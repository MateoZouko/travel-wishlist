import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Destination } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface DestinationContextType {
  destinations: Destination[];
  addDestination: (data: Omit<Destination, 'id' | 'created_at'>) => Promise<void>;
  updateDestination: (id: number, data: Omit<Destination, 'id' | 'created_at'>) => Promise<void>;
  deleteDestination: (id: number) => Promise<void>;
  loading: boolean;
}

const DestinationContext = createContext<DestinationContextType | null>(null);

export const DestinationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDestinations = async () => {
    try {
      const res = await axios.get(`${API_URL}/destinations`);
      setDestinations(res.data);
    } catch (err) {
      console.error('Error fetching destinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const addDestination = async (data: Omit<Destination, 'id' | 'created_at'>) => {
    await axios.post(`${API_URL}/destinations`, data);
    await fetchDestinations();
  };

  const updateDestination = async (id: number, data: Omit<Destination, 'id' | 'created_at'>) => {
    await axios.put(`${API_URL}/destinations/${id}`, data);
    await fetchDestinations();
  };

  const deleteDestination = async (id: number) => {
    await axios.delete(`${API_URL}/destinations/${id}`);
    await fetchDestinations();
  };

  return (
    <DestinationContext.Provider value={{ destinations, addDestination, updateDestination, deleteDestination, loading }}>
      {children}
    </DestinationContext.Provider>
  );
};

export const useDestinations = () => {
  const context = useContext(DestinationContext);
  if (!context) throw new Error('useDestinations must be used within DestinationProvider');
  return context;
};