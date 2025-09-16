import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This is a server-only file. It is used to create a Supabase client that
// can be used in Server Components, Server Actions, and Route Handlers.
export const createServerActionClient = () => {
    const cookieStore = cookies();
    return createServerClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch (error) {
                    // This can happen in Server Components, but is not a problem.
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: '', ...options });
                } catch (error) {
                    // This can happen in Server Components, but is not a problem.
                }
            },
        },
    });
}
