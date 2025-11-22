'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { ResetSystemDialog } from './components/reset-system-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const { language, setLanguage } = useLanguage();

  const resetOptions = [
    {
      action: 'reset_voter_status',
    },
    {
      action: 'reset_election_results',
    },
    {
      action: 'delete_all_voters',
    },
    {
      action: 'reset_all_elections',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('pageDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('languageSettings.title')}</CardTitle>
          <CardDescription>{t('languageSettings.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={language} onValueChange={(value) => setLanguage(value as 'id' | 'en')}>
              <SelectTrigger>
                <SelectValue placeholder={t('languageSettings.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>{t('dangerZone.title')}</CardTitle>
          </div>
          <CardDescription>{t('dangerZone.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetOptions.map((option) => (
            <Card key={option.action}>
              <CardHeader>
                <CardTitle className="text-lg">{t(`${option.action}.title`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t(`${option.action}.description`)}</p>
              </CardContent>
              <CardFooter>
                <ResetSystemDialog
                  action={option.action}
                  title={t(`${option.action}.title`)}
                  description={t(`${option.action}.description`)}
                />
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
