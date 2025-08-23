import { supabase } from '@/lib/supabaseClient';
import { Appointment } from '@/types/database.types';

export const appointmentsService = {
  // Get all appointments
  async getAllAppointments(filters?: any) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email)
      `)
      .order('start_time', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id);
    }

    if (filters?.date_from) {
      query = query.gte('start_time', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('start_time', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single appointment
  async getAppointment(id: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address, price),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email, phone)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create appointment
  async createAppointment(appointment: Partial<Appointment>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...appointment, created_by: user.id }])
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update appointment
  async updateAppointment(id: string, updates: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete appointment
  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get appointments for a specific date range
  async getAppointmentsByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email)
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get upcoming appointments
  async getUpcomingAppointments(limit: number = 5) {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email)
      `)
      .gte('start_time', now)
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Get appointment statistics
  async getAppointmentStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000)).toISOString();
    const endOfWeek = new Date(today.getTime() + ((6 - today.getDay()) * 24 * 60 * 60 * 1000)).toISOString();

    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('id, status, start_time, appointment_type');

    const { data: todayAppointments } = await supabase
      .from('appointments')
      .select('id')
      .gte('start_time', startOfDay)
      .lt('start_time', endOfDay);

    const { data: weekAppointments } = await supabase
      .from('appointments')
      .select('id')
      .gte('start_time', startOfWeek)
      .lt('start_time', endOfWeek);

    const total = allAppointments?.length || 0;
    const today_count = todayAppointments?.length || 0;
    const week_count = weekAppointments?.length || 0;
    const scheduled = allAppointments?.filter(a => a.status === 'scheduled').length || 0;
    const completed = allAppointments?.filter(a => a.status === 'completed').length || 0;
    const cancelled = allAppointments?.filter(a => a.status === 'cancelled').length || 0;
    const property_viewings = allAppointments?.filter(a => a.appointment_type === 'property_viewing').length || 0;
    const consultations = allAppointments?.filter(a => a.appointment_type === 'consultation').length || 0;

    return {
      total,
      today_count,
      week_count,
      scheduled,
      completed,
      cancelled,
      property_viewings,
      consultations
    };
  },

  // Search appointments
  async searchAppointments(searchTerm: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email)
      `)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get appointments for a specific agent
  async getAgentAppointments(agentId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address),
        client:clients(id, name, email, phone)
      `)
      .eq('agent_id', agentId)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get appointments for a specific client
  async getClientAppointments(clientId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address),
        agent:agents(id, name, email)
      `)
      .eq('client_id', clientId)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};