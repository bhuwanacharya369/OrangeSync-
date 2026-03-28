import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Clear the backend session state unconditionally
  await supabase.auth.signOut()

  // Revalidate entire app cache layout and instantly bounce them to the login screen
  revalidatePath('/', 'layout')
  
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302, // 302 forces a clean browser redirect
  })
}
