import { useMutation, useQueryClient } from '@tanstack/react-query';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { BarChart3, ListTree, ShieldCheck, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { BrandMark } from '@/components/brand-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { t, type TranslationKey } from '@/i18n';
import { isApiError } from '@/lib/api-client';
import { readToken, saveToken } from '@/lib/token';
import { login, loginFormSchema, meQueryKey } from './api';
import { safeNext } from './session';

const HIGHLIGHTS: { icon: typeof Users; key: TranslationKey }[] = [
  { icon: BarChart3, key: 'login.highlightStats' },
  { icon: Users, key: 'login.highlightUsers' },
  { icon: ListTree, key: 'login.highlightCatalog' },
];

/** 401 and 400 say the same thing on purpose: the server never tells which factor failed. */
function loginErrorKey(error: unknown): TranslationKey {
  if (isApiError(error, 429)) return 'login.tooManyAttempts';
  if (isApiError(error, 401) || isApiError(error, 400)) return 'login.invalidCredentials';
  if (isApiError(error) && error.kind === 'network') return 'errors.network';
  return 'errors.generic';
}

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const next = safeNext(params.get('next'));
  const expired = params.get('expired') === '1';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      saveToken(result.accessToken, result.expiresAt);
      queryClient.setQueryData(meQueryKey, result.admin);
      void navigate(next, { replace: true });
    },
    onError: () => setTotp(''),
  });

  const input = { username, password, totp };
  const valid = loginFormSchema.safeParse(input).success;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = loginFormSchema.safeParse(input);
    if (parsed.success) mutation.mutate(parsed.data);
  }

  if (readToken() && !mutation.isPending && !mutation.isSuccess) {
    return <Navigate to={next} replace />;
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-primary-foreground/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -start-16 -bottom-32 size-80 rounded-full bg-primary-foreground/5"
          aria-hidden
        />
        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          {t('brand.name')}
        </div>
        <div className="relative flex max-w-md flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {t('login.heroTitle')}
          </h2>
          <ul className="flex flex-col gap-4 text-sm">
            {HIGHLIGHTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs opacity-80">{t('login.footer')}</p>
      </aside>

      <div className="relative flex flex-col items-center justify-center bg-background p-6">
        <div className="absolute end-4 top-4">
          <ThemeToggle />
        </div>
        <div className="flex w-full max-w-sm flex-col gap-8">
          <BrandMark size="lg" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('login.subtitle')}</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            {expired && !mutation.isError && (
              <Alert>
                <AlertDescription>{t('login.sessionExpired')}</AlertDescription>
              </Alert>
            )}
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>{t(loginErrorKey(mutation.error))}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{t('login.username')}</Label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                className="h-10"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="totp">{t('login.totp')}</Label>
              <InputOTP
                id="totp"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totp}
                onChange={setTotp}
                containerClassName="justify-start"
              >
                <InputOTPGroup dir="ltr">
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} className="size-11 bg-card text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground">{t('login.totpHint')}</p>
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-10"
              disabled={!valid || mutation.isPending}
            >
              {mutation.isPending ? t('login.signingIn') : t('login.submit')}
            </Button>
          </form>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" aria-hidden />
            {t('login.securityNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
