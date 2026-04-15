export interface Destination {
  id: number;
  name: string;
  country: string;
  notes: string;
  status: 'wishlist' | 'visited' | 'planned';
  created_at: string;
  capital?: string;
  currency?: string;
  flag_url?: string;
}
