import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export async function requireUser() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?notice=configuration-required');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('AUTH GET USER ERROR:', error);
  }

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?notice=configuration-required');
  }

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id,user_id,role_id,is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('ADMIN LOOKUP ERROR:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      userId: user.id,
      email: user.email,
    });

    redirect('/account?error=admin-query-failed');
  }

  if (!admin) {
    console.error('ADMIN NOT FOUND:', {
      userId: user.id,
      email: user.email,
    });

    redirect('/account?error=unauthorized');
  }

  return {
    user,
    admin,
  };
}