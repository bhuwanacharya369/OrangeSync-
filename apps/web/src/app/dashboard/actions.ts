'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addContact(name: string, syncId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const metadata = user.user_metadata || {};
  const currentFriends = metadata.friends || [];
  
  if (!name || !syncId) throw new Error("Missing details");
  
  const newFriends = [...currentFriends, { name, syncId: syncId.toUpperCase() }];

  const { error } = await supabase.auth.updateUser({
    data: { friends: newFriends }
  });

  if (error) throw new Error(error.message);
  
  revalidatePath('/dashboard');
  return { success: true };
}

export async function removeContact(syncId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const metadata = user.user_metadata || {};
  const currentFriends = metadata.friends || [];
  
  const newFriends = currentFriends.filter((f: any) => f.syncId !== syncId);

  const { error } = await supabase.auth.updateUser({
    data: { friends: newFriends }
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}
