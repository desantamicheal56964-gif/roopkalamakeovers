/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, Testimonial, PortfolioItem, InstagramPost } from './types';

export const LUXURY_SERVICES: Service[] = [
  // Bridal Section
  {
    id: 'bridal-royal',
    name: 'Royal Signature Bridal Makeover',
    category: 'bridal',
    price: 24999,
    duration: '4-5 Hours',
    description: 'Our most elite bridal artistry. Includes premium HD Airbrush cosmetics, advanced hair sculpting with custom extensions, jewelry draping, floral styling, lash extensions, and pre-makeup hydration infusion.',
    features: ['Elite HD Airbrush Makeup', 'Precision Hair Sculpting', 'Luxury Hydration Serum', 'Jewelry & Dupatta Draping', 'Premium False Lashes'],
    popular: true
  },
  {
    id: 'bridal-hd',
    name: 'Classic High-Definition HD Bridal Makeup',
    category: 'bridal',
    price: 18500,
    duration: '3.5 Hours',
    description: 'Flawless camera-ready makeup using international luxury HD brands. Covers full facial sculpting, elegant hairstyling of choice, traditional draping, and professional eye couture.',
    features: ['Luxury HD Branded Cosmetics', 'Elegant Hairstyling', 'Standard Lash Extensions', 'Dupatta Draping'],
    popular: false
  },
  {
    id: 'bridal-engagement',
    name: 'Celestial Engagement & Sagan Makeup',
    category: 'bridal',
    price: 12000,
    duration: '3 Hours',
    description: 'A glowing, medium-coverage look designed to shine under banquet lighting. Tailored hairstyle, exquisite eye glitter work, and standard saree/lehenga draping.',
    features: ['Dewy Luminous Finish', 'Tailored Hairstyle', 'Draping Artistry', 'Eye Shadow Artistry'],
    popular: false
  },
  {
    id: 'bridal-party',
    name: 'Glitz & Glam Custom Party Makeover',
    category: 'bridal',
    price: 6500,
    duration: '2 Hours',
    description: 'Perfect for bridesmaids, festivals, or cocktail receptions. Customized party makeup styled elegantly with sleek or bouncy hair designs.',
    features: ['Professional Party Cosmetics', 'Sleek/Bouncy Hair Prep', 'Dynamic Highlighter Accents'],
    popular: false
  },

  // Hair Styling Section
  {
    id: 'hair-bridal-design',
    name: 'Bridal Haute Braids & Messy Buns',
    category: 'hair',
    price: 4500,
    duration: '1.5 Hours',
    description: 'Bespoke traditional hair art embellished with baby\'s breath, roses, or golden hair accessories. Crafted to remain picture-perfect for 12+ hours.',
    features: ['Anti-frizz Styling Prep', 'Floral/Jewelry Attachment', 'High-Hold Setting Mist'],
    popular: false
  },
  {
    id: 'hair-balayage',
    name: 'French Balayage & Glaze Melt',
    category: 'hair',
    price: 8500,
    duration: '3-4 Hours',
    description: 'Hand-painted sun-kissed balayage highlight with custom luxury gloss toner to match your skin undertones, inclusive of nourishment wash.',
    features: ['L\'Oréal/Olaplex Bond Protection', 'Hand-Painted Dimension', 'Glaze Coloring Treatment'],
    popular: true
  },
  {
    id: 'hair-spa',
    name: 'Caviar Nourishing Hair Spa & Blowout',
    category: 'hair',
    price: 3200,
    duration: '1.5 Hours',
    description: 'A deep conditioning protein-rich therapy that repairs damaged cuticles and adds high gloss. Completed with an signature bouncy blowout.',
    features: ['Deep Caviar Extract Mask', 'Micro-Steam Scalp Therapy', 'Luxury Bouncy Blowout'],
    popular: false
  },

  // Skin Therapies Section
  {
    id: 'skin-gold-facial',
    name: 'Roopkala 24K Gold Luxury Glow Treatment',
    category: 'skin',
    price: 5500,
    duration: '1.5 Hours',
    description: 'Our proprietary herbal gold-standard skin treatment that accelerates cellular regeneration. Purifies pores and leaves a warm golden luster.',
    features: ['24K Active Gold Serum', 'Ultrasonic Deep Peeling', 'Hydrating Gold Dust Mask', 'Lymphatic Scalp Massage'],
    popular: true
  },
  {
    id: 'skin-hydra-cell',
    name: 'Hydro-Infusion Cellular facial',
    category: 'skin',
    price: 6500,
    duration: '1.2 Hours',
    description: 'State-of-the-art non-invasive skin rejuvenation. Infuses pure oxygen and hyaluronic acid cocktails deep into the epidermis.',
    features: ['Hyaluronic Acid Jet Spray', 'Pore Tightening Cold Hammer', 'Exfoliating Vacuum Extractions'],
    popular: false
  },

  // Luxury Essentials
  {
    id: 'essential-manicure',
    name: 'Elixir Charcoal Spiced Pedicure & Manicure Duo',
    category: 'essentials',
    price: 2800,
    duration: '1.5 Hours',
    description: 'Indulging charcoal scrub, warm paraffin dip, cuticle detailing, and stress-relieving warm stone massage for hands and feet.',
    features: ['Active Charcoal Skin Detox', 'Warm Paraffin Wax Treatment', 'Therapeutic Hot Stone Rub'],
    popular: false
  },
  {
    id: 'essential-gel-nails',
    name: 'Glass-Gel Bridal Nail Extensions',
    category: 'essentials',
    price: 3500,
    duration: '2 Hours',
    description: 'Custom sculpted nail extensions with high-shine glass-gel polish. Includes options for gold foil details, Swarovski crystal attachments or French tip art.',
    features: ['Custom Length Sculpting', 'Gold Foil & Pearl Nail Art', 'Chip-Free Gel Guard'],
    popular: false
  }
];

