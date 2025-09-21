// utils/api.ts
import axios, { AxiosRequestConfig } from 'axios';
import { supabase } from '@/lib/supabase';

const baseURL =
  import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Create an axios instance with defaults
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function authFetch<T = any>(
  url: string,
  options: any = {}
): Promise<T> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: any = {
      ...options.headers,
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    console.log('Request:', baseURL + url, headers['Authorization']);

    const response = await api.request<T>({
      url,
      method: options.method || 'GET',
      data: options.body,
      headers,
      params: options.params,
    });

    return response.data;
  } catch (error: any) {
    console.error('API request failed:', error?.response || error);
    throw error;
  }
}
