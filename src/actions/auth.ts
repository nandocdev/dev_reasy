"use server";

import { createServerActionClient } from "@/lib/supabase/server";
import { isCurrentUserPlatformAdmin } from "@/lib/auth/platform";
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

    // Verificar si el usuario tiene rol de administrador de plataforma
    const isAdmin = await isCurrentUserPlatformAdmin();
    if (!isAdmin) {
        // Si no es admin, cerrar sesión y mostrar error
        await supabase.auth.signOut();
        return { error: "Access denied. You must be a platform administrator to access this portal." };
    }

    revalidatePath('/', 'layout');
    return redirect('/admin/dashboard');
}

export async function logout() {
    const supabase = createServerActionClient();
    await supabase.auth.signOut();
    return redirect('/admin/login');
}
