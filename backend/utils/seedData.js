const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// SEED_VELOCITY = average daily units sold (used to generate realistic orders)
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS_RAW = [
  // ── ELECTRONICS ─────────────────────────────────────────────────────────────
  {
    name: 'Premium Wireless Headphones',
    description: 'Experience crystal-clear audio with active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions. Perfect for music lovers, professionals, and remote workers.',
    price: 149.99, comparePrice: 199.99, category: 'Electronics', brand: 'SoundMax',
    stock: 18,   // HIGH risk: ~8.6 days at velocity
    soldCount: 520, rating: 4.5, numReviews: 128, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    images:    ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    tags: ['headphones', 'wireless', 'ANC', 'audio'],
    SEED_VELOCITY: 2.1,
  },
  {
    name: 'Smart Fitness Watch Pro',
    description: 'Track health and fitness with heart-rate monitoring, GPS, sleep analysis, blood-oxygen measurement, and 100+ workout modes. Water-resistant up to 50 m.',
    price: 89.99, comparePrice: 129.99, category: 'Electronics', brand: 'FitTech',
    stock: 28,   // MEDIUM risk: ~20 days
    soldCount: 315, rating: 4.3, numReviews: 95, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    images:    ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
    tags: ['smartwatch', 'fitness', 'GPS', 'health'],
    SEED_VELOCITY: 1.4,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: '360° surround sound, IPX7 waterproof, 24-hour playtime. Connect two speakers for true stereo. Built for outdoor adventures.',
    price: 59.99, comparePrice: 79.99, category: 'Electronics', brand: 'SoundMax',
    stock: 3,    // CRITICAL: ~1.25 days
    soldCount: 380, rating: 4.4, numReviews: 87, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
    images:    ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
    tags: ['speaker', 'bluetooth', 'waterproof', 'portable'],
    SEED_VELOCITY: 2.4,
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB per-key backlighting, tactile blue switches, anti-ghosting technology, aluminum frame. Includes detachable wrist rest and USB passthrough.',
    price: 89.99, comparePrice: 119.99, category: 'Electronics', brand: 'GameTech',
    stock: 4,    // CRITICAL: ~2.2 days
    soldCount: 290, rating: 4.4, numReviews: 93, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
    images:    ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
    tags: ['keyboard', 'mechanical', 'gaming', 'RGB'],
    SEED_VELOCITY: 1.8,
  },
  {
    name: 'Wireless Gaming Mouse',
    description: 'Ultra-lightweight at 62g, 25,000 DPI optical sensor, 70-hour battery, USB-C charging. Designed for competitive gaming.',
    price: 49.99, comparePrice: 69.99, category: 'Electronics', brand: 'GameTech',
    stock: 28,   // MEDIUM risk: ~18.7 days
    soldCount: 210, rating: 4.2, numReviews: 74, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
    images:    ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'],
    tags: ['mouse', 'gaming', 'wireless'],
    SEED_VELOCITY: 1.5,
  },
  {
    name: 'USB-C Power Bank 20000mAh',
    description: 'Dual USB-A + USB-C 65W fast charging. Powers laptops, phones, and tablets. Aviation-safe LiPo cells with multi-protection circuit.',
    price: 44.99, comparePrice: 59.99, category: 'Electronics', brand: 'ChargePro',
    stock: 0,    // CRITICAL: out of stock
    soldCount: 480, rating: 4.6, numReviews: 162, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
    images:    ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500'],
    tags: ['power bank', 'charging', 'USB-C'],
    SEED_VELOCITY: 3.1,
  },
  {
    name: 'True Wireless Earbuds Pro',
    description: 'Active noise cancellation, 36-hour total battery with case, wireless charging, IPX5 sweat resistance. Hi-Fi sound with custom 11mm drivers.',
    price: 79.99, comparePrice: 109.99, category: 'Electronics', brand: 'SoundMax',
    stock: 75,   // LOW risk: ~37.5 days
    soldCount: 290, rating: 4.5, numReviews: 112, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
    images:    ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
    tags: ['earbuds', 'wireless', 'ANC', 'TWS'],
    SEED_VELOCITY: 2.0,
  },
  {
    name: '4K Webcam with Ring Light',
    description: 'Auto-focus 4K 30fps, built-in ring light with 3 color modes, dual noise-cancelling mics. Plug-and-play for Mac and Windows.',
    price: 69.99, comparePrice: 89.99, category: 'Electronics', brand: 'StreamTech',
    stock: 17,   // MEDIUM risk: ~18.9 days
    soldCount: 145, rating: 4.1, numReviews: 58, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500',
    images:    ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500'],
    tags: ['webcam', '4K', 'streaming', 'ring light'],
    SEED_VELOCITY: 0.9,
  },

  // ── CLOTHING ─────────────────────────────────────────────────────────────────
  {
    name: 'Organic Cotton T-Shirt',
    description: '100% GOTS-certified organic cotton. Soft, breathable, eco-friendly. Available in 12 colors and sizes XS–3XL. Machine washable and pre-shrunk.',
    price: 24.99, comparePrice: 34.99, category: 'Clothing', brand: 'EcoWear',
    stock: 180,  // LOW risk: ~34.6 days
    soldCount: 880, rating: 4.6, numReviews: 312, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images:    ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    tags: ['t-shirt', 'organic', 'cotton', 'eco'],
    variants: [{ label: 'Size', options: ['XS','S','M','L','XL','2XL'] }, { label: 'Color', options: ['White','Black','Navy','Gray','Red','Olive'] }],
    SEED_VELOCITY: 5.2,
  },
  {
    name: 'Premium Hoodie Sweatshirt',
    description: 'Ultra-soft 450g fleece, brushed interior, kangaroo pocket, ribbed cuffs. Garment-dyed for a vintage wash look. Unisex relaxed fit.',
    price: 54.99, comparePrice: 74.99, category: 'Clothing', brand: 'UrbanFlex',
    stock: 22,   // HIGH risk: ~7.9 days
    soldCount: 390, rating: 4.4, numReviews: 134, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500',
    images:    ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500'],
    tags: ['hoodie', 'sweatshirt', 'fleece'],
    variants: [{ label: 'Size', options: ['XS','S','M','L','XL','2XL'] }, { label: 'Color', options: ['Black','Gray Marl','Forest Green','Navy','Rust'] }],
    SEED_VELOCITY: 2.8,
  },
  {
    name: 'Slim Fit Chino Pants',
    description: 'Stretch-cotton blend for all-day comfort. Clean finish, hidden button closure, two front slash pockets. Office-to-weekend versatile.',
    price: 44.99, comparePrice: 59.99, category: 'Clothing', brand: 'UrbanFlex',
    stock: 30,   // MEDIUM risk: ~18.75 days
    soldCount: 215, rating: 4.2, numReviews: 89, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500',
    images:    ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500'],
    tags: ['chinos', 'pants', 'slim fit'],
    variants: [{ label: 'Waist', options: ['28','30','32','34','36'] }, { label: 'Color', options: ['Khaki','Navy','Olive','Stone'] }],
    SEED_VELOCITY: 1.6,
  },
  {
    name: 'Waterproof Winter Jacket',
    description: '20,000mm waterproof rating, 3-in-1 design (shell + fleece liner). Taped seams, underarm vents, helmet-compatible hood. Packable to own pocket.',
    price: 129.99, comparePrice: 179.99, category: 'Clothing', brand: 'NorthWear',
    stock: 2,    // CRITICAL: ~0.9 days
    soldCount: 275, rating: 4.7, numReviews: 96, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500',
    images:    ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500'],
    tags: ['jacket', 'winter', 'waterproof', '3-in-1'],
    variants: [{ label: 'Size', options: ['S','M','L','XL','XXL'] }, { label: 'Color', options: ['Black','Navy','Forest','Burgundy'] }],
    SEED_VELOCITY: 2.2,
  },
  {
    name: 'Athletic Running Shorts',
    description: '4-way stretch recycled polyester, 5" inseam, built-in liner, reflective details, zippered back pocket. Lightweight at 95g.',
    price: 29.99, comparePrice: 39.99, category: 'Clothing', brand: 'SpeedWear',
    stock: 35,   // MEDIUM risk: ~15.2 days
    soldCount: 410, rating: 4.3, numReviews: 121, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=500',
    images:    ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=500'],
    tags: ['shorts', 'running', 'athletic'],
    variants: [{ label: 'Size', options: ['XS','S','M','L','XL'] }, { label: 'Color', options: ['Black','Navy','Red','Electric Blue'] }],
    SEED_VELOCITY: 2.3,
  },

  // ── SPORTS ───────────────────────────────────────────────────────────────────
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall vacuum insulation: cold 24h, hot 12h. BPA-free, leak-proof flip lid, dishwasher-safe body. Sweat-free exterior. 32oz / 950ml.',
    price: 27.99, comparePrice: 39.99, category: 'Sports', brand: 'HydroMax',
    stock: 200,  // LOW risk: ~41.7 days
    soldCount: 1090, rating: 4.8, numReviews: 445, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
    images:    ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    tags: ['water bottle', 'stainless steel', 'insulated', 'hydration'],
    variants: [{ label: 'Color', options: ['Midnight Black','Sky Blue','Forest Green','White','Rose Gold'] }],
    SEED_VELOCITY: 4.8,
  },
  {
    name: 'Professional Running Shoes',
    description: 'Carbon-fiber plate for explosive propulsion, engineered knit upper, 38mm stack height. Certified for road marathons and long training runs.',
    price: 119.99, comparePrice: 159.99, category: 'Sports', brand: 'RunPro',
    stock: 25,   // HIGH risk: ~9.6 days
    soldCount: 490, rating: 4.5, numReviews: 167, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    images:    ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    tags: ['shoes', 'running', 'carbon plate', 'marathon'],
    variants: [{ label: 'Size', options: ['6','7','8','9','10','11','12'] }, { label: 'Color', options: ['Black/White','Neon Yellow','Sky Blue'] }],
    SEED_VELOCITY: 2.6,
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Natural tree rubber base + microfiber suede top for superior wet grip. Eco-certified, non-toxic, 183×61×5mm. Includes carry strap.',
    price: 64.99, comparePrice: 89.99, category: 'Sports', brand: 'ZenFit',
    stock: 5,    // CRITICAL: ~2.5 days
    soldCount: 410, rating: 4.7, numReviews: 134, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
    images:    ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
    tags: ['yoga mat', 'yoga', 'fitness', 'natural rubber'],
    variants: [{ label: 'Color', options: ['Deep Purple','Ocean Blue','Sage Green','Black','Blush Pink'] }],
    SEED_VELOCITY: 2.0,
  },
  {
    name: 'Adjustable Resistance Bands Set',
    description: '5-band set (10–50lb), natural latex, reinforced fabric loops, anti-snap. Includes door anchor, handles, ankle straps, and carry bag.',
    price: 22.99, comparePrice: 34.99, category: 'Sports', brand: 'FitPro',
    stock: 120,  // LOW risk: ~37.5 days
    soldCount: 530, rating: 4.5, numReviews: 189, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500',
    images:    ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500'],
    tags: ['resistance bands', 'gym', 'home workout'],
    SEED_VELOCITY: 3.2,
  },
  {
    name: 'Gym Duffel Bag',
    description: '45L capacity, separate wet/dry compartment, ventilated shoe pocket, padded laptop sleeve. Durable 900D ballistic nylon.',
    price: 49.99, comparePrice: 64.99, category: 'Sports', brand: 'TravelPro',
    stock: 0,    // CRITICAL: out of stock
    soldCount: 320, rating: 4.3, numReviews: 78, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    images:    ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
    tags: ['gym bag', 'duffel', 'sports bag'],
    SEED_VELOCITY: 1.8,
  },
  {
    name: 'Protein Shaker Bottle',
    description: 'BlenderBall wire whisk, leak-proof spout, 28oz capacity, graduated markings. BPA-free Tritan plastic. Dishwasher safe.',
    price: 14.99, comparePrice: 22.99, category: 'Sports', brand: 'NutriGear',
    stock: 0,    // CRITICAL: out of stock
    soldCount: 660, rating: 4.4, numReviews: 203, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500',
    images:    ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500'],
    tags: ['shaker', 'protein', 'gym', 'blender bottle'],
    SEED_VELOCITY: 4.2,
  },

  // ── HOME ─────────────────────────────────────────────────────────────────────
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted mugs with reactive glaze finish. Each 12oz, microwave-safe, dishwasher-safe. Ideal housewarming gift.',
    price: 39.99, comparePrice: 54.99, category: 'Home', brand: 'ArtisanHome',
    stock: 72,   // LOW risk: ~48 days
    soldCount: 330, rating: 4.6, numReviews: 78, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500',
    images:    ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500'],
    tags: ['mug', 'ceramic', 'coffee', 'gift set'],
    SEED_VELOCITY: 1.5,
  },
  {
    name: 'LED Smart Desk Lamp',
    description: 'Touch control, 5 color temps, 10 brightness levels, 12W, USB-A charging port, flexible gooseneck. Eye-care flicker-free technology.',
    price: 44.99, comparePrice: 64.99, category: 'Home', brand: 'BrightSpace',
    stock: 38,   // LOW risk: ~34.5 days
    soldCount: 265, rating: 4.3, numReviews: 61, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
    images:    ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
    tags: ['lamp', 'LED', 'desk lamp', 'smart'],
    SEED_VELOCITY: 1.1,
  },
  {
    name: 'Scented Soy Candle Set',
    description: 'Set of 3 hand-poured soy wax candles: Cedarwood & Vanilla, Sea Mist, and Lavender Fields. 45-hour burn each. Cotton wick, reusable glass jar.',
    price: 32.99, comparePrice: 44.99, category: 'Home', brand: 'AromaLux',
    stock: 45,   // MEDIUM risk: ~18.75 days
    soldCount: 410, rating: 4.7, numReviews: 142, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1603905502826-4db0a45e9f9c?w=500',
    images:    ['https://images.unsplash.com/photo-1603905502826-4db0a45e9f9c?w=500'],
    tags: ['candle', 'soy', 'scented', 'home fragrance'],
    SEED_VELOCITY: 2.4,
  },
  {
    name: 'Bamboo Cutting Board Set',
    description: 'Set of 3 sizes: large (18"×12"), medium (14"×9"), small (11"×7"). Naturally antibacterial bamboo. Juice groove on large board. Includes care oil.',
    price: 36.99, comparePrice: 49.99, category: 'Home', brand: 'KitchenCraft',
    stock: 48,   // LOW risk: ~36.9 days
    soldCount: 240, rating: 4.5, numReviews: 95, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500',
    images:    ['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500'],
    tags: ['cutting board', 'bamboo', 'kitchen', 'cookware'],
    SEED_VELOCITY: 1.3,
  },

  // ── ACCESSORIES ─────────────────────────────────────────────────────────────
  {
    name: 'Minimalist Leather Wallet',
    description: 'Full-grain vegetable-tanned leather, RFID-blocking inner sleeve, 8-card capacity, cash slot. Slim 6mm profile.',
    price: 34.99, comparePrice: 49.99, category: 'Accessories', brand: 'LeatherCo',
    stock: 150,  // LOW risk: ~44.1 days
    soldCount: 630, rating: 4.7, numReviews: 203, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
    images:    ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500'],
    tags: ['wallet', 'leather', 'RFID', 'minimalist'],
    SEED_VELOCITY: 3.4,
  },
  {
    name: 'Backpack Urban Explorer',
    description: '25L, 15.6" padded laptop sleeve, USB pass-through, anti-theft back pocket, water-resistant 600D ripstop. Ergonomic air-mesh shoulder straps.',
    price: 74.99, comparePrice: 99.99, category: 'Accessories', brand: 'TravelPro',
    stock: 80,   // LOW risk: ~40 days
    soldCount: 370, rating: 4.5, numReviews: 118, isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    images:    ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
    tags: ['backpack', 'laptop bag', 'travel', 'anti-theft'],
    variants: [{ label: 'Color', options: ['Black','Navy','Olive','Gray'] }],
    SEED_VELOCITY: 2.0,
  },
  {
    name: 'Polarized Sunglasses',
    description: 'TAC polarized lenses with UV400 protection, TR90 flexible frame. Blocks 99.9% of UVA/UVB. Includes hard case and cleaning cloth.',
    price: 49.99, comparePrice: 79.99, category: 'Accessories', brand: 'VisionPro',
    stock: 16,   // HIGH risk: ~7.6 days
    soldCount: 345, rating: 4.4, numReviews: 86, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
    images:    ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
    tags: ['sunglasses', 'polarized', 'UV protection'],
    SEED_VELOCITY: 2.1,
  },
  {
    name: 'Silicone Watch Band Set',
    description: 'Pack of 5 fluoroelastomer bands compatible with Apple Watch 38/40/41/42/44/45mm. Sweat-resistant, buckle clasp, 2mm taper.',
    price: 19.99, comparePrice: 29.99, category: 'Accessories', brand: 'WristStyle',
    stock: 55,   // MEDIUM risk: ~19.6 days
    soldCount: 480, rating: 4.3, numReviews: 134, isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    images:    ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
    tags: ['watch band', 'silicone', 'Apple Watch'],
    SEED_VELOCITY: 2.8,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Monthly weights Jan–Dec (index 0 = January)
const MONTH_WEIGHTS = [1.10, 0.85, 0.90, 1.00, 1.10, 0.90, 0.90, 0.80, 1.15, 1.30, 1.90, 2.10];

const ADDRESSES = [
  { street: '124 Maple Ave',   city: 'New York',    state: 'NY', zipCode: '10001', country: 'US', phone: '212-555-0101' },
  { street: '87 Oak Street',   city: 'Chicago',     state: 'IL', zipCode: '60601', country: 'US', phone: '312-555-0202' },
  { street: '345 Pine Road',   city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'US', phone: '213-555-0303' },
  { street: '22 Elm Drive',    city: 'Houston',     state: 'TX', zipCode: '77001', country: 'US', phone: '713-555-0404' },
  { street: '9 Birch Lane',    city: 'Phoenix',     state: 'AZ', zipCode: '85001', country: 'US', phone: '602-555-0505' },
  { street: '56 Cedar Blvd',   city: 'Seattle',     state: 'WA', zipCode: '98101', country: 'US', phone: '206-555-0606' },
  { street: '203 Walnut Court',city: 'Boston',      state: 'MA', zipCode: '02101', country: 'US', phone: '617-555-0707' },
];

let orderCounter = 100001;
function nextOrderNum() { return `ORD-${orderCounter++}`; }

function rnd(n) { return Math.floor(Math.random() * n); }

function pickWeightedDate(startDate, endDate) {
  // Build array of (date, weight) — one entry per day
  const days = [], weights = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    days.push(new Date(cur));
    weights.push(MONTH_WEIGHTS[cur.getMonth()]);
    cur.setDate(cur.getDate() + 1);
  }
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < days.length; i++) {
    r -= weights[i];
    if (r <= 0) { return days[i]; }
  }
  return days[days.length - 1];
}

