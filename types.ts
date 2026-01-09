
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
  badge?: string; // New: "Best Seller", "Hot", etc.
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
  // SWITCHED TO PAYFAST
  payfast_merchant_id: string;
  payfast_merchant_key: string;
  payfast_passphrase?: string;
  
  is_live_mode: boolean;
  facebook_url?: string;
  instagram_url?: string;
  pinterest_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
}

// Window interface (Cleaned up)
declare global {
  interface Window {
    // No SDKs needed for PayFast redirect
  }
}
