"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RpcResult = { data: unknown; error: { message: string } | null };
type EditorialRpcClient = {
  rpc: (name: string, args?: Record<string, unknown>) => Promise<RpcResult>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function getEditorClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (error || !claims?.sub || !Array.isArray(roles) ||
      (!roles.includes("content_editor") && !roles.includes("administrator"))) {
    redirect("/dashboard?message=Content%20editor%20access%20is%20required.");
  }
  return supabase as unknown as EditorialRpcClient;
}

function readDraft(formData: FormData) {
  const id = String(formData.get("content_id") ?? "").trim() || null;
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const contentType = String(formData.get("content_type") ?? "article");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const jurisdiction = String(formData.get("jurisdiction") ?? "Bangladesh").trim();
  const authorName = String(formData.get("author_name") ?? "").trim() || null;
  const sourceNotes = String(formData.get("source_notes") ?? "").trim() || null;
  const body = String(formData.get("body_markdown") ?? "").trim();
  const provider = String(formData.get("video_provider") ?? "").trim();
  const videoId = String(formData.get("video_id") ?? "").trim();

  if (id && !uuidPattern.test(id)) return { error: "Invalid content reference." } as const;
  if (!slugPattern.test(slug) || slug.length < 3 || slug.length > 160) return { error: "Use a lowercase URL slug with letters, numbers and hyphens." } as const;
  if (title.length < 8 || title.length > 180) return { error: "Title must contain 8–180 characters." } as const;
  if (summary.length < 20 || summary.length > 500) return { error: "Summary must contain 20–500 characters." } as const;
  if (jurisdiction.length < 2 || jurisdiction.length > 100) return { error: "Enter a valid jurisdiction." } as const;
  if (authorName && authorName.length > 120) return { error: "Author name is too long." } as const;
  if (sourceNotes && sourceNotes.length > 4000) return { error: "Source notes are too long." } as const;

  if (contentType === "article") {
    if (body.length < 100 || body.length > 30000) return { error: "Article Markdown must contain 100–30,000 characters." } as const;
    return { value: { id, slug, contentType, title, summary, jurisdiction, authorName, sourceNotes, body, provider: null, videoId: null } } as const;
  }
  if (contentType === "video") {
    if (!["youtube", "vimeo"].includes(provider) || !/^[A-Za-z0-9_-]{6,32}$/.test(videoId)) {
      return { error: "Choose YouTube or Vimeo and provide a valid video identifier." } as const;
    }
    return { value: { id, slug, contentType, title, summary, jurisdiction, authorName, sourceNotes, body: null, provider, videoId } } as const;
  }
  return { error: "Unsupported content type." } as const;
}

export async function saveKnowledgeContentDraft(formData: FormData) {
  const parsed = readDraft(formData);
  if ("error" in parsed) redirect("/dashboard/content?error=" + encodeURIComponent(parsed.error));
  const rpc = await getEditorClient();
  const { data, error } = await rpc.rpc("save_knowledge_content_draft", {
    p_content_id: parsed.value.id,
    p_slug: parsed.value.slug,
    p_content_type: parsed.value.contentType,
    p_title: parsed.value.title,
    p_summary: parsed.value.summary,
    p_body_markdown: parsed.value.body,
    p_video_provider: parsed.value.provider,
    p_video_id: parsed.value.videoId,
    p_jurisdiction: parsed.value.jurisdiction,
    p_author_name: parsed.value.authorName,
    p_source_notes: parsed.value.sourceNotes,
  });
  if (error || typeof data !== "string") {
    redirect("/dashboard/content?error=" + encodeURIComponent("Draft could not be saved. The database workflow may not yet be installed, or the slug may already be in use."));
  }
  redirect("/dashboard/content?saved=1");
}

export async function submitKnowledgeContentForReview(formData: FormData) {
  const parsed = readDraft(formData);
  if ("error" in parsed) redirect("/dashboard/content?error=" + encodeURIComponent(parsed.error));
  const rpc = await getEditorClient();
  const saved = await rpc.rpc("save_knowledge_content_draft", {
    p_content_id: parsed.value.id,
    p_slug: parsed.value.slug,
    p_content_type: parsed.value.contentType,
    p_title: parsed.value.title,
    p_summary: parsed.value.summary,
    p_body_markdown: parsed.value.body,
    p_video_provider: parsed.value.provider,
    p_video_id: parsed.value.videoId,
    p_jurisdiction: parsed.value.jurisdiction,
    p_author_name: parsed.value.authorName,
    p_source_notes: parsed.value.sourceNotes,
  });
  if (saved.error || typeof saved.data !== "string") {
    redirect("/dashboard/content?error=" + encodeURIComponent("Draft could not be saved for review. Check the slug and database migration status."));
  }
  const transition = await rpc.rpc("transition_knowledge_content", {
    p_content_id: saved.data,
    p_to_status: "in_review",
    p_reason: "Submitted by content editor for editorial review.",
  });
  if (transition.error) {
    redirect("/dashboard/content?error=" + encodeURIComponent("Draft was saved, but submission failed. It remains a draft."));
  }
  redirect("/dashboard/content?submitted=1");
}

export async function transitionKnowledgeContent(formData: FormData) {
  const id = String(formData.get("content_id") ?? "");
  const toStatus = String(formData.get("to_status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!uuidPattern.test(id)) redirect("/dashboard/content?error=Invalid%20content%20reference.");
  if (!["approved", "rejected", "published", "archived"].includes(toStatus)) {
    redirect("/dashboard/content?error=Unsupported%20editorial%20transition.");
  }
  if (reason.length < 5 || reason.length > 1000) {
    redirect("/dashboard/content?error=A%20reason%20of%205%E2%80%931000%20characters%20is%20required.");
  }
  const rpc = await getEditorClient();
  const { error } = await rpc.rpc("transition_knowledge_content", {
    p_content_id: id,
    p_to_status: toStatus,
    p_reason: reason,
  });
  if (error) redirect("/dashboard/content?error=The%20editorial%20transition%20was%20not%20accepted.");
  redirect("/dashboard/content?updated=1");
}
