
import { getElections } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default async function RecapitulationDashboardPage() {
    const elections = await getElections();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Election Recapitulation</h1>
                <p className="text-muted-foreground">
                    Select an election to view or generate a recapitulation report.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {elections.map((election) => (
                    <Card key={election.id}>
                        <CardHeader>
                            <CardTitle>{election.name}</CardTitle>
                            <CardDescription>{election.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild className="w-full">
                                <Link href={`/admin/recapitulation/${election.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Recapitulation
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {elections.length === 0 && (
                     <p className="text-muted-foreground col-span-full">No elections available to show recapitulation for.</p>
                )}
            </div>
        </div>
    );
}
