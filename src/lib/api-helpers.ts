import { adminDb } from '@/lib/firebase-admin';

export async function checkUsernameExists(username: string, userIdToExclude?: string): Promise<boolean> {
    const usersSnapshot = await adminDb.ref('users').get();
    if (!usersSnapshot.exists()) return false;

    const users = usersSnapshot.val();
    for (const id in users) {
        if (id !== userIdToExclude && users[id].username === username) {
            return true;
        }
    }
    return false;
}
