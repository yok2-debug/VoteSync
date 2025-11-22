import { CandidateActionClientPage } from './components/candidate-action-client-page';

// This function is required for static export of dynamic routes.
export async function generateStaticParams() {
  return [];
}

export default function CandidateActionPage() {
  return <CandidateActionClientPage />;
}
