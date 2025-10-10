// store/useContactStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { parse } from 'papaparse';
import { contactAPI } from '../lib/api/contacts';
import { useAuthStore } from './useAuthStore';

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

interface ContactState {
  // State
  contacts: Contact[];
  contactLists: ContactList[];
  loading: boolean;
  importing: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };

  // Actions
  fetchContactLists: () => Promise<ContactList[]>;
  refreshContactLists: () => Promise<void>;
  fetchContacts: (contactListId: string, filters?: ContactFilters) => Promise<Contact[]>;
  createContactList: (name: string, description?: string) => Promise<ContactList>;
  updateContactList: (id: string, updates: Partial<ContactList>) => Promise<ContactList>;
  deleteContactList: (id: string) => Promise<void>;
  addContact: (contactListId: string, contactData: any) => Promise<Contact>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<Contact>;
  deleteContact: (contactId: string) => Promise<void>;
  importContactsFromFile: (contactListId: string, file: File) => Promise<ContactImportResult>;
  exportContacts: (contactListId: string, filters?: ContactFilters) => Promise<string>;
  toggleContactOptIn: (contactId: string, optedIn: boolean) => Promise<Contact>;
  getContactListStats: (contactListId: string) => Promise<any>;
  searchContacts: (query: string, filters?: ContactFilters) => Contact[];
  setLoading: (loading: boolean) => void;
  setImporting: (importing: boolean) => void;
  reset: () => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
  // Initial state
  contacts: [],
  contactLists: [],
  loading: false,
  importing: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 50
  },

  // Actions
  fetchContactLists: async (): Promise<ContactList[]> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.getLists();
      const lists = response.data.contactLists || [];
      set({ contactLists: lists });
      return lists;
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      toast.error('Failed to load contact lists');
      throw new Error('Failed to load contact lists');
    }
  },

  refreshContactLists: async (): Promise<void> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;
    
    try {
      const response = await contactAPI.getLists();
      const lists = response.data.contactLists || [];
      set({ contactLists: lists });
    } catch (error) {
      console.error('Error refreshing contact lists:', error);
    }
  },

  fetchContacts: async (contactListId: string, filters: ContactFilters = {}): Promise<Contact[]> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');
    if (!contactListId) throw new Error('Contact list ID is required');

    try {
      set({ loading: true });
      
      const params: any = {
        page: filters.page || 1,
        limit: filters.limit || 50
      };

      if (filters.optedIn !== undefined) {
        params.optedIn = filters.optedIn;
      }
      
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await contactAPI.getContacts(contactListId, params);
      const contactsData = response.data.contacts || [];
      
      set({ 
        contacts: contactsData,
        pagination: {
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
          total: response.data.total || 0,
          limit: response.data.limit || 50
        }
      });
      
      return contactsData;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
      throw new Error('Failed to load contacts');
    } finally {
      set({ loading: false });
    }
  },

  createContactList: async (name: string, description?: string): Promise<ContactList> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.createList({
        name,
        description
      });
      
      const newList = response.data.contactList;
      set(state => ({ 
        contactLists: [newList, ...state.contactLists] 
      }));
      toast.success('Contact list created successfully');
      return newList;
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast.error('Failed to create contact list');
      throw new Error('Failed to create contact list');
    }
  },

  updateContactList: async (id: string, updates: Partial<ContactList>): Promise<ContactList> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.updateList(id, updates);
      const updatedList = response.data.contactList;
      
      set(state => ({
        contactLists: state.contactLists.map(list => 
          list._id === id ? { ...list, ...updatedList } : list
        )
      }));
      toast.success('Contact list updated successfully');
      return updatedList;
    } catch (error) {
      console.error('Error updating contact list:', error);
      toast.error('Failed to update contact list');
      throw new Error('Failed to update contact list');
    }
  },

  deleteContactList: async (id: string): Promise<void> => {
    try {
      await contactAPI.deleteList(id);
      set(state => ({ 
        contactLists: state.contactLists.filter(list => list._id !== id) 
      }));
      //alert('Contact list deleted successfully');
    } catch (error) {
      console.error('Error deleting contact list:', error);
      alert('Failed to delete contact list');
    }
  },

  addContact: async (contactListId: string, contactData: any): Promise<Contact> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
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
      
      set(state => ({ 
        contacts: [newContact, ...state.contacts] 
      }));
      
      // Refresh contact lists to update counts
      await get().refreshContactLists();
      
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
  },

  updateContact: async (contactId: string, updates: Partial<Contact>): Promise<Contact> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.updateContact(contactId, updates);
      const updatedContact = response.data.contact;
      
      set(state => ({
        contacts: state.contacts.map(contact => 
          contact._id === contactId ? { ...contact, ...updatedContact } : contact
        )
      }));
      
      if (updates.optedIn !== undefined) {
        await get().refreshContactLists();
      }
      
      toast.success('Contact updated successfully');
      return updatedContact;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
      throw new Error('Failed to update contact');
    }
  },

  deleteContact: async (contactId: string): Promise<void> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      await contactAPI.deleteContact(contactId);
      
      set(state => ({
        contacts: state.contacts.filter(contact => contact._id !== contactId)
      }));
      
      await get().refreshContactLists();
      
      toast.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
      throw new Error('Failed to delete contact');
    }
  },

  importContactsFromFile: async (contactListId: string, file: File): Promise<ContactImportResult> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      set({ importing: true });
      
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

            if (importResult.success > 0) {
              await get().fetchContacts(contactListId);
              await get().refreshContactLists();
            }

            resolve(importResult);
          } catch (error) {
            reject(error);
          } finally {
            set({ importing: false });
          }
        },
        error: (error) => {
          set({ importing: false });
          toast.error('Failed to parse CSV file');
          reject(error);
        }
      });
    });
  },

  exportContacts: async (contactListId: string, filters: ContactFilters = {}): Promise<string> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await contactAPI.getContacts(contactListId, {
        ...filters,
        limit: 10000,
        page: 1
      });
      
      const contacts = response.data.contacts || [];
      
      const headers = ['Phone Number', 'Country Code', 'First Name', 'Last Name', 'Email', 'Company', 'Opted In', 'Status', 'Source'];
      const csvRows = contacts.map(contact => [
        contact.phoneNumber,
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
  },

  toggleContactOptIn: async (contactId: string, optedIn: boolean): Promise<Contact> => {
    return get().updateContact(contactId, { optedIn });
  },

  getContactListStats: async (contactListId: string) => {
    const { isAuthenticated } = useAuthStore.getState();
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
  },

  searchContacts: (query: string, filters: ContactFilters = {}): Contact[] => {
    const { contacts } = get();
    
    if (!query.trim()) {
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
      const matchesSearch = 
        contact.phoneNumber?.toLowerCase().includes(searchTerm) ||
        contact.firstName?.toLowerCase().includes(searchTerm) ||
        contact.lastName?.toLowerCase().includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm) ||
        `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase().includes(searchTerm);

      const matchesOptedIn = filters.optedIn === undefined || contact.optedIn === filters.optedIn;
      const matchesStatus = !filters.status || contact.status === filters.status;

      return matchesSearch && matchesOptedIn && matchesStatus;
    });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setImporting: (importing: boolean) => set({ importing }),
  reset: () => set({
    contacts: [],
    contactLists: [],
    loading: false,
    importing: false,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 50
    }
  })
}));