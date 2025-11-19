'use client';
import { useMemo } from 'react';
import type { Election, Voter, Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ElectionPieChart } from './election-pie-chart';

type RealCountDisplayProps = {
  election: Election;
  allVoters: Voter[];
  allCategories: Category[];
};

export function RealCountDisplay({ election, allVoters, allCategories }: RealCountDisplayProps) {
  
  const liveResults = election.results || {};
  const liveTotalVotes = Object.keys(election.votes || {}).length;

  const DPT = useMemo(() => {
    const allowedCategoryIds = allCategories
      .filter(cat => cat.allowedElections?.includes(election.id))
      .map(cat => cat.id);
    
    return allVoters.filter(voter => allowedCategoryIds.includes(voter.category)).length;
  }, [election.id, allVoters, allCategories]);

  
  const candidates = useMemo(() => Object.values(election.candidates || {}), [election.candidates]);
  const votesMasukPercentage = DPT > 0 ? (liveTotalVotes / DPT) * 100 : 0;

  const chartData = useMemo(() => {
    return candidates.map((candidate, index) => ({
      name: candidate.name,
      value: liveResults[candidate.id] || 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`
    }));
  }, [candidates, liveResults]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{election.name}</CardTitle>
        <CardDescription>{election.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6">
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
                <span>Suara Masuk</span>
                <span>{liveTotalVotes} dari {DPT} Pemilih</span>
            </div>
            <Progress value={votesMasukPercentage} />
            <div className="text-right text-xs text-muted-foreground">
                {votesMasukPercentage.toFixed(2)}%
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-48 w-full">
                <ElectionPieChart data={chartData} />
            </div>
             <div className="space-y-3">
                <h4 className="font-semibold text-center md:text-left">Perolehan Suara</h4>
                <ul className="space-y-2 text-sm">
                {candidates.sort((a,b) => (liveResults[b.id] || 0) - (liveResults[a.id] || 0)).map(candidate => (
                    <li key={candidate.id} className="flex justify-between items-center">
                    <span>{candidate.name}</span>
                    <span className="font-bold">
                        {liveResults[candidate.id] || 0} ({liveTotalVotes > 0 ? (((liveResults[candidate.id] || 0) / liveTotalVotes) * 100).toFixed(1) : 0}%)
                    </span>
                    </li>
                ))}
                </ul>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
