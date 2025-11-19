'use client';

import type { Election, Voter, Category, CommitteeMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
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

  const votersWhoDidNotVote = DPT - totalVotesCast;
  
  const handlePrint = () => {
    window.print();
  };
  
  const formatSchedule = (start?: string, end?: string) => {
    if (!start || !end) return 'Not set';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startFormat = format(startDate, 'd MMMM yyyy, HH:mm');
    const endFormat = format(endDate, 'd MMMM yyyy, HH:mm');
    return `${startFormat} - ${endFormat}`;
  }
  
  const electionDay = election.endDate ? format(new Date(election.endDate), 'EEEE, d MMMM yyyy') : 'N/A';
  const electionDuration = election.startDate && election.endDate 
    ? formatDistanceToNow(new Date(election.startDate), { addSuffix: false }) 
    : 'N/A';

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
              padding: 1rem;
              font-size: 12px;
            }
            .no-print {
                display: none;
            }
             .print-signature-table {
                width: 100%;
                margin-top: 50px;
                border-collapse: collapse;
            }
            .print-signature-table td {
                padding: 10px;
                border: 1px solid #ccc;
                vertical-align: top;
            }
            .print-signature-table .name-cell {
                width: 40%;
            }
            .print-signature-table .signature-cell {
                width: 60%;
            }
          }
        `}
      </style>
      <div className="flex justify-end gap-2 no-print">
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Berita Acara
        </Button>
      </div>
      <div id="print-section">
        <Card className="shadow-none border-0 print:shadow-none print:border-0">
            <CardHeader className="text-center space-y-2 border-b pb-4">
                <h2 className="text-2xl font-bold tracking-tight">BERITA ACARA</h2>
                <h3 className="text-xl font-semibold uppercase">HASIL PENGHITUNGAN SUARA PEMILIHAN</h3>
                <h1 className="text-xl font-semibold uppercase">{election.name}</h1>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                
                <p>
                    Pada hari ini, {electionDay}, telah dilaksanakan pemungutan suara untuk pemilihan {election.name} yang diselenggarakan selama {electionDuration} terhitung sejak {formatSchedule(election.startDate, election.endDate)}.
                </p>

                <div>
                    <h3 className="text-lg font-semibold mb-2">A. Data Pemilih dan Penggunaan Hak Pilih</h3>
                     <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Uraian</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Jumlah Pemilih dalam Daftar Pemilih Tetap (DPT)</TableCell>
                                    <TableCell className="text-right font-bold">{DPT}</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell>Jumlah Pemilih yang Menggunakan Hak Pilih</TableCell>
                                    <TableCell className="text-right font-bold">{totalVotesCast}</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell>Jumlah Pemilih yang Tidak Menggunakan Hak Pilih</TableCell>
                                    <TableCell className="text-right font-bold">{votersWhoDidNotVote}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                
                <div>
                    <h3 className="text-lg font-semibold mb-2">B. Rincian Perolehan Suara Kandidat</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">No. Urut</TableHead>
                                    <TableHead>Nama Kandidat</TableHead>
                                    <TableHead className="text-right">Jumlah Suara Sah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.length > 0 ? candidates.map((candidate, index) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="text-center">{index + 1}</TableCell>
                                        <TableCell className="font-medium">{candidate.name}</TableCell>
                                        <TableCell className="text-right font-bold">{election.results?.[candidate.id] || 0}</TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">Tidak ada kandidat dalam pemilihan ini.</TableCell>
                                  </TableRow>
                                )}
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell colSpan={2}>Total Seluruh Suara Sah</TableCell>
                                    <TableCell className="text-right">{totalVotesCast}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <p>
                    Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
                </p>

                {election.committee && election.committee.length > 0 && (
                  <div className="pt-8">
                     <h3 className="text-lg font-semibold mb-4 text-center">Panitia Pemilihan</h3>
                     <table className="print-signature-table">
                        <thead>
                            <tr>
                                <th className="text-left p-2 border">Nama & Jabatan</th>
                                <th className="text-left p-2 border">Tanda Tangan</th>
                            </tr>
                        </thead>
                         <tbody>
                            {election.committee.map((member, index) => (
                                <tr key={`committee-member-${index}`}>
                                    <td className="name-cell">
                                        <div className="font-bold">{member.name}</div>
                                        <div className="text-sm text-muted-foreground">{member.role}</div>
                                    </td>
                                    <td className="signature-cell">
                                        <div className="h-16"></div>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                     </table>
                  </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
