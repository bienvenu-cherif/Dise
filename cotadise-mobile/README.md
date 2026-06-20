# CotaDISE Mobile

Application mobile etudiant pour Android et iOS.

## Demarrer

```bash
npm install
npm run start
```

Configurer l'API:

```bash
EXPO_PUBLIC_API_BASE=http://adresse-du-backend:3000/api
```

Sur un vrai smartphone, `localhost` pointe vers le telephone. Il faut donc utiliser l'adresse IP de la machine qui execute le backend.

Sous PowerShell, pour tester sur un telephone connecte au meme Wi-Fi:

```powershell
$env:EXPO_PUBLIC_API_BASE="http://IP_DU_PC:3000/api"
npm run start:lan
```

L'adresse ouverte dans un navigateur affiche un manifeste JSON. L'application visuelle s'ouvre dans Expo Go avec l'URL `exp://IP_DU_PC:8081`.

## Builds installables

Installer EAS CLI puis se connecter:

```bash
npm install -g eas-cli
eas login
```

Build Android interne:

```bash
npm run build:preview:android
```

Build iPhone interne pour TestFlight/App Store Connect:

```bash
npm run build:preview:ios
```

Builds production:

```bash
npm run build:android
npm run build:ios
```

Pour iPhone, Apple impose un compte Apple Developer actif. Sans ce compte, les etudiants peuvent tester via Expo Go pendant le developpement, mais ne pourront pas installer une app iOS finale signee.

Avant une sortie officielle, remplacer l'URL API de production dans `eas.json`, ajouter les icones/ecran de demarrage, puis publier la politique de confidentialite et les conditions d'utilisation.

## Parcours couverts

- Connexion et stockage securise du token.
- Recherche et activation d'un compte etudiant importe officiellement.
- Tableau de bord personnel.
- Cotisations, progression, paiement Wave.
- Historique des paiements.
- Classement du niveau.
- Notifications.
- Defis recus ou lances.
