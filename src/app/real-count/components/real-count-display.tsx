'use client';
import { useMemo, useState, useEffect } from 'react';
import type { Election, Voter, Candidate, Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ElectionPieChart } from './election-pie-chart';
import { Badge } from '@/components/ui/badge';
import { useDatabase } from '@/context/database-context';

const getCandidateDisplayName = (candidate: Candidate) => {
    return candidate.viceCandidateName 
        ? `${candidate.name} & ${candidate.viceCandidateName}` 
        : candidate.name;
}

interface RealCountDisplayProps {
    election: Election;
    categories: Category[];
}

export function RealCountDisplay({ election, categories }: RealCountDisplayProps) {
  const [now, setNow] = useState(new Date());
  const { voters } = useDatabase();

  useEffect(() => {
    // Update the 'now' state every 10 seconds to re-evaluate time-sensitive UI
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const liveResults = election.results || {};
  const liveTotalVotes = Object.keys(election.votes || {}).length;

  const DPT = useMemo(() => {
    const allowedCategoryIds = new Set(
        categories.filter(c => c.allowedElections?.includes(election.id)).map(c => c.id)
    );
    return voters.filter(v => allowedCategoryIds.has(v.category)).length;
  }, [voters, categories, election.id]);
  
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
  
  const getScheduleStatusBadge = (election: Election) => {
    const startDate = election.startDate ? new Date(election.startDate) : null;
    const endDate = election.endDate ? new Date(election.endDate) : null;

    if (endDate && now > endDate) {
      return <Badge variant="destructive">Berakhir</Badge>;
    }
    if (startDate && now >= startDate && endDate && now < endDate) {
      return <Badge className="bg-green-500 text-white hover:bg-green-500/90">Berlangsung</Badge>;
    }
    if (startDate && now < startDate) {
      return <Badge className="bg-blue-500 text-white hover:bg-blue-500/90">Belum Mulai</Badge>;
    }
    return <Badge variant="secondary">Jadwal Tidak Diatur</Badge>;
  };


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle>{election.name}</CardTitle>
            {getScheduleStatusBadge(election)}
        </div>
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
