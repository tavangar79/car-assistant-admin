import { useMutation, useQueryClient } from '@tanstack/react-query';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { CarFront } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { t, type TranslationKey } from '@/i18n';
import { isApiError } from '@/lib/api-client';
import { readToken, saveToken } from '@/lib/token';
import { login, loginFormSchema, meQueryKey } from './api';
import { safeNext } from './session';

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
    <div className="relative flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="absolute end-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CarFront className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-lg">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
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
                containerClassName="justify-center"
              >
                <InputOTPGroup dir="ltr">
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-center text-xs text-muted-foreground">{t('login.totpHint')}</p>
            </div>
            <Button type="submit" size="lg" disabled={!valid || mutation.isPending}>
              {mutation.isPending ? t('login.signingIn') : t('login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
