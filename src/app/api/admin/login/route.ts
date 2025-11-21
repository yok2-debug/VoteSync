
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
      // createAdminSession will set the cookie on the response
      await createAdminSession(sessionPayload);
      
      // We need to construct a new response to which the cookie can be attached.
      const response = NextResponse.json({ success: true });
      // The cookie is actually set in the createAdminSession function via the cookies() helper.
      // Next.js automatically handles passing this to the final response.
      return response;

    } else {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
