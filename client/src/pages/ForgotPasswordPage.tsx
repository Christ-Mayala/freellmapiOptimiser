import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')

  const requestResetMutation = useMutation({
    mutationFn: (email: string) =>
      apiFetch('/api/user/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
    onSuccess: () => {
      setStep('code')
    },
  })

  const verifyCodeMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      apiFetch('/api/user/password-reset/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
    onSuccess: () => {
      navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`)
    },
  })

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    requestResetMutation.mutate(email)
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !code) return
    verifyCodeMutation.mutate({ email, code })
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Entrez le code</CardTitle>
            <CardDescription>
              Un code de vérification a été envoyé à <span className="font-medium">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>

              {verifyCodeMutation.isError && (
                <p className="text-destructive text-sm">
                  {(verifyCodeMutation.error as Error).message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? 'Vérification en cours…' : 'Vérifier le code'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-primary underline"
              >
                Modifier l'email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre adresse email pour recevoir un code de vérification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            {requestResetMutation.isError && (
              <p className="text-destructive text-sm">
                {(requestResetMutation.error as Error).message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={requestResetMutation.isPending}
            >
              {requestResetMutation.isPending ? 'Envoi en cours…' : 'Envoyer le code'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Vous vous souvenez de votre mot de passe ? </span>
            <Link to="/login" className="text-primary underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
