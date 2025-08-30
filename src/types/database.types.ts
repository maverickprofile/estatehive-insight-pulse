// =====================================================
// ESTATE HIVE CRM - DATABASE TYPES
// =====================================================
// Type definitions that match the database schema exactly
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// ENUMS - Matching database constraints
// =====================================================

export type UserRole = 'admin' | 'agent' | 'user' | 'owner' | 'builder'
export type PropertyType = 'residential' | 'commercial' | 'land' | 'industrial' | 'agricultural' | 'mixed_use'
export type PropertyStatus = 'draft' | 'active' | 'pending' | 'under_contract' | 'sold' | 'rented' | 'inactive' | 'expired'
export type PropertySubcategory = 'eh_living' | 'eh_commercial' | 'eh_verified' | 'eh_signature' | 'eh_dubai'
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'on_hold'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'vip' | 'blacklisted'
export type ConversationPlatform = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram' | 'facebook' | 'internal'
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll' | 'template'
export type AppointmentType = 'property_viewing' | 'site_visit' | 'consultation' | 'document_signing' | 'negotiation' | 'inspection' | 'handover' | 'followup' | 'other'
export type InvoiceType = 'sale' | 'rental' | 'commission' | 'maintenance' | 'booking' | 'advance' | 'refund' | 'service' | 'other'
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert'

// =====================================================
// DATABASE TABLES
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      agents: {
        Row: Agent
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Agent, 'id'>>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'age_of_property' | 'area_sqm'>
        Update: Partial<Omit<Property, 'id' | 'age_of_property' | 'area_sqm'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'balance_due'>
        Update: Partial<Omit<Client, 'id'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Conversation, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Message, 'id'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'duration_minutes'>
        Update: Partial<Omit<Appointment, 'id' | 'duration_minutes'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'balance_due'>
        Update: Partial<Omit<Invoice, 'id' | 'balance_due'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Notification, 'id'>>
      }
    }
    Views: {
      conversation_details: {
        Row: ConversationDetails
      }
    }
    Functions: {
      [key: string]: any
    }
  }
}

// =====================================================
// TABLE INTERFACES
// =====================================================

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  metadata: Json
}

export interface Agent {
  id: string
  created_at: string
  updated_at: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  agent_code: string | null
  license_number: string | null
  location: string | null
  specialties: string[]
  languages: string[]
  service_areas: string[]
  bio: string | null
  years_of_experience: number
  company_name: string | null
  company_address: string | null
  is_verified: boolean
  verified_at: string | null
  verified_by: string | null
  is_active: boolean
  rating: number
  total_reviews: number
  total_deals: number
  total_sales_value: number
  commission_rate: number
  commission_structure: 'percentage' | 'flat_fee' | 'tiered' | 'custom' | null
  website_url: string | null
  linkedin_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  metadata: Json
}

export interface Property {
  id: number
  created_at: string
  updated_at: string
  created_by: string | null
  agent_id: string | null
  owner_id: string | null
  title: string
  description: string | null
  property_code: string | null
  property_type: PropertyType
  property_subtype: string | null
  category: 'sale' | 'rent' | 'lease' | 'rent_to_own'
  subcategory?: PropertySubcategory | null
  status: PropertyStatus
  address: string | null
  unit_number: string | null
  city: string | null
  state: string | null
  country: string
  postal_code: string | null
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
  price: number | null
  original_price: number | null
  price_per_sqft: number | null
  currency: string
  price_negotiable: boolean
  rent_amount: number | null
  rent_frequency: 'monthly' | 'quarterly' | 'yearly' | null
  security_deposit: number | null
  maintenance_fee: number | null
  area_sqft: number | null
  area_sqm: number | null
  plot_area: number | null
  built_up_area: number | null
  carpet_area: number | null
  bedrooms: number | null
  bathrooms: number | null
  balconies: number
  total_rooms: number | null
  parking_spaces: number
  covered_parking: number
  floor_number: number | null
  total_floors: number | null
  year_built: number | null
  possession_date: string | null
  age_of_property: number | null
  furnishing_status: 'furnished' | 'semi_furnished' | 'unfurnished' | null
  facing_direction: string | null
  property_condition: string | null
  amenities: string[]
  nearby_facilities: Json
  image_urls: string[]
  video_urls: string[]
  virtual_tour_url: string | null
  floor_plan_urls: string[]
  document_urls: string[]
  featured_image: string | null
  is_verified: boolean
  verified_at: string | null
  verified_by: string | null
  is_featured: boolean
  featured_until: string | null
  slug: string | null
  meta_title: string | null
  meta_description: string | null
  keywords: string[]
  views_count: number
  inquiries_count: number
  favorites_count: number
  shares_count: number
  listed_date: string
  expiry_date: string | null
  last_price_update: string | null
  metadata: Json
}

