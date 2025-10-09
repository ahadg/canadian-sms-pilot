// hooks/useContactManagement.ts
import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from 'sonner';
import { parse } from 'papaparse';
import { contactAPI } from '../lib/api/contacts';

export interface Contact {
  _id: string;
  contactList: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  tags: string[];
  customFields: Record<string, any>;
  optedIn: boolean;
  status: 'active' | 'inactive' | 'bounced';
  source: string;
  importBatchId?: string;
  createdAt: string;
  updatedAt: string;
  user: string;
}

export interface ContactList {
  _id: string;
  name: string;
  description?: string;
  totalContacts: number;
  optedInCount: number;
  optedOutCount: number;
  createdAt: string;
  updatedAt: string;
  user: string;
}

export interface ContactImportResult {
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
    data: any;
  }>;
}

export interface ContactFilters {
  optedIn?: boolean;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useContactManagement() {
  const { user, isAuthenticated } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 50
  });

  // Fetch contact lists with proper error handling
  const fetchContactLists = useCallback(async (): Promise<ContactList[]> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.getLists();
      const lists = response.data.contactLists || [];
      setContactLists(lists);
      return lists;
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      toast.error('Failed to load contact lists');
      throw new Error('Failed to load contact lists');
    }
  }, [isAuthenticated]);

  // Refresh contact lists (optimized version)
  const refreshContactLists = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      const response = await contactAPI.getLists();
      const lists = response.data.contactLists || [];
      setContactLists(lists);
    } catch (error) {
      console.error('Error refreshing contact lists:', error);
    }
  }, [isAuthenticated]);

  // Fetch contacts with filtering and pagination
  const fetchContacts = useCallback(async (
    contactListId: string, 
    filters: ContactFilters = {}
  ): Promise<Contact[]> => {
    if (!isAuthenticated) throw new Error('User not authenticated');
    if (!contactListId) throw new Error('Contact list ID is required');

    try {
      setLoading(true);
      
      const params: any = {
        page: filters.page || 1,
        limit: filters.limit || 50
      };

      // Only include filters that are needed for initial load
      if (filters.optedIn !== undefined) {
        params.optedIn = filters.optedIn;
      }
      
      if (filters.status) {
        params.status = filters.status;
      }
      
      // Remove search from API call since we handle it locally
      // if (filters.search) {
      //   params.search = filters.search;
      // }

      const response = await contactAPI.getContacts(contactListId, params);
      const contactsData = response.data.contacts || [];
      
      setContacts(contactsData);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        limit: response.data.limit || 50
      });
      
      return contactsData;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
      throw new Error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create new contact list
  const createContactList = useCallback(async (name: string, description?: string): Promise<ContactList> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.createList({
        name,
        description
      });
      
      const newList = response.data.contactList;
      setContactLists(prev => [newList, ...prev]);
      toast.success('Contact list created successfully');
      return newList;
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast.error('Failed to create contact list');
      throw new Error('Failed to create contact list');
    }
  }, [isAuthenticated]);

  // Update contact list
  const updateContactList = useCallback(async (id: string, updates: Partial<ContactList>): Promise<ContactList> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.updateList(id, updates);
      const updatedList = response.data.contactList;
      
      setContactLists(prev => prev.map(list => 
        list._id === id ? { ...list, ...updatedList } : list
      ));
      toast.success('Contact list updated successfully');
      return updatedList;
    } catch (error) {
      console.error('Error updating contact list:', error);
      toast.error('Failed to update contact list');
      throw new Error('Failed to update contact list');
    }
  }, [isAuthenticated]);

  // Delete contact list
  const deleteContactList = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      await contactAPI.deleteList(id);
      setContactLists(prev => prev.filter(list => list._id !== id));
      toast.success('Contact list deleted successfully');
    } catch (error) {
      console.error('Error deleting contact list:', error);
      toast.error('Failed to delete contact list');
      throw new Error('Failed to delete contact list');
    }
  }, [isAuthenticated]);

  // Add single contact
  const addContact = useCallback(async (
    contactListId: string, 
    contactData: any
  ): Promise<Contact> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      // Validate phone number
      const cleanPhone = contactData?.phoneNumber?.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error('Phone number must be 10-15 digits');
      }

      const response = await contactAPI.createContact(contactListId, {
        ...contactData,
        phoneNumber: cleanPhone,
        status: 'active',
        source: 'manual'
      });
      
      const newContact = response.data.contact;
      
      // Update local state immediately for better UX
      setContacts(prev => [newContact, ...prev]);
      
      // Refresh contact lists to update counts
      await refreshContactLists();
      
      toast.success('Contact added successfully');
      return newContact;
    } catch (error: any) {
      console.error('Error adding contact:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        toast.error('Contact with this phone number already exists in the list');
        throw new Error('Contact with this phone number already exists in the list');
      }
      toast.error('Failed to add contact');
      throw error;
    }
  }, [isAuthenticated, refreshContactLists]);

  // Update contact
  const updateContact = useCallback(async (
    contactId: string, 
    updates: Partial<Contact>
  ): Promise<Contact> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.updateContact(contactId, updates);
      const updatedContact = response.data.contact;
      
      // Update local state immediately
      setContacts(prev => prev.map(contact => 
        contact._id === contactId ? { ...contact, ...updatedContact } : contact
      ));
      
      // Refresh contact lists to update counts if optedIn changed
      if (updates.optedIn !== undefined) {
        await refreshContactLists();
      }
      
      toast.success('Contact updated successfully');
      return updatedContact;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
      throw new Error('Failed to update contact');
    }
  }, [isAuthenticated, refreshContactLists]);

  // Delete contact
  const deleteContact = useCallback(async (contactId: string): Promise<void> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      await contactAPI.deleteContact(contactId);
      
      // Update local state immediately
      setContacts(prev => prev.filter(contact => contact._id !== contactId));
      
      // Refresh contact lists to update counts
      await refreshContactLists();
      
      toast.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
      throw new Error('Failed to delete contact');
    }
  }, [isAuthenticated, refreshContactLists]);

  // Bulk import contacts
  const importContactsFromFile = useCallback(async (
    contactListId: string, 
    file: File
  ): Promise<ContactImportResult> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      setImporting(true);
      
      parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const contactsToImport: any[] = [];
            const errors: Array<{ index: number; error: string; data: any }> = [];

            for (const [index, row] of results.data.entries()) {
              try {
                const phoneNumber = (row.phone || row.phone_number || row.number || row.Phone || row.phoneNumber || '').toString().replace(/\D/g, '');
                
                if (!phoneNumber) {
                  errors.push({
                    index: index + 2,
                    error: 'Phone number is required',
                    data: row
                  });
                  continue;
                }

                if (phoneNumber.length < 10 || phoneNumber.length > 15) {
                  errors.push({
                    index: index + 2,
                    error: 'Invalid phone number length',
                    data: row
                  });
                  continue;
                }

                const optedIn = !(
                  row.opted_in === 'false' || 
                  row.opt_in === 'false' || 
                  row.optedIn === 'false' ||
                  row.opted_in === '0' ||
                  row.optedIn === '0' ||
                  row.opted_in === false
                );

                contactsToImport.push({
                  phoneNumber: phoneNumber,
                  // countryCode: row.country_code || row.countryCode || '+1',
                  firstName: row.first_name || row.firstName || row.firstname || row['First Name'] || '',
                  lastName: row.last_name || row.lastName || row.lastname || row['Last Name'] || '',
                  email: row.email || row.Email || '',
                  company: row.company || row.Company || '',
                  optedIn: optedIn,
                  tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [],
                  customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {},
                  source: 'file_import'
                });
              } catch (error) {
                errors.push({
                  index: index + 2,
                  error: 'Invalid data format',
                  data: row
                });
              }
            }

            let importResult: ContactImportResult = {
              success: 0,
              failed: errors.length,
              errors: errors
            };

            if (contactsToImport.length > 0) {
              try {
                const response = await contactAPI.importContacts(contactListId, contactsToImport);
                importResult = {
                  success: response.data.imported || contactsToImport.length,
                  failed: response.data.failed || errors.length,
                  errors: [...errors, ...(response.data.errors || [])]
                };
              } catch (importError) {
                importResult.failed += contactsToImport.length;
                errors.push({
                  index: 0,
                  error: 'Bulk import failed',
                  data: null
                });
              }
            }

            // Refresh contacts and lists if any were successfully imported
            if (importResult.success > 0) {
              await fetchContacts(contactListId);
              await refreshContactLists();
            }

            resolve(importResult);
          } catch (error) {
            reject(error);
          } finally {
            setImporting(false);
          }
        },
        error: (error) => {
          setImporting(false);
          toast.error('Failed to parse CSV file');
          reject(error);
        }
      });
    });
  }, [isAuthenticated, fetchContacts, refreshContactLists]);

  // Export contacts to CSV
  const exportContacts = useCallback(async (contactListId: string, filters: ContactFilters = {}): Promise<string> => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      // Get all contacts by setting a high limit
      const response = await contactAPI.getContacts(contactListId, {
        ...filters,
        limit: 10000,
        page: 1
      });
      
      const contacts = response.data.contacts || [];
      
      const headers = ['Phone Number', 'Country Code', 'First Name', 'Last Name', 'Email', 'Company', 'Opted In', 'Status', 'Source'];
      const csvRows = contacts.map(contact => [
        contact.phoneNumber,
        // contact.countryCode,
        contact.firstName || '',
        contact.lastName || '',
        contact.email || '',
        contact.company || '',
        contact.optedIn ? 'Yes' : 'No',
        contact.status,
        contact.source
      ]);

      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => `"${field?.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting contacts:', error);
      throw new Error('Failed to export contacts');
    }
  }, [isAuthenticated]);

  // Toggle contact opted-in status
  const toggleContactOptIn = useCallback(async (contactId: string, optedIn: boolean): Promise<Contact> => {
    return updateContact(contactId, { optedIn });
  }, [updateContact]);

  // Get contact list statistics
  const getContactListStats = useCallback(async (contactListId: string) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.getListById(contactListId);
      const list = response.data.contactList;
      
      return {
        totalContacts: list.totalContacts,
        optedInCount: list.optedInCount,
        optedOutCount: list.optedOutCount,
        activeCount: list.totalContacts - list.optedOutCount
      };
    } catch (error) {
      console.error('Error fetching contact list stats:', error);
      throw error;
    }
  }, [isAuthenticated]);

  // Search contacts across all lists
  const searchContacts = useCallback((query: string, filters: ContactFilters = {}): Contact[] => {
    if (!query.trim()) {
      // If no search query, just apply filters
      let results = contacts;
      
      if (filters.optedIn !== undefined) {
        results = results.filter(contact => contact.optedIn === filters.optedIn);
      }
      
      if (filters.status) {
        results = results.filter(contact => contact.status === filters.status);
      }
      
      return results;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return contacts.filter(contact => {
      // Search across multiple fields
      const matchesSearch = 
        contact.phoneNumber?.toLowerCase().includes(searchTerm) ||
        contact.firstName?.toLowerCase().includes(searchTerm) ||
        contact.lastName?.toLowerCase().includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm) ||
        `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase().includes(searchTerm);

      // Apply filters
      const matchesOptedIn = filters.optedIn === undefined || contact.optedIn === filters.optedIn;
      const matchesStatus = !filters.status || contact.status === filters.status;

      return matchesSearch && matchesOptedIn && matchesStatus;
    });
  }, [contacts]);
  // Initialize data
  useEffect(() => {
    if (isAuthenticated) {
      fetchContactLists();
    } else {
      setContacts([]);
      setContactLists([]);
    }
  }, [isAuthenticated, fetchContactLists]);

  return {
    // State
    contacts,
    contactLists,
    loading,
    importing,
    pagination,
    
    // Methods
    fetchContactLists,
    refreshContactLists,
    fetchContacts,
    createContactList,
    updateContactList,
    deleteContactList,
    addContact,
    updateContact,
    deleteContact,
    importContactsFromFile,
    exportContacts,
    toggleContactOptIn,
    getContactListStats,
    searchContacts
  };
}