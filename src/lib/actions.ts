import { ref, update, remove, get, child } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function performResetAction(action: string) {
    const dbRef = ref(db);
    switch (action) {
      case 'reset_voter_status':
        const votersSnapshot = await get(child(dbRef, 'voters'));
        if (votersSnapshot.exists()) {
          const updates: { [key: string]: null } = {};
          votersSnapshot.forEach((voter) => {
            updates[`/voters/${voter.key}/hasVoted`] = null;
          });
          await update(dbRef, updates);
        }
        break;
      case 'reset_election_results':
        const electionsSnapshot = await get(child(dbRef, 'elections'));
        if (electionsSnapshot.exists()) {
          const updates: { [key: string]: null } = {};
          electionsSnapshot.forEach((election) => {
            updates[`/elections/${election.key}/votes`] = null;
            updates[`/elections/${election.key}/results`] = null;
          });
          await update(dbRef, updates);
        }
        break;
      case 'delete_all_voters':
        await remove(child(dbRef, 'voters'));
        break;
      case 'reset_all_elections':
        await remove(child(dbRef, 'elections'));
        break;
      default:
        throw new Error('Invalid reset action');
    }
  }
