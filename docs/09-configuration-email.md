# Configuration email

## Objectif

Envoyer les alertes importantes par email en plus de l'application.

## Variables

- `EMAIL_DISPATCH_ENABLED`: `true` pour activer l'envoi reel.
- `EMAIL_DISPATCH_INTERVAL_MS`: intervalle de traitement de la file, par defaut `60000`.
- `EMAIL_DISPATCH_BATCH_SIZE`: nombre maximum d'emails par traitement, par defaut `25`.
- `SMTP_HOST`: hote SMTP.
- `SMTP_PORT`: port SMTP, par defaut `587`.
- `SMTP_SECURE`: `true` si SSL direct, sinon `false`.
- `SMTP_USER`: utilisateur SMTP.
- `SMTP_PASSWORD`: mot de passe SMTP.
- `SMTP_FROM`: adresse expediteur affichee.

## Fonctionnement

Les notifications dont le canal contient email creent une ligne dans `email_messages`.

Si l'envoi est active et configure, le backend traite automatiquement les emails en attente:

- apres le demarrage;
- puis a intervalle regulier.

Le tresorier peut aussi declencher l'envoi avec:

- `POST /api/emails/envoyer-en-attente`

## Test reel

Dans l'administration, onglet `Alertes`, bloc `Exploitation email`:

1. Cliquer sur `Tester SMTP` pour verifier la connexion au serveur.
2. Saisir une adresse dans `Email de test`.
3. Cliquer sur `Envoyer un test reel`.
4. Verifier que le message `Test SMTP CotaDISE` arrive dans la boite cible.

Si le test de connexion passe mais que l'email n'arrive pas, verifier les dossiers spam,
le domaine expediteur et les restrictions du fournisseur SMTP.
