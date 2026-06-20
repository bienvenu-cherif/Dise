# API a prevoir

Ce fichier decrit les futures routes principales. Les noms pourront changer pendant l'implementation.

## Authentification

- `POST /api/auth/login`
- `POST /api/auth/mot-de-passe-oublie`
- `POST /api/auth/reinitialiser-mot-de-passe`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Annees academiques

- `POST /api/annees-academiques`
- `GET /api/annees-academiques`
- `GET /api/annees-academiques/active`
- `GET /api/annees-academiques/:id/preparation`
- `PATCH /api/annees-academiques/:id`
- `POST /api/annees-academiques/:id/ouvrir`
- `POST /api/annees-academiques/:id/fermer`

## Passages automatiques

- `POST /api/passages/previsualiser`
- `POST /api/passages/appliquer`
- `POST /api/passages/exceptions`
- `GET /api/passages/exceptions`

## Etudiants

- `POST /api/etudiants/import`
- `GET /api/etudiants/invites/recherche`
- `POST /api/etudiants/invites/:id/activer`
- `PUT /api/users/me`
- `PUT /api/users/me/mot-de-passe`
- `GET /api/etudiants`
- `GET /api/etudiants/me`
- `PATCH /api/etudiants/:id`
- `PATCH /api/etudiants/:id/statut`
- `PATCH /api/etudiants/:id/niveau`

## Montants de cotisation

- `POST /api/montants-cotisation`
- `GET /api/montants-cotisation`
- `PATCH /api/montants-cotisation/:id`
- `POST /api/montants-cotisation/exceptions`
- `GET /api/montants-cotisation/exceptions`

## Cotisations

- `POST /api/cotisations/generer`
- `GET /api/cotisations`
- `GET /api/cotisations/me`
- `GET /api/cotisations/me/progression`
- `GET /api/cotisations/me/courbe`
- `GET /api/cotisations/export`

## Paiements

- `POST /api/paiements/wave/initier`
- `POST /api/paiements/wave/webhook`
- `POST /api/paiements/main-a-main`
- `GET /api/paiements/me`
- `GET /api/paiements`
- `GET /api/paiements/export`
- `POST /api/paiements/enregistrer-manuel`
- `GET /api/users/camarades/recherche?q=`
- `GET /api/cotisations/beneficiaire/:userId`

Le webhook Wave confirme le paiement par reference interne et applique les effets une seule fois, meme si Wave renvoie plusieurs notifications pour la meme transaction.
Le paiement pour un camarade passe par `POST /api/paiements/wave/initier` avec le `userId` du beneficiaire.
La recherche de camarade ne retourne que des etudiants actifs, et les cotisations beneficiaire exposees au mobile sont limitees aux cotisations encore payables.

## Configurations Wave marchand

- `POST /api/configurations-wave`
- `GET /api/configurations-wave`
- `GET /api/configurations-wave?anneeId=:id`
- `GET /api/configurations-wave/:id`
- `PATCH /api/configurations-wave/:id`
- `POST /api/configurations-wave/:id/valider`
- `POST /api/configurations-wave/:id/activer`
- `POST /api/configurations-wave/:id/desactiver`

Les cles Wave sont chiffrees cote serveur et ne sont jamais renvoyees dans les reponses API. Une seule configuration Wave peut etre active pour une annee academique donnee. Les paiements gardent la reference de la configuration marchand utilisee.

## Audit

- `GET /api/audit`
- `GET /api/audit?entityType=:type`
- `GET /api/audit?entityId=:id`
- `GET /api/audit?actorId=:id`
- `GET /api/audit?action=:action`
- `GET /api/audit/export`

Le journal d'audit trace les actions sensibles: creation et activation de compte Wave marchand, paiements main a main, confirmations webhook Wave, changements de statut et application effective d'un paiement sur une cotisation.

## Classements

- `GET /api/classements/me`
- `GET /api/classements/niveau/:niveauId`
- `GET /api/classements/global`

## Defis

- `POST /api/defis`
- `GET /api/defis/me`
- `PATCH /api/defis/:id/accepter`
- `PATCH /api/defis/:id/refuser`
- `PATCH /api/defis/:id/annuler`
- `GET /api/defis/:id`

Le backend reevalue aussi les defis actifs apres chaque paiement confirme. Si un participant atteint 100%, le defi est marque termine et les deux participants reçoivent une notification.

## Notifications

- `GET /api/notifications/me`
- `PATCH /api/notifications/:id/lire`
- `POST /api/notifications/manuel`
- `POST /api/notifications/rappels-cotisation`
- `POST /api/notifications/rappels-cotisation/annee-active`

Le backend execute aussi une verification automatique quotidienne sur l'annee active ouverte. Cette verification respecte la regle des 3 semaines et n'envoie pas de rappel si un paiement ou un rappel recent existe deja.

## Emails

- `GET /api/emails/en-attente`
- `POST /api/emails/envoyer-en-attente`

Les emails sont envoyes depuis la file `email_messages` quand `EMAIL_DISPATCH_ENABLED=true` et que la configuration SMTP est complete.

## Alumni et dons

- `GET /api/alumni`
- `GET /api/alumni/promotions`
- `GET /api/alumni/promotions/:promotion`
- `POST /api/alumni/promotions/:promotion/message`
- `POST /api/dons`
- `POST /api/dons/main-a-main`
- `GET /api/dons`
- `GET /api/dons/me`
- `GET /api/dons/export`
- `GET /api/dons/:id`
