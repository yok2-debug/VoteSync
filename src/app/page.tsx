
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
import { Calendar, Users, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ReactMarkdown from 'react-markdown';

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
      <div className="relative pt-16 pb-24 bg-gradient-to-br from-primary via-primary/90 to-accent">
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
                Selamat Datang di VoteSync
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-primary-foreground/90">
                Sistem e-voting yang aman, transparan, dan mudah digunakan. Berikan suara Anda untuk masa depan yang lebih baik.
            </p>
        </div>
      </div>
      <main className="-mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Elections List */}
            <div className="space-y-6 lg:col-span-2">
              <h2 className="text-2xl font-bold tracking-tight text-center lg:text-left">Pemilihan Aktif</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-64 bg-card rounded-lg shadow-lg">
                  <p className="text-muted-foreground">Memuat data pemilihan...</p>
                </div>
              ) : activeElections.length > 0 ? (
                activeElections.map((election: Election) => {
                  const candidates = election.candidates ? Object.values(election.candidates).sort((a,b) => (a.orderNumber || 999) - (b.orderNumber || 999)) : [];
                  return (
                  <Card key={election.id} className="flex flex-col group hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                         <CardTitle className="text-xl group-hover:text-primary transition-colors">{election.name}</CardTitle>
                         {getStatus(election)}
                      </div>
                       <div className="flex items-center text-sm text-muted-foreground gap-2">
                         <Calendar className="h-4 w-4" />
                         <span>{formatSchedule(election.startDate, election.endDate)}</span>
                      </div>
                    </CardHeader>
                     <CardContent className="flex-grow space-y-4">
                      <p className="text-muted-foreground text-sm line-clamp-2">{election.description}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-2 h-4 w-4" />
                          <span>{candidates.length} Kandidat Berpartisipasi</span>
                      </div>
                     </CardContent>
                     <CardContent>
                      {candidates.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                             <Button variant="outline" className="w-full">
                              Lihat Detail Kandidat
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-3xl pb-2">
                            <DialogHeader>
                              <DialogTitle>Kandidat untuk {election.name}</DialogTitle>
                              <DialogDescription>
                                Berikut adalah daftar kandidat yang berpartisipasi beserta visi dan misi mereka.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto p-1 space-y-4">
                              {candidates.map((candidate: Candidate) => (
                                <Card key={candidate.id} className="flex flex-col sm:flex-row items-start gap-4 p-4">
                                  <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full sm:w-32">
                                    <div className="relative">
                                        <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold border-2 border-background">
                                          {candidate.orderNumber}
                                        </span>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <img
                                              src={candidate.photo || defaultAvatar?.imageUrl}
                                              alt={`Foto ${candidate.name}`}
                                              width={100}
                                              height={100}
                                              className="rounded-full object-cover w-24 h-24 border cursor-pointer hover:opacity-90 transition-opacity"
                                            />
                                          </DialogTrigger>
                                          <DialogContent className="p-0 border-0 max-w-xl bg-transparent shadow-none">
                                            <DialogHeader>
                                              <DialogTitle className="sr-only">
                                                Foto {candidate.name} diperbesar
                                              </DialogTitle>
                                            </DialogHeader>
                                            <DialogClose asChild>
                                                <img
                                                  src={candidate.photo || defaultAvatar?.imageUrl}
                                                  alt={`Foto ${candidate.name}`}
                                                  className="w-full h-auto rounded-md cursor-pointer"
                                                />
                                            </DialogClose>
                                          </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold">{candidate.name}</p>
                                        {candidate.viceCandidateName && <p className="text-sm text-muted-foreground">{candidate.viceCandidateName}</p>}
                                    </div>
                                  </div>
                                  <div className="flex-grow border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
                                    <article className="prose prose-sm dark:prose-invert max-w-none">
                                      <h4>Visi</h4>
                                      <ReactMarkdown>{candidate.vision || 'Visi belum tersedia.'}</ReactMarkdown>
                                      <h4 className="mt-4">Misi</h4>
                                      <ReactMarkdown>{candidate.mission || 'Misi belum tersedia.'}</ReactMarkdown>
                                    </article>
                                  </div>
                                </Card>
                              ))}
                            </div>
                             <DialogFooter className="sm:justify-end">
                              <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                )})}
              ) : (
                 <Card>
                    <CardContent className="py-20 text-center">
                        <p className="text-muted-foreground">Tidak ada pemilihan yang sedang aktif saat ini.</p>
                    </CardContent>
                </Card>
              )}
            </div>

            {/* Login Form */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                 <Card className="shadow-xl">
                    <CardHeader>
                      <CardTitle>Login Pemilih</CardTitle>
                      <CardDescription>
                        Masukkan ID Pemilih dan Kata Sandi Anda untuk memberikan suara.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LoginForm />
                    </CardContent>
                  </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
