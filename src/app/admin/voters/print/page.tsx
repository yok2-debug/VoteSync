'use client';
import { getVoterById, getVoters } from '@/lib/data';
import type { Voter } from '@/lib/types';
import { VoterCard } from './components/voter-card';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from '@/app/loading';

export default function PrintCardsPage() {
  const searchParams = useSearchParams();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVoters() {
      const voterIds = searchParams.get('voterIds');
      let fetchedVoters: Voter[] = [];

      if (voterIds) {
        const ids = voterIds.split(',');
        const voterPromises = ids.map(id => getVoterById(id));
        fetchedVoters = (await Promise.all(voterPromises)).filter((v): v is Voter => v !== null);
      } else {
        fetchedVoters = await getVoters();
      }
      setVoters(fetchedVoters);
      setIsLoading(false);
    }

    fetchVoters();
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && voters.length > 0) {
      window.print();
    }
  }, [isLoading, voters]);

  if (isLoading) {
    return <Loading />;
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
