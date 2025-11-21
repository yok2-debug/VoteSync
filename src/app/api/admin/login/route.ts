
import { NextResponse } from 'next/server';
import { getAdminCredentials } from '@/lib/data';
import { createAdminSession } from '@/lib/session';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedCredentials = loginSchema.safeParse(body);

    if (!parsedCredentials.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { username, password } = parsedCredentials.data;

    const adminCreds = await getAdminCredentials();

    if (adminCreds && adminCreds.username === username && adminCreds.password === password) {
      const sessionPayload = { isAdmin: true, username: username };
      
      const response = NextResponse.json({ success: true });
      await createAdminSession(sessionPayload);
      
      return response;

    } else {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
