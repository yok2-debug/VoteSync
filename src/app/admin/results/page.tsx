'use client';
import { useDatabase } from '@/context/database-context';
import Loading from '@/app/loading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart2 } from 'lucide-react';

export default function ResultsDashboardPage() {
    const { elections, isLoading } = useDatabase();

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
                <p className="text-muted-foreground">
                    Select an election to view real-time results.
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
                            <Link href={`/admin/results/${election.id}`} className="w-full">
                                <Button className="w-full">
                                    <BarChart2 className="mr-2 h-4 w-4" />
                                    View Results
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {elections.length === 0 && (
                     <p className="text-muted-foreground col-span-full">No elections available to show results for.</p>
                )}
            </div>
        </div>
    );
}
