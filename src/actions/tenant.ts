"use server";

import { createServerActionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type RegistrationState = {
  success?: boolean;
  error?: string;
} | null;

export async function requestBusinessRegistration(
  prevState: RegistrationState, 
  formData: FormData
): Promise<RegistrationState> {
  const supabase = createServerActionClient();

  const businessName = formData.get('businessName') as string;
  const email = formData.get('email') as string;
  const contactPhone = formData.get('contactPhone') as string | null;

  if (!businessName || !email) {
    return { error: "Por favor, completa todos los campos requeridos." };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Por favor, introduce un email válido." };
  }

  // Verificar si ya existe una solicitud con este email
  const { data: existingRequest } = await supabase
    .from('business_registration_requests')
    .select('id, status')
    .eq('email', email)
    .single();

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return { error: "Ya existe una solicitud pendiente para este email." };
    }
    if (existingRequest.status === 'approved') {
      return { error: "Este email ya ha sido registrado y aprobado." };
    }
  }

  const { error } = await supabase
    .from('business_registration_requests')
    .insert({
      business_name: businessName,
      email: email,
      contact_phone: contactPhone || null,
      status: 'pending',
    });

  if (error) {
    console.error("Error creating registration request:", error);
    return { error: "Hubo un problema al enviar tu solicitud. Por favor, inténtalo de nuevo." };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function approveRegistrationRequest(requestId: string) {
  const supabaseAdmin = createAdminClient();

  // 1. Get the request details
  const { data: request, error: requestError } = await supabaseAdmin
    .from('business_registration_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    console.error("Error fetching request:", requestError);
    return { error: "Could not find the registration request." };
  }

  if (request.status !== 'pending') {
    return { error: "This request has already been processed." };
  }
  
  // For now, we will fetch a default 'basic' plan.
  // In the future, this could come from the request itself.
  const { data: defaultPlan, error: planError } = await supabaseAdmin
    .from('subscription_plans')
    .select('id')
    .eq('slug', 'basic')
    .single();
  
  if (planError || !defaultPlan) {
    console.error("Error fetching default plan:", planError);
    return { error: "Could not find a default subscription plan." };
  }

  try {
    // 2. Create the new tenant
    const slug = request.business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: request.business_name,
        slug: slug,
        plan_id: defaultPlan.id,
        status: 'trial',
        owner_email: request.email,
        country: 'US', // Placeholder
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 3. Create the new user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      email_confirm: true, // Auto-confirm email for approved users
      user_metadata: {
        full_name: `Owner of ${request.business_name}`,
      }
    });

    if (authError) throw authError;

    // 4. Create the corresponding user in our tnt_users table
    const { error: userError } = await supabaseAdmin
      .from('tnt_users')
      .insert({
        tenant_id: newTenant.id,
        supabase_user_id: authUser.user.id,
        email: request.email,
        first_name: 'Owner', // Placeholder
        last_name: request.business_name, // Placeholder
        role: 'owner',
        is_service_provider: false
      });

    if (userError) throw userError;

    // 5. Update the request status to 'approved'
    const { error: updateError } = await supabaseAdmin
      .from('business_registration_requests')
      .update({ status: 'approved', processed_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) throw updateError;
    
    // TODO: Send a "Welcome" email to the new user with a password reset link.
    // const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(request.email);
    
  } catch (error: any) {
    console.error("Error during approval process:", error);
    // Here you might want to add logic to rollback previous steps if possible
    return { error: `An error occurred: ${error.message}` };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function rejectRegistrationRequest(requestId: string) {
  const supabase = createServerActionClient();
  
  const { error } = await supabase
    .from('business_registration_requests')
    .update({ status: 'rejected', processed_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    console.error("Error rejecting request:", error);
    return { error: "Could not reject the request." };
  }
  
  revalidatePath('/admin/dashboard');
  return { success: true };
}