
-- Interest lists main table
CREATE TABLE public.interest_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  venue_name text,
  start_date timestamp with time zone,
  status text NOT NULL DEFAULT 'published',
  max_submissions integer,
  expires_at timestamp with time zone,
  submissions_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Custom form fields
CREATE TABLE public.interest_list_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.interest_lists(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  placeholder text,
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  options jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Submissions
CREATE TABLE public.interest_list_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.interest_lists(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  user_id uuid,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.interest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_list_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_list_submissions ENABLE ROW LEVEL SECURITY;

-- interest_lists policies
CREATE POLICY "Producers manage their lists" ON public.interest_lists FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY "Anyone can view published lists" ON public.interest_lists FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage all lists" ON public.interest_lists FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- interest_list_fields policies
CREATE POLICY "Anyone can view fields of published lists" ON public.interest_list_fields FOR SELECT USING (EXISTS (SELECT 1 FROM interest_lists WHERE id = list_id AND status = 'published'));
CREATE POLICY "Producers manage their list fields" ON public.interest_list_fields FOR ALL USING (EXISTS (SELECT 1 FROM interest_lists WHERE id = list_id AND producer_id = auth.uid()));
CREATE POLICY "Admins manage all fields" ON public.interest_list_fields FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- interest_list_submissions policies
CREATE POLICY "Anyone can submit" ON public.interest_list_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Producers view submissions for their lists" ON public.interest_list_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM interest_lists WHERE id = list_id AND producer_id = auth.uid()));
CREATE POLICY "Admins manage all submissions" ON public.interest_list_submissions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-increment submissions_count
CREATE OR REPLACE FUNCTION public.increment_list_submissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE interest_lists SET submissions_count = submissions_count + 1 WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_submission_insert
AFTER INSERT ON public.interest_list_submissions
FOR EACH ROW EXECUTE FUNCTION public.increment_list_submissions();
