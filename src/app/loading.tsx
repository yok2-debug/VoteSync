import { Logo } from '@/components/logo';

export default function Loading() {
  return (
    <>
      <style>{`
        @media print {
          .loading-logo, .loading-logo * {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse loading-logo">
          <Logo />
        </div>
        <p className="mt-4 text-muted-foreground">Loading VoteSync...</p>
      </div>
    </>
  );
}
