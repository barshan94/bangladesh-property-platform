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

  const { data: reviewerRoles, error: reviewerRolesError } = await reviewer.client
    .from("user_roles").select("role_code").eq("user_id", reviewer.id);
  assert.ifError(reviewerRolesError);
  assert.deepEqual(reviewerRoles.map((row) => row.role_code), ["listing_reviewer"], "user_roles RLS must expose only the caller's role row");

  const { data: otherRoles, error: otherRolesError } = await seller.client
    .from("user_roles").select("role_code").eq("user_id", reviewer.id);
  assert.ifError(otherRolesError);
  assert.deepEqual(otherRoles, [], "seller JWT must not read another user's role rows");

  console.log("Auth JWT/RLS integration passed: anon, seller ownership, reviewer, publisher, administrator and user_roles isolation.");
} finally {
  if (listingIds.length) await admin.from("property_listings").delete().in("id", listingIds);
  if (createdUsers.length) await admin.auth.admin.deleteUser(createdUsers[0]).catch(() => {});
  for (const userId of createdUsers.slice(1)) await admin.auth.admin.deleteUser(userId).catch(() => {});
}
