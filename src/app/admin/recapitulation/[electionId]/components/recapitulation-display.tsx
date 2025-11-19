'use client';

import type { Election, Voter, Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

type RecapitulationDisplayProps = {
  election: Election;
  allVoters: Voter[];
  allCategories: Category[];
};

export function RecapitulationDisplay({ election, allVoters, allCategories }: RecapitulationDisplayProps) {
  const categoryMap = useMemo(() => new Map(allCategories.map(c => [c.id, c.name])), [allCategories]);
  const candidates = useMemo(() => Object.values(election.candidates || {}), [election.candidates]);
  const totalVotes = useMemo(() => Object.keys(election.votes || {}).length, [election.votes]);

  const participatingVoters = useMemo(() => {
    const voterIds = Object.keys(election.votes || {});
    return allVoters.filter(v => voterIds.includes(v.id));
  }, [election.votes, allVoters]);
  
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
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">ELECTION RECAPITULATION</CardTitle>
                <CardDescription className="text-lg">{election.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Election ID:</strong> {election.id}</div>
                    <div><strong>Status:</strong> <span className="capitalize">{election.status}</span></div>
                    <div><strong>Schedule:</strong> {formatSchedule(election.startDate, election.endDate)}</div>
                    <div><strong>Total Votes Cast:</strong> {totalVotes}</div>
                </div>

                <Separator />
                
                <div>
                    <h3 className="text-lg font-semibold mb-2">Vote Summary</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead className="text-right">Votes</TableHead>
                                    <TableHead className="text-right">Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.map(candidate => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="font-medium">{candidate.name}</TableCell>
                                        <TableCell className="text-right">{election.results?.[candidate.id] || 0}</TableCell>
                                        <TableCell className="text-right">
                                            {totalVotes > 0 ? (((election.results?.[candidate.id] || 0) / totalVotes) * 100).toFixed(2) : '0.00'}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-semibold mb-2">Voter Participation</h3>
                     <div className="rounded-md border">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Voter ID</TableHead>
                                    <TableHead>Voter Name</TableHead>
                                    <TableHead>Category</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participatingVoters.length > 0 ? participatingVoters.map(voter => (
                                    <TableRow key={voter.id}>
                                        <TableCell className="font-mono">{voter.id}</TableCell>
                                        <TableCell>{voter.name}</TableCell>
                                        <TableCell>{categoryMap.get(voter.category) || 'N/A'}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No voters have participated yet.</TableCell>
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


function Separator() {
    return <div className="border-t border-dashed my-4" />;
}
