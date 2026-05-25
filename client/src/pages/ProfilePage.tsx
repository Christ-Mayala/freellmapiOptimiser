import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionHeader } from '@/components/page-header'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import type { User } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string; password?: string }) =>
      apiFetch('/api/user/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (data) => {
      updateUser(data as User)
      setIsEditing(false)
      setPassword('')
      setConfirmPassword('')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch('/api/user/logout', { method: 'POST' }),
    onSuccess: () => {
      logout()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password && password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }

    const data: any = {}
    if (name !== user?.name) data.name = name
    if (email !== user?.email) data.email = email
    if (password) data.password = password

    updateProfileMutation.mutate(data)
  }

  return (
    <div>
      <SectionHeader
        title="Mon Compte"
        description="Gérez vos informations personnelles et votre compte."
      />

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Bouton Présentation */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-lg">Présentation</CardTitle>
            <CardDescription>
              Découvrez mon parcours et mes compétences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/profile/presentation')}>
              Voir ma présentation
            </Button>
          </CardContent>
        </Card>

        {/* Informations personnelles */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
            <CardDescription>
              Mettez à jour vos informations de profil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  placeholder="votre@email.com"
                />
              </div>

              {isEditing && (
                <>
                  <Separator className="my-4" />
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Laissez vide pour ne pas changer"
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez votre nouveau mot de passe"
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setName(user?.name || '')
                        setEmail(user?.email || '')
                        setPassword('')
                        setConfirmPassword('')
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Modifier le profil
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-lg">Sécurité</CardTitle>
            <CardDescription>
              Gérez la sécurité de votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-border/50">
              <div>
                <p className="font-medium">Déconnexion</p>
                <p className="text-sm text-muted-foreground">
                  Se déconnecter de votre compte.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Déconnexion…' : 'Se déconnecter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
