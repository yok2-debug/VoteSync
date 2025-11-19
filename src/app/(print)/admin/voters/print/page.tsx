
'use client';
import { getVoters } from '@/lib/data';
import type { Voter } from '@/lib/types';
import { VoterCard } from '@/app/admin/voters/print/components/voter-card';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function PrintCardsPageContent() {
  const searchParams = useSearchParams();
  const [votersToPrint, setVotersToPrint] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndFilterVoters() {
      setIsLoading(true);
      const voterIdsParam = searchParams.get('voterIds');
      if (voterIdsParam) {
        try {
          const idsToPrint = new Set(voterIdsParam.split(','));
          // Fetch enriched voters directly
          const allEnrichedVoters = await getVoters();
          const filteredVoters = allEnrichedVoters.filter(v => idsToPrint.has(v.id));
          setVotersToPrint(filteredVoters);
        } catch (e) {
            console.error("Failed to fetch voters for printing:", e);
            setError("Could not load voter data. Please try again.");
        }
      } else {
        setError("No voter IDs provided for printing.");
      }
      setIsLoading(false);
    }
    
    fetchAndFilterVoters();
    
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && votersToPrint.length > 0) {
      // Small delay to ensure DOM is fully rendered before printing
      const timer = setTimeout(() => {
        try {
            window.print();
        } catch (e) {
            console.error("Print failed:", e);
            setError("Could not open the print dialog.");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, votersToPrint]);

  if (isLoading) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center">
            <p>Preparing voter cards for printing...</p>
        </div>
    );
  }

  if (error) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <p>Error: {error}</p>
        </div>
      );
  }
  
  if (votersToPrint.length === 0) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <p>No voters found to print. Please check the selection.</p>
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
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
             background-color: #fff !important;
          }
           * {
            box-shadow: none !important;
            text-shadow: none !important;
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

export default function PrintPage() {
  // Wrap with Suspense because useSearchParams() needs it.
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center"><p>Loading...</p></div>}>
      <PrintCardsPageContent />
    </Suspense>
  )
}
