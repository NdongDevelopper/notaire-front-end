# Module Modèles d'actes — VOLKENO CRM Notarial

Implémentation de la **Bibliothèque de Modèles** (cahier des charges §12,
Lot 5) : liste filtrable par type d'acte, création et édition d'un modèle
via un éditeur en modal avec insertion de variables.

## Structure

```
models-module/
├── index.ts                       # exports groupés du module
├── types/
│   └── models.ts                  # TypeActe, EtapeWorkflow, ChecklistPiece, Etude, ModeleActe
├── services/
│   └── modelsApi.ts               # appels REST (session Django + CSRF)
├── components/
│   ├── CategoryFilter.tsx          # panneau "Catégories" (types d'actes)
│   ├── ModelCard.tsx               # carte d'un modèle dans la bibliothèque
│   └── ModelDetailsModal.tsx       # éditeur en modal (contenu + variables)
└── pages/
    └── ModelsLibraryPage.tsx       # page complète: filtre + grille + modal
```

## ⚠️ À propos des endpoints

Vous avez fourni ces 4 groupes d'endpoints pour ce module :

- `GET/POST/PATCH /api/etude/` — informations de l'étude
- `GET/POST/PATCH/DELETE /api/types-actes/` — catégories (Vente, Succession, Donation, Bail…)
- `GET/POST/PATCH/DELETE /api/etapes-workflow/` — étapes de workflow par type d'acte
- `GET/POST/PATCH/DELETE /api/checklist-pieces/` — checklist des pièces par type d'acte

Ils sont tous câblés dans `services/modelsApi.ts`. **Aucun endpoint n'a en
revanche été fourni pour le contenu des modèles eux-mêmes** (titre, texte,
variables, date de mise à jour — ce qu'affichent les cartes et l'éditeur des
captures d'écran). J'ai donc supposé une ressource `/api/modeles-actes/`
suivant exactement la même convention que les autres (`GET/POST/PATCH/DELETE`
+ un `POST /api/modeles-actes/<id>/dupliquer/` pour la duplication prévue au
cahier des charges §12). **Merci de créer cet endpoint côté Django (ou de me
donner son nom réel si il existe déjà)** — le frontend n'a rien d'autre à
changer une fois qu'il répond avec la forme :

```json
{
  "id": "uuid-ou-int",
  "titre": "Acte de Vente Immobilière Standard",
  "type_acte": "vente",
  "contenu": "PAR DEVANT Maître {{notaire}}...",
  "variables": ["vendeur", "acheteur", "montant"],
  "derniere_maj": "2024-05-12T10:00:00Z"
}
```

## Comment ça s'utilise

```tsx
import { ModelsLibraryPage } from "./modules/models";

<ModelsLibraryPage peutModifier={role === "associe" || role === "juriste"} />
```

- La **liste des catégories** vient de `/api/types-actes/` (filtrées sur
  `actif: true`).
- Cliquer sur une carte ouvre `ModelDetailsModal` en mode édition, préremplie
  avec le contenu du modèle.
- Cliquer sur **"Nouveau Modèle"** ouvre le même modal en mode création (titre
  + type d'acte à choisir).
- Dans l'éditeur, cliquer sur une variable (`{{vendeur}}`, `{{montant}}`…)
  l'insère directement à la position du curseur dans le contenu.
- Les variables proposées sont actuellement un catalogue **statique par type
  d'acte** (`VARIABLES_PAR_DEFAUT` dans `types/models.ts`), le temps qu'un
  vrai catalogue dynamique existe côté API.

## Permissions

La prop `peutModifier` masque le bouton "Nouveau Modèle" et pourra être
réutilisée pour désactiver l'enregistrement dans `ModelDetailsModal` selon
le rôle (associé/juriste autorisés, cahier des charges §12 : "un utilisateur
autorisé crée un modèle d'acte").

## Non couvert par ce module

- Génération d'un brouillon d'acte à partir d'un modèle + d'un dossier
  (préremplissage des variables réelles, export Word/PDF) — c'est le
  parcours "Rédaction et génération d'actes" du dossier, un module distinct.
- Gestion des étapes de workflow et de la checklist par type d'acte dans une
  UI dédiée : les fonctions du service existent (`listerEtapesWorkflow`,
  `listerChecklistPieces`, etc.) mais ne sont pas encore branchées à un écran
  — probablement à intégrer dans "Paramètres" (cahier des charges §18).
