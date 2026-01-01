import { Product } from './types';

// Configuration for WooCommerce Integration
export const WC_CONFIG = {
  baseUrl: 'https://biznizart.co.za',
  consumerKey: 'ck_22a064bbd4ac04ad840f99cd591efe3d9ca6a6a0', // Replace with environment variable in production
  consumerSecret: 'cs_1d08c5db224d9a383d6f4a33928e14055f385085' // Replace with environment variable in production
};

// -----------------------------------------------------------------------------------------
// INSTRUCTIONS FOR IMAGES:
// 1. Upload your product images to your WordPress Media Library at biznizart.co.za
// 2. Copy the "File URL" for each image.
// 3. Paste the URL inside the single quotes for the 'image' property below.
// -----------------------------------------------------------------------------------------

export const PRODUCTS: Product[] = [
  {
    id: 'garlic-ginger',
    wcId: 1315,
    name: 'Infused With Garlic & Ginger',
    subName: 'Sumami Brand Soya Sauce',
    description: 'The perfect balance of aromatic garlic and zesty ginger. Ideal for stir-frys and marinades.',
    price: 55, // Base price for reference, overridden by pack logic in App
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/garlic-ginger.png',
    category: 'sauce'
  },
  {
    id: 'citrus-coriander',
    wcId: 1313,
    name: 'Infused With Citrus & Coriander',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A refreshing burst of citrus paired with earthy coriander. Perfect for fish and salads.',
    price: 55,
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/citrus-coriander.png',
    category: 'sauce'
  },
  {
    id: 'chili',
    wcId: 1312,
    name: 'Infused With Chili',
    subName: 'Sumami Brand Soya Sauce',
    description: 'For those who crave heat. A spicy kick that elevates any dish without overpowering the umami.',
    price: 55,
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/Chillies.png',
    category: 'sauce'
  },
  {
    id: 'beef-stock',
    wcId: 1287,
    name: 'Infused With Beef Stock',
    subName: 'Sumami Brand Soya Sauce',
    description: 'Deep, rich, and meaty. Enhance your stews, gravies, and slow-cooked meals.',
    price: 55,
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/beef-stock.png',
    category: 'sauce'
  },
  {
    id: 'black-pepper',
    wcId: 1311,
    name: 'Infused With Black Pepper & Sea Salt',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A classic combination. Sharp cracked pepper meets natural sea salt.',
    price: 55,
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/black-pepper-and-sea-salt.png',
    category: 'sauce'
  },
  {
    id: 'sesame-mustard',
    wcId: 1316,
    name: 'Infused With Roasted Sesame & Mustard',
    subName: 'Sumami Brand Soya Sauce',
    description: 'Nutty, toasted notes with a mustard tang. incredible on sushi and roasted vegetables.',
    price: 55,
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/sesame-mustard.png',
    category: 'sauce'
  },
  {
    id: 'fenugreek',
    wcId: 1314,
    name: 'Infused With Fenugreek',
    subName: 'Sumami Brand Soya Sauce',
    description: 'A warm, nutty profile with hints of maple. Transforms curries and stews into rich, complex dishes.',
    price: 55,
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/fenugreek.png',
    category: 'sauce'
  }
];

export const BUNDLES: Product[] = [
  {
    id: 'starter-pack',
    wcId: 1358,
    name: 'The Starter Trio',
    subName: 'Build Your Own 3-Pack',
    description: 'Choose your top 3 flavours. The perfect introduction to Sumami Brand.',
    price: 315, // Updated Price
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/sumami-and-stews.png',
    category: 'bundle'
  },
  {
    id: 'master-chef',
    wcId: 2002,
    name: 'Master Chef Collection',
    subName: 'Full Range (7 Bottles)',
    description: 'Complete your kitchen arsenal. One of every infusion. The ultimate gift for foodies.',
    price: 535, // Updated Price
    // PASTE YOUR IMAGE URL BELOW:
    image: 'https://www.biznizart.co.za/wp-content/uploads/2026/01/7-bottle-gift-pack.png',
    category: 'bundle',
    highlight: true
  }
];

export const ASSETS = {
  // A dark, moody food background
  heroBg: 'https://www.biznizart.co.za/wp-content/uploads/2025/12/ChatGPT-Image-Dec-28-2025-02_53_46-PM.png',
  // A chef cooking lifestyle shot
  lifestyle: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1200&q=80', 
  // A generic quality seal/badge (transparent PNG)
  seal: 'https://cdn-icons-png.flaticon.com/512/6555/6555979.png',
  // Image for the cookbook bonus
  cookbook: 'https://www.biznizart.co.za/wp-content/uploads/2026/01/Sumami-cookbook.png'
};