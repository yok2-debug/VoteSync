import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { AdminSessionPayload, Permission } from '@/lib/types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';

async function getSessionFromCookie(): Promise<AdminSessionPayload | null> {
  // Tambahkan await di sini
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  
  if (!sessionCookie) {
    return null;
  }
  try {
    const parsed = JSON.parse(sessionCookie);
    if (parsed.expires && parsed.expires < Date.now()) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

export class AuthError extends Error {
  constructor(message = 'Akses ditolak. Anda tidak memiliki izin.') {
    super(message);
    this.name = 'AuthError';
  }
}

export async function verifyAdminSession(requiredPermission: Permission): Promise<AdminSessionPayload> {
    const session = await getSessionFromCookie();

    if (!session) {
        throw new AuthError('Sesi tidak valid atau telah kedaluwarsa.');
    }

    if (!session.permissions || !session.permissions.includes(requiredPermission)) {
        throw new AuthError(`Akses ditolak. Izin '${requiredPermission}' diperlukan.`);
    }

    return session;
}

export function handleApiError(error: unknown): NextResponse {
    if (error instanceof AuthError) {
        return NextResponse.json({ message: error.message }, { status: 403 }); // 403 Forbidden
    }
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json({ message: 'Terjadi kesalahan pada server', error: errorMessage }, { status: 500 });
}
