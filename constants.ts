
import { Product } from './types';

// -----------------------------------------------------------------------------------------
// SUPABASE CONFIGURATION (DATABASE)
// -----------------------------------------------------------------------------------------
export const SUPABASE_CONFIG = {
  url: 'https://lnzloecnqcxknozokflr.supabase.co', 
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuemxvZWNucWN4a25vem9rZmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDA1MjMsImV4cCI6MjA4MzE3NjUyM30.U2PbBVxCXxF-M0gDC3XT_Jba4uF8JMq0w2dowM2hAFA' 
};

// -----------------------------------------------------------------------------------------
// ADMIN DASHBOARD SECURITY
// -----------------------------------------------------------------------------------------
export const ADMIN_PIN = 'admin123'; 

// -----------------------------------------------------------------------------------------
// YOCO PAYMENT CONFIGURATION
// -----------------------------------------------------------------------------------------
export const YOCO_PUBLIC_KEY = 'pk_test_7edcb7cdmW93zGPed3a4'; 

// -----------------------------------------------------------------------------------------
// DOWNLOAD LINKS
// -----------------------------------------------------------------------------------------
export const COOKBOOK_DOWNLOAD_URL = 'https://drive.google.com/file/d/YOUR_REAL_PDF_LINK_HERE/view?usp=sharing'; 

// -----------------------------------------------------------------------------------------
// IMAGE HOSTING CONFIGURATION
// -----------------------------------------------------------------------------------------

// --- OPTION A: BACKUP (WordPress) ---
const WP_BASE_2025 = 'https://www.biznizart.co.za/wp-content/uploads/2025/12';
const WP_BASE_2026 = 'https://www.biznizart.co.za/wp-content/uploads/2026/01';

// --- OPTION B: ACTIVE (Supabase Storage) ---
// pointing to your 'public-images' bucket
const SUPABASE_STORAGE_URL = 'https://lnzloecnqcxknozokflr.supabase.co/storage/v1/object/public/public-images';

// SWITCHED TO TRUE: The app is now looking for images in Supabase
const USE_SUPABASE_IMAGES = true; 

export const ASSETS = {
  // UPDATED: Now looking at the ROOT of public-images bucket (no 'site' folder)
  
  // Updated to 'Hero 1.webp'
  heroBg: USE_SUPABASE_IMAGES 
    ? `${SUPABASE_STORAGE_URL}/Hero%201.webp` 
    : `${WP_BASE_2026}/promote-fenugreek.png`,
    
  // UPDATED: Using your specific file 'Cooking.webp'
  lifestyle: USE_SUPABASE_IMAGES 
    ? `${SUPABASE_STORAGE_URL}/Cooking.webp` 
    : `${WP_BASE_2026}/group-table.png`, 

  // Updated to 'Sumami Cookbook.webp'
  cookbook: USE_SUPABASE_IMAGES 
    ? `${SUPABASE_STORAGE_URL}/Sumami%20Cookbook.webp` 
    : `${WP_BASE_2026}/Sumami-cookbook.png`,

  seal: 'https://cdn-icons-png.flaticon.com/512/3502/3502601.png',
  
  // Updated Yoco Logo
  yoco: USE_SUPABASE_IMAGES 
    ? `${SUPABASE_STORAGE_URL}/Yoco.webp` 
    : 'https://upload.wikimedia.org/wikipedia/commons/1/16/Yoco_Logo.svg'
};

