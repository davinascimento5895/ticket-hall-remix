
-- ============================================================
-- TicketHall — Full Database Schema
-- ============================================================

-- Role enum and user_roles table (security best practice: roles in separate table)
CREATE TYPE public.app_role AS ENUM ('admin', 'producer', 'buyer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'buyer',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'producer' THEN 2 ELSE 3 END
  LIMIT 1
$$;

-- user_roles RLS
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TYPE public.producer_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  cpf TEXT UNIQUE,
  producer_status producer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);

-- Auto-create profile + buyer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('music', 'sports', 'theater', 'festival', 'corporate', 'education', 'other')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'ended')),
  cover_image_url TEXT,
  banner_image_url TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_zip TEXT,
  venue_latitude DECIMAL,
  venue_longitude DECIMAL,
  is_online BOOLEAN DEFAULT false,
  online_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  doors_open_time TIMESTAMPTZ,
  minimum_age INTEGER DEFAULT 0,
  max_capacity INTEGER,
  has_seat_map BOOLEAN DEFAULT false,
  seat_map_config JSONB,
  platform_fee_percent DECIMAL DEFAULT 7.0,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_producer ON public.events(producer_id);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_city ON public.events(venue_city);
CREATE INDEX idx_events_featured ON public.events(is_featured) WHERE is_featured = true;

CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (status = 'published');
CREATE POLICY "Producers can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = producer_id);
CREATE POLICY "Producers can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = producer_id AND public.has_role(auth.uid(), 'producer'));
CREATE POLICY "Producers can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = producer_id);
CREATE POLICY "Producers can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = producer_id);
CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TICKET TIERS
-- ============================================================
CREATE TABLE public.ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tier_type TEXT DEFAULT 'paid' CHECK (tier_type IN ('paid', 'free', 'donation', 'combo')),
  price DECIMAL(10,2) DEFAULT 0,
  original_price DECIMAL(10,2),
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  is_visible BOOLEAN DEFAULT true,
  is_transferable BOOLEAN DEFAULT true,
  is_resellable BOOLEAN DEFAULT false,
  min_per_order INTEGER DEFAULT 1,
  max_per_order INTEGER DEFAULT 10,
  includes_items TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tiers_event ON public.ticket_tiers(event_id);

CREATE POLICY "Anyone can view visible tiers of published events" ON public.ticket_tiers
  FOR SELECT USING (
    is_visible = true AND EXISTS (
      SELECT 1 FROM public.events WHERE id = event_id AND status = 'published'
    )
  );
CREATE POLICY "Producers can manage tiers for their events" ON public.ticket_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all tiers" ON public.ticket_tiers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'cancelled', 'refunded', 'expired')),
  subtotal DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  payment_gateway_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_gateway TEXT,
  payment_external_id TEXT,
  pix_qr_code TEXT,
  pix_qr_code_image TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  coupon_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_event ON public.orders(event_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE POLICY "Buyers can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Producers can view orders for their events" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES public.ticket_tiers(id) NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  original_buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  attendee_name TEXT,
  attendee_email TEXT,
  attendee_cpf TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  qr_code_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled', 'transferred', 'refunded')),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES public.profiles(id),
  is_offline_synced BOOLEAN DEFAULT false,
  transfer_history JSONB DEFAULT '[]',
  resale_price DECIMAL(10,2),
  is_for_resale BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tickets_owner ON public.tickets(owner_id);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_order ON public.tickets(order_id);
CREATE INDEX idx_tickets_qr ON public.tickets(qr_code);

CREATE POLICY "Owners can view their tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Producers can view tickets for their events" ON public.tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all tickets" ON public.tickets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  producer_id UUID REFERENCES public.profiles(id) NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  applicable_tier_ids UUID[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate coupons" ON public.coupons
  FOR SELECT USING (is_active = true);
CREATE POLICY "Producers can manage their coupons" ON public.coupons
  FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- WAITLIST
-- ============================================================
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  tier_id UUID REFERENCES public.ticket_tiers(id),
  user_id UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  phone TEXT,
  position INTEGER,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'purchased', 'expired')),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their waitlist entries" ON public.waitlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Producers can view waitlist for their events" ON public.waitlist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all waitlists" ON public.waitlist
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- CHECK-IN SESSIONS
-- ============================================================
CREATE TABLE public.checkin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  operator_id UUID REFERENCES public.profiles(id) NOT NULL,
  device_id TEXT,
  last_sync_at TIMESTAMPTZ,
  offline_scans JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can manage their sessions" ON public.checkin_sessions
  FOR ALL USING (auth.uid() = operator_id);
CREATE POLICY "Producers can view sessions for their events" ON public.checkin_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all sessions" ON public.checkin_sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  title TEXT,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, is_read);

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- EVENT ANALYTICS
-- ============================================================
CREATE TABLE public.event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) UNIQUE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  platform_revenue DECIMAL(10,2) DEFAULT 0,
  producer_revenue DECIMAL(10,2) DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  tickets_checked_in INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can view analytics for their events" ON public.event_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all analytics" ON public.event_analytics
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- GUEST LISTS
-- ============================================================
CREATE TABLE public.guest_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  tier_id UUID REFERENCES public.ticket_tiers(id),
  added_by UUID REFERENCES public.profiles(id) NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guest_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage guest lists for their events" ON public.guest_lists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND producer_id = auth.uid())
  );
CREATE POLICY "Admins can manage all guest lists" ON public.guest_lists
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- STORAGE BUCKET for event images
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

CREATE POLICY "Anyone can view event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated users can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own event images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own event images" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
