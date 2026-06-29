# Publication mobile Android et iOS

## Objectif

Permettre aux etudiants d'installer CotaDISE sur Android et iPhone.

## Choix technique

L'application etudiant est construite avec Expo et React Native dans `cotadise-mobile`.

Ce choix permet de produire:

- une app Android;
- une app iOS;
- des builds internes pour test;
- des builds production pour les stores.

## Developpement

Pendant le developpement, les etudiants testeurs peuvent utiliser Expo Go.

```bash
cd cotadise-mobile
npm install
npm run start
```

Sur smartphone, l'API doit pointer vers une adresse joignable par le telephone:

```bash
EXPO_PUBLIC_API_BASE=http://IP_DU_PC:3000/api
```

## Android

Pour Android, on peut produire:

- un APK interne pour installation directe;
- un AAB pour Google Play.

Commandes:

```bash
npm run build:preview:android
npm run build:android
```

## iPhone

Pour iPhone, Apple impose un compte Apple Developer.

Distribution possible:

- TestFlight pour les tests;
- App Store pour la publication officielle;
- distribution interne selon les autorisations Apple disponibles.

Commandes:

```bash
npm run build:preview:ios
npm run build:ios
```

## Variables de production

Les profils EAS utilisent `EXPO_PUBLIC_API_BASE`, `EXPO_PUBLIC_PRIVACY_URL` et
`EXPO_PUBLIC_TERMS_URL`.

Les profils `preview` et `production` pointent deja vers l'environnement Render
de recette:

```txt
https://cotadise-api.onrender.com/api
```

Si un domaine definitif est choisi plus tard, remplacer ces trois URLs dans
`cotadise-mobile/eas.json`, puis relancer le controle de publication.

Avant de construire une version destinee aux stores, executer depuis la racine :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-release-readiness.ps1
```

Le controle bloque les URL locales ou de demonstration, les pages legales absentes,
les assets manquants et les identifiants mobiles invalides.

## Regles de securite

- Aucune cle Wave dans l'application mobile.
- Le token utilisateur est stocke avec `expo-secure-store`.
- Les paiements sont confirmes uniquement par le webhook backend.
- L'API de production doit utiliser HTTPS.
- Les builds iOS et Android doivent pointer vers le meme backend de production.

## Documents a publier

Avant la publication officielle, preparer et rendre accessibles:

- la politique de confidentialite: `docs/12-politique-de-confidentialite.md`;
- les conditions d'utilisation: `docs/13-conditions-utilisation.md`;
- l'identite visuelle et les assets: `docs/14-identite-visuelle.md`;
- une adresse email de contact du bureau ou du tresorier;
- une fiche claire expliquant que l'application est reservee aux etudiants ISE importes officiellement.

## Checklist avant store

- Confirmer l'URL API, la confidentialite et les conditions dans `cotadise-mobile/eas.json`.
- Ajouter l'icone de l'application.
- Ajouter l'ecran de demarrage.
- Verifier le nom public de l'application: CotaDISE.
- Tester l'activation d'un nouvel ISE1.
- Tester un paiement Wave en mode marchand de test.
- Tester un paiement pour un camarade.
- Tester les alertes et les defis.
- Tester un compte ayant deja termine toute sa cotisation.
- Tester sur Android reel.
- Tester sur iPhone reel via TestFlight.
- Verifier la checklist MVP: `docs/15-validation-mvp-80.md`.
