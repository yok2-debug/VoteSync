
import { VoteClientPage } from './components/vote-client-page';

// This function is required for static export of dynamic routes.
// By returning an empty array, we tell Next.js to generate these pages on-demand.
export async function generateStaticParams() {
  return [];
}

export default function VotePage() {
    return <VoteClientPage />;
}
