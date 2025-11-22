
import { VoteClientPage } from './components/vote-client-page';

// This function is required for static export of dynamic routes.
// It tells Next.js what pages to generate at build time.
// Since our elections are dynamic, we'll return an empty array
// and handle rendering entirely on the client side.
export async function generateStaticParams() {
  return [];
}

export default function VotePage() {
    return <VoteClientPage />;
}
