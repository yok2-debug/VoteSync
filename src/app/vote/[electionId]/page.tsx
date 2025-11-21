'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateVoteForm } from './components/candidate-vote-form';
import { VoterLogoutButton } from '../components/voter-logout-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useDatabase } from '@/context/database-context';
import { getVoterSession } from '@/lib/session';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import type { Voter, VoterSessionPayload, Election, Category } from '@/lib/types';
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

function VotePageContent() {
  const { electionId } = useParams() as { electionId: string };
  const { elections, voters, categories, isLoading: isDbLoading } = useDatabase();
  const [session, setSession] = useState<VoterSessionPayload | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      const voterSession = await getVoterSession();
      if (!voterSession?.voterId) {
        router.push('/');
      } else {
        setSession(voterSession);
      }
      setIsSessionLoading(false);
    }
    fetchSession();
  }, [router]);

  const election = useMemo(() => elections.find(e => e.id === electionId), [elections, electionId]);
  const voter = useMemo(() => voters.find(v => v.id === session?.voterId), [voters, session]);
  const category = useMemo(() => categories.find(c => c.id === voter?.category), [categories, voter]);
  
  const candidates = useMemo(() => {
    if (!election?.candidates) return [];
    return Object.values(election.candidates).sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999));
  }, [election?.candidates]);

  const isLoading = isDbLoading || isSessionLoading;

  useEffect(() => {
    if (!isLoading && (!election || !voter)) {
        router.push('/vote');
    }
  }, [isLoading, election, voter, router]);

  if (isLoading || !session?.voterId || !election || !voter || !category) {
    return <Loading />; 
  }
  
  const now = new Date();
  const electionStarted = election?.startDate ? new Date(election.startDate) <= now : false;
  const electionEnded = election?.endDate ? new Date(election.endDate) < now : false;
  const isVoterAllowed = category?.allowedElections?.includes(electionId);
  const hasVoted = voter?.hasVoted?.[electionId];

  if (election.status !== 'active' || !electionStarted || electionEnded || !isVoterAllowed || hasVoted) {
     if (typeof window !== 'undefined') {
        router.push('/vote');
    }
    return <Loading />;
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
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
                <Card key={candidate.id} className="flex flex-col w-full max-w-xs sm:w-64">
                <CardHeader className="flex flex-col items-center p-0 pt-6">
                   <Dialog>
                      <DialogTrigger asChild>
                        <img
                          src={candidate.photo || 'https://picsum.photos/seed/default/400/400'}
                          alt={`Photo of ${candidate.name}`}
                          width={144}
                          height={144}
                          className="rounded-full border-4 border-primary object-cover cursor-pointer hover:opacity-90 transition-opacity h-36 w-36"
                        />
                      </DialogTrigger>
                      <DialogContent className="max-w-xl p-2 border-0 bg-transparent shadow-none">
                        <DialogClose asChild>
                          <img
                              src={candidate.photo || 'https://picsum.photos/seed/default/400/400'}
                              alt={`Photo of ${candidate.name}`}
                              className="w-full h-auto rounded-md cursor-pointer"
                          />
                        </DialogClose>
                      </DialogContent>
                   </Dialog>
                    <CardTitle className="pt-2 text-base flex flex-col items-center text-center">
                      <span>{candidate.name}</span>
                      {candidate.viceCandidateName && (
                        <>
                          <span className="text-base font-normal leading-none">&</span>
                          <span>{candidate.viceCandidateName}</span>
                        </>
                      )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center items-center p-0 pt-4">
                    <Dialog>
                        <DialogTrigger asChild>
                        <Button variant="secondary">
                            <FileText className="mr-2 h-4 w-4" />
                            Lihat Visi & Misi
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
                </CardContent>
                <div className="p-6 pt-2">
                    <CandidateVoteForm electionId={election.id} candidate={candidate} voterId={session.voterId!} />
                </div>
                </Card>
            ))}
        </div>
      </div>
    </main>
  );
}


export default function VotePage() {
  return <VotePageContent />;
}
