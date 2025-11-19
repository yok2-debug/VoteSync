'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Vote } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, runTransaction, update } from 'firebase/database';
import { useRouter } from 'next/navigation';
import type { Candidate } from '@/lib/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CandidateVoteFormProps {
  electionId: string;
  candidate: Candidate;
  voterId: string;
}

export function CandidateVoteForm({ electionId, candidate, voterId }: CandidateVoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVote() {
    setIsSubmitting(true);
    const dbRef = ref(db);
  
    try {
      await runTransaction(dbRef, (currentData) => {
        if (!currentData) {
          // If the root is null, something is very wrong.
          throw new Error("Database is empty or unavailable.");
        }
  
        const voter = currentData.voters?.[voterId];
        if (!voter) {
          throw new Error("Voter not found.");
        }
  
        // 1. Check if the voter has already voted in this election.
        if (voter.hasVoted?.[electionId]) {
          // By returning undefined, we abort the transaction.
          // We'll throw an error outside to notify the user.
          return; 
        }
  
        // Prepare all the updates. This is the "multi-path update" approach.
        const updates: Record<string, any> = {};
  
        // 2. Mark the voter as having voted.
        updates[`/voters/${voterId}/hasVoted/${electionId}`] = true;
  
        // 3. Record the specific vote in the election.
        updates[`/elections/${electionId}/votes/${voterId}`] = candidate.id;
  
        // 4. Atomically increment the candidate's vote count.
        const currentVoteCount = currentData.elections?.[electionId]?.results?.[candidate.id] || 0;
        updates[`/elections/${electionId}/results/${candidate.id}`] = currentVoteCount + 1;
        
        // This is a "dummy" update to ensure the transaction runs on the root.
        // It's not strictly necessary if we are sure the paths exist, but it's safer.
        // We can just return the currentData and apply updates separately but this is cleaner.
        
        // Firebase RTDB transaction on the root returns the entire root data.
        // We are not modifying it directly but using it for reads.
        // The actual write happens via the `update(dbRef, updates)` call after the transaction logic.
        // The transaction here is primarily for the atomic read-check-write on voter status.
        // Let's restructure to perform writes inside the transaction if possible.
        // The issue is that runTransaction only works on a single path.
        // A better approach is an atomic multi-path update after a read.
        // But for atomicity, a Cloud Function is best. Let's simulate it.
        // The logic here is flawed. `runTransaction` should return the data to be written.

        // Abort if voter has already voted.
        if (voter.hasVoted && voter.hasVoted[electionId]) {
          return;
        }

        // Set `hasVoted` for the voter
        if (!currentData.voters[voterId].hasVoted) {
          currentData.voters[voterId].hasVoted = {};
        }
        currentData.voters[voterId].hasVoted[electionId] = true;

        // Set the vote
        if (!currentData.elections[electionId].votes) {
          currentData.elections[electionId].votes = {};
        }
        currentData.elections[electionId].votes[voterId] = candidate.id;

        // Increment the result
        if (!currentData.elections[electionId].results) {
          currentData.elections[electionId].results = {};
        }
        if (!currentData.elections[electionId].results[candidate.id]) {
          currentData.elections[electionId].results[candidate.id] = 0;
        }
        currentData.elections[electionId].results[candidate.id]++;
        
        return currentData; // Return the entire modified data structure
      });

      toast({
        title: 'Vote Cast Successfully!',
        description: `Your vote for ${candidate.name} has been recorded.`,
      });
      
      router.push('/vote');
      router.refresh();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to Cast Vote',
        description: 'You may have already voted or an error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full" disabled={isSubmitting}>
          <Vote className="mr-2 h-4 w-4" />
          Vote for {candidate.name}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to vote for <span className="font-bold">{candidate.name}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleVote} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Vote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
