/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product } from './types';

const STORAGE_KEYS = {
  URL: 'seulugar_supabase_url',
  ANON_KEY: 'seulugar_supabase_anon_key',
  USE_FALLBACK: 'seulugar_supabase_use_fallback'
};

// Default initial products that match the official, simplified category names
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'iPhone 15 Pro Max 256GB',
    description: 'Smartphone topo de gama da Apple com ecrã Super Retina XDR de 6.7 polegadas, estrutura em titânico e câmara de 48MP. Ideal para fotógrafos e profissionais exigentes.',
    price: 1150000,
    category: 'Eletrónicos',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    type: 'physical',
    stock: 12,
    created_at: new Date().toISOString(),
    rating: 4.8,
    sales_count: 34
  },
  {
    id: 'prod-2',
    name: 'Ebook: Marketing Digital em Angola',
    description: 'O guia definitivo para impulsionar as suas vendas online no mercado angolano. Aprenda estratégias reais de tráfego, gestão de redes sociais e vendas por WhatsApp.',
    price: 45000,
    category: 'Livros',
    image_url: 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=600&auto=format&fit=crop&q=80',
    type: 'digital',
    stock: 9999,
    digital_link: 'https://ekjpcvrgtmwkgsxfjuxn.supabase.co/storage/v1/object/public/products/digital_preview.pdf',
    created_at: new Date().toISOString(),
    rating: 4.9,
    sales_count: 145
  },
  {
    id: 'prod-3',
    name: 'Café Ginga Premium (Grão - 1kg)',
    description: 'Café de prestígio 100% arábica produzido nas terras altas de Angola. Notas ricas de chocolate, corpo aveludado e aroma excecional para os melhores momentos do seu dia.',
    price: 18500,
    category: 'Outros',
    image_url: 'https://images.unsplash.com/photo-1559056191-48af97c88cd7?w=600&auto=format&fit=crop&q=80',
    type: 'physical',
    stock: 45,
    created_at: new Date().toISOString(),
    rating: 4.7,
    sales_count: 56
  },
  {
    id: 'prod-4',
    name: 'Pack 100+ Templates Canva Imobiliários',
    description: 'Templates 100% editáveis no Canva para Corretores e Agências Imobiliárias em Angola. Poupe tempo e destaque os seus imóveis com um design minimalista e moderno.',
    price: 12000,
    category: 'Outros',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    type: 'digital',
    stock: 9999,
    digital_link: 'https://ekjpcvrgtmwkgsxfjuxn.supabase.co/storage/v1/object/public/products/digital_preview.pdf',
    created_at: new Date().toISOString(),
    rating: 4.6,
    sales_count: 88
  },
  {
    id: 'prod-5',
    name: 'Auscultadores Bluetooth Premium ANC',
    description: 'Cancelamento ativo de ruído inteligente, autonomia de até 40 horas e carregamento ultra-rápido. Som Hi-Fi com graves profundos e comandos táteis refinados.',
    price: 135000,
    category: 'Eletrónicos',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    type: 'physical',
    stock: 20,
    created_at: new Date().toISOString(),
    rating: 4.5,
    sales_count: 22
  },
  {
    id: 'prod-6',
    name: 'Ebook: Finanças Pessoais Para Angolanos',
    description: 'Aprenda a poupar, investir em títulos do tesouro do BNA e gerir o seu orçamento familiar face aos desafios da inflação em Angola. Guia prático com tabelas prontas.',
    price: 8500,
    category: 'Livros',
    image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80',
    type: 'digital',
    stock: 9999,
    digital_link: 'https://ekjpcvrgtmwkgsxfjuxn.supabase.co/storage/v1/object/public/products/digital_preview.pdf',
    created_at: new Date().toISOString(),
    rating: 4.9,
    sales_count: 210
  }
];

let supabaseClientInstance: SupabaseClient | null = null;

