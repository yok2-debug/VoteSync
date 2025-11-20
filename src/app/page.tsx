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
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  return (
    <>
      <PublicNavbar />
      <main className="flex min-h-screen flex-col items-center bg-background p-4 pt-20">
        <div className="w-full max-w-4xl mx-auto space-y-10">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Selamat Datang di VoteSync</h1>
            <p className="text-muted-foreground">Sistem E-Voting untuk pemilihan yang transparan dan aman.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Memuat data pemilihan...</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-center mb-6">Pemilihan Aktif</h2>
              {activeElections.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeElections.map((election) => (
                    <Card key={election.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                           <CardTitle>{election.name}</CardTitle>
                           {getStatus(election)}
                        </div>
                        <CardDescription>{election.description}</CardDescription>
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
                <p className="text-center text-muted-foreground">Tidak ada pemilihan yang sedang aktif saat ini.</p>
              )}
            </div>
          )}

          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
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
      </main>
    </>
  );
}
