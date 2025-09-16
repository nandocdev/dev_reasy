"use server";

import { createServerActionClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
    const supabase = createServerActionClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: "Could not authenticate user. Please check your credentials." };
    }
    
    // Aquí deberíamos verificar si el usuario tiene rol de 'platform_admin'
    // antes de redirigir. Por ahora, asumimos que sí.

    revalidatePath('/', 'layout');
    return redirect('/admin/dashboard');
}

export async function logout() {
    const supabase = createServerActionClient();
    await supabase.auth.signOut();
    return redirect('/admin/login');
}
