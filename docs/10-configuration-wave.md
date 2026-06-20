# Configuration Wave

## Objectif

Permettre les paiements de cotisation via Wave tout en gardant une confirmation fiable par webhook.

## Variables

- `WAVE_CHECKOUT_URL`: URL d'initiation du paiement Wave.
- `WAVE_API_KEY`: cle API Wave.
- `WAVE_CURRENCY`: devise, par defaut `XOF`.
- `WAVE_SUCCESS_URL`: URL de retour apres paiement reussi.
- `WAVE_ERROR_URL`: URL de retour apres paiement echoue.
- `WAVE_WEBHOOK_URL`: URL publique du webhook backend.
- `WAVE_WEBHOOK_SECRET`: secret de signature webhook, si disponible.

Ces variables servent de configuration technique par defaut. En production, la cible recommandee est de rattacher la configuration Wave a l'annee academique ou au bureau actif, car le compte marchand peut changer d'un bureau a l'autre.

## Changement de bureau

Chaque bureau peut utiliser son propre compte Wave marchand. Le systeme doit donc permettre de declarer une configuration Wave par annee academique:

- nom du bureau ou de la division responsable;
- nom du compte marchand Wave;
- cle API chiffrée cote serveur;
- secret webhook chiffre cote serveur;
- statut de validation de la configuration;
- date d'activation;
- personne ayant configure ou valide le compte.

Au moment d'initier un paiement, le backend choisit la configuration Wave de l'annee academique liee a la cotisation. Si aucune configuration n'est active pour cette annee, le paiement reste en attente et la reponse indique que Wave n'est pas configure.

Quand un nouveau bureau prend les reignes:

1. L'ancien tresorier ferme l'annee precedente.
2. Le nouveau tresorier cree ou ouvre la nouvelle annee academique.
3. Le nouveau bureau renseigne le nouveau compte Wave marchand.
4. Un administrateur valide la configuration avec un petit paiement de test.
5. Les cotisations de la nouvelle annee peuvent etre ouvertes.

Les anciens paiements restent lies a l'ancien compte marchand et a l'ancienne annee academique. On ne remplace jamais l'historique.

## Endpoints

- `POST /api/paiements/wave/initier`
- `POST /api/paiements/wave/webhook`

## Regles

- L'initiation cree d'abord un paiement local en attente.
- La reference locale commence par `COTADISE-WAVE-`.
- Le paiement n'ajuste la cotisation qu'apres confirmation.
- Le webhook est idempotent: une reference deja confirmee n'est pas comptabilisee deux fois.
- Si la configuration Wave manque, le paiement local en attente est cree et la reponse indique `configured: false`.
- Une cotisation d'une annee donnee doit etre payee sur le compte marchand Wave rattache a cette meme annee.
- Un changement de compte marchand ne doit jamais modifier les paiements historiques.
- Les cles Wave ne doivent jamais etre exposees dans l'application mobile ni dans les reponses API.
- Le paiement garde l'identifiant de la configuration Wave utilisee afin que le webhook puisse verifier la signature avec le bon secret, meme si le compte actif change plus tard.
- Le fallback `.env` reste reserve aux tests ou aux premiers deploiements, mais la cible de production est la configuration Wave par annee academique.
- Le backend refuse l'initiation d'un paiement Wave si le montant depasse le reste a payer de la cotisation.
- La confirmation Wave enregistre le montant confirme, le montant applique et la date d'application.
- Si un webhook est renvoye plusieurs fois pour la meme reference, le paiement n'est applique qu'une seule fois.
