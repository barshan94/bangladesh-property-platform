-- Private administrator-only notes for recording inquiry follow-up.
-- Notes are not customer messages and are never sent automatically.
CREATE TABLE IF NOT EXISTS public.inquiry_staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  note text NOT NULL CHECK (char_length(note) BETWEEN 5 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inquiry_staff_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.inquiry_staff_notes FROM anon, authenticated;
