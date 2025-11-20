'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Vote as VoteIcon, Lock, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VoterLogoutButton } from './components/voter-logout-button';
import { useDatabase } from '@/context/database-context';
import { getVoterSession } from '@/lib/session';
import { useEffect, useState, useMemo } from 'react';
import Loading from '../loading';
import type { VoterSessionPayload } from '@/lib/types';

export default function VoterDashboardPage() {
  const router = useRouter();
  const { elections, voters, categories, isLoading: isDbLoading } = useDatabase();
  const [session, setSession] = useState<VoterSessionPayload | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    async function fetchSessionAndCheck() {
      const voterSession = await getVoterSession();
      if (!voterSession?.voterId) {
          router.push('/');
      } else {
        setSession(voterSession);
      }
      setIsSessionLoading(false);
    }
    fetchSessionAndCheck();
  }, [router]);

  const voter = useMemo(() => {
    if (!session?.voterId) return null;
    return voters.find(v => v.id === session.voterId);
  }, [voters, session]);
  
  const category = useMemo(() => {
      if (!voter) return null;
      return categories.find(c => c.id === voter.category);
  }, [categories, voter]);

  const availableElections = useMemo(() => {
    if (!category) return [];
    return elections.filter(e => {
        const isActive = e.status === 'active';
        const isAllowed = category?.allowedElections?.includes(e.id);
        return isActive && isAllowed;
    });
  }, [elections, category]);
  
  const isLoading = isDbLoading || isSessionLoading;

  if (isLoading || !voter) {
    return <Loading />;
  }

  const now = new Date();

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Voter Dashboard</h1>
              <p className="text-muted-foreground">Selamat datang! Silakan gunakan hak pilih Anda.</p>
            </div>
            <VoterLogoutButton />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              <CardTitle>Informasi Pemilih</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-y-3 text-sm">
                <div className="text-muted-foreground">Nama</div>
                <div className="font-semibold">: {voter.name}</div>
                
                <div className="text-muted-foreground">Tanggal Lahir</div>
                <div className="font-semibold">: {voter.birthPlace || '-'}{voter.birthPlace && voter.birthDate ? ', ' : ''}{voter.birthDate || '-'}</div>

                <div className="text-muted-foreground">Jenis Kelamin</div>
                <div className="font-semibold">: {voter.gender || '-'}</div>

                <div className="text-muted-foreground">Alamat</div>
                <div className="font-semibold break-words">: {voter.address || '-'}</div>
             </div>
          </CardContent>
        </Card>

        {availableElections.length > 0 ? (
          <div className="space-y-4">
            {availableElections.map(election => {
              const hasVoted = voter?.hasVoted?.[election.id] === true;
              const electionStarted = election.startDate ? new Date(election.startDate) <= now : false;
              const electionEnded = election.endDate ? new Date(election.endDate) < now : false;

              let content;

              if (hasVoted) {
                 content = (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Anda sudah memberikan suara dalam pemilihan ini.</span>
                  </div>
                );
              } else if (electionEnded) {
                content = (
                  <div className="flex items-center gap-2 text-red-600">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Pemilihan ini telah berakhir.</span>
                  </div>
                );
              } else if (!electionStarted) {
                  content = (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Pemilihan ini belum dimulai.</span>
                    </div>
                  );
              } else {
                 content = (
                  <Link href={`/vote/${election.id}`}>
                    <Button className="w-full">
                      <VoteIcon className="mr-2 h-4 w-4" />
                      Masuk ke Halaman Voting
                    </Button>
                  </Link>
                );
              }

              return (
                <Card key={election.id}>
                  <CardHeader>
                    <CardTitle>{election.name}</CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {content}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Tidak ada pemilihan yang tersedia untuk kategori Anda saat ini.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
