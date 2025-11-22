import { CandidateActionClientPage } from './components/candidate-action-client-page';

// This function is required for static export of dynamic routes.
// By returning an empty array, we tell Next.js to generate these pages on-demand.
export async function generateStaticParams() {
  return [];
}

export default function CandidateActionPage() {
  return <CandidateActionClientPage />;
}
