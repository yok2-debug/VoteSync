'use server';

import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import type { AdminUser, Role, Permission } from '@/lib/types';
import { get, ref, update, set, push } from 'firebase/database';


export async function initializeDefaultAdmin(): Promise<void> {
  const rolesRef = adminDb.ref('roles');
  const usersRef = adminDb.ref('users');

  let superAdminRoleId: string | null = null;

  try {
    // 1. Check for Super Admin role, and get its ID.
    const rolesSnapshot = await rolesRef.once('value');
    if (rolesSnapshot.exists()) {
      const roles = rolesSnapshot.val();
      for (const id in roles) {
        if (roles[id].name === 'Super Admin') {
          superAdminRoleId = id;
          break;
        }
      }
    }

    // 2. If Super Admin role doesn't exist, create it.
    if (!superAdminRoleId) {
      const newRoleRef = rolesRef.push();
      const allPermissions: Permission[] = ['dashboard', 'elections', 'candidates', 'voters', 'categories', 'recapitulation', 'settings', 'users'];
      const superAdminRole: Omit<Role, 'id'> = {
        name: 'Super Admin',
        permissions: allPermissions
      };
      await newRoleRef.set(superAdminRole);
      superAdminRoleId = newRoleRef.key;
    }

    // 3. Check if 'admin' user exists.
    let adminUserExists = false;
    const usersSnapshot = await usersRef.once('value');
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      for (const id in users) {
        if (users[id].username === 'admin') {
          adminUserExists = true;
          break;
        }
      }
    }

    // 4. If 'admin' user doesn't exist, create it with the Super Admin role.
    if (!adminUserExists && superAdminRoleId) {
      const defaultAdmin: Omit<AdminUser, 'id'> = {
        username: 'admin',
        password: 'admin',
        roleId: superAdminRoleId
      };
      const newUserRef = usersRef.push();
      await newUserRef.set({ ...defaultAdmin, id: newUserRef.key });
    }
  } catch(error) {
    // Fail silently in production
  }
}


export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const usersSnapshot = await get(ref(db, 'users'));
    if (!usersSnapshot.exists()) {
      return []; // Return empty array if no users node
    }
    const usersData = usersSnapshot.val();
    return usersData ? Object.keys(usersData).map(id => ({ id, ...usersData[id] })) : [];
  } catch (error) {
    // In case of error, return empty.
    return [];
  }
}

export async function getRoles(): Promise<Role[]> {
    try {
        const snapshot = await get(ref(db, 'roles'));
        if (!snapshot.exists()) {
            return [];
        }
        const data = snapshot.val();
        return data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
    } catch (error) {
        return [];
    }
}
