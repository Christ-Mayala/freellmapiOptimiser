'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SectionHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { memo } from 'react'

/* -------------------------------------------------------------------------- */
/*  Données – on pourrait les placer dans un JSON / CMS plus tard               */
/* -------------------------------------------------------------------------- */
const technologies = [
  'JavaScript / TypeScript',
  'React / Next.js',
  'Node.js / Express',
  'MongoDB / MySQL',
  'Flutter / React Native',
  'Firebase',
  'Git / GitHub',
  'Angular',
  'API REST',
  'IA conversationnelle',
  'Automatisation',
] as const

/* -------------------------------------------------------------------------- */
/*  Badge optimisé (memo)                                                     */
/* -------------------------------------------------------------------------- */
const TechBadge = memo(({ tech }: { tech: typeof technologies[number] }) => (
  <Badge variant="secondary" className="text-sm px-3 py-1">
    {tech}
  </Badge>
))
TechBadge.displayName = 'TechBadge'

/* -------------------------------------------------------------------------- */
/*  Petite section réutilisable – rend le JSX plus lisible                      */
/* -------------------------------------------------------------------------- */
type SectionProps = {
  title: string
  children: React.ReactNode
}
const Section = ({ title, children }: SectionProps) => (
  <section className="space-y-2">
    <h4 className="font-semibold text-lg">{title}</h4>
    {children}
  </section>
)

/* -------------------------------------------------------------------------- */
/*  Page principale                                                            */
/* -------------------------------------------------------------------------- */
export default function PresentationPage() {
  const navigate = useNavigate()
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Retour au profil */}
      <div className="flex items-center mb-4">
        <Button
          onClick={() => {
            scrollToTop()
            navigate('/profile')
          }}
        >
          ↩ Retour au profil
        </Button>
      </div>

      {/* En‑tête de la page */}
      <SectionHeader
        title="Qui suis‑je ?"
        description="Mon parcours, mes coups de cœur tech et ce qui me motive au quotidien."
      />

      {/* Contenu principal */}
      <main className="space-y-6 max-w-4xl mx-auto px-4 py-6">
        <Card className="animate-fade-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Voilà un peu sur moi</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* ==== Identité ==== */}
            <section className="space-y-4">
              <header>
                <h3 className="text-xl font-semibold">Alvine May</h3>
                <p className="text-muted-foreground">
                  Développeur·se full‑stack indépendant·e, j’adore créer des expériences web et mobiles qui claquent.
                </p>
              </header>

              <article className="space-y-2">
                <p>
                  En plein bootcamp d’ingénierie informatique, je passe mon temps à bidouiller de l’IA,
                  des systèmes embarqués et tout ce qui touche à l’innovation.
                </p>
                <p>
                  J’aime concevoir des applis « smart » qui boostent la productivité, automatisent les tâches
                  rébarbatives et offrent une UX fluide comme du beurre.
                </p>
              </article>
            </section>

            <Separator />

            {/* ==== CyberFusion ==== */}
            <Section title="Mon bébé : CyberFusion">
              <p>
                Une petite plateforme qui aide les boîtes, les étudiants et les curieux à exploiter l’IA
                et le web moderne. En gros : rendre la technologie accessible à tous.
              </p>
            </Section>

            <Separator />

            {/* ==== Compétences ==== */}
            <Section title="Ce que je manie au quotidien">
              <p>
                Front‑end / back‑end, intégration d’API, design d’interfaces, bases de données, systèmes
                intelligents et architecture d’applications. Tout ça, avec une bonne dose de bonne humeur !
              </p>
            </Section>

            <Separator />

            {/* ==== Projets annexes ==== */}
            <Section title="Petits projets qui me tiennent à cœur">
              <p>
                Des chatbots qui comprennent le texte et les images, des interfaces multimodales,
                des pipelines de traitement d’image… Le tout dans des infrastructures qui grandissent
                avec le projet.
              </p>
            </Section>

            <Separator />

            {/* ==== Tech stack ==== */}
            <Section title="Mes outils favoris">
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <TechBadge key={tech} tech={tech} />
                ))}
              </div>
            </Section>

            <Separator />

            {/* ==== Mission personnelle ==== */}
            <section className="bg-accent/30 dark:bg-accent/20 rounded-xl p-6">
              <h4 className="font-semibold text-lg mb-2">Ma petite mission</h4>
              <p className="italic text-foreground">
                « Construire des outils intelligents, simples d’accès et utiles pour faire décoller la
                transformation numérique en Afrique, notamment au Congo. »
              </p>
            </section>

            {/* Footer light */}
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Développé avec ❤️ par Alvine May.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}