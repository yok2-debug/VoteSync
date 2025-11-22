'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { ResetSystemDialog } from './components/reset-system-dialog';

export default function SettingsPage() {

  const resetOptions = [
    {
      action: 'reset_votes_and_status',
      title: 'Reset Suara & Status Pemilih',
      description: 'Menghapus semua suara yang masuk, mereset hasil pemilihan menjadi nol, dan mereset status "telah memilih" untuk semua pemilih. Ini memungkinkan pemungutan suara diulang.',
    },
    {
      action: 'delete_all_voters',
      title: 'Hapus Semua Pemilih',
      description: 'Secara permanen menghapus semua data pemilih dari sistem. Tindakan ini tidak dapat diurungkan.',
    },
    {
      action: 'reset_all_elections',
      title: 'Reset Semua Pemilihan',
      description: 'Menghapus semua pemilihan, kandidat, dan data terkait. Sistem akan menjadi kosong.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Kelola pengaturan seluruh sistem dan lakukan operasi reset.</p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>Zona Berbahaya</CardTitle>
          </div>
          <CardDescription>Tindakan ini tidak dapat diurungkan dan dapat menyebabkan kehilangan data permanen. Lanjutkan dengan sangat hati-hati.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetOptions.map((option) => (
            <Card key={option.action}>
              <CardHeader>
                <CardTitle className="text-lg">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{option.description}</p>
              </CardContent>
              <CardFooter>
                <ResetSystemDialog
                  action={option.action}
                  title={option.title}
                  description={option.description}
                />
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
