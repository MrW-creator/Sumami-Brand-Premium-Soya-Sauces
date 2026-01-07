
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

// Window interface for Yoco SDK
declare global {
  interface Window {
    YocoSDK: any;
  }
}
