// ============================================================
// TicketHall — Core TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'producer' | 'buyer' | 'staff';
export type ProducerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'ended';
export type EventCategory = 'music' | 'sports' | 'theater' | 'festival' | 'corporate' | 'education' | 'other';
export type TierType = 'paid' | 'free' | 'donation' | 'combo';
export type OrderStatus = 'pending' | 'processing' | 'paid' | 'cancelled' | 'refunded' | 'expired';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'google_pay' | 'apple_pay';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'transferred' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';
export type WaitlistStatus = 'waiting' | 'notified' | 'purchased' | 'expired';
export type DocumentType = 'cpf' | 'cnpj';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  document_number: string | null;
  document_type: DocumentType;
  role: UserRole;
  producer_status: ProducerStatus;
  organizer_slug: string | null;
  organizer_bio: string | null;
  organizer_logo_url: string | null;
  organizer_banner_url: string | null;
  organizer_website: string | null;
  organizer_instagram: string | null;
  organizer_facebook: string | null;
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
  // Certificate configuration fields
  has_certificates?: boolean;
  certificate_config?: Record<string, any>;
  selected_template_id?: string | null;
  custom_background_url?: string | null;
  certificate_text_config?: CertificateTextConfig;
  certificate_colors?: CertificateColors;
  certificate_fields?: CertificateFields;
  workload_hours?: number | null;
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
  capacity_group_id: string | null;
  is_hidden_by_default: boolean;
  unlock_code: string | null;
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
  refunded_amount: number;
  refund_reason: string | null;
  refunded_at: string | null;
  invoice_number: string | null;
  invoice_issued_at: string | null;
  invoice_pdf_url: string | null;
  billing_company_name: string | null;
  billing_cnpj: string | null;
  billing_address: string | null;
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

export type CheckoutFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
export type CheckoutAppliesTo = 'order' | 'attendee';
export type FeeType = 'percentage' | 'fixed';
export type CheckinResult = 'success' | 'already_used' | 'invalid' | 'invalid_qr' | 'wrong_list' | 'not_found' | 'inactive' | 'race_condition' | 'list_inactive';
export type WebhookEventType = 'order.paid' | 'order.cancelled' | 'order.refunded' | 'ticket.checked_in' | 'ticket.transferred' | 'event.published' | 'event.cancelled';
export type BulkMessageStatus = 'draft' | 'sending' | 'sent' | 'failed';
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CommissionType = 'percentage' | 'fixed';
export type TeamMemberRole = 'admin' | 'manager' | 'checkin_staff' | 'reports_only';
export type TeamMemberStatus = 'pending' | 'active' | 'revoked';

export interface CheckoutQuestion {
  id: string;
  event_id: string;
  tier_ids: string[] | null;
  question: string;
  field_type: CheckoutFieldType;
  options: any | null;
  is_required: boolean;
  applies_to: CheckoutAppliesTo;
  sort_order: number;
  created_at: string;
}

export interface CheckoutAnswer {
  id: string;
  order_id: string | null;
  ticket_id: string | null;
  question_id: string;
  answer: string | null;
  created_at: string;
}

export interface TicketTaxFee {
  id: string;
  event_id: string;
  tier_id: string | null;
  name: string;
  fee_type: FeeType;
  amount: number;
  is_passed_to_buyer: boolean;
  created_at: string;
}

export interface CapacityGroup {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  sold_count: number;
  created_at: string;
}

export interface CheckinList {
  id: string;
  event_id: string;
  name: string;
  allowed_tier_ids: string[] | null;
  access_code: string | null;
  is_active: boolean;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CheckinScanLog {
  id: string;
  checkin_list_id: string | null;
  ticket_id: string | null;
  qr_code_scanned: string;
  result: CheckinResult;
  scanned_by: string | null;
  device_id: string | null;
  scanned_at: string;
}

export interface Webhook {
  id: string;
  producer_id: string;
  event_id: string | null;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  next_retry_at: string | null;
  attempts: number;
  created_at: string;
}

export interface BulkMessage {
  id: string;
  event_id: string;
  producer_id: string;
  subject: string;
  body: string;
  recipient_filter: Record<string, any> | null;
  recipients_count: number | null;
  sent_at: string | null;
  status: BulkMessageStatus;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  ticket_ids: string[] | null;
  amount: number;
  platform_fee_refunded: number;
  reason: string | null;
  initiated_by: string | null;
  status: RefundStatus;
  gateway_refund_id: string | null;
  created_at: string;
}

export interface Affiliate {
  id: string;
  event_id: string;
  producer_id: string;
  name: string;
  code: string;
  commission_type: CommissionType | null;
  commission_value: number;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  is_active: boolean;
  created_at: string;
}

export interface EventProduct {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  quantity_available: number | null;
  quantity_sold: number;
  max_per_order: number;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface OrderProduct {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface ProducerTeamMember {
  id: string;
  producer_id: string;
  user_id: string | null;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invite_token: string | null;
  invited_at: string;
  accepted_at: string | null;
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

// ============================================================
// Certificate System Types
// ============================================================

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  default_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface CertificateSigner {
  id: string;
  event_id: string;
  name: string;
  role: string | null;
  signature_url: string | null;
  display_order: number;
  created_at: string;
}

export interface CertificateParticipantPref {
  id: string;
  event_id: string;
  user_id: string;
  opt_out: boolean;
  preferred_name: string | null;
  consent_cpf: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  event_id: string;
  ticket_id: string;
  user_id: string;
  certificate_code: string;
  attendee_name: string;
  issued_at: string;
  workload_hours: number | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  revoked_by: string | null;
  version: number;
  qr_code_url: string | null;
  linkedin_url: string | null;
  created_at: string;
}

export interface CertificateColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface CertificateTextConfig {
  title: string;
  subtitle: string;
  bodyText: string;
  showDate: boolean;
  showLocation: boolean;
  showWorkload: boolean;
  footerText: string;
}

export interface CertificateFields {
  showParticipantName: boolean;
  showEventTitle: boolean;
  showEventDate: boolean;
  showEventLocation: boolean;
  showWorkload: boolean;
  showVerificationCode: boolean;
  showQrCode: boolean;
  showSigners: boolean;
  showLogo: boolean;
  showBorder?: boolean;
}

export interface CertificateVerificationResult {
  valid: boolean;
  revoked: boolean;
  certificateCode: string;
  eventName?: string;
  participantName?: string;
  eventDate?: string;
  eventEndDate?: string;
  eventLocation?: string;
  workload?: number | null;
  issuedAt?: string;
  version?: number;
  revokedAt?: string | null;
  reason?: string | null;
  message: string;
  verificationUrl?: string;
}

export interface CertificateEventConfig {
  selected_template_id: string | null;
  custom_background_url: string | null;
  certificate_text_config: CertificateTextConfig;
  certificate_colors: CertificateColors;
  certificate_fields: CertificateFields;
}
