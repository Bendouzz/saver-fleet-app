# Saver Fleet App

## Configuration obligatoire (Supabase)

Crée un fichier `.env.local` à la racine (tu peux copier `.env.example`) :

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Lancer et tester l'application

- `npm start` : lance l'app en local
- `npm test -- --watchAll=false` : lance les tests
- `npm run build` : vérifie la build de production

## Checklist hardening (prod)

- Activer et vérifier les policies RLS table par table
- Mapper les policies par rôle métier (admin, ops, dispatcher, finance, logistique)
- Interdire toute clé sensible dans le repo (utiliser variables Vercel uniquement)
- Activer logs/audit des actions critiques (paie, KPI, reversements, dettes)
- Vérifier les permissions Storage (preuves, photos, devis)
- Mettre en place alerting runtime (Vercel + Supabase logs)
