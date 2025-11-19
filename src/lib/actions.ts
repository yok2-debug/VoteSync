'use server';

import { getAdminCredentials, getVoterById } from '@/lib/data';
import { createSession, deleteSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as z from 'zod';

const voterLoginSchema = z.object({
  voterId: z.string(),
  password: z.string(),
});

const adminLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type LoginResult = {
  success: boolean;
  error?: string;
  redirectPath?: string;
};

export async function login(
  values: z.infer<typeof voterLoginSchema> | z.infer<typeof adminLoginSchema>,
  role: 'voter' | 'admin'
): Promise<LoginResult> {
  if (role === 'admin') {
    const parsedValues = adminLoginSchema.safeParse(values);
    if (!parsedValues.success) {
      return { success: false, error: 'Invalid input.' };
    }

    const adminCreds = await getAdminCredentials();
    if (
      adminCreds &&
      adminCreds.username === parsedValues.data.username &&
      adminCreds.password === parsedValues.data.password
    ) {
      await createSession({ isAdmin: true });
      return { success: true, redirectPath: '/admin/dashboard' };
    } else {
      return { success: false, error: 'Invalid admin credentials.' };
    }
  }

  if (role === 'voter') {
    const parsedValues = voterLoginSchema.safeParse(values);
    if (!parsedValues.success) {
      return { success: false, error: 'Invalid input.' };
    }

    const voter = await getVoterById(parsedValues.data.voterId);
    if (voter && voter.password === parsedValues.data.password) {
      await createSession({ voterId: voter.id });
      return { success: true, redirectPath: '/vote' };
    } else {
      return { success: false, error: 'Invalid voter ID or password.' };
    }
  }

  return { success: false, error: 'Invalid role.' };
}

export async function logout() {
  await deleteSession();
  revalidatePath('/');
  redirect('/');
}
