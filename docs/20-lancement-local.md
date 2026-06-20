# Lancement local CotaDISE

## 1. Backend

```powershell
cd cotadise-backend
npm run start:dev
```

Verifier:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/health
```

## 2. Admin web tresorier

```powershell
cd cotadise-frontend
npm run dev
```

Ouvrir:

```txt
http://localhost:5173
```

## 3. Mobile avec Expo Go

Recuperer l'adresse IP locale du PC:

```powershell
Get-NetIPAddress -AddressFamily IPv4
```

Puis lancer Expo en LAN:

```powershell
cd cotadise-mobile
$env:EXPO_PUBLIC_API_BASE="http://IP_DU_PC:3000/api"
npm run start:lan
```

Dans Expo Go, ouvrir:

```txt
exp://IP_DU_PC:8081
```

Ne pas ouvrir `http://IP_DU_PC:8081` dans le navigateur pour voir l'application: cette URL affiche seulement le manifeste Expo.

## 4. Donnees de demonstration

Pour injecter les donnees de demo:

```env
DEMO_SEED_ENABLED=true
```

Puis redemarrer le backend. Repasser a `false` avant tout usage officiel.

Les comptes demo sont documentes dans `docs/19-donnees-demo.md`.
