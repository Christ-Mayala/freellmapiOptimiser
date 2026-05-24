import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, Trash2, Key, ShieldAlert, BarChart, Sun, Moon, PanelLeftClose, PanelLeftOpen, MessageCircle, User } from 'lucide-react'
import type { Conversation } from '../types'

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
  const startOf7DaysAgo = new Date(startOfToday.getTime() - 6 * 86400000)
  const startOf30DaysAgo = new Date(startOfToday.getTime() - 29 * 86400000)

  if (date >= startOfToday) return "Aujourd'hui"
  if (date >= startOfYesterday) return 'Hier'
  if (date >= startOf7DaysAgo) return 'Cette semaine'
  if (date >= startOf30DaysAgo) return 'Ce mois'
  return 'Plus ancien'
}

const DATE_GROUP_ORDER = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Ce mois', 'Plus ancien']

export function Sidebar() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => apiFetch('/api/conversations').then(data => Array.isArray(data) ? data : []),
  })

  const createConversation = useMutation({
    mutationFn: (title?: string) => apiFetch<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: title || `Conversation ${new Date().toLocaleString()}` })
    }),
    onSuccess: (data: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/c/${data.id}`)
    },
  })

  const deleteConversation = useMutation({
    mutationFn: (convId: string) => apiFetch(`/api/conversations/${convId}`, { method: 'DELETE' }),
    onSuccess: (_, convId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (id === convId) {
        navigate('/c/new')
      }
    },
  })

  return (
    <div className={`relative flex-shrink-0 flex flex-col transition-all duration-300 border-r border-border/40 bg-[#f9f9f9] dark:bg-[#171717] ${collapsed ? 'w-0' : 'w-[260px]'}`}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-10 top-3 z-50 rounded-xl hover:bg-accent text-muted-foreground w-8 h-8"
        aria-label="Basculer la barre latérale"
      >
        {collapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
      </Button>

      <div className={`flex flex-col h-full overflow-hidden w-[260px] ${collapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {/* En-tête */}
        <div className="p-3">
          <Button 
            variant="ghost" 
            onClick={() => {
          const defaultTitle = `Conversation ${new Date().toLocaleString()}`;
          createConversation.mutate(defaultTitle);
        }}
            disabled={createConversation.isPending}
            className="w-full justify-start gap-2 h-10 px-3 bg-background hover:bg-accent border border-border/40 shadow-sm rounded-xl font-medium"
          >
            <Plus className="size-4" />
            <span>Nouvelle discussion</span>
          </Button>
        </div>

        {/* Liste des conversations groupées par date */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {conversations.length === 0 ? (
            <div key="no-conversations" className="px-2 py-4 text-center">
              <p className="text-xs text-muted-foreground">Aucune conversation</p>
            </div>
          ) : (
            <div key="conversations-list" className="space-y-4">
              {(() => {
                // Grouper les conversations par date
                const groups: Record<string, Conversation[]> = {}
                for (const conv of conversations) {
                  const label = getDateGroup(conv.updatedAt || conv.createdAt)
                  if (!groups[label]) groups[label] = []
                  groups[label].push(conv)
                }
                return DATE_GROUP_ORDER.filter(g => groups[g]?.length > 0).map(groupLabel => (
                  <div key={groupLabel} className="mb-2">
                    <div className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 pt-3 pb-1">
                      {groupLabel}
                    </div>
                    <div className="space-y-0.5">
                      {groups[groupLabel].map(conv => {
                        const isActive = location.pathname === `/c/${conv.id}` || (location.pathname === '/' && conv.id === conversations[0]?.id)
                        return (
                          <div
                            key={conv.id}
                            onClick={() => navigate(`/c/${conv.id}`)}
                            className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              isActive ? 'bg-accent/80 text-foreground' : 'hover:bg-accent/40 text-foreground/80'
                            }`}
                          >
                            <MessageSquare className="size-4 flex-shrink-0 opacity-70" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{conv.title}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 w-7 h-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-background/80 rounded-md transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation.mutate(conv.id as unknown as string)
                              }}
                              disabled={deleteConversation.isPending}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Menu du bas */}
        <div className="p-3 border-t border-border/40 space-y-1 bg-[#f9f9f9] dark:bg-[#171717]">
          <NavLink 
            to="/c/new" 
            className={() => {
              const isConvActive = location.pathname.startsWith('/c/')
              return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isConvActive ? 'bg-accent/80' : 'hover:bg-accent/40 text-foreground/80'}`
            }}
          >
            <MessageCircle className="size-4.5" />
            <span>Conversation</span>
          </NavLink>
          <NavLink 
            to="/keys" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent/80' : 'hover:bg-accent/40 text-foreground/80'}`}
          >
            <Key className="size-4.5" />
            <span>Clés API</span>
          </NavLink>
          <NavLink 
            to="/fallback" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent/80' : 'hover:bg-accent/40 text-foreground/80'}`}
          >
            <ShieldAlert className="size-4.5" />
            <span>Chaîne de secours</span>
          </NavLink>
          <NavLink 
            to="/analytics" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent/80' : 'hover:bg-accent/40 text-foreground/80'}`}
          >
            <BarChart className="size-4.5" />
            <span>Analyses</span>
          </NavLink>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent/80' : 'hover:bg-accent/40 text-foreground/80'}`}
          >
            <User className="size-4.5" />
            <span>Mon Compte</span>
          </NavLink>
          
          <div className="pt-2 mt-2 border-t border-border/40">
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium hover:bg-accent/40 text-foreground/80 transition-colors"
            >
              {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
              <span>{dark ? 'Mode Clair' : 'Mode Sombre'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
