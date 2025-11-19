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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Vote, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, runTransaction } from 'firebase/database';
import { useRouter } from 'next/navigation';
import type { Candidate } from '@/lib/types';
import { useState } from 'react';

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
    const electionRef = ref(db, `elections/${electionId}`);
    const voterRef = ref(db, `voters/${voterId}`);

    try {
      // Transaction on election data
      await runTransaction(electionRef, (election) => {
        if (election) {
          // Initialize paths if they don't exist
          if (!election.votes) election.votes = {};
          if (!election.results) election.results = {};

          // Check if the voter has already voted in this specific election's data
          if (election.votes[voterId]) {
            // Abort transaction if vote already exists in this election's record
            return; 
          }

          // Record the vote
          election.votes[voterId] = candidate.id;
          
          // Increment result for the candidate
          if (!election.results[candidate.id]) {
            election.results[candidate.id] = 0;
          }
          election.results[candidate.id]++;
        }
        return election;
      });

      // Separate transaction for the main voter object
      await runTransaction(voterRef, (voter) => {
        if (voter) {
            if (!voter.hasVoted) {
                voter.hasVoted = {};
            }
            // Mark the voter as having voted for this election
            voter.hasVoted[electionId] = true;
        }
        return voter;
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
        description: error instanceof Error ? error.message : 'You may have already voted or an error occurred.',
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
