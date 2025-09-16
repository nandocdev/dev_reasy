import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This is a server-only file. It is used to create a Supabase client that
// can be used in Server Components, Server Actions, and Route Handlers.
export const createServerClient = () => {
    const cookieStore = cookies();
    return createSupabaseServerClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
                cookieStore.set({ name, value: '', ...options });
            },
        },
    });
}
