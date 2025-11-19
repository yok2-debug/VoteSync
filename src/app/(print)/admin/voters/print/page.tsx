
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
    async function fetchAndPrintVoters() {
      const voterIdsParam = searchParams.get('voterIds');
      if (!voterIdsParam) {
        setError("No voter IDs provided for printing.");
        setIsLoading(false);
        return;
      }

      try {
        const idsToPrint = new Set(voterIdsParam.split(','));
        const allEnrichedVoters = await getVoters();
        const filteredVoters = allEnrichedVoters.filter(v => idsToPrint.has(v.id));
        
        if (filteredVoters.length === 0) {
          setError("No voters found to print. Please check the selection.");
          setIsLoading(false);
          return;
        }

        setVotersToPrint(filteredVoters);
        setIsLoading(false);

        // Crucial: Wait for state to update and DOM to re-render BEFORE printing.
        setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            console.error("Print failed:", e);
            // This error is tricky to show in UI as print dialog might be open/closed.
          }
        }, 500);

      } catch (e) {
        console.error("Failed to fetch voters for printing:", e);
        setError("Could not load voter data. Please try again.");
        setIsLoading(false);
      }
    }
    
    fetchAndPrintVoters();
    
    // We only want this effect to run once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (isLoading) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center">
            <p>Preparing voter cards for printing...</p>
        </div>
    );
  }

  if (error) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center text-red-600">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
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
