# API a prevoir

Ce fichier decrit les futures routes principales. Les noms pourront changer pendant l'implementation.

## Authentification

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Annees academiques

- `POST /api/annees-academiques`
- `GET /api/annees-academiques`
- `GET /api/annees-academiques/active`
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
- `POST /api/paiements/wave/pour-camarade`
- `POST /api/paiements/main-a-main`
- `GET /api/paiements/me`
- `GET /api/paiements`
- `GET /api/paiements/export`
- `POST /api/paiements/enregistrer-manuel`

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
