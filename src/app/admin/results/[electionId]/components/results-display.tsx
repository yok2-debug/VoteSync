'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Election, Candidate } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { predictElectionOutcome } from '@/ai/flows/real-time-election-prediction';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit } from 'lucide-react';

type ResultsDisplayProps = {
  election: Election;
};

type VoteData = {
  name: string;
  votes: number;
};

type Prediction = {
    predictedOutcome: Record<string, number>;
    marginOfError: number;
    confidenceLevel: number;
};

export function ResultsDisplay({ election }: ResultsDisplayProps) {
  const [results, setResults] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const votesRef = ref(db, `elections/${election.id}/votes`);
    const unsubscribe = onValue(votesRef, (snapshot) => {
      const votes: Record<string, string> = snapshot.val() || {};
      const voteCounts: Record<string, number> = {};
      
      Object.values(election.candidates).forEach(c => {
        voteCounts[c.id] = 0;
      });

      let count = 0;
      for (const voterId in votes) {
        const candidateId = votes[voterId];
        if (candidateId in voteCounts) {
          voteCounts[candidateId]++;
        }
        count++;
      }
      setResults(voteCounts);
      setTotalVotes(count);
    });

    return () => unsubscribe();
  }, [election.id, election.candidates]);

  const chartData: VoteData[] = useMemo(() => {
    return Object.entries(results).map(([candidateId, voteCount]) => ({
      name: election.candidates[candidateId]?.name || 'Unknown',
      votes: voteCount,
    })).sort((a, b) => b.votes - a.votes);
  }, [results, election.candidates]);

  const handlePrediction = async () => {
    setIsPredicting(true);
    setPrediction(null);
    try {
        const votesRef = ref(db, `elections/${election.id}/votes`);
        const snapshot = await onValue(votesRef, () => {}); // A way to get current data
        const currentVotes = (snapshot as any).val() || {};

        if (Object.keys(currentVotes).length < 10) {
            toast({
                variant: 'destructive',
                title: 'Prediction Not Available',
                description: 'Need at least 10 votes to generate a prediction.',
            });
            return;
        }

        const predictionResult = await predictElectionOutcome({
            electionId: election.id,
            votes: currentVotes,
            candidates: election.candidates,
        });

        setPrediction(predictionResult);
        toast({
            title: 'Prediction Generated',
            description: 'AI-powered outcome prediction is now available.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Prediction Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
    } finally {
        setIsPredicting(false);
    }
  };

  const predictionData = useMemo(() => {
    if (!prediction) return [];
    return Object.entries(prediction.predictedOutcome).map(([candidateId, percentage]) => ({
        name: election.candidates[candidateId]?.name || 'Unknown',
        percentage: percentage,
    })).sort((a,b) => b.percentage - a.percentage);
  }, [prediction, election.candidates]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Vote Count</CardTitle>
            <CardDescription>Total Votes Cast: {totalVotes}</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {prediction && (
            <Card>
                <CardHeader>
                    <CardTitle>AI Predicted Outcome</CardTitle>
                    <CardDescription>Confidence: {prediction.confidenceLevel}% | Margin of Error: ±{prediction.marginOfError}%</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {predictionData.map(p => (
                            <div key={p.name} className="flex items-center gap-4">
                                <div className="w-24 text-sm font-medium truncate">{p.name}</div>
                                <div className="flex-1 bg-muted rounded-full h-4">
                                    <div className="bg-accent rounded-full h-4" style={{ width: `${p.percentage}%` }}></div>
                                </div>
                                <div className="w-12 text-right text-sm font-bold">{p.percentage.toFixed(1)}%</div>
                            </div>
                        ))}
                     </div>
                </CardContent>
            </Card>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>AI Prediction</CardTitle>
                <CardDescription>Use GenAI to predict the final outcome based on current trends.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button className="w-full" onClick={handlePrediction} disabled={isPredicting}>
                    {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    {isPredicting ? 'Analyzing Votes...' : 'Generate Prediction'}
                </Button>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {chartData.map((item) => (
                <li key={item.name} className="flex justify-between items-center text-sm">
                  <span>{item.name}</span>
                  <span className="font-bold">
                    {item.votes} votes ({totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : 0}%)
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
