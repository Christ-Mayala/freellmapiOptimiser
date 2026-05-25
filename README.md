# FreeLLMAPI Documentation

## Introduction
FreeLLMAPI est une interface API conçue pour interagir avec divers modèles de langage (LLM), offrant une gestion robuste des conversations, des clés API et des configurations de secours.

## Architecture
Le projet est structuré autour d'un framework modulaire permettant une isolation stricte des données par utilisateur.

### Composants clés
- **Conversations :** Gestion des historiques de chat, liés à un `userId`.
- **Clés API :** Gestion sécurisée des clés pour les différents fournisseurs de modèles.
- **Fallback :** Configuration de secours pour assurer la continuité de service.

## Validation des données
Le projet utilise `Zod` pour la validation des schémas de données, garantissant la cohérence et la sécurité des entrées API.

## Installation
1. Cloner le dépôt.
2. Installer les dépendances : `npm install`.
3. Configurer les variables d'environnement (`.env`).
4. Lancer le serveur : `npm run dev`.

## API
- `POST /api/conversations` : Créer une nouvelle conversation.
- `GET /api/conversations` : Lister les conversations de l'utilisateur.
- `POST /api/conversations/:id/messages` : Ajouter un message à une conversation.
