import { supabase } from '@/lib/supabaseClient';
import { Invoice } from '@/types/database.types';

export const invoicesService = {
  // Get all invoices
  async getAllInvoices(filters?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address),
        agent:agents(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single invoice
  async getInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, address),
        property:properties(id, title, address, price),
        agent:agents(id, name, email, phone)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create invoice
  async createInvoice(invoice: Partial<Invoice>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate invoice number if not provided
    if (!invoice.invoice_number) {
      const year = new Date().getFullYear();
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `INV-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastInvoice && lastInvoice.length > 0) {
        const lastNumber = parseInt(lastInvoice[0].invoice_number.split('-').pop() || '0');
        nextNumber = lastNumber + 1;
      }
      
      invoice.invoice_number = `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...invoice, created_by: user.id }])
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address),
        agent:agents(id, name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Invoice>) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address),
        agent:agents(id, name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete invoice
  async deleteInvoice(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get invoices by status
  async getInvoicesByStatus(status: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address)
      `)
      .eq('status', status)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get overdue invoices
  async getOverdueInvoices() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address)
      `)
      .lt('due_date', today)
      .neq('status', 'paid')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get invoice statistics
  async getInvoiceStats() {
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('id, status, total_amount, due_date, created_at');

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const total = allInvoices?.length || 0;
    const totalAmount = allInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const paid = allInvoices?.filter(inv => inv.status === 'paid').length || 0;
    const pending = allInvoices?.filter(inv => inv.status === 'sent').length || 0;
    const draft = allInvoices?.filter(inv => inv.status === 'draft').length || 0;
    const paidAmount = allInvoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const pendingAmount = allInvoices?.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    
    const overdue = allInvoices?.filter(inv => {
      const dueDate = new Date(inv.due_date);
      return dueDate < today && inv.status !== 'paid';
    }).length || 0;

    const thisMonthInvoices = allInvoices?.filter(inv => {
      const createdDate = new Date(inv.created_at);
      return createdDate >= thisMonth;
    }).length || 0;

    const thisMonthAmount = allInvoices?.filter(inv => {
      const createdDate = new Date(inv.created_at);
      return createdDate >= thisMonth;
    }).reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    return {
      total,
      totalAmount,
      paid,
      pending,
      draft,
      overdue,
      paidAmount,
      pendingAmount,
      thisMonthInvoices,
      thisMonthAmount
    };
  },

  // Search invoices
  async searchInvoices(searchTerm: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address)
      `)
      .or(`invoice_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Mark invoice as paid
  async markAsPaid(id: string, paidAmount?: number, paidDate?: string) {
    const updates: any = {
      status: 'paid',
      paid_date: paidDate || new Date().toISOString()
    };

    if (paidAmount !== undefined) {
      updates.paid_amount = paidAmount;
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Send invoice
  async sendInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        sent_date: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get client invoices
  async getClientInvoices(clientId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        property:properties(id, title, address),
        agent:agents(id, name, email)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get agent invoices
  async getAgentInvoices(agentId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone),
        property:properties(id, title, address)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};