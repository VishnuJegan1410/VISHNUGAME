
import { Game } from './types';

export const HERO_IMAGES = [
  'https://picsum.photos/seed/gamer1/1920/1080',
  'https://picsum.photos/seed/cyberpunk/1920/1080',
  'https://picsum.photos/seed/esports/1920/1080',
  'https://picsum.photos/seed/neoncity/1920/1080',
];

export const GAMES: Game[] = [
  {
    id: '1',
    title: 'Cyber Warfare X',
    category: 'PC',
    images: [
      'https://picsum.photos/seed/fps/400/300',
      'https://picsum.photos/seed/warfare/400/300'
    ],
    pricePerHour: 120,
    available: true,
  },
  {
    id: '2',
    title: 'Speed Demon GT',
    category: 'PS5',
    images: [
      'https://picsum.photos/seed/racing/400/300'
    ],
    pricePerHour: 100,
    available: true,
  },
  {
    id: '3',
    title: 'Galactic Empire',
    category: 'PC',
    images: [
      'https://picsum.photos/seed/space/400/300',
      'https://picsum.photos/seed/scifi/400/300',
      'https://picsum.photos/seed/stars/400/300'
    ],
    pricePerHour: 120,
    available: false,
  },
  {
    id: '4',
    title: 'Zombie Apoc VR',
    category: 'VR',
    images: [
      'https://picsum.photos/seed/horror/400/300'
    ],
    pricePerHour: 250,
    available: true,
  },
  {
    id: '5',
    title: 'Kingdom Quest',
    category: 'Xbox',
    images: [
      'https://picsum.photos/seed/rpg/400/300'
    ],
    pricePerHour: 80,
    available: true,
  },
  {
    id: '6',
    title: 'Street Brawler 6',
    category: 'PS5',
    images: [
      'https://picsum.photos/seed/fight/400/300'
    ],
    pricePerHour: 100,
    available: true,
  }
];
