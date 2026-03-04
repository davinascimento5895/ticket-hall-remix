-- LGPD consent records
CREATE TABLE public.lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'terms', 'marketing', 'data_processing'
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, consent_type)
);

ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their consents" ON public.lgpd_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their consents" ON public.lgpd_consents
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON public.lgpd_consents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- LGPD data requests (export / deletion)
CREATE TABLE public.lgpd_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'export', 'deletion'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  completed_at TIMESTAMPTZ,
  download_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lgpd_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their data requests" ON public.lgpd_data_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create data requests" ON public.lgpd_data_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all data requests" ON public.lgpd_data_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_lgpd_consents_user ON public.lgpd_consents(user_id);
CREATE INDEX idx_lgpd_data_requests_user ON public.lgpd_data_requests(user_id);
CREATE INDEX idx_lgpd_data_requests_status ON public.lgpd_data_requests(status);