export const CLIENT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Aishwarya Sharma',
    rating: 5,
    text: 'For my wedding day, Roopkala Makeover was the absolute best decision. The HD Airbrush looked perfect in real life and in our wedding video. Every relative kept praising how radiant and natural my makeup was. The staff handles everything with so much grace!',
    category: 'Royal Signature Bridal Makeover',
    badge: 'Verified Bride',
    date: 'April 2026'
  },
  {
    id: 't-2',
    name: 'Priyanka Patel',
    rating: 5,
    text: 'I booked the 24K Gold Glow Facial and Sangeet Makeup here. The glow on my skin was incredible. The makeup matched my champagne golden lehenga exactly and didn\'t smudge or crease even after hours of energetic dancing!',
    category: '24K Gold Luxury Glow & Sangeet',
    badge: 'Verified Bride',
    date: 'May 2026'
  },
  {
    id: 't-3',
    name: 'Meenakshi Iyer',
    rating: 5,
    text: 'Roopkala is our family\'s go-to place! Their Caviar Hair Spa and manicures are pure luxury. The ambiance is beautifully designed—very dark, elegant, and peaceful. It feels like entering a elite royal sanctuary.',
    category: 'Premium Caviar Hair Spa & Nail Extensions',
    badge: 'VIP Client',
    date: 'March 2026'
  }
];

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'p-1',
    title: 'The Royal Crimson Bride',
    category: 'Bridal Makeover',
    image: '/src/assets/images/bridal_look_traditional_1779467505772.png',
    description: 'A classic rich crimson lehenga look featuring precision gold-shimmer eyelids, soft contouring, a timeless matte red lip, and a high-set traditional bun draped in translucent fabric.',
    tag: 'Traditional HD'
  },
  {
    id: 'p-2',
    title: 'The Dewy Champagne Glow',
    category: 'Engagement Look',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
    description: 'A luminous, glass-skin engagement finish with dusty rose lips, pearl eye highlighting, and cascading messy waves wrapped in baby\'s breath flowers.',
    tag: 'Rose Gold Glitz'
  },
  {
    id: 'p-3',
    title: 'Sleek Reception Editorial',
    category: 'Celebrity Makeup',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
    description: 'A dramatic dark smokey eye, bronze aesthetic skin highlight, paired with an elegant sleek low-bun hairstyle for a contemporary bold look.',
    tag: 'Modern Chic'
  },
  {
    id: 'p-4',
    title: 'Premium Styling Studio Ambiance',
    category: 'Roopkala Elite Sanctuary',
    image: '/src/assets/images/salon_interior_1779467523614.png',
    description: 'Glimpse into our state-of-the-art dark themed makeup stations where magic translates to aesthetic masterpiece. Outfitted with bespoke gold furnishings and warm, skin-true spotlights.',
    tag: 'Roopkala Studio'
  }
];

export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'ig-1',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
    likes: '1,245',
    comments: '42',
    caption: 'Behind the scenes: Customizing a royal traditional look for our serene bride Aishwarya. Handcrafted gold-foil shadows. ✨ #RoopkalaMakeover #IndianBride #BridalArtistry',
    daysAgo: 2
  },
  {
    id: 'ig-2',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
    likes: '968',
    comments: '29',
    caption: 'Tame your mane! Our custom Balayage Melt leaves hair with unmatched dimension under natural light. ❤️ #BalayageHair #SalonGlow #RoopkalaSalon',
    daysAgo: 4
  },
  {
    id: 'ig-3',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400',
    likes: '1,890',
    comments: '68',
    caption: 'Gold Standard, literal. Our luxurious 24K gold facial hydrates and heals. Glow like royalty on your most auspicious days! 🌟 #GoldFacial #BridalGlow #SkincareSecrets',
    daysAgo: 6
  }
];
