import { authFetch } from "@/lib/api";

export interface MessageVariant {
  _id?: string;
  id: string;
  content: string;
  tone: string;
  language: string;
  characterCount: number;
  spamScore: number;
  encoding: string;
  cost: number;
  createdAt: string;
}

export interface SavedMessage {
  _id: string;
  name: string;
  category: string;
  originalPrompt: string;
  baseMessage: string;
  variants: MessageVariant[];
  settings: any;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
}

export interface GenerationRequest {
  prompt: string;
  variantCount?: number;
  characterLimit?: number;
  tones?: string[];
  languages?: string[];
  creativityLevel?: number;
  includeEmojis?: boolean;
  companyName: string;
  unsubscribeText?: string;
  customInstructions?: string;
  category?: string;
}

export interface GenerateAndSaveRequest extends GenerationRequest {
  name: string;
  category?: string;
  isTemplate?: boolean;
}

export const messageAPI = {
  // Get all messages
  getAll: async (params?: any) => {
    return authFetch<{ data: { messages: SavedMessage[] } }>('/api/messages', {
      params
    });
  },

  // Get message by ID
  getById: async (id: string) => {
    return authFetch<{ message: SavedMessage }>(`/api/messages/${id}`);
  },

  // Create new message
  create: async (data: any) => {
    return authFetch<any>('/api/messages', {
      method: 'POST',
      data: JSON.stringify(data)
    });
  },

  // Update message
  update: async (id: string, data: any) => {
    return authFetch<any>(`/api/messages/${id}`, {
      method: 'PUT',
      data: JSON.stringify(data)
    });
  },

  // Delete message
  delete: async (id: string) => {
    return authFetch(`/api/messages/${id}`, {
      method: 'DELETE'
    });
  },

  // Get message variants
  getVariants: async (messageId: string) => {
    return authFetch<{ data: {variants: MessageVariant[]} }>(`/api/messages/${messageId}/variants`);
  },

  // Create message variant
  createVariant: async (messageId: string, data: any) => {
    return authFetch<{ variant: MessageVariant }>(`/api/messages/${messageId}/variants`, {
      method: 'POST',
      data: JSON.stringify(data)
    });
  },

  // Get templates
  getTemplates: async () => {
    return authFetch<{ templates: SavedMessage[] }>('/api/messages/templates');
  },

  // Create template
  createTemplate: async (data: any) => {
    return authFetch<{ template: SavedMessage }>('/api/messages/templates', {
      method: 'POST',
      data: JSON.stringify(data)
    });
  },

  // Update template
  updateTemplate: async (id: string, data: any) => {
    return authFetch<{ template: SavedMessage }>(`/api/messages/templates/${id}`, {
      method: 'PUT',
      data: JSON.stringify(data)
    });
  },

  // Delete template
  deleteTemplate: async (id: string) => {
    return authFetch(`/api/messages/templates/${id}`, {
      method: 'DELETE'
    });
  },

  // ============ AI Generation Methods ============

  // Generate variants using AI
  generateVariants: async (data: GenerationRequest) => {
    return authFetch<{ 
      data: { 
        variants: MessageVariant[] 
      } 
    }>('/api/messages/ai/generate', {
      method: 'POST',
      data: JSON.stringify(data)
    });
  }
};