export interface Lead {
  id: number
  created_at: string
  updated_at: string
  assigned_to: string | null
  assigned_by: string | null
  assigned_at: string | null
  name: string
  email: string | null
  phone: string | null
  alternate_phone: string | null
  whatsapp_number: string | null
  telegram_username: string | null
  date_of_birth: string | null
  occupation: string | null
  company_name: string | null
  annual_income: number | null
  source: string
  source_details: string | null
  campaign_name: string | null
  referrer_name: string | null
  referrer_contact: string | null
  interest_type: 'buy' | 'sell' | 'rent' | 'lease' | 'invest'
  property_type: string[]
  property_subtype: string[]
  location_preference: string[]
  preferred_cities: string[]
  preferred_neighborhoods: string[]
  budget_min: number | null
  budget_max: number | null
  loan_required: boolean
  pre_approved_loan: boolean
  loan_amount: number | null
  min_area_sqft: number | null
  max_area_sqft: number | null
  min_bedrooms: number | null
  preferred_amenities: string[]
  possession_timeline: string | null
  stage: LeadStage
  sub_stage: string | null
  priority: Priority
  score: number
  quality_rating: 'hot' | 'warm' | 'cold' | null
  last_contact_at: string | null
  last_contact_type: string | null
  next_followup_at: string | null
  followup_count: number
  site_visits_count: number
  last_site_visit_date: string | null
  properties_visited: number[]
  preferred_contact_method: string | null
  preferred_contact_time: string | null
  language_preference: string
  notes: string | null
  tags: string[]
  converted_to_client: boolean
  converted_at: string | null
  client_id: number | null
  conversion_value: number | null
  lost_reason: string | null
  lost_notes: string | null
  lost_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  metadata: Json
}

export interface Client {
  id: number
  created_at: string
  updated_at: string
  user_id: string | null
  lead_id: number | null
  converted_from_lead: boolean
  primary_agent_id: string | null
  secondary_agent_id: string | null
  client_code: string | null
  name: string
  email: string | null
  phone: string
  alternate_phone: string | null
  whatsapp_number: string | null
  telegram_username: string | null
  date_of_birth: string | null
  anniversary_date: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
  nationality: string
  occupation: string | null
  company_name: string | null
  designation: string | null
  work_email: string | null
  work_phone: string | null
  annual_income: number | null
  income_source: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  country: string
  postal_code: string | null
  client_type: 'individual' | 'company' | 'partnership' | 'trust'
  client_category: 'buyer' | 'seller' | 'investor' | 'tenant' | 'landlord'
  status: ClientStatus
  company_registration_no: string | null
  gst_number: string | null
  pan_number: string | null
  authorized_signatory: string | null
  preferred_contact_method: string | null
  preferred_contact_time: string | null
  preferred_language: string
  do_not_disturb: boolean
  interested_property_types: string[]
  preferred_locations: string[]
  budget_range_min: number | null
  budget_range_max: number | null
  properties_viewed: number
  properties_shortlisted: number[]
  properties_purchased: number[]
  properties_sold: number[]
  last_activity_at: string
  last_interaction_type: string | null
  last_interaction_notes: string | null
  total_transactions: number
  total_purchase_value: number
  total_sale_value: number
  total_commission_paid: number
  loyalty_points: number
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  referral_count: number
  referred_by_client_id: number | null
  client_rating: number | null
  feedback_count: number
  nps_score: number | null
  documents: Json
  kyc_verified: boolean
  kyc_verified_at: string | null
  kyc_verified_by: string | null
  first_transaction_date: string | null
  last_transaction_date: string | null
  next_followup_date: string | null
  contract_renewal_date: string | null
  tags: string[]
  internal_notes: string | null
  special_requirements: string | null
  metadata: Json
}

