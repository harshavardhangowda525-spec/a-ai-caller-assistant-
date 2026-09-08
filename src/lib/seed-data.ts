import type {
  CafeEvent,
  GalleryImage,
  MenuItem,
  ReviewTheme,
  SiteContent,
} from './types';

/**
 * Static seed content. Doubles as the graceful fallback the public site
 * renders from whenever Supabase is not configured, so the site is always
 * deployable and never blank. Admins edit the live copies in the database.
 */

export const DEFAULT_CONTENT: SiteContent = {
  heroHeadline: 'Coffee with a story.',
  heroSub:
    'Specialty coffee sourced from tribal farms, crafted with passion in the heart of Church Street.',
  heroBadge: 'Church Street · Bengaluru',
  aboutTitle: 'Rooted in origin. Brewed for today.',
  aboutBody:
    'Tribal Brew Daily began with a simple belief — that the best coffee carries the story of the land and the hands that grow it. We work closely with tribal farming communities across the Western Ghats, sourcing single-origin beans that are grown in the shade, picked by hand and roasted to reveal their character. In our Church Street home, that story is finished by baristas who treat every cup as craft.',
  coffeeStory:
    'From the misty slopes of Malnad and the tribal belts of Karnataka, our beans travel a short, honest journey — grown with care, roasted in small batches, and brewed the moment you order. No shortcuts, no anonymity. Just coffee you can trace back to the people and the place it came from.',
  openingHours: 'Open daily · 8:00 AM – 11:00 PM',
  phone: '+918041234567',
  address:
    '16/4, Church St, Haridevpur, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001',
  email: 'hello@tribalbrew.coffee',
  instagram: 'https://instagram.com/tribalbrewdaily',
  facebook: 'https://facebook.com/tribalbrewdaily',
  orderingUrl: 'https://tribalbrew.coffee/order',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Tribal+Brew+Daily+Church+Street+Bengaluru',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Tribal+Brew+Daily+Church+Street+Bengaluru',
};

export const MENU: MenuItem[] = [
  {
    id: 'vietnamese-coffee',
    name: 'Vietnamese Coffee',
    description: 'Dark, slow-dripped and finished with silky condensed milk.',
    price: 260,
    category: 'signature',
    image: '/images/coffee-vietnamese.jpg',
    available: true,
    featured: true,
    sort: 1,
  },
  {
    id: 'malnad-magic',
    name: 'Malnad Magic',
    description: 'Our house pour — single-origin Malnad beans, bright and full-bodied.',
    price: 240,
    category: 'signature',
    image: '/images/coffee-malnad.jpg',
    available: true,
    featured: true,
    sort: 2,
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    description: 'Steeped 18 hours for a smooth, low-acidity, naturally sweet cup.',
    price: 280,
    category: 'cold',
    image: '/images/coffee-coldbrew.jpg',
    available: true,
    featured: true,
    sort: 3,
  },
  {
    id: 'pour-over',
    name: 'Pour Over Coffee',
    description: 'A clean, delicate hand-brew that lets the origin speak for itself.',
    price: 300,
    category: 'signature',
    image: '/images/coffee-pourover.jpg',
    available: true,
    featured: true,
    sort: 4,
  },
  {
    id: 'sakkat-latte',
    name: 'Sakkat Latte',
    description: 'Our signature spiced latte — warm, local and impossibly comforting.',
    price: 290,
    category: 'signature',
    image: '/images/coffee-sakkat.jpg',
    available: true,
    featured: true,
    sort: 5,
  },
  {
    id: 'salted-pistachio-latte',
    name: 'Salted Pistachio Latte',
    description: 'Roasted pistachio, a whisper of salt, and espresso in balance.',
    price: 320,
    category: 'signature',
    image: '/images/coffee-pistachio.jpg',
    available: true,
    featured: true,
    sort: 6,
  },
  {
    id: 'iced-latte',
    name: 'Iced Latte',
    description: 'Double shot over ice with cold milk — crisp and effortless.',
    price: 250,
    category: 'cold',
    image: '/images/coffee-icedlatte.jpg',
    available: true,
    featured: true,
    sort: 7,
  },
  {
    id: 'hot-vanilla-latte',
    name: 'Hot Vanilla Latte',
    description: 'Real vanilla folded into steamed milk and a smooth espresso base.',
    price: 270,
    category: 'coffee',
    image: '/images/coffee-vanilla.jpg',
    available: true,
    featured: true,
    sort: 8,
  },
  {
    id: 'korean-cream-cheese-bun',
    name: 'Korean Cream Cheese Bun',
    description: 'Pillowy, golden bun with a rich, tangy cream-cheese heart.',
    price: 220,
    category: 'food',
    image: '/images/food-creamcheese-bun.jpg',
    available: true,
    featured: true,
    sort: 9,
  },
  {
    id: 'biscoff-bliss-brownie',
    name: 'Biscoff Bliss Brownie',
    description: 'Fudgy dark-chocolate brownie swirled with molten Biscoff.',
    price: 240,
    category: 'dessert',
    image: '/images/food-biscoff-brownie.jpg',
    available: true,
    featured: true,
    sort: 10,
  },
];

