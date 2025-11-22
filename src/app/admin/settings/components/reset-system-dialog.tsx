
'use client';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ref, update, remove, get, child } from 'firebase/database';
import { db } from '@/lib/firebase';

type ResetSystemDialogProps = {
  action: string;
  title: string;
  description: string;
};

const CONFIRMATION_TEXT = 'RESET';

async function performResetAction(action: string) {
    const dbRef = ref(db);
    
    const resetVotesAndStatus = async () => {
        // Reset election results first
        const electionsSnapshotResults = await get(child(dbRef, 'elections'));
        if (electionsSnapshotResults.exists()) {
          const electionUpdates: { [key: string]: null } = {};
          electionsSnapshotResults.forEach((election) => {
            electionUpdates[`/elections/${election.key}/votes`] = null;
            electionUpdates[`/elections/${election.key}/results`] = null;
          });
          if (Object.keys(electionUpdates).length > 0) {
            await update(dbRef, electionUpdates);
          }
        }
        
        // Then reset voter status
        const votersSnapshot = await get(child(dbRef, 'voters'));
        if (votersSnapshot.exists()) {
          const voterUpdates: { [key: string]: any } = {};
          const votersData = votersSnapshot.val();
          if (Array.isArray(votersData)) {
            votersData.forEach((voter, index) => {
              if (voter && voter.id) {
                voterUpdates[`/voters/${voter.id}/hasVoted`] = null;
              }
            });
          } else {
             Object.keys(votersData).forEach(key => {
                voterUpdates[`/voters/${key}/hasVoted`] = null;
             });
          }
          if (Object.keys(voterUpdates).length > 0) {
            await update(dbRef, voterUpdates);
          }
        }
    };

    switch (action) {
      case 'reset_votes_and_status':
        await resetVotesAndStatus();
        break;
      case 'delete_all_voters':
        await remove(child(dbRef, 'voters'));
        break;
      case 'reset_all_elections':
        // 1. Clean up category references first
        const categoriesSnapshot = await get(child(dbRef, 'categories'));
        if (categoriesSnapshot.exists()) {
            const updates: { [key: string]: null } = {};
            categoriesSnapshot.forEach(category => {
                updates[`/categories/${category.key}/allowedElections`] = null;
            });
            await update(dbRef, updates);
        }
        // 2. Then, delete all elections
        await remove(child(dbRef, 'elections'));
        break;
      default:
        throw new Error('Invalid reset action');
    }
  }

export function ResetSystemDialog({ action, title, description }: ResetSystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setIsSubmitting(true);
    try {
      await performResetAction(action);
      toast({
        title: 'Action Successful',
        description: `${title} has been completed.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
      setConfirmationInput('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Perform Action</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently {description.toLowerCase().replace('permanently ', '')}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
            <Label htmlFor="confirmation">To confirm, please type "<span className="font-bold text-destructive">{CONFIRMATION_TEXT}</span>" below.</Label>
            <Input 
                id="confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                autoComplete="off"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmationInput('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={confirmationInput !== CONFIRMATION_TEXT || isSubmitting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I understand, proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
