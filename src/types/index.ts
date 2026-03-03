// ============================================================
// TicketHall — Core TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'producer' | 'buyer';
export type ProducerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'ended';
export type EventCategory = 'music' | 'sports' | 'theater' | 'festival' | 'corporate' | 'education' | 'other';
export type TierType = 'paid' | 'free' | 'donation' | 'combo';
export type OrderStatus = 'pending' | 'processing' | 'paid' | 'cancelled' | 'refunded' | 'expired';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'google_pay' | 'apple_pay';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'transferred' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';
export type WaitlistStatus = 'waiting' | 'notified' | 'purchased' | 'expired';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  cpf: string | null;
  role: UserRole;
  producer_status: ProducerStatus;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  producer_id: string;
  title: string;
  slug: string;
  description: string | null;
  category: EventCategory | null;
  status: EventStatus;
  cover_image_url: string | null;
  banner_image_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_zip: string | null;
  venue_latitude: number | null;
  venue_longitude: number | null;
  is_online: boolean;
  online_url: string | null;
  start_date: string;
  end_date: string;
  doors_open_time: string | null;
  minimum_age: number;
  max_capacity: number | null;
  has_seat_map: boolean;
  seat_map_config: Record<string, any> | null;
  platform_fee_percent: number;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  tier_type: TierType;
  price: number;
  original_price: number | null;
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  sale_start_date: string | null;
  sale_end_date: string | null;
  is_visible: boolean;
  is_transferable: boolean;
  is_resellable: boolean;
  min_per_order: number;
  max_per_order: number;
  includes_items: string[] | null;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  event_id: string;
  status: OrderStatus;
  subtotal: number;
  platform_fee: number;
  payment_gateway_fee: number;
  discount_amount: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: string;
  payment_gateway: string | null;
  payment_external_id: string | null;
  pix_qr_code: string | null;
  pix_qr_code_image: string | null;
  boleto_url: string | null;
  boleto_barcode: string | null;
  coupon_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  order_id: string;
  tier_id: string;
  event_id: string;
  owner_id: string;
  original_buyer_id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_cpf: string | null;
  qr_code: string;
  qr_code_image_url: string | null;
  status: TicketStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  is_offline_synced: boolean;
  transfer_history: Record<string, any>[];
  resale_price: number | null;
  is_for_resale: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  event_id: string;
  producer_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  min_order_value: number;
  applicable_tier_ids: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  tierId: string;
  eventId: string;
  quantity: number;
  tierSnapshot: {
    name: string;
    price: number;
    eventTitle: string;
    eventDate: string;
  };
}
