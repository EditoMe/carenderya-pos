export const theme = {
  bg: '#F4F1EB',
  card: '#FFFFFF',
  text: '#221A12',
  muted: '#8B8378',
  line: '#E9E2D8',
  accent: '#F26B2E',
  accentDark: '#D9551D',
  accentSoft: '#FFE7D6',
  green: '#2E9E4F',
  greenSoft: '#DFF3E4',
  amber: '#C77B0A',
  amberSoft: '#FBECD0',
  red: '#D64545',
  redSoft: '#F9DEDC',
  blue: '#2F7DE1',
  radius: 14,
} as const;

export type OrderType = 'Dine In' | 'Take Away' | 'Deliver';
export type OrderStatus = 'In Progress' | 'Ready to Serve' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'GCash' | 'Card';