export const EVENTS: CafeEvent[] = [
  {
    id: 'live-music-fri',
    title: 'Live Music Fridays',
    date: '2026-09-11',
    time: '8:00 PM',
    description:
      'Acoustic sets from Bengaluru artists under warm light. Order a Sakkat Latte and stay a while.',
    image: '/images/event-livemusic.jpg',
    bookingUrl: null,
    published: true,
  },
  {
    id: 'karaoke-night',
    title: 'Karaoke Nights',
    date: '2026-09-13',
    time: '9:00 PM',
    description:
      'Grab the mic. Our after-dark karaoke turns the café into the friendliest stage on Church Street.',
    image: '/images/event-karaoke.jpg',
    bookingUrl: null,
    published: true,
  },
  {
    id: 'community-cupping',
    title: 'Community Cupping',
    date: '2026-09-18',
    time: '5:00 PM',
    description:
      'A guided tasting through our tribal-origin lots. Meet the roasters, learn to taste like a pro.',
    image: '/images/event-cupping.jpg',
    bookingUrl: null,
    published: true,
  },
  {
    id: 'seasonal-launch',
    title: 'Seasonal Menu Launch',
    date: '2026-09-25',
    time: '6:00 PM',
    description:
      'First taste of our new seasonal specials, from spiced cold brews to festive bakes.',
    image: '/images/event-seasonal.jpg',
    bookingUrl: null,
    published: true,
  },
];

/**
 * Review cards summarise GENUINE recurring themes from public feedback
 * (4.7★, 257+ reviews). They are honest paraphrases of what regulars
 * consistently mention — not invented quotes attributed to named people.
 */
export const REVIEW_THEMES: ReviewTheme[] = [
  {
    id: 'unique-coffee',
    quote: 'The specialty menu keeps regulars coming back for something they can’t get elsewhere.',
    theme: 'Unique Coffee',
    author: 'Recurring in 257+ Google reviews',
  },
  {
    id: 'friendly-staff',
    quote: 'Warm, welcoming baristas who remember your order and your name.',
    theme: 'Friendly Staff',
    author: 'Recurring in 257+ Google reviews',
  },
  {
    id: 'cozy',
    quote: 'A cozy, unhurried space that’s easy to settle into for hours.',
    theme: 'Cozy Atmosphere',
    author: 'Recurring in 257+ Google reviews',
  },
  {
    id: 'live-music',
    quote: 'Live music nights that give Church Street evenings a soundtrack.',
    theme: 'Live Music',
    author: 'Recurring in 257+ Google reviews',
  },
  {
    id: 'cheese-buns',
    quote: 'The Korean cream cheese buns are a standout most reviewers mention.',
    theme: 'Korean Cheese Buns',
    author: 'Recurring in 257+ Google reviews',
  },
  {
    id: 'desserts',
    quote: 'Desserts and bakes that pair beautifully with the coffee.',
    theme: 'Desserts',
    author: 'Recurring in 257+ Google reviews',
  },
  {
    id: 'affordable',
    quote: 'Specialty quality at a genuinely fair ₹200–400 spend.',
    theme: 'Affordable Pricing',
    author: 'Recurring in 257+ Google reviews',
  },
];

export const GALLERY: GalleryImage[] = [
  { id: 'g1', src: '/images/gallery-pour.jpg', caption: 'The perfect pour', category: 'coffee', span: 'tall', sort: 1 },
  { id: 'g2', src: '/images/gallery-interior.jpg', caption: 'Our Church Street corner', category: 'interior', span: 'wide', sort: 2 },
  { id: 'g3', src: '/images/food-creamcheese-bun.jpg', caption: 'Korean cream cheese bun', category: 'food', span: 'normal', sort: 3 },
  { id: 'g4', src: '/images/event-livemusic.jpg', caption: 'Live music after dark', category: 'events', span: 'normal', sort: 4 },
  { id: 'g5', src: '/images/gallery-latteart.jpg', caption: 'Latte art in progress', category: 'coffee', span: 'normal', sort: 5 },
  { id: 'g6', src: '/images/gallery-vibe.jpg', caption: 'The evening vibe', category: 'vibe', span: 'tall', sort: 6 },
  { id: 'g7', src: '/images/food-biscoff-brownie.jpg', caption: 'Biscoff bliss brownie', category: 'food', span: 'normal', sort: 7 },
  { id: 'g8', src: '/images/gallery-beans.jpg', caption: 'Single-origin beans', category: 'coffee', span: 'wide', sort: 8 },
  { id: 'g9', src: '/images/gallery-counter.jpg', caption: 'At the counter', category: 'interior', span: 'normal', sort: 9 },
];

export const STATS = {
  rating: '4.7',
  reviews: '257+',
  spend: '₹200–400',
  closing: '11 PM',
};

export const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Our Coffee', href: '#journey' },
  { label: 'Menu', href: '#menu' },
  { label: 'Experience', href: '#experience' },
  { label: 'Events', href: '#events' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#location' },
];
