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
import { useRouter } from 'next/navigation';
import type { Candidate } from '@/lib/types';
import { useState } from 'react';
import { saveVote } from '@/lib/actions';

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
    try {
      await saveVote(electionId, candidate.id, voterId);
      
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
