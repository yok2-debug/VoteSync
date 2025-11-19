'use client';

import type { Election, Voter, Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Users, UserCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type RecapitulationDisplayProps = {
  election: Election;
  allVoters: Voter[];
  allCategories: Category[];
};

export function RecapitulationDisplay({ election, allVoters, allCategories }: RecapitulationDisplayProps) {
  const candidates = useMemo(() => Object.values(election.candidates || {}), [election.candidates]);
  const totalVotesCast = useMemo(() => Object.keys(election.votes || {}).length, [election.votes]);

  const DPT = useMemo(() => {
    // Find categories allowed in this election
    const allowedCategoryIds = allCategories
      .filter(cat => cat.allowedElections?.includes(election.id))
      .map(cat => cat.id);
    
    // Count voters belonging to those categories
    return allVoters.filter(voter => allowedCategoryIds.includes(voter.category)).length;
  }, [election.id, allVoters, allCategories]);

  const participationPercentage = DPT > 0 ? ((totalVotesCast / DPT) * 100).toFixed(2) : 0;
  
  const handlePrint = () => {
    window.print();
  };
  
  const formatSchedule = (start?: string, end?: string) => {
    if (!start || !end) return 'Not set';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startFormat = format(startDate, 'd MMM yyyy, HH:mm');
    const endFormat = format(endDate, 'd MMM yyyy, HH:mm');
    return `${startFormat} - ${endFormat}`;
  }


  return (
    <div className="space-y-6">
       <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
                display: none;
            }
          }
        `}
      </style>
      <div className="flex justify-end gap-2 no-print">
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
        </Button>
      </div>
      <div id="print-section">
        <Card>
            <CardHeader className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">ELECTION RECAPITULATION</h2>
                <h1 className="text-xl font-semibold">{election.name}</h1>
                <p className="text-muted-foreground">{formatSchedule(election.startDate, election.endDate)}</p>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total DPT (Eligible Voters)</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{DPT}</div>
                      <p className="text-xs text-muted-foreground">Total voters who have the right to vote</p>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalVotesCast}</div>
                      <p className="text-xs text-muted-foreground">{participationPercentage}% participation rate from DPT</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-center">Final Vote Summary</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">No.</TableHead>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead className="text-right">Votes</TableHead>
                                    <TableHead className="text-right">Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.length > 0 ? candidates.map((candidate, index) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">{candidate.name}</TableCell>
                                        <TableCell className="text-right">{election.results?.[candidate.id] || 0}</TableCell>
                                        <TableCell className="text-right">
                                            {totalVotesCast > 0 ? (((election.results?.[candidate.id] || 0) / totalVotesCast) * 100).toFixed(2) : '0.00'}%
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No candidates in this election.</TableCell>
                                  </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