export interface Conversation {
  id: number
  created_at: string
  updated_at: string
  user_id: string
  assigned_to: string | null
  assigned_at: string | null
  platform: ConversationPlatform
  platform_conversation_id: string | null
  client_phone: string | null
  client_email: string | null
  telegram_chat_id: number | null
  telegram_user_id: number | null
  telegram_username: string | null
  instagram_user_id: string | null
  facebook_user_id: string | null
  client_name: string | null
  client_avatar_url: string | null
  client_id: number | null
  lead_id: number | null
  title: string | null
  status: 'active' | 'archived' | 'blocked' | 'spam' | 'resolved' | 'pending'
  priority: Priority
  category: string | null
  last_message: string | null
  last_message_at: string | null
  last_message_by: 'client' | 'agent' | 'system' | 'bot' | null
  last_message_type: MessageType | null
  unread_count: number
  total_messages: number
  agent_message_count: number
  client_message_count: number
  first_response_at: string | null
  first_response_time_seconds: number | null
  avg_response_time_seconds: number | null
  last_agent_response_at: string | null
  tags: string[]
  labels: Json
  related_property_id: number | null
  related_appointment_id: number | null
  related_invoice_id: number | null
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | null
  language_detected: string
  auto_reply_enabled: boolean
  bot_handled: boolean
  source_url: string | null
  referrer_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  metadata: Json
}

export interface Message {
  id: number
  created_at: string
  updated_at: string
  conversation_id: number
  sender_id: string | null
  sender_type: 'client' | 'agent' | 'system' | 'bot'
  sender_name: string | null
  sender_avatar_url: string | null
  message_type: MessageType
  content: string
  formatted_content: string | null
  media_url: string | null
  media_thumbnail_url: string | null
  media_mime_type: string | null
  media_size_bytes: number | null
  media_duration_seconds: number | null
  media_width: number | null
  media_height: number | null
  document_name: string | null
  document_pages: number | null
  location_latitude: number | null
  location_longitude: number | null
  location_address: string | null
  location_name: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_vcard: string | null
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted'
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  failure_reason: string | null
  is_reply: boolean
  reply_to_message_id: number | null
  is_forwarded: boolean
  forwarded_from_conversation_id: number | null
  forwarded_from_message_id: number | null
  is_edited: boolean
  edited_at: string | null
  edit_history: Json
  external_id: string | null
  external_timestamp: string | null
  external_status: string | null
  is_starred: boolean
  is_pinned: boolean
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  reactions: Json
  mentions: string[]
  hashtags: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | null
  language_detected: string | null
  contains_pii: boolean
  is_spam: boolean
  spam_score: number | null
  related_property_id: number | null
  related_lead_id: number | null
  related_client_id: number | null
  template_id: string | null
  template_name: string | null
  template_language: string | null
  template_variables: Json | null
  metadata: Json
}

export interface Appointment {
  id: number
  created_at: string
  updated_at: string
  user_id: string
  agent_id: string | null
  created_by: string | null
  client_id: number | null
  lead_id: number | null
  property_id: number | null
  multiple_properties: number[]
  appointment_code: string | null
  title: string
  description: string | null
  appointment_type: AppointmentType
  purpose: string | null
  start_time: string
  end_time: string
  duration_minutes: number
  all_day: boolean
  location_type: 'physical' | 'virtual' | 'phone' | 'hybrid'
  location_address: string | null
  location_name: string | null
  location_latitude: number | null
  location_longitude: number | null
  location_instructions: string | null
  is_virtual: boolean
  meeting_platform: string | null
  meeting_url: string | null
  meeting_id: string | null
  meeting_password: string | null
  dial_in_number: string | null
  status: 'scheduled' | 'confirmed' | 'tentative' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
  confirmation_status: 'pending' | 'confirmed' | 'declined' | 'maybe'
  confirmed_at: string | null
  confirmed_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  rescheduled_from: number | null
  rescheduled_to: number | null
  attendee_name: string | null
  attendee_email: string | null
  attendee_phone: string | null
  attendee_count: number
  additional_attendees: Json
  assigned_agents: string[]
  reminder_enabled: boolean
  reminder_minutes_before: number[]
  reminders_sent: Json
  requires_followup: boolean
  followup_date: string | null
  followup_notes: string | null
  followup_completed: boolean
  outcome: string | null
  outcome_notes: string | null
  client_feedback: string | null
  client_rating: number | null
  external_calendar_id: string | null
  external_calendar_provider: string | null
  ical_uid: string | null
  attachments: Json
  preparation_notes: string | null
  documents_to_bring: string[]
  transportation_arranged: boolean
  transportation_details: string | null
  metadata: Json
}

