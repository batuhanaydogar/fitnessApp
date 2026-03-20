import { supabase } from '@/lib/supabase/client';

export type QuoteItem = {
  id: string;
  quote: string;
};

export async function getActiveQuotes(): Promise<QuoteItem[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('motivational_quotes')
    .select('id, quote')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getFavoriteQuoteIds(): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_favorite_quotes')
    .select('quote_id')
    .eq('user_id', session.user.id);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.quote_id);
}

export async function toggleFavoriteQuote(quoteId: string, isFavorite: boolean): Promise<void> {
  if (!supabase) {
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return;
  }

  if (isFavorite) {
    const { error } = await supabase
      .from('user_favorite_quotes')
      .delete()
      .eq('user_id', session.user.id)
      .eq('quote_id', quoteId);

    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.from('user_favorite_quotes').insert({
    user_id: session.user.id,
    quote_id: quoteId,
  });

  if (error) {
    throw error;
  }
}
