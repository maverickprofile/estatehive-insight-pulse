import { supabase } from '@/lib/supabaseClient';
import { Agent } from '@/types/database.types';

export const agentsService = {
  // Get all agents
  async getAllAgents(filters?: any) {
    let query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.specialization) {
      query = query.contains('specialization', [filters.specialization]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single agent
  async getAgent(id: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create agent
  async createAgent(agent: Partial<Agent>) {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update agent
  async updateAgent(id: string, updates: Partial<Agent>) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete agent
  async deleteAgent(id: string) {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get agent stats
  async getAgentStats(id: string) {
    // Get properties managed by agent
    const { data: properties } = await supabase
      .from('properties')
      .select('id, status')
      .eq('agent_id', id);

    // Get leads assigned to agent
    const { data: leads } = await supabase
      .from('leads')
      .select('id, stage')
      .eq('assigned_to', id);

    // Get clients assigned to agent
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('assigned_agent', id);

    return {
      totalProperties: properties?.length || 0,
      activeProperties: properties?.filter(p => p.status === 'active').length || 0,
      totalLeads: leads?.length || 0,
      convertedLeads: leads?.filter(l => l.stage === 'won').length || 0,
      totalClients: clients?.length || 0
    };
  },

  // Search agents
  async searchAgents(searchTerm: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  }
};