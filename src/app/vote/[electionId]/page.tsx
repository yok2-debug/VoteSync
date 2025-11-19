import { getElectionById, getVoterById, getCategoryById } from '@/lib/data';
import { getVoterSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CandidateVoteForm } from './components/candidate-vote-form';


type VotePageProps = {
  params: {
    electionId: string;
  };
};

export default async function VotePage({ params }: VotePageProps) {
  const session = await getVoterSession();
  if (!session?.voterId) {
    redirect('/');
  }

  const [election, voter] = await Promise.all([
    getElectionById(params.electionId),
    getVoterById(session.voterId)
  ]);
  
  const now = new Date();
  const electionStarted = election?.startDate ? new Date(election.startDate) <= now : true;
  const electionEnded = election?.endDate ? new Date(election.endDate) < now : false;


  if (!election || election.status !== 'ongoing' || !voter || !electionStarted || electionEnded) {
    redirect('/vote');
  }

  const category = await getCategoryById(voter.category);

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
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{election.name}</h1>
          <p className="text-muted-foreground">Select your chosen candidate below.</p>
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
              <CardContent className="flex-grow space-y-4">
                <div>
                  <h3 className="font-semibold">Vision</h3>
                  <p className="text-sm text-muted-foreground">{candidate.vision || 'No vision provided.'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Mission</h3>
                  <p className="text-sm text-muted-foreground">{candidate.mission || 'No mission provided.'}</p>
                </div>
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
