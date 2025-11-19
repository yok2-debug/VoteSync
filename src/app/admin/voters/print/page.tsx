
'use client';
import { getVoters } from '@/lib/data';
import type { Voter } from '@/lib/types';
import { VoterCard } from './components/voter-card';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from '@/app/loading';
import { DatabaseProvider } from '@/context/database-context';

export default function PrintCardsPage() {
  return (
    <DatabaseProvider>
      <PrintCardsPageContent />
    </DatabaseProvider>
  )
}

function PrintCardsPageContent() {
  const searchParams = useSearchParams();
  const [votersToPrint, setVotersToPrint] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAndFilterVoters() {
      const voterIdsParam = searchParams.get('voterIds');
      if (voterIdsParam) {
        const idsToPrint = new Set(voterIdsParam.split(','));
        // Fetch enriched voters directly
        const allEnrichedVoters = await getVoters();
        const filteredVoters = allEnrichedVoters.filter(v => idsToPrint.has(v.id));
        setVotersToPrint(filteredVoters);
      }
      setIsLoading(false);
    }
    
    fetchAndFilterVoters();
    
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && votersToPrint.length > 0) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, votersToPrint]);

  if (isLoading) {
    return <Loading />;
  }

  if (votersToPrint.length === 0) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <p className="text-muted-foreground">No voters found to print. Please check the selection.</p>
        </div>
      );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body, html {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
             background-color: #fff !important;
          }
          .no-print {
            display: none !important;
          }
           * {
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="p-4 min-h-screen print-container">
        <div className="grid grid-cols-4 gap-2">
          {votersToPrint.map(voter => (
            <VoterCard key={voter.id} voter={voter} />
          ))}
        </div>
      </div>
    </>
  );
}