export interface Invoice {
  id: number
  created_at: string
  updated_at: string
  user_id: string
  created_by: string | null
  agent_id: string | null
  client_id: number | null
  lead_id: number | null
  property_id: number | null
  appointment_id: number | null
  invoice_number: string
  invoice_type: InvoiceType
  invoice_category: string | null
  invoice_date: string
  due_date: string | null
  payment_terms: string
  custom_payment_terms: string | null
  bill_to_name: string
  bill_to_email: string | null
  bill_to_phone: string | null
  bill_to_address: string | null
  bill_to_city: string | null
  bill_to_state: string | null
  bill_to_postal_code: string | null
  bill_to_country: string
  bill_to_gst: string | null
  bill_to_pan: string | null
  ship_to_address: string | null
  ship_to_city: string | null
  ship_to_state: string | null
  ship_to_postal_code: string | null
  status: 'draft' | 'pending' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'disputed'
  approval_status: 'pending' | 'approved' | 'rejected' | 'not_required'
  approved_by: string | null
  approved_at: string | null
  line_items: Json
  currency: string
  subtotal: number
  discount_type: 'percentage' | 'fixed' | null
  discount_percent: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  cgst_rate: number
  cgst_amount: number
  sgst_rate: number
  sgst_amount: number
  igst_rate: number
  igst_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'failed'
  payment_method: string | null
  payment_reference: string | null
  payment_date: string | null
  payment_history: Json
  bank_name: string | null
  bank_account_number: string | null
  bank_ifsc_code: string | null
  bank_branch: string | null
  notes: string | null
  internal_notes: string | null
  terms_and_conditions: string | null
  reminder_enabled: boolean
  reminder_sent_count: number
  last_reminder_sent_at: string | null
  next_reminder_date: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  refund_amount: number
  refund_date: string | null
  refund_reference: string | null
  refund_reason: string | null
  pdf_url: string | null
  documents: Json
  sent_to_emails: string[]
  sent_at: string | null
  viewed_at: string | null
  requires_signature: boolean
  signature_url: string | null
  signed_by: string | null
  signed_at: string | null
  metadata: Json
}

export interface Notification {
  id: number
  created_at: string
  updated_at: string
  user_id: string
  role_target: string | null
  type: NotificationType
  category: string
  priority: Priority | 'critical'
  title: string
  description: string | null
  short_description: string | null
  icon: string | null
  image_url: string | null
  is_read: boolean
  read_at: string | null
  is_archived: boolean
  archived_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  action_type: string | null
  action_url: string | null
  action_label: string | null
  action_data: Json
  requires_action: boolean
  action_taken: boolean
  action_taken_at: string | null
  action_response: string | null
  related_entity_type: string | null
  related_entity_id: string | null
  lead_id: number | null
  property_id: number | null
  client_id: number | null
  appointment_id: number | null
  conversation_id: number | null
  invoice_id: number | null
  agent_id: string | null
  sender_id: string | null
  sender_name: string | null
  sender_type: string | null
  channels: string[]
  email_sent: boolean
  email_sent_at: string | null
  sms_sent: boolean
  sms_sent_at: string | null
  whatsapp_sent: boolean
  whatsapp_sent_at: string | null
  push_sent: boolean
  push_sent_at: string | null
  scheduled_for: string | null
  sent_at: string | null
  expires_at: string | null
  group_id: string | null
  group_key: string | null
  is_grouped: boolean
  group_count: number
  template_id: string | null
  template_variables: Json
  force_send: boolean
  silent: boolean
  opened_count: number
  clicked_count: number
  dismissed_count: number
  data: Json
  metadata: Json
}

export interface ConversationDetails extends Conversation {
  client_full_name: string | null
  client_code: string | null
  loyalty_tier: string | null
  lead_stage: string | null
  lead_priority: string | null
  property_title: string | null
  property_code: string | null
  assigned_agent_name: string | null
}