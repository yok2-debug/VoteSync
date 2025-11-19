'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CandidateVoteForm } from './components/candidate-vote-form';
import { VoterLogoutButton } from '../components/voter-logout-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useDatabase } from '@/context/database-context';
import { getVoterSession } from '@/lib/session';
import { useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import Loading from '@/app/loading';
import type { VoterSessionPayload } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function VotePage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, voters, categories, isLoading } = useDatabase();
  const [session, setSession] = useState<VoterSessionPayload | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const voterSession = await getVoterSession();
      setSession(voterSession);
      setIsSessionLoading(false);
    }
    fetchSession();
  }, []);
  
  if (isLoading || isSessionLoading) {
    return <Loading />;
  }

  if (!session?.voterId) {
    redirect('/');
  }
  
  const election = elections.find(e => e.id === electionId);
  const voter = voters.find(v => v.id === session.voterId);

  const now = new Date();
  const electionStarted = election?.startDate ? new Date(election.startDate) <= now : false;
  const electionEnded = election?.endDate ? new Date(election.endDate) < now : false;

  if (!election || election.status !== 'active' || !voter || !electionStarted || electionEnded) {
    redirect('/vote');
  }

  const category = categories.find(c => c.id === voter.category);

  // Check if voter category is allowed
  if (!category?.allowedElections?.includes(election.id)) {
    redirect('/vote');
  }
  
  // Check if voter has already voted
  if (voter.hasVoted?.[election.id]) {
    redirect('/vote');
  }

  const candidates = election.candidates ? Object.values(election.candidates) : [];
  const defaultPhoto = PlaceHolderImages.find(p => p.id === 'default-avatar');
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex w-full items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/vote">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <VoterLogoutButton />
        </header>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{election.name}</h1>
          <p className="text-muted-foreground">Pilih kandidat pilihan Anda di bawah ini.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map(candidate => (
            <Card key={candidate.id} className="flex flex-col">
              <CardHeader className="items-center">
                 <Image
                    src={candidate.photo || defaultPhoto?.imageUrl || 'https://picsum.photos/seed/default/400/400'}
                    alt={`Photo of ${candidate.name}`}
                    width={150}
                    height={150}
                    className="rounded-full border-4 border-primary object-cover"
                    data-ai-hint={defaultPhoto?.imageHint || 'person portrait'}
                  />
                <CardTitle className="pt-4">{candidate.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center">
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary">
                        <FileText className="mr-2 h-4 w-4" />
                        Lihat Visi & Misi
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{candidate.name}</DialogTitle>
                        <DialogDescription>
                          Visi dan Misi Kandidat
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Visi</h3>
                           <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: candidate.vision || 'Tidak ada visi yang diberikan.' }}
                            />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mt-4 mb-2">Misi</h3>
                           <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: candidate.mission || 'Tidak ada misi yang diberikan.' }}
                            />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
              </CardContent>
              <div className="p-6 pt-0">
                <CandidateVoteForm electionId={election.id} candidate={candidate} voterId={session.voterId!} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
