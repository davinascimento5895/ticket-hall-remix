
-- Product images table
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.event_products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images for published events" ON public.product_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_products ep
    JOIN events e ON e.id = ep.event_id
    WHERE ep.id = product_images.product_id AND e.status = 'published'
  )
);

CREATE POLICY "Producers can manage their product images" ON public.product_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM event_products ep
    JOIN events e ON e.id = ep.event_id
    WHERE ep.id = product_images.product_id AND e.producer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all product images" ON public.product_images
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Product variations table
CREATE TABLE public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.event_products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product variations for published events" ON public.product_variations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_products ep
    JOIN events e ON e.id = ep.event_id
    WHERE ep.id = product_variations.product_id AND e.status = 'published'
  )
);

CREATE POLICY "Producers can manage their product variations" ON public.product_variations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM event_products ep
    JOIN events e ON e.id = ep.event_id
    WHERE ep.id = product_variations.product_id AND e.producer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all product variations" ON public.product_variations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
