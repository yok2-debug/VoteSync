import { getElections } from '@/lib/data';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Voter } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Vote as VoteIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function VoterDashboardPage() {
  const session = await getSession();
  if (!session?.voterId) {
    redirect('/');
  }

  const [elections, voterSnapshot] = await Promise.all([
    getElections(),
    get(ref(db, `voters/${session.voterId}`)),
  ]);

  const voter: Voter | null = voterSnapshot.exists() ? voterSnapshot.val() : null;

  const ongoingElections = elections.filter(e => e.status === 'ongoing');

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Voter Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {voter?.name || 'Voter'}! Please cast your vote.</p>
        </div>

        {ongoingElections.length > 0 ? (
          <div className="space-y-4">
            {ongoingElections.map(election => {
              const hasVoted = voter?.hasVoted?.[election.id] === true;
              return (
                <Card key={election.id}>
                  <CardHeader>
                    <CardTitle>{election.name}</CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasVoted ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">You have already voted in this election.</span>
                      </div>
                    ) : (
                      <Link href={`/vote/${election.id}`}>
                        <Button className="w-full">
                          <VoteIcon className="mr-2 h-4 w-4" />
                          Go to Voting Page
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">There are no ongoing elections at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
