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
import { db } from '@/lib/firebase';
import { ref, runTransaction } from 'firebase/database';

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
      const electionTransaction = await runTransaction(electionRef, (election) => {
        if (election) {
          if (!election.votes) election.votes = {};
          if (election.votes[voterId]) {
            // Abort transaction if voter already voted in this election
            return; 
          }
          election.votes[voterId] = candidate.id;
          if (!election.results) election.results = {};
          if (!election.results[candidate.id]) {
            election.results[candidate.id] = 0;
          }
          election.results[candidate.id]++;
        }
        return election;
      });

      if (!electionTransaction.committed) {
        throw new Error('Anda sudah memberikan suara dalam pemilihan ini.');
      }

      // Transaction on voter data
      await runTransaction(voterRef, (voter) => {
        if (voter) {
          if (!voter.hasVoted) {
            voter.hasVoted = {};
          }
          voter.hasVoted[electionId] = true;
        }
        return voter;
      });
      
      toast({
        title: 'Suara Berhasil Dicatat!',
        description: `Suara Anda untuk ${candidate.name} telah direkam.`,
      });
      
      router.replace('/vote');

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memberikan Suara',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan atau Anda mungkin sudah memilih.',
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
          Pilih
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Pilihan Anda</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin memilih <span className="font-bold">{candidate.name}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleVote} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Konfirmasi Pilihan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
