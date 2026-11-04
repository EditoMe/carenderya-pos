import type { ImageSourcePropType } from 'react-native';

export type Category = 'Ulam' | 'Kanin' | 'Sabaw' | 'Inumin' | 'Merienda' | 'Extras';

export const CATEGORIES: ('All Menu' | Category)[] = [
  'All Menu',
  'Ulam',
  'Kanin',
  'Sabaw',
  'Inumin',
  'Merienda',
  'Extras',
];

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  emoji: string;
  tint: string;
  /** Bundled dish photo (exported from the Figma prototype). */
  photo?: ImageSourcePropType;
  available: boolean;
  bestseller?: boolean;
}

// Dishes, photos and prices match the Figma prototype 1:1.
export const MENU: MenuItem[] = [
  { id: 'adobo', name: 'Chicken Adobo', price: 65, category: 'Ulam', emoji: '🍗', tint: '#F7E3C8', photo: require('@/assets/images/dishes/adobo.jpg'), available: true, bestseller: true },
  { id: 'sinigang', name: 'Pork Sinigang', price: 80, category: 'Sabaw', emoji: '🍲', tint: '#FFE0D6', photo: require('@/assets/images/dishes/sinigang.jpg'), available: true, bestseller: true },
  { id: 'kare', name: 'Kare-Kare', price: 95, category: 'Ulam', emoji: '🥘', tint: '#F3E4C3', photo: require('@/assets/images/dishes/kare.jpg'), available: true },
  { id: 'kawali', name: 'Lechon Kawali', price: 90, category: 'Ulam', emoji: '🥓', tint: '#F6DCC8', photo: require('@/assets/images/dishes/kawali.jpg'), available: true, bestseller: true },
  { id: 'canton', name: 'Pancit Canton', price: 50, category: 'Merienda', emoji: '🍜', tint: '#FDEBC0', photo: require('@/assets/images/dishes/canton.jpg'), available: true },
  { id: 'sisig', name: 'Sisig', price: 85, category: 'Ulam', emoji: '🍳', tint: '#F5D9C6', photo: require('@/assets/images/dishes/sisig.jpg'), available: true, bestseller: true },
  { id: 'plain-rice', name: 'Plain Rice', price: 15, category: 'Kanin', emoji: '🍚', tint: '#F1EAD9', photo: require('@/assets/images/dishes/plain-rice.jpg'), available: true },
  { id: 'halo', name: 'Halo-Halo', price: 55, category: 'Merienda', emoji: '🍨', tint: '#E4D9F5', photo: require('@/assets/images/dishes/halo.jpg'), available: true },
  { id: 'sago', name: "Sago't Gulaman", price: 25, category: 'Inumin', emoji: '🥤', tint: '#DDEEDC', photo: require('@/assets/images/dishes/sago.jpg'), available: true },
];

export const peso = (n: number) =>
  `₱${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
