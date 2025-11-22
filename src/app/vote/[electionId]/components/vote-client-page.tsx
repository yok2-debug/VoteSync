'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CandidateVoteForm } from './candidate-vote-form';
import { VoterLogoutButton } from '../../components/voter-logout-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useDatabase } from '@/context/database-context';
import { getVoterSession } from '@/lib/session-client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import type { Voter, VoterSessionPayload, Election, Category, Candidate } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function VoteClientPage() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, voters, isLoading: isDbLoading } = useDatabase();
  const [session, setSession] = useState<VoterSessionPayload | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const voterSession = getVoterSession();
    if (!voterSession?.voterId) {
      router.replace('/');
      return;
    }
    setSession(voterSession);
    setIsSessionLoading(false);
  }, [router]);

  const election = useMemo(() => {
    if (isDbLoading) return undefined;
    return elections.find(e => e.id === electionId);
  }, [elections, electionId, isDbLoading]);
  
  const voter = useMemo(() => {
    if (!session?.voterId || isDbLoading) return undefined;
    return voters.find(v => v.id === session.voterId);
  }, [voters, session, isDbLoading]);

  useEffect(() => {
    if (isDbLoading || isSessionLoading) {
      return; // Wait for all data to be loaded
    }
    
    // Stricter check: ensure election and voter are loaded before validation
    if (!election || !voter) {
       if (!isDbLoading && !isSessionLoading) {
         // If DB is not loading and we still can't find them, redirect.
         router.replace('/vote');
       }
       return;
    }

    const now = new Date();
    const electionStarted = election.startDate ? new Date(election.startDate) <= now : true;
    const electionEnded = election.endDate ? new Date(election.endDate) < now : false;
    const hasVoted = voter.hasVoted?.[electionId];

    if (
      election.status !== 'active' || 
      !electionStarted || 
      electionEnded || 
      hasVoted
    ) {
      router.replace('/vote');
      return;
    }

    setIsValid(true);

  }, [isDbLoading, isSessionLoading, election, voter, electionId, router]);


  if (!isValid || !election || !voter) {
    return <Loading />; 
  }
  
  const candidates = Object.values(election.candidates || {}).sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999));
  const defaultAvatar = PlaceHolderImages.find(p => p.id === 'default-avatar');
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-8">
      <div className="w-full max-w-7xl space-y-8">
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
        <div className="flex flex-wrap justify-center gap-6">
            {candidates.map(candidate => (
                <Card key={candidate.id} className="flex flex-col w-full max-w-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-col items-center p-6 bg-card/80">
                    <div className="relative">
                       <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold border-4 border-background">
                        {candidate.orderNumber}
                       </span>
                       <Dialog>
                          <DialogTrigger asChild>
                            <img
                              src={candidate.photo || defaultAvatar?.imageUrl || 'https://picsum.photos/seed/default/400/400'}
                              alt={`Photo of ${candidate.name}`}
                              width={160}
                              height={160}
                              className="rounded-full border-4 border-primary object-cover cursor-pointer hover:opacity-90 transition-opacity h-40 w-40"
                            />
                          </DialogTrigger>
                          <DialogContent className="max-w-xl p-2 border-0 bg-transparent shadow-none">
                            <DialogHeader>
                              <DialogTitle className="sr-only">
                                Foto {candidate.name} diperbesar
                              </DialogTitle>
                            </DialogHeader>
                            <DialogClose asChild>
                              <img
                                  src={candidate.photo || defaultAvatar?.imageUrl || 'https://picsum.photos/seed/default/400/400'}
                                  alt={`Photo of ${candidate.name}`}
                                  className="w-full h-auto rounded-md cursor-pointer"
                              />
                            </DialogClose>
                          </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col items-center p-4 text-center">
                      <h3 className="text-xl font-bold">
                        {candidate.name}
                        {candidate.viceCandidateName && ` & ${candidate.viceCandidateName}`}
                      </h3>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/50 grid grid-cols-2 gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            Visi Misi
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                              {candidate.name}
                              {candidate.viceCandidateName && ` & ${candidate.viceCandidateName}`}
                            </DialogTitle>
                            <DialogDescription>
                            Visi dan Misi Kandidat
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                            <article className="prose dark:prose-invert max-w-none">
                            <h3 className="font-semibold text-lg mb-2">Visi</h3>
                            <ReactMarkdown>{candidate.vision || 'Tidak ada visi yang diberikan.'}</ReactMarkdown>
                            <h3 className="font-semibold text-lg mt-4 mb-2">Misi</h3>
                            <ReactMarkdown>{candidate.mission || 'Tidak ada misi yang diberikan.'}</ReactMarkdown>
                            </article>
                        </div>
                        </DialogContent>
                    </Dialog>
                    <CandidateVoteForm electionId={election.id} candidate={candidate} voterId={voter.id} />
                  </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </main>
  );
}
