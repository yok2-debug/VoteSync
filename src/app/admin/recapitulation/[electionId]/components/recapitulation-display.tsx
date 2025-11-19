'use client';

import type { Election, Voter, Category, CommitteeMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
  
  const electionDayInfo = useMemo(() => {
    if (!election.endDate) return { day: 'N/A', date: 'N/A' };
    const date = new Date(election.endDate);
    return {
      day: format(date, 'EEEE', { locale: id }),
      date: format(date, 'd MMMM yyyy', { locale: id })
    }
  }, [election.endDate]);


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
                margin-top: 40px;
                border-collapse: collapse;
                page-break-inside: avoid;
            }
            .print-signature-table th,
            .print-signature-table td {
                padding: 12px 8px;
                border: 1px solid #ddd;
                text-align: left;
                vertical-align: middle;
            }
            .print-signature-table .no-col { width: 5%; text-align: center; }
            .print-signature-table .name-col { width: 30%; }
            .print-signature-table .role-col { width: 25%; }
            .print-signature-table .signature-col { width: 40%; }
            .print-signature-table .signature-box {
                height: 50px;
                position: relative;
            }
            .print-signature-table .signature-dots {
                border-bottom: 1px dotted #888;
                width: 100%;
                position: absolute;
                bottom: 0;
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
                    Pada hari {electionDayInfo.day}, tanggal {electionDayInfo.date}, telah dilaksanakan pemungutan suara untuk pemilihan {election.name} dengan hasil sebagai berikut:
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
                                <th className="no-col">No.</th>
                                <th className="name-col">Nama</th>
                                <th className="role-col">Jabatan</th>
                                <th className="signature-col">Tanda Tangan</th>
                            </tr>
                        </thead>
                         <tbody>
                            {election.committee.map((member, index) => (
                                <tr key={`committee-member-${index}`}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{member.name}</td>
                                    <td>{member.role}</td>
                                    <td>
                                      <div className="signature-box">
                                        <div className="signature-dots"></div>
                                      </div>
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