function addTimeJitter(date) {
  const d = new Date(date);
  d.setHours(7 + rnd(14));
  d.setMinutes(rnd(60));
  d.setSeconds(rnd(60));
  return d;
}

// Velocity-weighted product selection (1–3 items per order)
function pickProducts(products) {
  const count = Math.random() < 0.60 ? 1 : Math.random() < 0.65 ? 2 : 3;
  const chosen = [];
  const usedIds = new Set();
  const totalV = products.reduce((s, p) => s + p._velocity, 0);

  let attempts = 0;
  while (chosen.length < count && attempts < 40) {
    attempts++;
    let r = Math.random() * totalV;
    for (const p of products) {
      r -= p._velocity;
      if (r <= 0) {
        if (!usedIds.has(p._id.toString())) {
          usedIds.add(p._id.toString());
          chosen.push(p);
        }
        break;
      }
    }
  }
  return chosen;
}

function buildOrder(products, allUsers, date) {
  const user = allUsers[rnd(allUsers.length)];
  const picked = pickProducts(products);

  const items = picked.map(p => ({
    product:  p._id,
    name:     p.name,
    image:    p.thumbnail,
    price:    p.price,
    quantity: Math.random() < 0.75 ? 1 : 2,
  }));

  const itemsPrice   = parseFloat(items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2));
  const shippingPrice = itemsPrice >= 50 ? 0 : 5.99;
  const taxPrice      = parseFloat((itemsPrice * 0.08).toFixed(2));
  const totalPrice    = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  const cutoff    = new Date('2026-05-10');
  const isOld     = date < cutoff;
  const statusArr = isOld ? ['delivered'] : ['processing', 'shipped', 'confirmed'];
  const status    = isOld ? 'delivered' : statusArr[rnd(statusArr.length)];

  const addr = { ...ADDRESSES[rnd(ADDRESSES.length)], name: user.name };

  return {
    _id:          new mongoose.Types.ObjectId(),
    orderNumber:  nextOrderNum(),
    user:         user._id,
    items,
    shippingAddress: addr,
    paymentMethod: Math.random() < 0.7 ? 'card' : 'paypal',
    itemsPrice, shippingPrice, taxPrice, totalPrice,
    isPaid:       true,
    paidAt:       date,
    status,
    isDelivered:  isOld,
    deliveredAt:  isOld ? new Date(date.getTime() + (3 + rnd(5)) * 86400000) : undefined,
    trackingHistory: [
      { status: 'confirmed', description: 'Order placed and payment received', timestamp: date },
      ...(status !== 'confirmed' ? [{ status, description: `Order ${status}`, timestamp: new Date(date.getTime() + 86400000) }] : []),
    ],
    createdAt: date,
    updatedAt: date,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────
const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
    console.log('🗑  Cleared existing data');

    // ── Admin ──
    const admin = await User.create({
      name:     'Admin User',
      email:    process.env.ADMIN_EMAIL    || 'admin@shop.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role:     'admin',
    });

    // ── Regular users ──
    const hash = pw => bcrypt.hash(pw, 12);
    const userDocs = await User.insertMany([
      { name: 'Yasir Hameed',   email: 'yasir@example.com',  password: await hash('password123'), role: 'user' },
      { name: 'Tayyab Gill',    email: 'tayyab@example.com', password: await hash('password123'), role: 'user' },
      { name: 'Ali Ahmed',      email: 'ali@example.com',    password: await hash('password123'), role: 'user' },
      { name: 'Sara Khan',      email: 'sara@example.com',   password: await hash('password123'), role: 'user' },
      { name: 'Zain Malik',     email: 'zain@example.com',   password: await hash('password123'), role: 'user' },
      { name: 'Hira Baig',      email: 'hira@example.com',   password: await hash('password123'), role: 'user' },
    ]);
    const allUsers = [admin, ...userDocs];
    console.log(`👤 Created ${allUsers.length} users`);

    // ── Products (strip SEED_VELOCITY before inserting) ──
    const productInsertData = PRODUCTS_RAW.map(({ SEED_VELOCITY, ...rest }) => rest);
    const products          = await Product.create(productInsertData);
    console.log(`📦 Created ${products.length} products`);

    // Attach velocity for order generation
    const productsWithV = products.map((p, i) => ({
      ...p.toObject(),
      _velocity: PRODUCTS_RAW[i].SEED_VELOCITY,
    }));

    // ── Orders ────────────────────────────────────────────────────────────────
    const orders = [];

    // PASS 1: 420 historically-distributed orders (May 2025 → May 2026)
    const histStart = new Date('2025-05-18');
    const histEnd   = new Date('2026-04-17');
    for (let i = 0; i < 420; i++) {
      const date = addTimeJitter(pickWeightedDate(histStart, histEnd));
      orders.push(buildOrder(productsWithV, allUsers, date));
    }

    // PASS 2: 90 dense recent orders (last 30 days) for the velocity line chart
    // Spread them evenly across the last 30 days so every day has 2–4 orders
    const recentStart = new Date('2026-04-18');
    const recentEnd   = new Date('2026-05-17');
    for (let i = 0; i < 90; i++) {
      // Evenly space + small jitter
      const dayOffset = Math.floor((i / 90) * 30);
      const base = new Date(recentStart);
      base.setDate(base.getDate() + dayOffset);
      const date = addTimeJitter(base);
      orders.push(buildOrder(productsWithV, allUsers, date));
    }

    // PASS 3: 40 orders specifically for top 5 velocity products in last 14 days
    const urgentProducts = [...productsWithV].sort((a, b) => b._velocity - a._velocity).slice(0, 5);
    for (let i = 0; i < 40; i++) {
      const dayOffset = rnd(14);
      const base = new Date('2026-05-04');
      base.setDate(base.getDate() + dayOffset);
      const date = addTimeJitter(base);

      // Force-pick from high-velocity products
      const p    = urgentProducts[rnd(urgentProducts.length)];
      const user = allUsers[rnd(allUsers.length)];
      const qty  = Math.random() < 0.6 ? 1 : 2;
      const itemsPrice   = parseFloat((p.price * qty).toFixed(2));
      const shippingPrice = itemsPrice >= 50 ? 0 : 5.99;
      const taxPrice      = parseFloat((itemsPrice * 0.08).toFixed(2));

      orders.push({
        _id:         new mongoose.Types.ObjectId(),
        orderNumber: nextOrderNum(),
        user:        user._id,
        items: [{ product: p._id, name: p.name, image: p.thumbnail, price: p.price, quantity: qty }],
        shippingAddress: { ...ADDRESSES[rnd(ADDRESSES.length)], name: user.name },
        paymentMethod: 'card',
        itemsPrice, shippingPrice, taxPrice,
        totalPrice: parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2)),
        isPaid: true, paidAt: date,
        status: date < new Date('2026-05-10') ? 'delivered' : 'processing',
        isDelivered: date < new Date('2026-05-10'),
        trackingHistory: [{ status: 'confirmed', description: 'Order placed', timestamp: date }],
        createdAt: date, updatedAt: date,
      });
    }

    // Sort chronologically before insert (cosmetic)
    orders.sort((a, b) => a.createdAt - b.createdAt);

    // Use native driver to preserve custom createdAt timestamps
    await Order.collection.insertMany(orders, { ordered: false });
    console.log(`🧾 Created ${orders.length} orders`);

    // ── Summary ──────────────────────────────────────────────────────────────
    const riskSummary = {
      critical: products.filter(p => p.stock === 0).length + ' out-of-stock, plus ~4 with < 7 days velocity',
      high:     '4 products with 7–14 days of stock',
      medium:   '7 products with 14–30 days of stock',
      low:      '9 products well-stocked (30+ days)',
    };

    console.log('\n✅ Database seeded successfully!\n');
    console.log('─'.repeat(50));
    console.log(`Admin Login:      ${admin.email}  /  ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log(`Test User Login:  yasir@example.com  /  password123`);
    console.log('\nRisk Distribution:');
    Object.entries(riskSummary).forEach(([k, v]) => console.log(`  ${k.toUpperCase()}: ${v}`));
    console.log('\nNow run: npm run dev (backend) & npm run dev (frontend)');
    console.log('Then visit: http://localhost:5173/admin/inventory');
    console.log('─'.repeat(50));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedDB();
