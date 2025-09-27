import { authFetch } from "@/lib/api";


export interface Contact {
  _id: string;
  contactList: string;
  phoneNumber: string;
  countryCode: string;
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

export const contactAPI = {
  // Contact List methods
  getLists: async () => {
    return authFetch('/api/contacts/lists');
  },

  getListById: async (id: string) => {
    return authFetch(`/api/contacts/lists/${id}`);
  },

  createList: async (data: { name: string; description?: string }) => {
    return authFetch('/api/contacts/lists', {
      method: 'POST',
      data: JSON.stringify(data)
    });
  },

  updateList: async (id: string, data: Partial<ContactList>) => {
    return authFetch(`/api/contacts/lists/${id}`, {
      method: 'PUT',
      data: JSON.stringify(data)
    });
  },

  deleteList: async (id: string) => {
    return authFetch(`/api/contacts/lists/${id}`, {
      method: 'DELETE'
    });
  },

  // Contact methods
  getContacts: async (listId: string, params?: {
    page?: number;
    limit?: number;
    optedIn?: boolean;
    status?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.optedIn !== undefined) queryParams.append('optedIn', params.optedIn.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/api/contacts/lists/${listId}/contacts${queryString ? `?${queryString}` : ''}`;
    
    return authFetch(url);
  },

  createContact: async (listId: string, data: any) => {
    return authFetch(`/api/contacts/lists/${listId}/contacts`, {
      method: 'POST',
      data: JSON.stringify(data)
    });
  },

  updateContact: async (id: string, data: Partial<Contact>) => {
    return authFetch(`/api/contacts/contacts/${id}`, {
      method: 'PUT',
      data: JSON.stringify(data)
    });
  },

  deleteContact: async (id: string) => {
    return authFetch(`/api/contacts/contacts/${id}`, {
      method: 'DELETE'
    });
  },

  importContacts: async (listId: string, contacts: any[]) => {
    return authFetch(`/api/contacts/lists/${listId}/contacts/import`, {
      method: 'POST',
      data: JSON.stringify({ contacts })
    });
  }
};