'use client';
import { LoginForm } from '@/components/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PublicNavbar } from '@/components/public-navbar';
import { useDatabase } from '@/context/database-context';
import { Badge } from '@/components/ui/badge';
import Loading from './loading';
import { useMemo } from 'react';
import type { Election } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

export default function LoginPage() {
  const { elections, isLoading } = useDatabase();

  const activeElections = useMemo(
    () => elections.filter((e) => e.status === 'active'),
    [elections]
  );
  
  const now = new Date();

  const getStatus = (election: { startDate?: string; endDate?: string }) => {
    const startDate = election.startDate ? new Date(election.startDate) : null;
    const endDate = election.endDate ? new Date(election.endDate) : null;

    if (endDate && now > endDate) {
      return <Badge variant="destructive">Telah Berakhir</Badge>;
    }
    if (startDate && now >= startDate) {
      return <Badge className="bg-green-500 text-white">Sedang Berlangsung</Badge>;
    }
    return <Badge variant="secondary">Akan Datang</Badge>;
  };
  
  const formatSchedule = (start?: string, end?: string) => {
    if (!start || !end) return 'Jadwal belum ditentukan';
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        // e.g., 17 Agu 2024, 09:00 - 17:00
        const startFormat = format(startDate, 'd MMM yyyy, HH:mm');
        const endFormat = format(endDate, 'HH:mm');
        return `${startFormat} - ${endFormat}`;
    } catch (e) {
        return 'Jadwal tidak valid';
    }
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 flex-col items-center justify-center bg-background p-4 pt-20">
        <div className="w-full max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Selamat Datang di VoteSync</h1>
            <p className="text-muted-foreground">Sistem E-Voting untuk pemilihan yang transparan dan aman.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left Column: Active Elections */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight text-center md:text-left">Pemilihan Aktif</h2>
               {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">Memuat data pemilihan...</p>
                </div>
              ) : activeElections.length > 0 ? (
                <div className="space-y-6">
                  {activeElections.map((election: Election) => (
                    <Card key={election.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                           <CardTitle>{election.name}</CardTitle>
                           {getStatus(election)}
                        </div>
                        <CardDescription>{election.description}</CardDescription>
                         <div className="flex items-center pt-2 text-sm text-muted-foreground gap-2">
                           <Calendar className="h-4 w-4" />
                           <span>{formatSchedule(election.startDate, election.endDate)}</span>
                        </div>
                      </CardHeader>
                       <CardContent className="flex-grow flex items-end">
                        <p className="text-sm text-muted-foreground">
                            Jumlah Kandidat: {Object.keys(election.candidates || {}).length}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center md:text-left text-muted-foreground py-10">Tidak ada pemilihan yang sedang aktif saat ini.</p>
              )}
            </div>

            {/* Right Column: Login Form */}
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-sm">
                <Card>
                <CardHeader className="text-center">
                    <CardTitle>Login Pemilih</CardTitle>
                    <CardDescription>
                    Silakan masuk menggunakan ID Pemilih dan Kata Sandi Anda untuk memberikan suara.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
