export interface Product {
  id: string;
  wcId: number; // WooCommerce Product ID for Single Bottle
  wcId3Pack?: number; // WooCommerce Product ID for 3-Pack
  wcId6Pack?: number; // WooCommerce Product ID for 6-Pack
  name: string;
  subName: string;
  description: string;
  price: number;
  image: string;
  category: 'sauce' | 'bundle';
  highlight?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOptions?: string[]; // For bundle selections
  variantLabel?: string; // e.g. "3-Pack" or "6-Pack"
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // Added Phone Number
  address: string;
  city: string;
  zipCode: string;
}

// Window interface for Yoco SDK
declare global {
  interface Window {
    YocoSDK: any;
  }
}