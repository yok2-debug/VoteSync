import { getVoterById, getVoters } from '@/lib/data';
import type { Voter } from '@/lib/types';
import { VoterCard } from './components/voter-card';

type PrintCardsPageProps = {
  searchParams: {
    voterIds?: string;
  };
};

export default async function PrintCardsPage({ searchParams }: PrintCardsPageProps) {
  const { voterIds } = searchParams;
  let voters: Voter[] = [];

  if (voterIds) {
    const ids = voterIds.split(',');
    const voterPromises = ids.map(id => getVoterById(id));
    voters = (await Promise.all(voterPromises)).filter((v): v is Voter => v !== null);
  } else {
    voters = await getVoters();
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="p-4 bg-gray-100 min-h-screen">
        <div className="grid grid-cols-2 gap-4">
          {voters.map(voter => (
            <VoterCard key={voter.id} voter={voter} />
          ))}
        </div>
      </div>
    </>
  );
}