// -----------------------------------------------------------------------------------------
// PRODUCTS (SINGLE SAUCES ONLY)
// -----------------------------------------------------------------------------------------
export const PRODUCTS: Product[] = [
  {
    id: 'garlic-ginger',
    sku: 'SUM-001',
    name: 'Infused With Garlic & Ginger',
    subName: 'Sumami Brand Soya Sauce',
    description: 'The perfect balance of aromatic garlic and zesty ginger. Ideal for stir-frys and marinades.',
    price: 55, 
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Infused%20With%20Garlic%20&%20Ginger.webp` 
      : `${WP_BASE_2025}/garlic-ginger.png`,
    category: 'sauce'
  },
  {
    id: 'citrus-coriander',
    sku: 'SUM-002',
    name: 'Infused With Citrus & Coriander',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A refreshing burst of citrus paired with earthy coriander. Perfect for fish and salads.',
    price: 55,
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Infused%20With%20Citrus%20&%20Coriander.webp` 
      : `${WP_BASE_2025}/citrus-coriander.png`,
    category: 'sauce'
  },
  {
    id: 'chili',
    sku: 'SUM-003',
    name: 'Infused With Chili',
    subName: 'Sumami Brand Soya Sauce',
    description: 'For those who crave heat. A spicy kick that elevates any dish without overpowering the umami.',
    price: 55,
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Infused%20With%20Chilli.webp` 
      : `${WP_BASE_2025}/Chillies.png`,
    category: 'sauce'
  },
  {
    id: 'beef-stock',
    sku: 'SUM-004',
    name: 'Infused With Beef Stock',
    subName: 'Sumami Brand Soya Sauce',
    description: 'Deep, rich, and meaty. Enhance your stews, gravies, and slow-cooked meals.',
    price: 55,
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Infused%20With%20Beef%20Stock.webp` 
      : `${WP_BASE_2025}/beef-stock.png`,
    category: 'sauce'
  },
  {
    id: 'black-pepper',
    sku: 'SUM-005',
    name: 'Infused With Black Pepper & Sea Salt',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A classic combination. Sharp cracked pepper meets natural sea salt.',
    price: 55,
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Infused%20With%20Black%20Pepper%20&%20Sea%20Salt.webp` 
      : `${WP_BASE_2025}/black-pepper-and-sea-salt.png`,
    category: 'sauce'
  },
  {
    id: 'sesame-mustard',
    sku: 'SUM-006',
    name: 'Infused With Roasted Sesame & Mustard',
    subName: 'Sumami Brand Soya Sauce',
    description: 'Nutty, toasted notes with a mustard tang. Incredible on sushi and roasted vegetables.',
    price: 55,
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Infused%20With%20Roasted%20Sesame%20&%20Mustard%20Seeds.webp` 
      : `${WP_BASE_2025}/sesame-mustard.png`,
    category: 'sauce'
  },
  {
    id: 'fenugreek',
    sku: 'SUM-007',
    name: 'Infused With Fenugreek',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A warm, nutty profile with hints of maple. Transforms curries and stews into rich, complex dishes.',
    price: 55,
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Fenugreek%20Bottled.webp` 
      : `${WP_BASE_2025}/fenugreek.png`,
    category: 'sauce'
  }
];

// -----------------------------------------------------------------------------------------
// BUNDLES (CURATED COLLECTIONS)
// -----------------------------------------------------------------------------------------
export const BUNDLES: Product[] = [
  {
    id: 'starter-pack',
    sku: 'SUM-BUN-3',
    name: 'The Starter Trio',
    subName: 'Build Your Own 3-Pack',
    description: 'Choose your top 3 flavours. The perfect introduction to Sumami Brand.',
    price: 315, 
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/The%20Starter%20Trio.webp` 
      : `${WP_BASE_2025}/sumami-and-stews.png`,
    category: 'bundle'
  },
  {
    id: 'master-chef',
    sku: 'SUM-BUN-7',
    name: 'Master Chef Collection',
    subName: 'Full Range (7 Bottles)',
    description: 'Complete your kitchen arsenal. One of every infusion. The ultimate gift for foodies.',
    price: 535, 
    image: USE_SUPABASE_IMAGES 
      ? `${SUPABASE_STORAGE_URL}/Master%20Chef%20Collection.webp` 
      : `${WP_BASE_2026}/SOYA-MIXED-FLAVOUR-7PACK.png`,
    category: 'bundle'
  }
];
