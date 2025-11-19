import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AdminLoginForm } from './components/admin-login-form';
import { PublicNavbar } from '@/components/public-navbar';
import { Logo } from '@/components/logo';

export default function AdminLoginPage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 pt-20">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
             <div className="mx-auto">
                <Logo />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Enter your administrator credentials to continue</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>Access the management dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminLoginForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
