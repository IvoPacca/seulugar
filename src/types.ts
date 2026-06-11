/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductType = 'physical' | 'digital';

export interface Product {
  id: string; // generated uid
  name: string;
  description: string;
  price: number; // in AOA (Kz)
  category: string;
  image_url: string;
  type: ProductType;
  stock: number; // relevant for physical
  digital_link?: string; // download link or redemption code for digital
  created_at: string;
  rating?: number;
  sales_count?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
  phoneNumber?: string;
  address?: string;
  province?: string;
  created_at: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  type: ProductType;
  digital_link?: string;
}

export type OrderStatus = 'pending' | 'approved' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: 'bank_transfer' | 'paypay' | 'multicaixa_express' | 'delivery';
  paymentReference: string; // bank transfer transaction reference / code
  paymentProofUrl?: string; // base64 or upload URL
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    phone: string;
    province: string;
    street: string;
  };
  created_at: string;
}

export interface SupabaseConfigState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  useFallback: boolean;
}
