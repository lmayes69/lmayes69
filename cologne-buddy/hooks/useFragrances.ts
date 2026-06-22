import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Fragrance } from '../types';

export function useFragrances(userId?: string) {
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFragrances = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('fragrances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setFragrances((data as Fragrance[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchFragrances(); }, [fetchFragrances]);

  const addFragrance = async (fragrance: Omit<Fragrance, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('fragrances')
      .insert({ ...fragrance, user_id: userId })
      .select()
      .single();

    if (!error && data) {
      setFragrances(prev => [data as Fragrance, ...prev]);
    }
    return { data: data as Fragrance | null, error: error?.message };
  };

  const updateFragrance = async (id: string, updates: Partial<Fragrance>) => {
    const { data, error } = await supabase
      .from('fragrances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setFragrances(prev => prev.map(f => f.id === id ? data as Fragrance : f));
    }
    return { error: error?.message };
  };

  const deleteFragrance = async (id: string) => {
    const { error } = await supabase.from('fragrances').delete().eq('id', id);
    if (!error) {
      setFragrances(prev => prev.filter(f => f.id !== id));
    }
    return { error: error?.message };
  };

  const toggleFavorite = async (id: string) => {
    const fragrance = fragrances.find(f => f.id === id);
    if (!fragrance) return;
    await updateFragrance(id, { is_favorite: !fragrance.is_favorite });
  };

  return { fragrances, loading, error, refetch: fetchFragrances, addFragrance, updateFragrance, deleteFragrance, toggleFavorite };
}
