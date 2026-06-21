# Mise en production CotaDISE sur Render

## Choix retenu

Render heberge les trois composants dans le meme espace :

- `cotadise-postgresql` : base PostgreSQL geree ;
- `cotadise-api` : backend NestJS construit avec Docker ;
- `cotadise-admin` : frontend React et pages legales statiques.

Le fichier `render.yaml` de la racine decrit cette architecture. Les secrets JWT,
applicatif et de chiffrement Wave sont generes par Render et ne sont jamais stockes
dans Git.

## 1. Prerequis externes

1. Placer le projet dans un depot GitHub prive appartenant durablement a la DISE.
2. Creer un compte Render appartenant a la DISE, et non au tresorier sortant.
3. Choisir un domaine durable, par exemple `cotadise.org`.
4. Creer une boite ou un service SMTP, par exemple `noreply@cotadise.org`.

Les acces techniques doivent etre conserves par au moins deux responsables de la
division. La passation annuelle concerne le compte tresorier de l'application, pas
la propriete de l'infrastructure.

## 2. Creer l'infrastructure

1. Dans Render, choisir `New > Blueprint`.
2. Connecter le depot GitHub et selectionner `render.yaml`.
3. Choisir une region unique pour la base et l'API.
4. Le Blueprint utilise les offres gratuites pour la recette initiale. Passer ensuite
   PostgreSQL et l'API sur des offres payantes avec persistance et sauvegardes avant
   l'ouverture officielle aux etudiants.
5. Renseigner les trois valeurs demandees pendant la creation :

```text
PUBLIC_BACKEND_URL=https://cotadise-api.onrender.com
CORS_ORIGINS=https://cotadise-admin.onrender.com
VITE_API_BASE=https://cotadise-api.onrender.com/api
```

Les URL exactes peuvent differer si les noms Render sont deja utilises. Garder
`EMAIL_DISPATCH_ENABLED=false` jusqu'au test SMTP.

Les variables SMTP ne sont volontairement pas demandees par le Blueprint initial.
Elles seront ajoutees dans l'environnement de l'API lorsque le compte email sera pret.

## 3. Verifier le premier deploiement

Verifier successivement :

```text
https://URL_API/api/health
https://URL_ADMIN/
https://URL_ADMIN/privacy.html
https://URL_ADMIN/terms.html
```

Le health check doit retourner `status: ok` et `database.status: up`. Le premier
demarrage de l'API execute automatiquement les migrations PostgreSQL.

## 4. Domaine et HTTPS

Ajouter dans Render :

- `api.cotadise.org` sur `cotadise-api` ;
- `app.cotadise.org` sur `cotadise-admin`.

Appliquer les enregistrements DNS indiques par Render, attendre le certificat HTTPS,
puis remplacer les variables :

```text
PUBLIC_BACKEND_URL=https://api.cotadise.org
CORS_ORIGINS=https://app.cotadise.org
VITE_API_BASE=https://api.cotadise.org/api
```

Redeployer l'API et le frontend apres ces changements.

## 5. SMTP

Renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` et
`SMTP_FROM`. Tester depuis `Alertes > Exploitation email > Tester SMTP`. Seulement
apres reception reelle du message, passer `EMAIL_DISPATCH_ENABLED=true` et redeployer.

## 6. Expo et pages legales

Configurer les trois variables EAS avec les URL definitives :

```text
EXPO_PUBLIC_API_BASE=https://api.cotadise.org/api
EXPO_PUBLIC_PRIVACY_URL=https://app.cotadise.org/privacy.html
EXPO_PUBLIC_TERMS_URL=https://app.cotadise.org/terms.html
```

Ne construire les APK, AAB et IPA definitifs qu'apres cette configuration.

## 7. Sauvegardes et surveillance

1. Activer les sauvegardes PostgreSQL gerees disponibles dans l'offre choisie.
2. Tester une restauration sur une base de recette avant l'ouverture aux etudiants.
3. Brancher un moniteur HTTPS sur `https://api.cotadise.org/api/health` toutes les
   cinq minutes.
4. Envoyer les alertes de panne a au moins deux responsables.
5. Conserver aussi un export chiffre hors de Render selon la politique de la DISE.

## 8. Recette mobile et passation

1. Installer le build de previsualisation sur un Android et un iPhone physiques.
2. Tester activation ISE1, connexion, paiement simule, paiement pour un camarade,
   defi, classement, notifications et liens legaux.
3. Faire executer au futur tresorier : import ISE1, fixation des montants, paiement
   main a main, relance, exception annuelle, cloture et passation.
4. Tester la passation en recette et confirmer que l'ancien tresorier perd tout acces
   administratif avant de la faire en production.

## 9. Stores

Creer Google Play Console et Apple Developer avec des comptes institutionnels.
Generer ensuite les builds `production`, remplir les fiches de confidentialite,
joindre les URL legales, lancer les tests fermes, puis soumettre les versions publiques.

## Ordre d'execution restant

1. Creer les comptes GitHub et Render institutionnels.
2. Executer le Blueprint et verifier PostgreSQL/API/frontend.
3. Acheter ou affecter le domaine, puis activer HTTPS.
4. Configurer et tester SMTP.
5. Configurer EAS et produire les builds mobiles de recette.
6. Activer sauvegardes et monitoring, puis tester une restauration.
7. Tester sur Android et iPhone physiques.
8. Faire la repetition avec le futur tresorier.
9. Creer les comptes stores, lancer les tests fermes et publier.
