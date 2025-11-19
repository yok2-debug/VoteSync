import { getCategories, getElections, getVoters } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, Users, Box, CheckCircle, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function Dashboard() {
  const [elections, voters, categories] = await Promise.all([
    getElections(),
    getVoters(),
    getCategories(),
  ]);

  if (!elections) {
    // A sensible default if elections can't be fetched might be to go to the creation page
    // For now, redirecting to the same section is fine.
    redirect('/admin/elections');
  }

  const totalElections = elections.length;
  const totalVoters = voters.length;
  const totalCategories = categories.length;
  const completedElections = elections.filter(e => e.status === 'completed').length;
  const ongoingElections = elections.filter(e => e.status === 'ongoing').length;

  const stats = [
    { title: 'Total Elections', value: totalElections, icon: <Vote className="h-6 w-6 text-muted-foreground" />, href: '/admin/elections' },
    { title: 'Total Voters', value: totalVoters, icon: <Users className="h-6 w-6 text-muted-foreground" />, href: '/admin/voters' },
    { title: 'Voter Categories', value: totalCategories, icon: <Box className="h-6 w-6 text-muted-foreground" />, href: '/admin/categories' },
    { title: 'Ongoing Elections', value: ongoingElections, icon: <Clock className="h-6 w-6 text-muted-foreground" />, href: '/admin/elections' },
    { title: 'Completed Elections', value: completedElections, icon: <CheckCircle className="h-6 w-6 text-muted-foreground" />, href: '/admin/elections' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of the VoteSync system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the sidebar to manage elections, voters, categories, and view results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
