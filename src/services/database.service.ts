// =====================================================
// ESTATE HIVE CRM - DATABASE SERVICE
// =====================================================
// Centralized service for all database operations
// =====================================================

import { supabase } from '@/lib/supabaseClient'
import type { 
  Database, 
  Profile, 
  Agent, 
  Property, 
  Lead, 
  Client, 
  Conversation, 
  Message, 
  Appointment, 
  Invoice, 
  Notification 
} from '@/types/database.types'

// =====================================================
// PROFILES SERVICE
// =====================================================

export const profilesService = {
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return data
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getProfilesByRole(role: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
    
    if (error) throw error
    return data
  }
}

// =====================================================
// AGENTS SERVICE
// =====================================================

export const agentsService = {
  async getAllAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getAgentById(id: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateAgent(id: string, updates: Partial<Agent>) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async searchAgents(location?: string, specialty?: string, minRating?: number) {
    let query = supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true)
    
    if (location) {
      query = query.or(`location.ilike.%${location}%,service_areas.cs.{${location}}`)
    }
    
    if (specialty) {
      query = query.contains('specialties', [specialty])
    }
    
    if (minRating) {
      query = query.gte('rating', minRating)
    }
    
    const { data, error } = await query.order('rating', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// =====================================================
// PROPERTIES SERVICE
// =====================================================

export const propertiesService = {
  async getAllProperties(filters?: {
    status?: string
    property_type?: string
    category?: string
    city?: string
    min_price?: number
    max_price?: number
  }) {
    let query = supabase
      .from('properties')
      .select('*')  // Simple select without join for now
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.property_type) {
      query = query.eq('property_type', filters.property_type)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    if (filters?.min_price) {
      query = query.gte('price', filters.min_price)
    }
    if (filters?.max_price) {
      query = query.lte('price', filters.max_price)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching properties:', error)
      throw error
    }
    
    // If we have agent_ids, fetch agent data separately
    if (data && data.length > 0) {
      const agentIds = [...new Set(data.filter(p => p.agent_id).map(p => p.agent_id))]
      
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from('agents')
          .select('id, name, email, phone, avatar_url')
          .in('id', agentIds)
        
        // Map agents to properties
        if (agents) {
          const agentMap = agents.reduce((acc, agent) => {
            acc[agent.id] = agent
            return acc
          }, {} as any)
          
          data.forEach(property => {
            if (property.agent_id && agentMap[property.agent_id]) {
              property.agent = agentMap[property.agent_id]
            }
          })
        }
      }
    }
    
    return data || []
  },

  async getPropertyById(id: number) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Fetch agent data if property has agent_id
    if (data && data.agent_id) {
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', data.agent_id)
        .single()
      
      if (agent) {
        data.agent = agent
      }
    }
    
    // Try to increment view count (ignore error if function doesn't exist)
    try {
      await supabase.rpc('increment_property_view', { p_property_id: id })
    } catch (e) {
      // Ignore error if function doesn't exist
    }
    
    return data
  },

  async createProperty(property: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Clean up the data - remove empty strings and convert to proper types
    const cleanedProperty: any = {
      // Basic Information
      title: property.title,
      description: property.description || null,
      property_type: property.property_type || 'residential',
      property_subtype: property.property_subtype || 'apartment',
      category: property.category || 'sale',
      status: property.status || 'active',
      
      // Location
      address: property.address || null,
      unit_number: property.unit_number || null,
      neighborhood: property.neighborhood || null,
      city: property.city,
      state: property.state || null,
      postal_code: property.postal_code || null,
      country: property.country || 'India',
      
      // Pricing
      price: property.price ? parseFloat(property.price) : null,
      original_price: property.original_price ? parseFloat(property.original_price) : null,
      price_negotiable: property.price_negotiable || false,
      currency: property.currency || 'INR',
      rent_amount: property.rent_amount ? parseFloat(property.rent_amount) : null,
      rent_frequency: property.rent_frequency || 'monthly',
      security_deposit: property.security_deposit ? parseFloat(property.security_deposit) : null,
      maintenance_fee: property.maintenance_fee ? parseFloat(property.maintenance_fee) : null,
      
      // Specifications
      area_sqft: property.area_sqft ? parseFloat(property.area_sqft) : null,
      plot_area: property.plot_area ? parseFloat(property.plot_area) : null,
      built_up_area: property.built_up_area ? parseFloat(property.built_up_area) : null,
      carpet_area: property.carpet_area ? parseFloat(property.carpet_area) : null,
      
      // Room Details
      bedrooms: property.bedrooms ? parseInt(property.bedrooms) : null,
      bathrooms: property.bathrooms ? parseInt(property.bathrooms) : null,
      balconies: property.balconies ? parseInt(property.balconies) : null,
      total_rooms: property.total_rooms ? parseInt(property.total_rooms) : null,
      
      // Parking & Floors
      parking_spaces: property.parking_spaces ? parseInt(property.parking_spaces) : null,
      covered_parking: property.covered_parking ? parseInt(property.covered_parking) : null,
      floor_number: property.floor_number ? parseInt(property.floor_number) : null,
      total_floors: property.total_floors ? parseInt(property.total_floors) : null,
      
      // Construction
      year_built: property.year_built ? parseInt(property.year_built) : null,
      possession_date: property.possession_date || null,
      furnishing_status: property.furnishing_status || 'unfurnished',
      facing_direction: property.facing_direction || 'north',
      property_condition: property.property_condition || 'new',
      
      // Features
      amenities: property.amenities || [],
      image_urls: property.image_urls || [],
      images: property.image_urls || [], // Duplicate for compatibility
      
      // Marketing
      is_featured: property.is_featured || false,
      featured: property.is_featured || false, // Duplicate for compatibility
      meta_title: property.meta_title || null,
      meta_description: property.meta_description || null,
      
      // Ownership
      created_by: user.id,
      owner_id: user.id
    }
    
    // Remove null/empty values
    Object.keys(cleanedProperty).forEach(key => {
      if (cleanedProperty[key] === '' || cleanedProperty[key] === undefined) {
        delete cleanedProperty[key]
      }
    })
    
    const { data, error } = await supabase
      .from('properties')
      .insert(cleanedProperty)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating property:', error)
      console.error('Property data:', cleanedProperty)
      throw error
    }
    return data
  },

  async updateProperty(id: number, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteProperty(id: number) {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'inactive' })
      .eq('id', id)
    
    if (error) throw error
  },

  async searchProperties(searchTerm: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .limit(20)
    
    if (error) throw error
    return data
  },

  async getNearbyProperties(latitude: number, longitude: number, radiusKm: number = 5) {
    const { data, error } = await supabase
      .rpc('get_nearby_properties', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_km: radiusKm
      })
    
    if (error) throw error
    return data
  }
}

