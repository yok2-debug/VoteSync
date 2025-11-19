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

type ResetSystemDialogProps = {
  action: string;
  title: string;
  description: string;
};

const CONFIRMATION_TEXT = 'RESET';

export function ResetSystemDialog({ action, title, description }: ResetSystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setIsSubmitting(true);
    // Placeholder for actual server action call
    try {
      // await performResetAction(action);
      console.log(`Performing reset action: ${action}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
