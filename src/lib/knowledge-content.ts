import { createClient } from "@/lib/supabase/server";

export type PublishedKnowledgeContent = {
  id: string;
  slug: string;
  content_type: "article" | "video";
  title: string;
  summary: string;
  body_markdown: string | null;
  video_provider: "youtube" | "vimeo" | null;
  video_id: string | null;
  jurisdiction: string;
  author_name: string | null;
  published_at: string;
  reviewed_at: string;
};

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type ContentQuery = PromiseLike<QueryResult<PublishedKnowledgeContent[]>> & {
  eq: (column: string, value: string) => ContentQuery;
  order: (column: string, options: { ascending: boolean }) => ContentQuery;
  limit: (count: number) => ContentQuery;
  maybeSingle: () => Promise<QueryResult<PublishedKnowledgeContent>>;
};

const columns = "id,slug,content_type,title,summary,body_markdown,video_provider,video_id,jurisdiction,author_name,published_at,reviewed_at";

function isPublishedContent(value: unknown): value is PublishedKnowledgeContent {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.slug !== "string" ||
    typeof item.title !== "string" ||
    typeof item.summary !== "string" ||
    typeof item.jurisdiction !== "string" ||
    typeof item.published_at !== "string" ||
    typeof item.reviewed_at !== "string" ||
    !["article", "video"].includes(String(item.content_type))
  ) return false;

  if (item.content_type === "article") {
    return typeof item.body_markdown === "string" &&
      item.video_provider === null && item.video_id === null;
  }

  return item.body_markdown === null &&
    ["youtube", "vimeo"].includes(String(item.video_provider)) &&
    typeof item.video_id === "string" &&
    /^[A-Za-z0-9_-]{6,32}$/.test(item.video_id);
}

export async function getPublishedKnowledgeContent() {
  const supabase = await createClient();
  const publicClient = supabase as unknown as { from: (table: string) => { select: (fields: string) => ContentQuery } };
  const query = publicClient.from("published_knowledge_content").select(columns);
  const { data, error } = await query
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) return { content: [], error };
  return {
    content: (Array.isArray(data) ? data : []).filter(isPublishedContent),
    error: null,
  };
}

export async function getPublishedKnowledgeEntry(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) {
    return { content: null, error: null };
  }

  const supabase = await createClient();
  const publicClient = supabase as unknown as { from: (table: string) => { select: (fields: string) => ContentQuery } };
  const query = publicClient.from("published_knowledge_content").select(columns);
  const { data, error } = await query.eq("slug", slug).maybeSingle();

  if (error || !data || !isPublishedContent(data)) {
    return { content: null, error };
  }
  return { content: data, error: null };
}
