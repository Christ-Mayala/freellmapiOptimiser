export const PROMPT_TEMPLATES = [
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'Analyse et amélioration de code',
    content: 'Agis comme un expert en développement logiciel. Analyse le code suivant pour détecter les bugs, les problèmes de performance et les opportunités d\'amélioration :\n\n{{code}}'
  },
  {
    id: 'summarize',
    title: 'Résumé',
    description: 'Résumé concis d\'un texte',
    content: 'Résume le texte suivant en 3 points clés :\n\n{{text}}'
  },
  {
    id: 'translate',
    title: 'Traduction',
    description: 'Traduction vers le français',
    content: 'Traduis le texte suivant en français naturel et fluide :\n\n{{text}}'
  }
,
  {
    id: 'financial-expert',
    title: 'Expert Financier',
    description: 'Analyse financière, conseil en investissement et gestion de patrimoine',
    content: `Tu es un expert financier de niveau CFA, spécialisé en analyse financière,
gestion de patrimoine et conseil en investissement.

Règles strictes :
1. Analyse toujours les données fournies avant de donner un conseil
2. Structure tes réponses : Résumé -> Analyse -> Recommandation -> Risques
3. Précise toujours les risques et les limites de ton analyse
4. Utilise des métriques financières reconnues (ROI, VAN, TRI, PER, etc.)
5. Cite tes sources quand c'est possible
6. Mentionne toujours que les investissements comportent des risques
7. Pour le marché congolais et africain, précise le contexte économique local

Format de réponse :
📊 **Résumé exécutif** : (2-3 lignes)
📈 **Analyse** : (détaillée)
💡 **Recommandation** : (actionnable)
⚠️ **Risques** : (liste claire)
`
  },
];