export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  age: number;
  photoUrl: string;
  isVerified: boolean;
  isAdmin?: boolean;
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'OFFICE STAFF';
  credits: number;
  password?: string; // Optional for admin editing
  isBlocked?: boolean;
}

export interface Game {
  id: string;
  title: string;
  category: string; // Changed from enum to string for custom typing
  images: string[]; // Array for multiple images
  pricePerHour: number;
  available: boolean;
  isHidden?: boolean; // Controls visibility on booking screen
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountCode: string;
  percentage: number; 
  active: boolean;
  maxClaims: number;
  currentClaims: number;
}

export interface ShopSettings {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  autoMode: boolean;
}

export enum AuthView {
  SELECT_MODE = 'SELECT_MODE',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  OTP_VERIFY = 'OTP_VERIFY'
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  gameTitle: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'expired';
  price: number;
  couponCode?: string | null;
  timestamp: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  footerAddress: string;
  footerText: string;
  heroImage?: string;
  heroTextColor?: string;
  footerImage?: string;
  adminName?: string;
  // Navigation Title Customization
  navTitlePart1?: string;
  navTitlePart2?: string;
  navTitleColor1?: string;
  navTitleColor2?: string;
}