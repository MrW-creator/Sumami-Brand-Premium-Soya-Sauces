
export interface Product {
  id: string;
  sku: string; // Added for spreadsheet/database identification
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
  isBonus?: boolean; // New flag for "Buy 2 Get 1 Free" items
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; 
  address: string;
  city: string;
  zipCode: string;
}

export interface StoreSettings {
  id?: number;
  yoco_test_key: string;
  yoco_live_key: string;
  is_live_mode: boolean;
  facebook_url?: string;
  instagram_url?: string;
  pinterest_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
}

// Window interface for Yoco SDK
declare global {
  interface Window {
    YocoSDK: any;
  }
}
