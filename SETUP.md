# DriveDZ Frontend v3 — Installation

Ce dossier **remplace entièrement** votre ancien `frontend/src/`. Refonte complète,
ne mélangez pas avec les anciens fichiers (supprime en particulier l'ancien
`ExamsAdmin.jsx` à la racine et `context/Dashboard.jsx` s'ils existent encore).

## Installation
```powershell
# dans votre dossier frontend existant, remplacez tout src/ par celui-ci, puis :
npm install
copy .env.example .env
npm run dev
```
Le backend (v3) doit tourner sur `http://127.0.0.1:8000` (`uvicorn app.main:app --reload`).

## Ce qui a changé
Voir `backend/CHANGELOG.md` pour le détail — le frontend consomme maintenant une API
qui renvoie des noms (pas des ID), des montants déjà calculés, des statuts d'examen
à 5 états, et des notifications réelles. Nouveaux composants : `NotificationBell`,
`ProfileMenu` (changement de mot de passe inclus), recherche globale dans l'en-tête.
