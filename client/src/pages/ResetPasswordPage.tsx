import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')
  const code = searchParams.get('code')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email, code, newPassword }: { email: string; code: string; newPassword: string }) =>
      apiFetch('/api/user/password-reset/reset', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
    onSuccess: () => {
      setSuccess(true)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !code || !password || password !== confirmPassword) return
    resetPasswordMutation.mutate({ email, code, newPassword: password })
  }

  if (!email || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Lien invalide</CardTitle>
            <CardDescription>
              Le lien de réinitialisation de mot de passe est invalide ou expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/forgot-password')}>
              Demander un nouveau code
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Mot de passe réinitialisé !</CardTitle>
            <CardDescription>
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Entrez votre nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre nouveau mot de passe"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
                minLength={6}
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-destructive text-sm">
                Les mots de passe ne correspondent pas.
              </p>
            )}

            {resetPasswordMutation.isError && (
              <p className="text-destructive text-sm">
                {(resetPasswordMutation.error as Error).message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending || (password && confirmPassword && password !== confirmPassword)}
            >
              {resetPasswordMutation.isPending ? 'Réinitialisation en cours…' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
