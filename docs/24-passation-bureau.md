# Passation du bureau

Chaque annee, le bureau change. Les anciens gestionnaires ne doivent plus pouvoir administrer CotaDISE apres la passation.

## Regle metier

- Le nouveau tresorier est choisi dans l'onglet `Etudiants`.
- Il devient `tresorier`.
- Les anciens comptes `admin` et `tresorier` perdent leur role de gestion.
- Un ancien gestionnaire encore etudiant conserve uniquement son acces etudiant.
- Un ancien gestionnaire devenu alumni conserve uniquement son acces alumni.
- Un compte technique sans niveau est suspendu.
- Les anciens tokens JWT ne conservent aucun privilege : le role est relu en base a chaque requete.
- L'historique n'est pas supprime : les anciennes actions restent visibles dans l'audit.

## Pourquoi ne pas supprimer les anciens comptes

Supprimer les anciens comptes casserait la tracabilite :

- paiements enregistres;
- configurations Wave creees;
- exports;
- alertes envoyees;
- modifications sensibles.

La bonne approche est donc :

- retirer l'acces;
- conserver l'identite dans les journaux d'audit.

## Endpoint

```http
POST /api/users/passation-bureau
```

Corps :

```json
{
  "nouveauTresorierId": "uuid-utilisateur",
  "motif": "Bureau 2027 elu en octobre"
}
```

L'action est tracee dans `audit_logs` avec `action = passation_bureau`.

## Test manuel

1. Se connecter avec le tresorier sortant.
2. Aller dans `Etudiants`.
3. Ouvrir `Passation du bureau`.
4. Choisir le nouveau tresorier.
5. Confirmer.
6. Verifier que l'ancien tresorier ne peut plus acceder a l'admin.
7. Verifier que le nouveau tresorier peut se connecter.
