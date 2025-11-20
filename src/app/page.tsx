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
import type { Candidate, Election } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  
  const defaultAvatar = PlaceHolderImages.find(p => p.id === 'default-avatar');

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
                  {activeElections.map((election: Election) => {
                    const candidates = election.candidates ? Object.values(election.candidates).sort((a,b) => (a.orderNumber || 999) - (b.orderNumber || 999)) : [];
                    return (
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
                       <CardContent className="flex-grow flex items-end justify-between">
                        <p className="text-sm text-muted-foreground">
                            Jumlah Kandidat: {candidates.length}
                        </p>
                        {candidates.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                               <Button variant="secondary">
                                <Users className="mr-2 h-4 w-4" />
                                Lihat Kandidat
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Kandidat untuk {election.name}</DialogTitle>
                                <DialogDescription>
                                  Berikut adalah daftar kandidat yang berpartisipasi.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto p-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {candidates.map((candidate: Candidate) => (
                                    <div key={candidate.id} className="flex flex-col items-center text-center gap-2">
                                       <div className="relative">
                                          <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold border-2 border-background">
                                            {candidate.orderNumber}
                                          </span>
                                          <img
                                            src={candidate.photo || defaultAvatar?.imageUrl}
                                            alt={`Foto ${candidate.name}`}
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover w-20 h-20 border"
                                          />
                                       </div>
                                      <div className="text-sm font-medium leading-tight">
                                        <p>{candidate.name}</p>
                                        {candidate.viceCandidateName && <p className="text-xs text-muted-foreground">{candidate.viceCandidateName}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardContent>
                    </Card>
                  )})}
                </div>
              ) : (
                <p className="text-center md:text-left text-muted-foreground py-10">Tidak ada pemilihan yang sedang aktif saat ini.</p>
              )}
            </div>

            {/* Right Column: Login Form */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight text-center md:text-left">Login Pemilih</h2>
              <Card>
                <CardHeader className="text-center">
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
