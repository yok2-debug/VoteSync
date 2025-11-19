import { Logo } from '@/components/logo';

export default function Loading() {
  return (
    <>
      <style>{`
        @media print {
          #loading-container {
            display: none !important;
          }
        }
      `}</style>
      <div id="loading-container" className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse loading-logo">
          <Logo />
        </div>
        <p className="mt-4 text-muted-foreground">Loading VoteSync...</p>
      </div>
    </>
  );
}
