# Corrections frontend — Rapport Volkeno du 19 octobre 2026

## Correction appliquée
- Fichier : `src/features/models/pages/ModelsLibraryPage.tsx`
- Le bandeau « Bibliothèque de Modèles » n'est plus `sticky` et ne possède plus `z-50`.
- Objectif : éviter que l'en-tête de la bibliothèque reste au-dessus du menu latéral et masque les liens lors de la navigation, conformément à l'anomalie ANO-01 du rapport.

## Vérifications
- La vérification TypeScript (`tsc -b`) s'est terminée sans erreur.
- La compilation Vite complète n'a pas pu être terminée dans l'environnement de vérification, car les dépendances natives optionnelles de Rolldown pour Linux sont absentes du `node_modules` fourni dans l'archive. Cela ne signale pas une erreur du code modifié.

## Test manuel recommandé
1. Lancer `npm install`, puis `npm run dev`.
2. Se connecter avec un compte autorisé.
3. Ouvrir « Modèles d'actes ».
4. Ouvrir le menu latéral et naviguer vers « Dashboard », puis « Clients ».
5. Vérifier que le bandeau « Bibliothèque de Modèles » disparaît et ne masque aucun lien.
6. Répéter sur mobile et desktop.
7. Vérifier également les autres modules : dossiers, Kanban, tâches et comptabilité.

## Remplacement
Cette archive contient le code source et les fichiers de configuration, sans `node_modules`, dossier `.git`, builds générés ni fichier `.env`. Conserver le fichier `.env` existant du projet et réinstaller les dépendances avant le lancement.
