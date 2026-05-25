import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SectionHeader } from '@/components/page-header'

interface FallbackEntry {
  modelDbId: string
  priority: number
  effectivePriority: number
  penalty: number
  rateLimitHits: number
  enabled: boolean
  platform: string
  modelId: string
  displayName: string
  intelligenceRank: number
  speedRank: number
  sizeLabel: string
  rpmLimit: number | null
  rpdLimit: number | null
  monthlyTokenBudget: string
  keyCount: number
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeFallbackEntries(data: unknown): FallbackEntry[] {
  if (!Array.isArray(data)) return []

  const seen = new Set<string>()
  const normalized: FallbackEntry[] = []

  for (const raw of data) {
    const entry = (raw ?? {}) as Partial<FallbackEntry> & { modelDbId?: unknown }
    const modelDbId = String(entry.modelDbId ?? '').trim()
    if (!modelDbId || seen.has(modelDbId)) continue
    seen.add(modelDbId)

    const priority = toFiniteNumber(entry.priority, normalized.length + 1)
    normalized.push({
      modelDbId,
      priority,
      effectivePriority: toFiniteNumber(entry.effectivePriority, priority),
      penalty: toFiniteNumber(entry.penalty, 0),
      rateLimitHits: toFiniteNumber(entry.rateLimitHits, 0),
      enabled: entry.enabled === true,
      platform: String(entry.platform ?? ''),
      modelId: String(entry.modelId ?? ''),
      displayName: String(entry.displayName ?? ''),
      intelligenceRank: toFiniteNumber(entry.intelligenceRank, 0),
      speedRank: toFiniteNumber(entry.speedRank, 0),
      sizeLabel: String(entry.sizeLabel ?? ''),
      rpmLimit: toNullableNumber(entry.rpmLimit),
      rpdLimit: toNullableNumber(entry.rpdLimit),
      monthlyTokenBudget: String(entry.monthlyTokenBudget ?? '0'),
      keyCount: toFiniteNumber(entry.keyCount, 0),
    })
  }

  return normalized.sort((a, b) => a.priority - b.priority)
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface TokenUsageData {
  totalBudget: number
  totalUsed: number
  models: { displayName: string; platform: string; budget: number }[]
}

const platformColors: Record<string, string> = {
  google:      '#4285f4',
  groq:        '#f55036',
  cerebras:    '#8b5cf6',
  sambanova:   '#14b8a6',
  nvidia:      '#76b900',
  mistral:     '#f59e0b',
  openrouter:  '#ec4899',
  github:      '#6e7b8b',
  cohere:      '#d946ef',
  cloudflare:  '#f38020',
  zhipu:       '#06b6d4',
  ollama:      '#000000',
  kilo:        '#7c3aed',
  pollinations: '#a855f7',
  llm7:        '#0ea5e9',
}

function TokenUsageBar({ data }: { data: TokenUsageData }) {
  const { totalBudget, totalUsed, models } = data
  const remaining = Math.max(0, totalBudget - totalUsed)
  const remainingPct = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0

  // Scale each model's segment proportionally so the colored portion of the
  // bar sums to `remaining`; the grey tail represents what's been used.
  const modelsWithWidth = models.map(m => ({
    ...m,
    remainingTokens: totalBudget > 0 ? (m.budget / totalBudget) * remaining : 0,
    widthPct: totalBudget > 0 ? (m.budget / totalBudget) * (remaining / totalBudget) * 100 : 0,
  }))
  const usedPct = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-medium">Budget de jetons mensuel</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="text-foreground font-medium">{formatTokens(remaining)}</span> restants
          <span className="mx-1.5">·</span>
          {remainingPct}% de {formatTokens(totalBudget)}
        </span>
      </div>

      <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
        {modelsWithWidth.map((m, i) => (
          <div
            key={i}
            title={`${m.displayName} (${m.platform}) — ${formatTokens(m.remainingTokens)} remaining`}
            style={{
              width: `${m.widthPct}%`,
              backgroundColor: platformColors[m.platform] ?? '#94a3b8',
            }}
          />
        ))}
        {totalUsed > 0 && (
          <div
            title={`Utilisés — ${formatTokens(totalUsed)}`}
            className="bg-muted-foreground/30"
            style={{ width: `${usedPct}%` }}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1.5 text-xs tabular-nums">
        {modelsWithWidth.map((m, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span
              className="size-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: platformColors[m.platform] ?? '#94a3b8' }}
            />
            <span className="truncate">{m.displayName}</span>
            <span className="flex-1" />
            <span className="font-mono text-muted-foreground">{formatTokens(m.remainingTokens)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

interface SortableModelRowProps {
  entry: FallbackEntry
  index: number
  onToggle: (modelDbId: string, enabled: boolean) => void
}

function SortableModelRow({
  entry,
  index,
  onToggle,
}: SortableModelRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.modelDbId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-4 py-3 bg-card ${isDragging ? 'opacity-50' : ''} ${entry.enabled ? '' : 'opacity-50'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors"
        aria-label="Glisser pour réorganiser"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <span className="text-xs font-mono text-muted-foreground w-5 tabular-nums">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{entry.displayName}</span>
          <span className="text-xs text-muted-foreground">{entry.platform}</span>
          {entry.penalty > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              −{entry.penalty} pénalité
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground tabular-nums">
          <span>Intel #{entry.intelligenceRank}</span>
          <span>Vitesse #{entry.speedRank}</span>
          {entry.rpmLimit && <span>{entry.rpmLimit} rpm</span>}
          {entry.rpdLimit && <span>{entry.rpdLimit} rpd</span>}
          <span>{entry.monthlyTokenBudget} jet/mois</span>
        </div>
      </div>
      <Switch
        checked={entry.enabled}
        onCheckedChange={(checked) => onToggle(entry.modelDbId, checked)}
      />
    </div>
  )
}

export default function FallbackPage() {
  const queryClient = useQueryClient()
  const [localEntries, setLocalEntries] = useState<FallbackEntry[] | null>(null)

  const { data: entries = [], isLoading } = useQuery<FallbackEntry[]>({
    queryKey: ['fallback'],
    queryFn: () => apiFetch('/api/fallback').then(normalizeFallbackEntries),
  })

  const { data: tokenUsage } = useQuery<TokenUsageData>({
    queryKey: ['fallback', 'token-usage'],
    queryFn: () => apiFetch('/api/fallback/token-usage'),
  })

  const saveMutation = useMutation({
    mutationFn: (data: { modelDbId: string; priority: number; enabled: boolean }[]) =>
      apiFetch('/api/fallback', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fallback'] })
      setLocalEntries(null)
    },
  })

  const sortMutation = useMutation({
    mutationFn: (preset: string) =>
      apiFetch(`/api/fallback/sort/${preset}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fallback'] })
      setLocalEntries(null)
    },
  })

  const allEntries = localEntries ?? entries
  const displayEntries = allEntries.filter(e => e.modelDbId && e.keyCount > 0 && e.enabled)
  const hiddenEntries = allEntries.filter(e => !(e.modelDbId && e.keyCount > 0 && e.enabled))
  const unconfiguredPlatforms = [...new Set(hiddenEntries.filter(e => e.keyCount === 0).map(e => e.platform))]

  // Filtrer le budget de jetons pour n'afficher que les modèles actuellement activés
  const filteredTokenUsage = tokenUsage ? (() => {
    const filteredModels = tokenUsage.models.filter(m =>
      displayEntries.some(e => e.displayName === m.displayName && e.platform === m.platform)
    )
    const filteredBudget = filteredModels.reduce((sum, m) => sum + m.budget, 0)
    return {
      totalBudget: filteredBudget,
      totalUsed: Math.min(tokenUsage.totalUsed, filteredBudget),
      models: filteredModels,
    }
  })() : undefined

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const oldIndex = displayEntries.findIndex(e => String(e.modelDbId) === activeId)
    const newIndex = displayEntries.findIndex(e => String(e.modelDbId) === overId)
    if (oldIndex < 0 || newIndex < 0) return

    const reorderedVisible = arrayMove(displayEntries, oldIndex, newIndex)
    const merged = [
      ...reorderedVisible.map((e, i) => ({ ...e, priority: i + 1 })),
      ...hiddenEntries.map((e, i) => ({ ...e, priority: reorderedVisible.length + i + 1 })),
    ]
    setLocalEntries(merged)
  }

  function handleToggle(modelDbId: string, enabled: boolean) {
    const updated = allEntries.map(e =>
      e.modelDbId === modelDbId ? { ...e, enabled } : e
    )
    setLocalEntries(updated)
  }

  function handleSave() {
    if (!localEntries) return
    saveMutation.mutate(
      allEntries.map(e => ({
        modelDbId: e.modelDbId,
        priority: e.priority,
        enabled: e.enabled,
      }))
    )
  }

  const hasChanges = localEntries !== null

  return (
    <div>
      <SectionHeader
        title="Chaîne de secours (Fallback)"
        description="Faites glisser pour réorganiser. Les requêtes essaient les modèles de haut en bas jusqu'à ce que l'un d'eux réussisse."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => sortMutation.mutate('intelligence')} disabled={sortMutation.isPending}>
              Trier par intelligence
            </Button>
            <Button variant="outline" size="sm" onClick={() => sortMutation.mutate('speed')} disabled={sortMutation.isPending}>
              Trier par vitesse
            </Button>
            <Button variant="outline" size="sm" onClick={() => sortMutation.mutate('budget')} disabled={sortMutation.isPending}>
              Trier par budget
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {filteredTokenUsage && filteredTokenUsage.totalBudget > 0 && (
          <TokenUsageBar data={filteredTokenUsage} />
        )}

        {isLoading ? (
          <p key="loading" className="text-sm text-muted-foreground">Chargement…</p>
        ) : displayEntries.length === 0 ? (
          <div key="empty" className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun modèle disponible. Ajoutez des clés API sur la page <a href="/keys" className="underline text-foreground">Clés API</a> d'abord.
            </p>
          </div>
        ) : (
          <div key="fallback-list" className="space-y-6">
            <div className="rounded-lg border divide-y overflow-hidden">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayEntries.map(e => String(e.modelDbId))}
                  strategy={verticalListSortingStrategy}
                >
                  {displayEntries.map((entry, index) => (
                    <SortableModelRow
                      key={entry.modelDbId}
                      entry={entry}
                      index={index}
                      onToggle={handleToggle}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            {hasChanges && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setLocalEntries(null)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Sauvegarde…' : 'Enregistrer l\'ordre'}
                </Button>
              </div>
            )}

            {unconfiguredPlatforms.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Cachés (aucune clé) : {unconfiguredPlatforms.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
