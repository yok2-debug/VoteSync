
'use client';

import type { Election, Voter, Category } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

type RecapitulationDisplayProps = {
  election: Election;
  allVoters: Voter[];
  allCategories: Category[];
};

// Helper function to convert number to words in Indonesian
const toWords = (num: number): string => {
  const
    terbilang = [
      '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
    ];

  if (num < 12) return terbilang[num];
  if (num < 20) return toWords(num - 10) + ' belas';
  if (num < 100) return terbilang[Math.floor(num / 10)] + ' puluh ' + toWords(num % 10);
  if (num < 200) return 'seratus ' + toWords(num - 100);
  if (num < 1000) return terbilang[Math.floor(num / 100)] + ' ratus ' + toWords(num % 100);
  if (num < 2000) return 'seribu ' + toWords(num - 1000);
  if (num < 1000000) return toWords(Math.floor(num / 1000)) + ' ribu ' + toWords(num % 1000);
  if (num < 1000000000) return toWords(Math.floor(num/1000000)) + ' juta ' + toWords(num % 1000000);
  if (num < 1000000000000) return toWords(Math.floor(num/1000000000)) + ' milyar ' + toWords(num % 1000000000);
  // Add more cases if needed for larger numbers
  return num.toString();
};

type FormattedDateParts = {
    day: string;
    dayWords: string;
    month: string;
    yearWords: string;
}

const formatDateToWords = (date: Date): FormattedDateParts => {
    const day = date.getDate();
    const year = date.getFullYear();
    const month = format(date, 'MMMM', { locale: localeID });
    
    return {
        day: format(date, 'EEEE', { locale: localeID }),
        dayWords: toWords(day).trim(),
        month: month,
        yearWords: toWords(year).trim(),
    };
}


export function RecapitulationDisplay({ election, allVoters, allCategories }: RecapitulationDisplayProps) {
  const candidates = useMemo(() => 
      Object.values(election.candidates || {})
        .sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999)), 
      [election.candidates]
  );
  const totalVotesCast = useMemo(() => Object.keys(election.votes || {}).length, [election.votes]);

  const DPT = useMemo(() => {
    const allowedCategoryIds = allCategories
      .filter(cat => cat.allowedElections?.includes(election.id))
      .map(cat => cat.id);
    
    return allVoters.filter(voter => allowedCategoryIds.includes(voter.category)).length;
  }, [election.id, allVoters, allCategories]);

  const votersWhoDidNotVote = DPT - totalVotesCast;
  
  const handlePrint = () => {
    window.print();
  };
  
  const electionDateInfo = useMemo(() => {
    if (!election.endDate) return null;
    return formatDateToWords(new Date(election.endDate));
  }, [election.endDate]);


  return (
    <div className="space-y-6">
       <style>
        {`
          @page {
            margin-top: 1.5cm;
            margin-bottom: 1cm;
          }
          @media print {
            body, body * {
              visibility: hidden;
              background: transparent !important;
              color: #000 !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            b, strong {
                font-weight: bold !important;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 1rem;
              font-size: 12px;
            }
            .no-print {
                display: none;
            }
            .print-card {
                border: none !important;
                background: #fff !important;
            }
            .print-card-header {
                border-bottom: 2px solid #000 !important;
                background: #fff !important;
                padding-top: 0 !important;
            }
            .print-card-content {
                border: none !important;
                background: #fff !important;
            }
            .print-table {
                color: #000 !important;
                border-collapse: collapse !important;
            }
            .print-table th, .print-table td {
                border: 1px solid #000 !important;
                color: #000 !important;
                padding: 4px 8px;
            }
            .print-table th {
                text-align: center !important;
            }
            .print-table tr {
                border: none !important;
            }
            .print-table thead {
                background-color: #f2f2f2 !important;
            }
            
             .print-signature-container {
                padding-top: 1rem;
             }

             .print-signature-table {
                width: 100%;
                margin-top: 0;
                border-collapse: collapse;
                page-break-inside: avoid;
            }
            .print-signature-table th,
            .print-signature-table td {
                padding: 12px 8px;
                border: 1px solid #000;
                vertical-align: middle;
            }
             .print-signature-table th {
                text-align: center;
             }
            .print-signature-table tr {
                border: none !important;
            }
            .print-signature-table .no-col { width: 5%; }
            .print-signature-table .name-col { width: 30%; text-align: left;}
            .print-signature-table .role-col { width: 25%; text-align: left;}
            .print-signature-table .signature-col { width: 40%; }
            .print-signature-table .signature-box {
                height: 50px;
                position: relative;
            }
            .print-signature-table .signature-dots {
                border-bottom: 1px dotted #000;
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
        <Card className="shadow-none border-0 print-card">
            <CardHeader className="text-center space-y-2 pb-4 print-card-header">
                <h2 className="text-2xl font-bold tracking-tight">BERITA ACARA</h2>
                <h3 className="text-xl font-semibold uppercase">HASIL PENGHITUNGAN SUARA PEMILIHAN</h3>
                <h1 className="text-xl font-semibold uppercase">{election.name}</h1>
            </CardHeader>
            <CardContent className="space-y-8 pt-6 print-card-content">
                
                <p>
                    Pada hari ini {electionDateInfo ? <><b>{electionDateInfo.day}</b>, <span>tanggal</span> <b className="capitalize">{electionDateInfo.dayWords}</b> <span>bulan</span> <b className="capitalize">{electionDateInfo.month}</b> <span>tahun</span> <b className="capitalize">{electionDateInfo.yearWords}</b></> : <span><b>(Tanggal tidak diatur)</b></span>}, telah dilaksanakan pemungutan suara untuk pemilihan {election.name} dengan hasil sebagai berikut:
                </p>

                <div>
                    <h3 className="text-lg font-semibold mb-2">A. Data Pemilih dan Penggunaan Hak Pilih</h3>
                     <div className="rounded-md print-table">
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
                    <div className="rounded-md print-table">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">No. Urut</TableHead>
                                    <TableHead>Nama Kandidat</TableHead>
                                    <TableHead className="text-right">Jumlah Suara Sah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.length > 0 ? candidates.map((candidate) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="text-center">{candidate.orderNumber}</TableCell>
                                        <TableCell className="font-medium">{candidate.name}</TableCell>
                                        <TableCell className="text-right font-bold">{election.results?.[candidate.id] || 0}</TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">Tidak ada kandidat dalam pemilihan ini.</TableCell>
                                  </TableRow>
                                )}
                                <TableRow className="font-bold bg-muted/50 print-table">
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
                  <div className="print-signature-container">
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
