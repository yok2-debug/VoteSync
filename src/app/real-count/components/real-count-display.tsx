'use client';
import { useMemo } from 'react';
import type { Election, Voter, Category, Candidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ElectionPieChart } from './election-pie-chart';

const getCandidateDisplayName = (candidate: Candidate) => {
    return candidate.viceCandidateName 
        ? `${candidate.name} & ${candidate.viceCandidateName}` 
        : candidate.name;
}

export function RealCountDisplay({ election, allVoters, allCategories }: RealCountDisplayProps) {
  
  const liveResults = election.results || {};
  const liveTotalVotes = Object.keys(election.votes || {}).length;

  const DPT = useMemo(() => {
    const allowedCategoryIds = allCategories
      .filter(cat => cat.allowedElections?.includes(election.id))
      .map(cat => cat.id);
    
    return allVoters.filter(voter => allowedCategoryIds.includes(voter.category)).length;
  }, [election.id, allVoters, allCategories]);

  
  const candidates = useMemo(() => 
    Object.values(election.candidates || {})
      .sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999)), 
    [election.candidates]
  );
  const votesMasukPercentage = DPT > 0 ? (liveTotalVotes / DPT) * 100 : 0;

  const chartData = useMemo(() => {
    return candidates.map((candidate, index) => ({
      id: candidate.id,
      name: getCandidateDisplayName(candidate),
      value: liveResults[candidate.id] || 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`
    }));
  }, [candidates, liveResults]);
  
  const candidateColorMap = useMemo(() => {
    return new Map(chartData.map(d => [d.id, d.fill]));
  }, [chartData]);


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

        <div className="space-y-4">
            <div className="w-full">
                <ElectionPieChart data={chartData} />
            </div>
             <div className="space-y-3">
                <h4 className="font-semibold text-center md:text-left">Perolehan Suara</h4>
                <ul className="space-y-2 text-sm">
                {candidates.map(candidate => (
                    <li key={candidate.id} className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                         <span 
                          className="w-3 h-3 rounded-full inline-block flex-shrink-0" 
                          style={{ backgroundColor: candidateColorMap.get(candidate.id) }}
                        ></span>
                        <span 
                          className="break-words font-medium"
                          style={{ color: candidateColorMap.get(candidate.id) }}
                        >
                          {getCandidateDisplayName(candidate)}
                        </span>
                      </div>
                      <span className="font-bold text-nowrap">
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
