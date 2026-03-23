-- Create financial_categories table to persist producer-specific categories
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'payable' or 'receivable'
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage their financial categories" ON public.financial_categories
  FOR ALL USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all financial categories" ON public.financial_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_categories_producer_type_value
  ON public.financial_categories(producer_id, type, value);
