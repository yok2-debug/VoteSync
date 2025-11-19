import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ResetSystemDialog } from './components/reset-system-dialog';

export default function SettingsPage() {
  const resetOptions = [
    {
      title: 'Reset Voter Status',
      description: 'Resets the "hasVoted" status for all voters, allowing them to vote again. Vote counts are not cleared.',
      action: 'reset_voter_status',
    },
    {
      title: 'Reset Election Results',
      description: 'Deletes all cast votes and resets vote counts to zero for all elections.',
      action: 'reset_election_results',
    },
    {
      title: 'Delete All Voters',
      description: 'Permanently deletes all voter records from the system. This action cannot be undone.',
      action: 'delete_all_voters',
    },
    {
      title: 'Reset All Elections',
      description: 'Deletes all elections, candidates, and related data. The system will be empty.',
      action: 'reset_all_elections',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage system-wide settings and perform reset operations.
        </p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>Danger Zone</CardTitle>
          </div>
          <CardDescription>
            These actions are irreversible and can lead to permanent data loss. Proceed with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetOptions.map((option) => (
            <Card key={option.action}>
              <CardHeader>
                <CardTitle className="text-lg">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{option.description}</p>
              </CardContent>
              <CardFooter>
                 <ResetSystemDialog
                  action={option.action}
                  title={option.title}
                  description={option.description}
                />
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
