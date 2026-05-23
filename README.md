# FreeLLMAPI - Frontend

**Une interface OpenAI-compatible. Onze fournisseurs LLM gratuits. ~1B+ tokens par mois.**

Interface d'administration React + Vite pour FreeLLMAPI, connectée à ton backend DryApi déployé sur Render.

## À propos du projet

FreeLLMAPI agrège les tiers gratuits de Google, Groq, Cerebras, SambaNova, NVIDIA, Mistral, OpenRouter, GitHub Models, Cohere, Cloudflare et Z.ai (Zhipu) derrière un seul endpoint `/v1/chat/completions`. Les clés sont stockées de façon chiffrée. Un routeur choisit le meilleur modèle disponible pour chaque requête, bascule sur le fournisseur suivant lorsque l'un est limité par le débit, et suit l'utilisation par clé pour que tu restes en dessous de tous les quotas des tiers gratuits.

## Fonctionnalités

- 🔑 **Gestion des clés API fournisseurs** — Ajoute, modifie et supprime tes clés API pour chaque fournisseur
- 🔄 **Chaîne de secours (Fallback Chain)** — Réorganise l'ordre de priorité des modèles
- 📊 **Analytiques** — Visualise les requêtes, le taux de réussite, les tokens et la latence
- 🎮 **Playground** — Teste les modèles directement dans l'interface
- 🌙 **Mode sombre** — Interface adaptée à la lumière et à l'obscurité
- 📈 **Suivi de l'état des clés** — Vois quelle clé est saine, limitée ou invalide

## Configuration

### Backend
Ce frontend est connecté à ton backend DryApi :
- **URL**: `https://dryapi.onrender.com`

### Variables d'environnement

Crée un fichier `.env` à la racine (ou configure-le sur Netlify) :
```env
VITE_API_URL=https://dryapi.onrender.com
```

## Développement local

```bash
# Aller dans le dossier client
cd client

# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) dans ton navigateur.

## Déploiement sur Netlify

### Étape 1 : Pousser le code sur GitHub/GitLab
```bash
cd d:\Alvine\freellmapi
git init
git add .
git commit -m "Initial commit - FreeLLMAPI Frontend"
git remote add origin <URL_DE_TON_REPO_GITHUB>
git branch -M main
git push -u origin main
```

### Étape 2 : Déployer sur Netlify
1.  Va sur [app.netlify.com](https://app.netlify.com)
2.  Clique sur **"Add new site" → "Import an existing project"**
3.  Connecte ton compte GitHub/GitLab et sélectionne ton repo
4.  Configure les paramètres de build :
    - **Build command**: `cd client && npm install && npm run build`
    - **Publish directory**: `client/dist`
5.  **IMPORTANT**: Ajoute une variable d'environnement dans Netlify :
    - Dans les **Settings** du site → **Environment variables**
    - Ajoute : `VITE_API_URL` avec la valeur `https://dryapi.onrender.com`
6.  Clique sur **Deploy site** !

### Étape 3 : Configurer les CORS sur le backend
N'oublie pas d'ajouter l'URL de ton frontend Netlify dans les origines CORS autorisées de ton backend DryApi sur Render !

## Build pour la production

```bash
cd client
npm run build
```

Le build optimisé se trouve dans le dossier `client/dist/`.

## Stack technique

- **React 19** — Framework UI
- **Vite** — Build tool et serveur de développement
- **TypeScript** — Typage statique
- **Tailwind CSS** — Framework CSS
- **shadcn/ui** — Composants UI
- **React Router** — Routage
- **Recharts** — Graphiques
- **TanStack Query** — Gestion des données serveur

## Fournisseurs supportés

- Google (Gemini)
- Groq (Llama)
- Cerebras
- SambaNova
- Mistral
- OpenRouter
- GitHub Models
- Cloudflare Workers AI
- Cohere
- Z.ai (Zhipu)
- NVIDIA (désactivé par défaut)
