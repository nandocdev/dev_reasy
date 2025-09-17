import { createServerActionClient as createServerActionClientOriginal } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This is a server-only file. It is used to create a Supabase client that
// can be used in Server Components, Server Actions, and Route Handlers.
export const createServerActionClient = () => {
    const cookieStore = cookies();
    return createServerActionClientOriginal({ cookies: () => cookieStore });
};
