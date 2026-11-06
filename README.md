### Architecture du Projet : Etudes notaires

Ce document décrit l’architecture du frontend React + TypeScript du projet ainsi que les principales dépendances utilisées.

* * *

### 1\. Vision Globale

Le projet est organisé selon une architecture **feature-based (par modules métiers)**. Chaque module métier (`auth`, `clients`, `cases`, `documents`, `finance`, etc.) est isolé dans son propre dossier afin de :

*   Faciliter la maintenance
*   Améliorer la scalabilité
*   Éviter le couplage entre les features
*   Permettre le travail en équipe
*   Rendre le code réutilisable

* * *

### 2\. Structure du Projet

text

    src/
    ├── App.tsx
    ├── main.tsx
    │
    ├── app/
    ├── assets/
    │
    ├── features/
    │   ├── auth/
    │   ├── users/
    │   ├── clients/
    │   ├── cases/
    │   ├── documents/
    │   ├── finance/
    │   ├── tasks/
    │   ├── audit/
    │   ├── notifications/
    │   ├── workflow/
    │   └── field-agent/
    │
    ├── layouts/
    │   └── AuthLayout/
    │
    ├── routes/
    │
    ├── shared/
    │   ├── components/
    │   ├── services/
    │   ├── hooks/
    │   ├── utils/
    │   └── types/
    │
    └── styles/
    

Utilisez le code avec précaution.

* * *

### 3\. Modules Métier (Features)

###  Auth

*   Authentification (login / register)
*   Gestion JWT (token)
*   Protection des routes
*   Gestion des rôles (RBAC)

###  Users 

*   Gestion des employés du notariat
*   Attribution des rôles (juriste, comptable, assistant, etc.)
*   Activation / désactivation des comptes

###  Clients

*   Base clients (personnes physiques et morales)
*   Gestion des informations civiles et professionnelles
*   Recherche et consultation des clients

###  Cases (Dossiers notariaux)

*   Création et suivi des dossiers
*   Types : vente immobilière, succession
*   **Workflow complet :** `Open` → `Documents Pending` → `Drafting` → `Validation` → `Signature` → `Formalités` → `Closed`
*   Association des parties (acheteur, vendeur, héritier, etc.)
*   Vue Kanban des dossiers

###  Documents (GED)

*   Gestion documentaire des dossiers
*   Upload et stockage des fichiers
*   Checklists automatiques par type de dossier
*   **États des documents :** `Missing`, `Received`, `To Verify`, `Validated`

###  Finance

*   Gestion des honoraires (fees)
*   Suivi des taxes et débours
*   Historique des paiements
*   **Méthodes :** cash, virement bancaire, mobile money, chèque
*   Suivi du solde par dossier

###  Tasks

*   Gestion des tâches internes
*   Assignation aux utilisateurs
*   Deadlines et statuts
*   Liaison possible avec un dossier

###  Audit

*   Journal des actions sensibles
*   **Logs de sécurité :** connexions, téléchargements, modifications financières, actions critiques
*   Traçabilité complète (obligatoire pour la conformité)

###  Notifications

*   Notifications système en temps réel
*   Alertes de dossiers et tâches
*   Rappels importants

###  Workflow

*   Configuration des pipelines de dossiers
*   Personnalisation des étapes du cycle de vie
*   Adapté aux procédures notariales

###  Field-Agent (Future)

*   Interface mobile terrain
*   Upload de preuves (photos, documents)
*   Missions externes liées aux dossiers

* * *

### 4\. Dépendances

### Core

*   `react`
*   `react-dom`
*   `typescript`
*   `vite`

### Routing

*   `react-router-dom`

### API & Data Fetching

*   `axios`
*   `@tanstack/react-query`

### Forms & Validation

*   `react-hook-form`
*   `zod`

### State Management

*   `zustand` (recommandé)

### UI

*   `tailwindcss`
*   `lucide-react`
*   `sonner`
*   `clsx`

* * *

### 5\. Bonnes Pratiques

*   Architecture **feature-based** obligatoire.
*   Dossier `shared` uniquement pour le code 100% réutilisable.
*   Éviter les imports relatifs complexes (`../../`).
*   Utiliser les alias de chemin (`@/`).
*   Chaque module doit rester indépendant.
*   Logique métier isolée dans les `services/hooks`, pas dans les composants graphiques.

* * *

### 6\. Priorité MVP

Pour la première version du projet, l'accent est mis sur les modules suivants :

1.  **Auth**
2.  **Clients**
3.  **Cases**
4.  **Documents**
5.  **Finance** (version basique)

Les autres modules seront intégrés après la stabilisation de ce socle technique.

---

## Mode Offline-First

Le frontend est conçu pour continuer à fonctionner lorsque la connexion au backend Django est interrompue.

### Ce qui fonctionne hors connexion

- **Application installable (PWA)** : le shell React, les assets et les routes de navigation déjà connues sont précachés.
- **Lecture des données déjà consultées** : les réponses `GET` de l'API sont conservées dans IndexedDB, séparées par utilisateur.
- **Fallback automatique** : si une lecture API échoue sans réseau, Axios récupère la dernière réponse locale disponible.
- **Écritures différées** : les `POST`, `PUT`, `PATCH` et `DELETE` autorisés sont enregistrés dans une file IndexedDB.
- **Synchronisation automatique** : la file est rejouée lorsque la connexion revient, avec gestion du rafraîchissement JWT.
- **Uploads hors ligne** : les `File` contenus dans un `FormData` sont conservés dans IndexedDB et rejoués au retour du réseau.
- **Session dégradée** : le dernier utilisateur authentifié peut rouvrir l'application hors connexion afin de consulter les données déjà synchronisées.
- **Indicateur réseau** : l'interface affiche l'état hors ligne et le nombre d'actions en attente.

### Limites importantes

Le mode offline-first ne signifie pas que le serveur Django et PostgreSQL sont remplacés par le navigateur. **Django reste la source de vérité.** Une modification faite hors connexion est d'abord stockée localement puis envoyée au serveur au retour du réseau.

Les nouvelles créations qui nécessitent un identifiant généré par Django peuvent rester affichées comme « en attente » jusqu'à leur synchronisation. Il faut éviter de considérer une action comme définitivement validée tant que le serveur ne l'a pas acceptée.

### Stockage local

Les données API sont stockées dans IndexedDB :

- base : `EasyNotaireOffline`
- store : `api-cache`
- durée maximale d'une entrée : 30 jours
- taille maximale d'une réponse : 2 Mo
- maximum : 250 réponses

Le cache est isolé par identifiant utilisateur et est supprimé lors d'une déconnexion/session expirée pour éviter de réutiliser les données d'un autre compte.

### Test hors ligne

1. Lancer `npm install`.
2. Lancer `npm run dev`.
3. Ouvrir l'application et consulter plusieurs pages pendant que le réseau fonctionne.
4. Dans les DevTools du navigateur, activer **Network → Offline**.
5. Recharger l'application.
6. Les pages et données déjà consultées doivent rester accessibles.
7. Effectuer une action d'écriture prise en charge : elle apparaît dans la file d'attente.
8. Réactiver le réseau : la file doit être rejouée automatiquement.

Pour tester réellement le service worker et l'installation PWA, utiliser `npm run build` puis `npm run preview` plutôt que le serveur de développement.
