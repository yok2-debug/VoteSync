import { Logo } from '@/components/logo';
import { LoginForm } from '@/components/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PublicNavbar } from '@/components/public-navbar';
import { DatabaseProvider } from '@/context/database-context';

export default function LoginPage() {
  return (
    <DatabaseProvider>
      <PublicNavbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 pt-20">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto">
              <Logo />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang di VoteSync</h1>
            <p className="text-sm text-muted-foreground">Silakan masuk menggunakan ID Pemilih dan Kata Sandi Anda.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Login Pemilih</CardTitle>
              <CardDescription>Masukkan detail Anda untuk memberikan suara.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </DatabaseProvider>
  );
}
