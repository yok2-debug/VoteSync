'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Vote as VoteIcon, Lock, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { VoterLogoutButton } from './components/voter-logout-button';
import { useDatabase } from '@/context/database-context';
import { getVoterSession } from '@/lib/session';
import { useEffect, useState } from 'react';
import Loading from '../loading';
import type { VoterSessionPayload } from '@/lib/types';

export default function VoterDashboardPage() {
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

  const voter = voters.find(v => v.id === session.voterId);

  if (!voter) {
    // This might happen if the voter is deleted while logged in.
    redirect('/');
  }
  
  const category = categories.find(c => c.id === voter.category);

  // 1. Filter for active elections
  // 2. Filter for elections allowed for the voter's category
  const availableElections = elections.filter(e => {
    const isActive = e.status === 'active';
    const isAllowed = category?.allowedElections?.includes(e.id);
    return isActive && isAllowed;
  });

  const now = new Date();

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Voter Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {voter?.name || 'Voter'}! Please cast your vote.</p>
            </div>
            <VoterLogoutButton />
        </div>

        {availableElections.length > 0 ? (
          <div className="space-y-4">
            {availableElections.map(election => {
              const hasVoted = voter?.hasVoted?.[election.id] === true;
              const electionStarted = election.startDate ? new Date(election.startDate) <= now : false;
              const electionEnded = election.endDate ? new Date(election.endDate) < now : false;

              let content;

              if (hasVoted) {
                 content = (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">You have already voted in this election.</span>
                  </div>
                );
              } else if (electionEnded) {
                content = (
                  <div className="flex items-center gap-2 text-red-600">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">This election has ended.</span>
                  </div>
                );
              } else if (!electionStarted) {
                  content = (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">This election has not started yet.</span>
                    </div>
                  );
              } else {
                 content = (
                  <Link href={`/vote/${election.id}`}>
                    <Button className="w-full">
                      <VoteIcon className="mr-2 h-4 w-4" />
                      Go to Voting Page
                    </Button>
                  </Link>
                );
              }

              return (
                <Card key={election.id}>
                  <CardHeader>
                    <CardTitle>{election.name}</CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {content}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">There are no active elections available for your category at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
