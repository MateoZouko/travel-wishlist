export interface Destination {
  id: number;
  name: string;
  country: string;
  notes: string;
  status: 'wishlist' | 'visited' | 'planned';
  created_at: string;
}

export interface ISSPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}