// =====================================================
// LEADS SERVICE
// =====================================================

export const leadsService = {
  async getAllLeads(filters?: {
    stage?: string
    priority?: string
    assigned_to?: string
  }) {
    let query = supabase
      .from('leads')
      .select('*')
    
    if (filters?.stage) {
      query = query.eq('stage', filters.stage)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }
    
    // Sort by created_at descending (newest first)
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getLeadById(id: number) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateLead(id: number, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async convertLeadToClient(leadId: number) {
    const { data, error } = await supabase
      .rpc('convert_lead_to_client', {
        p_lead_id: leadId
      })
    
    if (error) throw error
    return data
  },

  async getLeadStatistics(userId?: string, dateFrom?: string, dateTo?: string) {
    const { data, error } = await supabase
      .rpc('get_lead_statistics', {
        p_user_id: userId,
        p_date_from: dateFrom,
        p_date_to: dateTo
      })
    
    if (error) throw error
    return data
  },

  async getUpcomingFollowups(userId?: string, days: number = 7) {
    const { data, error } = await supabase
      .rpc('get_upcoming_followups', {
        p_user_id: userId,
        p_days: days
      })
    
    if (error) throw error
    return data
  }
}

// =====================================================
// CLIENTS SERVICE
// =====================================================

export const clientsService = {
  async getAllClients(filters?: {
    status?: string
    client_type?: string
    loyalty_tier?: string
  }) {
    let query = supabase
      .from('clients')
      .select(`
        *,
        primary_agent:agents!primary_agent_id(name, email, phone)
      `)
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.client_type) {
      query = query.eq('client_type', filters.client_type)
    }
    if (filters?.loyalty_tier) {
      query = query.eq('loyalty_tier', filters.loyalty_tier)
    }
    
    const { data, error } = await query.order('total_transactions', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getClientById(id: number) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        primary_agent:agents!primary_agent_id(*),
        lead:leads!lead_id(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateClient(id: number, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getClientStatistics(agentId?: string) {
    const { data, error } = await supabase
      .rpc('get_client_statistics', {
        p_agent_id: agentId
      })
    
    if (error) throw error
    return data
  }
}

// =====================================================
// CONVERSATIONS SERVICE
// =====================================================

export const conversationsService = {
  async getAllConversations() {
    const { data, error } = await supabase
      .from('conversation_details')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
    
    if (error) throw error
    return data
  },

  async getConversationById(id: number) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createConversation(conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        ...conversation,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markConversationRead(id: number) {
    const { data, error } = await supabase
      .rpc('mark_conversation_read', {
        p_conversation_id: id
      })
    
    if (error) throw error
    return data
  },

  // Real-time subscription for conversations
  subscribeToConversations(callback: (payload: any) => void) {
    return supabase
      .channel('conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        callback
      )
      .subscribe()
  }
}

// =====================================================
// MESSAGES SERVICE
// =====================================================

export const messagesService = {
  async getMessagesByConversation(conversationId: number, limit: number = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data?.reverse() // Return in chronological order
  },

  async sendMessage(
    conversationId: number,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string
  ) {
    const { data, error } = await supabase
      .rpc('send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: messageType,
        p_media_url: mediaUrl
      })
    
    if (error) throw error
    return data
  },

  async markMessagesRead(conversationId: number, upToMessageId?: number) {
    const { data, error } = await supabase
      .rpc('mark_messages_read', {
        p_conversation_id: conversationId,
        p_up_to_message_id: upToMessageId
      })
    
    if (error) throw error
    return data
  },

  // Real-time subscription for messages
  subscribeToMessages(conversationId: number, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe()
  }
}

// =====================================================
// APPOINTMENTS SERVICE
// =====================================================

export const appointmentsService = {
  async getAllAppointments(filters?: {
    status?: string
    appointment_type?: string
    start_date?: string
    end_date?: string
  }) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        client:clients!client_id(name, email, phone),
        property:properties!property_id(title, address, city),
        agent:agents!agent_id(name, email, phone)
      `)
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.appointment_type) {
      query = query.eq('appointment_type', filters.appointment_type)
    }
    if (filters?.start_date) {
      query = query.gte('start_time', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('end_time', filters.end_date)
    }
    
    const { data, error } = await query.order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getAppointmentById(id: number) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients!client_id(*),
        lead:leads!lead_id(*),
        property:properties!property_id(*),
        agent:agents!agent_id(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'duration_minutes'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointment,
        user_id: user.id,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateAppointment(id: number, updates: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async rescheduleAppointment(id: number, newStartTime: string, newEndTime: string, reason?: string) {
    const { data, error } = await supabase
      .rpc('reschedule_appointment', {
        p_appointment_id: id,
        p_new_start_time: newStartTime,
        p_new_end_time: newEndTime,
        p_reason: reason
      })
    
    if (error) throw error
    return data
  },

  async getUpcomingAppointments(userId?: string, daysAhead: number = 7) {
    const { data, error } = await supabase
      .rpc('get_upcoming_appointments', {
        p_user_id: userId,
        p_days_ahead: daysAhead
      })
    
    if (error) throw error
    return data
  },

  async checkConflicts(startTime: string, endTime: string, agentId?: string, excludeId?: number) {
    const { data, error } = await supabase
      .rpc('check_appointment_conflicts', {
        p_start_time: startTime,
        p_end_time: endTime,
        p_agent_id: agentId,
        p_exclude_appointment_id: excludeId
      })
    
    if (error) throw error
    return data
  }
}

// =====================================================
// INVOICES SERVICE
// =====================================================

export const invoicesService = {
  async getAllInvoices(filters?: {
    status?: string
    payment_status?: string
    invoice_type?: string
    date_from?: string
    date_to?: string
  }) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients!client_id(name, email, phone, client_code),
        property:properties!property_id(title, property_code)
      `)
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }
    if (filters?.invoice_type) {
      query = query.eq('invoice_type', filters.invoice_type)
    }
    if (filters?.date_from) {
      query = query.gte('invoice_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('invoice_date', filters.date_to)
    }
    
    const { data, error } = await query.order('invoice_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getInvoiceById(id: number) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients!client_id(*),
        property:properties!property_id(*),
        appointment:appointments!appointment_id(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'balance_due' | 'invoice_number'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        user_id: user.id,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateInvoice(id: number, updates: Partial<Invoice>) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async recordPayment(
    invoiceId: number,
    amount: number,
    paymentMethod: string,
    paymentReference?: string,
    paymentDate?: string
  ) {
    const { data, error } = await supabase
      .rpc('record_invoice_payment', {
        p_invoice_id: invoiceId,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_payment_reference: paymentReference,
        p_payment_date: paymentDate
      })
    
    if (error) throw error
    return data
  },

  async getInvoiceStatistics(userId?: string, dateFrom?: string, dateTo?: string) {
    const { data, error } = await supabase
      .rpc('get_invoice_statistics', {
        p_user_id: userId,
        p_date_from: dateFrom,
        p_date_to: dateTo
      })
    
    if (error) throw error
    return data
  }
}

// =====================================================
// NOTIFICATIONS SERVICE
// =====================================================

export const notificationsService = {
  async getAllNotifications(filters?: {
    is_read?: boolean
    category?: string
    priority?: string
  }) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('is_deleted', false)
      .eq('is_archived', false)
    
    if (filters?.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async markAsRead(notificationIds: number[]) {
    const { data, error } = await supabase
      .rpc('mark_notifications_read', {
        p_notification_ids: notificationIds
      })
    
    if (error) throw error
    return data
  },

  async markAllAsRead() {
    const { data, error } = await supabase
      .rpc('mark_notifications_read', {
        p_mark_all: true
      })
    
    if (error) throw error
    return data
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getNotificationStatistics() {
    const { data, error } = await supabase
      .rpc('get_notification_statistics')
    
    if (error) throw error
    return data
  },

  // Real-time subscription for notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

// =====================================================
// DASHBOARD SERVICE
// =====================================================

export const dashboardService = {
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get multiple statistics in parallel
    const [
      propertiesData,
      leadsData,
      clientsData,
      appointmentsData,
      invoicesData,
      notificationsData
    ] = await Promise.all([
      propertiesService.getAllProperties({ status: 'active' }),
      leadsService.getLeadStatistics(user.id),
      clientsService.getClientStatistics(),
      appointmentsService.getUpcomingAppointments(user.id),
      invoicesService.getInvoiceStatistics(user.id),
      notificationsService.getNotificationStatistics()
    ])

    return {
      properties: propertiesData,
      leads: leadsData,
      clients: clientsData,
      appointments: appointmentsData,
      invoices: invoicesData,
      notifications: notificationsData
    }
  }
}