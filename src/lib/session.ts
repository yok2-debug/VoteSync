'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload } from './types';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createAdminSession(payload: Omit<AdminSessionPayload, 'expires'>) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = { ...payload, expires: expires.getTime() };
  
  // 1. Await cookies() untuk mendapatkan objek cookie yang bisa dimodifikasi
  const cookieStore = await cookies();

  // 2. Gunakan cookieStore yang sudah di-await untuk mengatur cookie
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    path: '/',
    sameSite: 'lax',
  });
}

export async function deleteAdminSession() {
  // 1. Await cookies() di sini juga
  const cookieStore = await cookies();
  
  // 2. Hapus cookie
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function logoutAdmin() {
  // 1. Await cookies() di sini juga
  const cookieStore = await cookies();

  // 2. Hapus cookie
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  
  // 3. Redirect setelah cookie dihapus
  redirect('/admin-login');
}
