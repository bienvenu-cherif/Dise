# Tableau de bord tresorier

## Objectif

Donner au tresorier une vue de pilotage simple, rapide et fiable sur la campagne annuelle de cotisation.

## Fonctionnalites visibles

- Suivre le montant attendu, collecte et restant.
- Suivre les cotisations soldees, partielles et sans aucun paiement.
- Identifier les cotisations en retard.
- Exporter les cotisations, paiements, retards et dons alumni.
- Saisir un paiement main a main.
- Consulter les paiements Wave, paiements pour camarade et paiements physiques.
- Consulter le journal d'audit des operations sensibles.
- Consulter les classements.
- Suivre les defis et leurs gagnants.
- Consulter les alumni par promotion sortante.
- Consulter les dons alumni et leurs origines.
- Acceder aux actions rapides: ajouter un etudiant, creer une cotisation, saisir un paiement.
- Filtrer la vue par annee academique.
- Filtrer la vue par niveau ISE1, ISE2, ISE3 ou alumni selon le besoin.
- Consulter les emails en attente.
- Forcer l'envoi des emails en attente lorsque le SMTP est configure.

## Indicateurs suivis

- Taux global de recouvrement.
- Montant total attendu.
- Montant total collecte.
- Montant total restant.
- Montant total en retard.
- Nombre de cotisations en retard.
- Nombre d'etudiants ayant tout solde.
- Nombre d'etudiants en paiement partiel.
- Nombre d'etudiants sans paiement.
- Nombre de paiements confirmes.
- Nombre de paiements en attente.
- Nombre de paiements echoues ou annules.
- Nombre de paiements faits pour un camarade.
- Nombre de paiements main a main.
- Nombre de defis actifs.
- Nombre de defis termines.
- Nombre d'alumni.
- Nombre de promotions sortantes.
- Montant total des dons alumni confirmes.
- Nombre de dons alumni confirmes.

## Points de vigilance

- Un etudiant ayant tout solde ne doit pas recevoir de rappel.
- Les alumni ne doivent pas apparaitre dans les cotisations obligatoires.
- Les dons alumni sont volontaires et se suivent separement des cotisations.
- Les indicateurs de cotisation et paiement doivent respecter les filtres annee academique et niveau.
- Les actions financieres sensibles doivent etre auditables avec acteur, date, objet et details non secrets.
- Les exports de cotisations, paiements et retards doivent respecter les filtres actifs.
- L'envoi email reel depend de `EMAIL_DISPATCH_ENABLED` et des variables SMTP.
