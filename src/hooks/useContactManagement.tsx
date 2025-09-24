// hooks/useContactManagement.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { parse } from 'papaparse';

export interface Contact {
  id: string;
  contact_list_id: string;
  phone_number: string;
  country_code: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  opted_in: boolean;
  status: 'active' | 'inactive' | 'bounced';
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ContactList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  total_contacts: number;
  opted_in_count: number;
  opted_out_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContactImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface ContactFilters {
  opted_in?: boolean;
  status?: string;
  search?: string;
}

export function useContactManagement() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Fetch contact lists with proper error handling
  const fetchContactLists = useCallback(async (): Promise<ContactList[]> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const lists = data || [];
      setContactLists(lists);
      return lists;
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      throw new Error('Failed to load contact lists');
    }
  }, [user]);

  // Fetch contacts with filtering and pagination
  const fetchContacts = useCallback(async (
    contactListId: string, 
    filters: ContactFilters = {},
    page = 1,
    pageSize = 50
  ): Promise<Contact[]> => {
    if (!user) throw new Error('User not authenticated');
    if (!contactListId) throw new Error('Contact list ID is required');

    try {
      setLoading(true);
      
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('contact_list_id', contactListId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (filters.opted_in !== undefined) {
        query = query.eq('opted_in', filters.opted_in);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.search) {
        query = query.or(`phone_number.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const contactsData = data || [];
      setContacts(contactsData);
      return contactsData;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new contact list
  const createContactList = useCallback(async (name: string, description?: string): Promise<ContactList> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .insert([{
          name,
          description,
          user_id: user.id,
          total_contacts: 0,
          opted_in_count: 0,
          opted_out_count: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      setContactLists(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating contact list:', error);
      throw new Error('Failed to create contact list');
    }
  }, [user]);

  // Delete contact list
  const deleteContactList = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('contact_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setContactLists(prev => prev.filter(list => list.id !== id));
    } catch (error) {
      console.error('Error deleting contact list:', error);
      throw new Error('Failed to delete contact list');
    }
  }, [user]);

  // Add single contact
  const addContact = useCallback(async (
    contactListId: string, 
    contactData: any
  ): Promise<Contact> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Validate phone number
      const cleanPhone = contactData.phone_number.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error('Phone number must be 10-15 digits');
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contactData,
          phone_number: cleanPhone,
          contact_list_id: contactListId,
          user_id: user.id,
          status: 'active',
          source: 'manual'
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Contact with this phone number already exists in the list');
        }
        throw error;
      }
      
      setContacts(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }, [user]);

  // Add multiple contacts
  const addContacts = useCallback(async (
    contactListId: string, 
    contactsData: Omit<Contact, 'id' | 'contact_list_id' | 'user_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const contactsToInsert = contactsData.map(contact => ({
        ...contact,
        phone_number: contact.phone_number.replace(/\D/g, ''),
        contact_list_id: contactListId,
        user_id: user.id,
        status: 'active',
        source: 'bulk_import'
      }));

      const { error } = await supabase
        .from('contacts')
        .insert(contactsToInsert);

      if (error) throw error;
      
      // Refresh contacts
      await fetchContacts(contactListId);
    } catch (error) {
      console.error('Error adding contacts:', error);
      throw new Error('Failed to add contacts');
    }
  }, [user, fetchContacts]);

  // Update contact
  const updateContact = useCallback(async (
    contactId: string, 
    updates: Partial<Contact>
  ): Promise<Contact> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? data : contact
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new Error('Failed to update contact');
    }
  }, [user]);

  // Delete contact
  const deleteContact = useCallback(async (contactId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Failed to delete contact');
    }
  }, [user]);

  // Import contacts from file
  const importContactsFromFile = useCallback(async (
    contactListId: string, 
    file: File
  ): Promise<ContactImportResult> => {
    if (!user) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      setImporting(true);
      
      parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const validContacts: any[] = [];
            const errors: string[] = [];
            let successCount = 0;
            let failedCount = 0;

            for (const [index, row] of results.data.entries()) {
              try {
                const phoneNumber = (row.phone || row.phone_number || row.number || '').toString().replace(/\D/g, '');
                
                if (!phoneNumber) {
                  errors.push(`Row ${index + 2}: Phone number is required`);
                  failedCount++;
                  continue;
                }

                if (phoneNumber.length < 10 || phoneNumber.length > 15) {
                  errors.push(`Row ${index + 2}: Invalid phone number length`);
                  failedCount++;
                  continue;
                }

                validContacts.push({
                  phone_number: phoneNumber,
                  country_code: row.country_code || '+1',
                  first_name: row.first_name || row.firstname || row.fname || '',
                  last_name: row.last_name || row.lastname || row.lname || '',
                  email: row.email || '',
                  //company: row.company || '',
                  opted_in: !(row.opted_in === 'false' || row.opt_in === 'false' || row.opted_in === false),
                  source: 'file_import'
                });
                
                successCount++;
              } catch (error) {
                errors.push(`Row ${index + 2}: Invalid data format`);
                failedCount++;
              }
            }

            if (validContacts.length > 0) {
              await addContacts(contactListId, validContacts);
            }

            resolve({
              success: successCount,
              failed: failedCount,
              errors
            });
          } catch (error) {
            reject(error);
          } finally {
            setImporting(false);
          }
        },
        error: (error) => {
          setImporting(false);
          reject(error);
        }
      });
    });
  }, [user, addContacts]);

  // Export contacts to CSV
  const exportContacts = useCallback(async (contactListId: string, filters: ContactFilters = {}): Promise<string> => {
    const contacts = await fetchContacts(contactListId, filters, 1, 10000); // Get all contacts
    
    const headers = ['Phone Number', 'Country Code', 'First Name', 'Last Name', 'Email', 'Opted In', 'Status'];
    const csvRows = contacts.map(contact => [
      contact.phone_number,
      contact.country_code,
      contact.first_name || '',
      contact.last_name || '',
      contact.email || '',
      //contact.company || '',
      contact.opted_in ? 'Yes' : 'No',
      contact.status
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }, [fetchContacts]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchContactLists(),
        ]);
        setLoading(false);
      };
      
      loadData();
    }
  }, [user]);

  return {
    // State
    contacts,
    contactLists,
    loading,
    importing,
    
    // Methods
    fetchContactLists,
    fetchContacts,
    createContactList,
    deleteContactList,
    addContact,
    addContacts,
    updateContact,
    deleteContact,
    importContactsFromFile,
    exportContacts
  };
}