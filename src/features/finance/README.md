# Module Finances — VOLKENO CRM Notarial

Implémentation du module **Finances** (cahier des charges §15, Lot 6) :
honoraires, débours, droits/taxes, frais administratifs, paiements, reste à
payer et statut financier par dossier.

## Structure

```
finance-module/
├── index.ts                     # exports groupés du module
├── types/
│   ├── finance.ts                # enums (catégorie, mode, statut), libellés, helpers
│   ├── invoice.ts                # type LigneFinanciere (charge facturée)
│   └── payment.ts                # type Paiement + SituationFinanciere
├── services/
│   └── financeApi.ts             # appels REST vers les endpoints fournis
├── components/
│   ├── StatsCard.tsx              # carte KPI (icône carrée + montant + libellé)
│   ├── FinanceSummary.tsx         # 4 KPIs: honoraires, débours, encaissé, restant à recouvrer
│   ├── PaymentForm.tsx            # onglets "Ajouter une charge" / "Enregistrer un paiement"
│   ├── PaymentTable.tsx           # tableau des charges facturées (vue par dossier)
│   ├── SettlementsTable.tsx       # "Grand Livre des Règlements" + export PDF
│   └── UrgentRecoveryPanel.tsx    # "Recouvrement Urgent": dossiers au plus gros reste à payer
└── pages/
    └── FinancePage.tsx            # page complète, deux modes (voir ci-dessous)
```

Dépendance additionnelle: **lucide-react** (icônes). Déjà présente si vous utilisez
shadcn/ui ou un starter React récent; sinon `npm install lucide-react`.

## Deux modes de `FinancePage`

- **`<FinancePage />`** (sans `dossierId`) → le **Module Comptabilité**
  transverse à toute l'étude: 4 KPIs, Grand Livre des Règlements (tous
  dossiers), panneau Recouvrement Urgent. C'est la vue derrière l'item de
  menu "Finances".
- **`<FinancePage dossierId={id} />`** → le suivi financier d'**un** dossier:
  mêmes KPIs recalculés sur ce dossier, formulaire d'ajout de charge /
  paiement, tableau des charges du dossier. C'est l'onglet "Finances" ouvert
  depuis la fiche d'un dossier.

## Endpoints utilisés (déjà fournis)

- `GET/POST /api/lignes-financieres/`
- `GET/PATCH/DELETE /api/lignes-financieres/<uuid:pk>/`
- `GET/POST /api/paiements/`
- `GET/PATCH/DELETE /api/paiements/<uuid:pk>/`
- `GET /api/paiements/situation/<uuid:dossier_id>/`

`services/financeApi.ts` lit l'URL de base dans
`process.env.REACT_APP_API_BASE_URL` (par défaut `/api`) et s'appuie sur
**l'authentification par session Django** :

- `credentials: "include"` est envoyé sur chaque requête pour que le cookie
  `sessionid` accompagne les appels (nécessaire même en dev si le frontend
  et l'API ne sont pas exactement sur le même port).
- Pour les méthodes `POST`/`PUT`/`PATCH`/`DELETE`, le header `X-CSRFToken`
  est automatiquement ajouté à partir du cookie `csrftoken` déposé par
  Django (`CSRF_COOKIE_NAME`, protection CSRF standard de Django).

Prérequis côté backend Django :

```python
# settings.py
CSRF_COOKIE_HTTPONLY = False  # le JS doit pouvoir lire le cookie csrftoken
CORS_ALLOW_CREDENTIALS = True  # si le frontend est sur un domaine/port différent
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000"]  # adapter à votre origine frontend
```

Assurez-vous qu'un premier appel `GET` a bien eu lieu (page de connexion ou
endpoint `GET /api/.../`) avant tout `POST`, afin que le cookie `csrftoken`
soit déjà présent dans le navigateur.

## Intégration

1. Copier le dossier `finance-module/` dans votre projet frontend, par
   exemple sous `src/modules/finance/`.
2. Ajuster les imports relatifs si votre organisation de dossiers diffère.
3. Utiliser la page directement :

```tsx
import { FinancePage } from "./modules/finance";

// Menu "Finances" (dashboard transverse)
<FinancePage peutExporter={role !== "stagiaire"} onOuvrirDossier={(id) => navigate(`/dossiers/${id}`)} />

// Onglet "Finances" d'un dossier précis
<FinancePage
  dossierId={dossier.id}
  peutModifier={role === "associe" || role === "comptable"}
/>
```

### Correction de la colonne "Dossier" affichant "Inconnu"

Le tableau et le panneau de recouvrement affichent le dossier lié à chaque
ligne/paiement via `dossier_numero`. Si l'API renvoie seulement l'UUID du
dossier (`dossier`) sans ce libellé, l'UI applique un repli propre
(`Dossier a1b2c3d4…`) plutôt que d'afficher "Inconnu". Pour un affichage
optimal, faites renvoyer `dossier_numero` par le backend sur les endpoints
`/api/lignes-financieres/` et `/api/paiements/` (ex: jointure sur le champ
`numero` du modèle `Dossier`, du type `2026-VENTE-0001`).

## Règles métier respectées

- **Catégories** : honoraires, débours, droits et taxes, frais administratifs, autres.
- **Modes de paiement** : espèces, chèque, virement, mobile money, autre.
- **Statuts financiers** : non facturé, en attente de provision, partiellement
  payé, soldé, en retard de paiement — calculés automatiquement à partir du
  total facturé et du total payé (`deriveStatutFinancier`, repli côté client
  si l'API ne renvoie pas le statut).
- **Reste à payer** calculé automatiquement (jamais négatif).
- **Permissions** : la prop `peutModifier` masque le formulaire et les
  actions de suppression pour les profils non autorisés (seuls associés et
  comptable modifient les finances selon le cahier des charges). La prop
  `peutExporter` affiche/masque le bouton d'export du tableau des règlements.
- **Traçabilité** : chaque ajout/suppression passe par l'API ; le
  journal d'audit (hors-scope de ce module) doit être alimenté côté backend
  sur ces mêmes endpoints, conformément à la section 20 du cahier des charges.

## Non couvert par ce module (hors périmètre)

- Génération des reçus PDF (P1) — le champ `recu_url` est déjà prévu dans le
  type `Paiement` et affiché dès qu'il est renseigné par l'API.
- Export Excel/PDF réel des rapports financiers (bouton prêt dans
  `SettlementsTable`, à brancher sur votre endpoint de rapport).
- Journal d'audit et notifications (modules distincts du cahier des charges).
