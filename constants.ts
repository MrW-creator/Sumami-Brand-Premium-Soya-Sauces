
import { Product } from './types';

// -----------------------------------------------------------------------------------------
// SUPABASE CONFIGURATION (DATABASE)
// 1. Go to https://supabase.com and create a free project.
// 2. Go to Project Settings > API.
// 3. Paste the URL and ANON KEY below.
// -----------------------------------------------------------------------------------------
export const SUPABASE_CONFIG = {
  url: '', // e.g. https://xyz.supabase.co
  anonKey: '' // e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
};

// -----------------------------------------------------------------------------------------
// ADMIN DASHBOARD SECURITY
// Change this to your preferred admin password.
// Supports letters, numbers, and special characters.
// -----------------------------------------------------------------------------------------
export const ADMIN_PIN = 'admin123';

// -----------------------------------------------------------------------------------------
// YOCO PAYMENT CONFIGURATION
// 1. Log into Yoco > Developers > Keys.
// 2. Paste your Public Key below (e.g. 'pk_test_...' or 'pk_live_...').
// -----------------------------------------------------------------------------------------
export const YOCO_PUBLIC_KEY = 'pk_test_7edcb7cdmW93zGPed3a4'; 

// -----------------------------------------------------------------------------------------
// DOWNLOAD LINKS
// -----------------------------------------------------------------------------------------
export const COOKBOOK_DOWNLOAD_URL = 'https://drive.google.com/file/d/YOUR_LINK_HERE/view?usp=sharing'; 

// -----------------------------------------------------------------------------------------
// IMAGE HOSTING CONFIGURATION
// Currently, images are loaded from the old WordPress site.
// TO MOVE TO SUPABASE/WEBP:
// 1. Convert your images to .webp (smaller & faster).
// 2. Upload them to a Supabase Storage bucket named 'products'.
// 3. Update the BASE_URL below to your Supabase Public URL.
// -----------------------------------------------------------------------------------------

// CURRENT: WordPress Hotlinks
const WP_BASE_2025 = 'https://www.biznizart.co.za/wp-content/uploads/2025/12';
const WP_BASE_2026 = 'https://www.biznizart.co.za/wp-content/uploads/2026/01';

// FUTURE: Supabase Example (Uncomment and use this structure later)
// const BASE_URL = 'https://[PROJECT-ID].supabase.co/storage/v1/object/public/products';

export const ASSETS = {
  heroBg: `${WP_BASE_2026}/promote-fenugreek.png`,
  lifestyle: `${WP_BASE_2026}/group-table.png`, 
  seal: 'https://cdn-icons-png.flaticon.com/512/3502/3502601.png',
  cookbook: `${WP_BASE_2026}/Sumami-cookbook.png`,
  // Using direct SVG for crisp rendering on all screens
  yoco: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Yoco_Logo.svg'
};

// -----------------------------------------------------------------------------------------
// PRODUCTS
// SKU field added for Spreadsheet/Database identification.
// -----------------------------------------------------------------------------------------

export const PRODUCTS: Product[] = [
  {
    id: 'garlic-ginger',
    sku: 'SUM-001',
    name: 'Infused With Garlic & Ginger',
    subName: 'Sumami Brand Soya Sauce',
    description: 'The perfect balance of aromatic garlic and zesty ginger. Ideal for stir-frys and marinades.',
    price: 55, 
    image: `${WP_BASE_2025}/garlic-ginger.png`,
    category: 'sauce'
  },
  {
    id: 'citrus-coriander',
    sku: 'SUM-002',
    name: 'Infused With Citrus & Coriander',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A refreshing burst of citrus paired with earthy coriander. Perfect for fish and salads.',
    price: 55,
    image: `${WP_BASE_2025}/citrus-coriander.png`,
    category: 'sauce'
  },
  {
    id: 'chili',
    sku: 'SUM-003',
    name: 'Infused With Chili',
    subName: 'Sumami Brand Soya Sauce',
    description: 'For those who crave heat. A spicy kick that elevates any dish without overpowering the umami.',
    price: 55,
    image: `${WP_BASE_2025}/Chillies.png`,
    category: 'sauce'
  },
  {
    id: 'beef-stock',
    sku: 'SUM-004',
    name: 'Infused With Beef Stock',
    subName: 'Sumami Brand Soya Sauce',
    description: 'Deep, rich, and meaty. Enhance your stews, gravies, and slow-cooked meals.',
    price: 55,
    image: `${WP_BASE_2025}/beef-stock.png`,
    category: 'sauce'
  },
  {
    id: 'black-pepper',
    sku: 'SUM-005',
    name: 'Infused With Black Pepper & Sea Salt',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A classic combination. Sharp cracked pepper meets natural sea salt.',
    price: 55,
    image: `${WP_BASE_2025}/black-pepper-and-sea-salt.png`,
    category: 'sauce'
  },
  {
    id: 'sesame-mustard',
    sku: 'SUM-006',
    name: 'Infused With Roasted Sesame & Mustard',
    subName: 'Sumami Brand Soya Sauce',
    description: 'Nutty, toasted notes with a mustard tang. incredible on sushi and roasted vegetables.',
    price: 55,
    image: `${WP_BASE_2025}/sesame-mustard.png`,
    category: 'sauce'
  },
  {
    id: 'fenugreek',
    sku: 'SUM-007',
    name: 'Infused With Fenugreek',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A warm, nutty profile with hints of maple. Transforms curries and stews into rich, complex dishes.',
    price: 55,
    image: `${WP_BASE_2025}/fenugreek.png`,
    category: 'sauce'
  }
];

export const BUNDLES: Product[] = [
  {
    id: 'starter-pack',
    sku: 'SUM-BUN-3',
    name: 'The Starter Trio',
    subName: 'Build Your Own 3-Pack',
    description: 'Choose your top 3 flavours. The perfect introduction to Sumami Brand.',
    price: 315, 
    image: `${WP_BASE_2025}/sumami-and-stews.png`,
    category: 'bundle'
  },
  {
    id: 'master-chef',
    sku: 'SUM-BUN-7',
    name: 'Master Chef Collection',
    subName: 'Full Range (7 Bottles)',
    description: 'Complete your kitchen arsenal. One of every infusion. The ultimate gift for foodies.',
    price: 535, 
    image: `${WP_BASE_2026}/SOYA-MIXED-FLAVOUR-7PACK.png`,
    category: 'bundle',
    highlight: true
  }
];