// Helper to convert literal https://supabase.com inputs to the actual project API endpoint
// Sanitizes URLs by stripping trailing slashes and common subpath segments like /rest/v1
export function transformSupabaseUrl(url: string): string {
  let trimmed = url.trim();
  
  // Handle empty or placeholder url
  if (!trimmed || trimmed === 'https://supabase.com' || trimmed === 'https://supabase.com/') {
    return 'https://ekjpcvrgtmwkgsxfjuxn.supabase.co';
  }

  // Strip any trailing slashes repeatedly
  while (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  // Strip trailing /rest/v1 or rest/v1 if present (case-insensitive)
  if (trimmed.toLowerCase().endsWith('/rest/v1')) {
    trimmed = trimmed.slice(0, -8).trim();
  }

  // Strip trailing slash again just in case there was a double slash before /rest/v1
  while (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  return trimmed || 'https://ekjpcvrgtmwkgsxfjuxn.supabase.co';
}

export function getSupabaseCredentials() {
  let url = localStorage.getItem(STORAGE_KEYS.URL);
  let anonKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY);
  
  // Seta de forma padrão as credenciais reais de produção do cliente quando vazias
  if (!url || !anonKey) {
    url = 'https://ekjpcvrgtmwkgsxfjuxn.supabase.co';
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVranBjdnJndG13a2dzeGZqdXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjcyMjgsImV4cCI6MjA5Njc0MzIyOH0.MFneVKcDwGDsLO6jdioI_IlMWOc9uoG3BwaLiZ43_0w';
  }

  const finalUrl = transformSupabaseUrl(url);
  
  return {
    supabaseUrl: finalUrl,
    supabaseAnonKey: anonKey,
    useFallback: false,
    isConfigured: !!(finalUrl && anonKey)
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string, useFallback: boolean) {
  const finalUrl = transformSupabaseUrl(url);
  localStorage.setItem(STORAGE_KEYS.URL, finalUrl);
  localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
  localStorage.setItem(STORAGE_KEYS.USE_FALLBACK, 'false');
  // Clear cached client instance to force recreation with new credentials
  supabaseClientInstance = null;
}

export function clearSupabaseCredentials() {
  localStorage.removeItem(STORAGE_KEYS.URL);
  localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
  localStorage.setItem(STORAGE_KEYS.USE_FALLBACK, 'false');
  // Clear cached client instance to force recreation with new credentials
  supabaseClientInstance = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseCredentials();
  
  if (!isConfigured) {
    supabaseClientInstance = null;
    return null;
  }

  try {
    if (!supabaseClientInstance) {
      supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
    }
    return supabaseClientInstance;
  } catch (error) {
    console.error("Error creating Supabase client: ", error);
    return null;
  }
}

// Helper: Fetch products from Supabase (or local fallback)
export async function fetchAllProducts(): Promise<Product[]> {
  const client = getSupabaseClient();
  const { useFallback } = getSupabaseCredentials();

  if (client && !useFallback) {
    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          category: item.category,
          image_url: item.image_url,
          type: item.type as 'physical' | 'digital',
          stock: Number(item.stock || 0),
          digital_link: item.digital_link || '',
          created_at: item.created_at,
          rating: item.rating || 5.0,
          sales_count: item.sales_count || 0
        }));
      }
    } catch (e) {
      console.error("Supabase failed, falling back to LocalStorage catalog. Error: ", e);
    }
  }

  const cached = localStorage.getItem('seulugar_local_products');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  localStorage.setItem('seulugar_local_products', JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

// Helper: Insert a new product
export async function createProductInDatabase(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const client = getSupabaseClient();
  const { useFallback } = getSupabaseCredentials();

  const newProduct: Product = {
    ...productData,
    id: `prod-${Date.now()}`,
    created_at: new Date().toISOString(),
    rating: 5.0,
    sales_count: 0
  };

  if (client && !useFallback) {
    try {
      const { data, error } = await client
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          image_url: productData.image_url,
          type: productData.type,
          stock: productData.stock,
          digital_link: productData.digital_link
        }])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        const item = data[0];
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          category: item.category,
          image_url: item.image_url,
          type: item.type as 'physical' | 'digital',
          stock: Number(item.stock || 0),
          digital_link: item.digital_link || '',
          created_at: item.created_at,
          rating: 5.0,
          sales_count: 0
        };
      }
    } catch (e) {
      console.error("Supabase create failed, writing to LocalStore fallback. Error: ", e);
    }
  }

  const currentProducts = await fetchAllProducts();
  const updatedList = [newProduct, ...currentProducts];
  localStorage.setItem('seulugar_local_products', JSON.stringify(updatedList));
  return newProduct;
}

// Helper: Update an existing product
export async function updateProductInDatabase(productId: string, productData: Partial<Product>): Promise<boolean> {
  const client = getSupabaseClient();
  const { useFallback } = getSupabaseCredentials();

  if (client && !useFallback) {
    try {
      const { error } = await client
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          image_url: productData.image_url,
          type: productData.type,
          stock: productData.stock,
          digital_link: productData.digital_link
        })
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase update failed, editing locally. Error: ", e);
    }
  }

  const currentProducts = await fetchAllProducts();
  const updatedList = currentProducts.map(p => {
    if (p.id === productId) {
      return { ...p, ...productData };
    }
    return p;
  });
  localStorage.setItem('seulugar_local_products', JSON.stringify(updatedList));
  return true;
}

// Helper: Delete a product
export async function deleteProductFromDatabase(productId: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { useFallback } = getSupabaseCredentials();

  if (client && !useFallback) {
    try {
      const { error } = await client
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase delete failed, matching locally. Error: ", e);
    }
  }

  const currentProducts = await fetchAllProducts();
  const updatedList = currentProducts.filter(p => p.id !== productId);
  localStorage.setItem('seulugar_local_products', JSON.stringify(updatedList));
  return true;
}

// Helper: Upload file to Supabase Storage Bucket 'products'
export async function uploadProductImage(file: File): Promise<string> {
  const client = getSupabaseClient();
  const { useFallback } = getSupabaseCredentials();

  if (client && !useFallback) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('products')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = client.storage
        .from('products')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch (err) {
      console.error("Supabase Storage upload failed, converting to local preview. Error: ", err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
