import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
for (const [name, value] of Object.entries({ SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey })) {
  assert.ok(value, `${name} must be provided by supabase status`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const password = `Local-Test-${randomUUID()}-Aa9!`;
const createdUsers = [];
const listingIds = [];

async function createRoleUser(label, role) {
  const email = `${label}-${suffix}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { roles: role ? [role] : [] },
  });
  assert.ifError(error);
  createdUsers.push(data.user.id);
  if (role) {
    const { error: roleError } = await admin.from("user_roles").insert({
      user_id: data.user.id, role_code: role,
    });
    assert.ifError(roleError);
  }
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sessionData, error: signInError } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signInError);
  assert.ok(sessionData.session?.access_token, `${label} should receive a real access token`);
  const { data: userData, error: userError } = await client.auth.getUser();
  assert.ifError(userError);
  assert.equal(userData.user.id, data.user.id, `${label} JWT should resolve to its Auth user`);
  return { id: data.user.id, client };
}

async function createListing(ownerId, status, reference) {
  const { data, error } = await admin.from("property_listings").insert({
    public_reference: reference,
    owner_user_id: ownerId,
    listing_kind: "sale",
    property_type: "apartment",
    headline: `Integration fixture ${reference}`,
    description: "Temporary fixture used to verify Supabase Auth JWT and row-level security.",
    division: "Dhaka",
    district: "Dhaka",
    status,
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  }).select("id").single();
  assert.ifError(error);
  listingIds.push(data.id);
  return data.id;
}

async function visible(client, id) {
  const { data, error } = await client.from("property_listings").select("id,status").eq("id", id);
  assert.ifError(error);
  return data.length === 1;
}

try {
  const seller = await createRoleUser("seller", "seller");
  const otherSeller = await createRoleUser("other-seller", "seller");
  const reviewer = await createRoleUser("reviewer", "listing_reviewer");
  const publisher = await createRoleUser("publisher", "listing_publisher");
  const administrator = await createRoleUser("administrator", "administrator");
  const revokedReviewer = await createRoleUser("revoked-reviewer", "listing_reviewer");
  const { error: revokeError } = await admin.from("user_roles")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", revokedReviewer.id)
    .eq("role_code", "listing_reviewer");
  assert.ifError(revokeError);

  const submittedId = await createListing(seller.id, "submitted", `BPP-${suffix.toUpperCase()}01`);
  const approvedId = await createListing(seller.id, "approved", `BPP-${suffix.toUpperCase()}02`);
  const publishedId = await createListing(seller.id, "published", `BPP-${suffix.toUpperCase()}03`);

  const anonymous = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  assert.equal(await visible(anonymous, submittedId), false, "anonymous JWT must not read submitted listings");
  assert.equal(await visible(anonymous, publishedId), true, "anonymous JWT must read published listings");

  const { data: sellerDraft, error: draftError } = await seller.client.from("property_listings").insert({
    public_reference: `BPP-${suffix.toUpperCase()}04`,
    owner_user_id: seller.id,
    listing_kind: "sale",
    property_type: "apartment",
    headline: "Seller-owned draft integration fixture",
    description: "A valid draft inserted through the authenticated seller JWT.",
    division: "Dhaka",
    district: "Dhaka",
  }).select("id").single();
  assert.ifError(draftError);
  listingIds.push(sellerDraft.id);
  assert.equal(await visible(seller.client, sellerDraft.id), true, "seller JWT must read its own draft");
  assert.equal(await visible(otherSeller.client, sellerDraft.id), false, "another seller JWT must not read the draft");

  assert.equal(await visible(reviewer.client, submittedId), true, "active reviewer JWT must read submitted listings");
  assert.equal(await visible(publisher.client, approvedId), true, "active publisher JWT must read approved listings");
  assert.equal(await visible(administrator.client, submittedId), true, "active administrator JWT must read submitted listings");
  assert.equal(await visible(revokedReviewer.client, submittedId), false, "revoked reviewer JWT with a stale role claim must not read submitted listings");

  const { error: sellerTransitionError } = await seller.client.rpc("transition_property_listing", {
    p_listing_id: submittedId,
    p_to_status: "under_review",
    p_reason: null,
    p_request_id: `seller-denied-${suffix}`,
  });
  assert.equal(sellerTransitionError?.message, "LISTING_NOT_FOUND_OR_TRANSITION_FORBIDDEN", "seller JWT must be denied reviewer transitions without disclosing whether a protected listing exists");
  const { data: afterSellerAttempt, error: afterSellerAttemptError } = await admin
    .from("property_listings").select("status").eq("id", submittedId).single();
  assert.ifError(afterSellerAttemptError);
  assert.equal(afterSellerAttempt.status, "submitted", "a denied seller transition must leave listing status unchanged");

  const { error: reviewerStartError } = await reviewer.client.rpc("transition_property_listing", {
    p_listing_id: submittedId,
    p_to_status: "under_review",
    p_reason: null,
    p_request_id: `review-start-${suffix}`,
  });
  assert.ifError(reviewerStartError);

  const { error: reviewerApproveError } = await reviewer.client.rpc("transition_property_listing", {
    p_listing_id: submittedId,
    p_to_status: "approved",
    p_reason: "Integration test approval decision",
    p_request_id: `review-approve-${suffix}`,
  });
  assert.ifError(reviewerApproveError);

  const { error: publisherError } = await publisher.client.rpc("transition_property_listing", {
    p_listing_id: submittedId,
    p_to_status: "published",
    p_reason: null,
    p_request_id: `publish-${suffix}`,
  });
  assert.ifError(publisherError);
  assert.equal(await visible(anonymous, submittedId), true, "anonymous users must see the listing after publication");

  // The intended policy allows a user to inspect their own role rows, but
  // must never expose another user's authorization records.
  const { data: reviewerRoles, error: reviewerRolesError } = await reviewer.client
    .from("user_roles").select("role_code").eq("user_id", reviewer.id);
  assert.ifError(reviewerRolesError);
  assert.deepEqual(reviewerRoles, [{ role_code: "listing_reviewer" }],
    "a user may read their own role assignment");

  const { data: otherRoles, error: otherRolesError } = await seller.client
    .from("user_roles").select("role_code").eq("user_id", reviewer.id);
  assert.ifError(otherRolesError);
  assert.deepEqual(otherRoles, [],
    "a different authenticated user must not read another user's role assignment");

  console.log("Auth JWT/RLS integration passed: anon, seller ownership, reviewer, publisher, administrator and own-role-only isolation.");
} finally {
  if (listingIds.length) await admin.from("property_listings").delete().in("id", listingIds);
  if (createdUsers.length) await admin.auth.admin.deleteUser(createdUsers[0]).catch(() => {});
  for (const userId of createdUsers.slice(1)) await admin.auth.admin.deleteUser(userId).catch(() => {});
}
