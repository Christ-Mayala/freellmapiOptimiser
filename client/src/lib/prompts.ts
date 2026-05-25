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
];
