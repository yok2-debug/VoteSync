'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload } from './types';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createAdminSession(payload: Omit<AdminSessionPayload, 'expires'>) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = { ...payload, expires: expires.getTime() };
  
  // 1. Tambahkan `await` di sini
  const cookieStore = await cookies();

  // 2. Sekarang Anda bisa menggunakan .set()
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    path: '/',
    sameSite: 'lax',
  });
}

export async function deleteAdminSessionCookie() {
  // 1. Tambahkan `await` di sini juga
  const cookieStore = await cookies();
  
  // 2. Sekarang Anda bisa menggunakan .delete()
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function logoutAdmin() {
  await deleteAdminSessionCookie();
  // Redirect akan ditangani di sisi klien (client-side)
  // Jika Anda ingin redirect dari server, Anda bisa tambahkan baris ini kembali:
  // redirect('/admin-login');
}
