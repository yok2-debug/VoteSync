import { Logo } from '@/components/logo';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="animate-pulse">
        <Logo />
      </div>
      <p className="mt-4 text-muted-foreground">Loading VoteSync...</p>
    </div>
  );
}
