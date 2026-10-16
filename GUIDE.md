# ADAM'S ET FRÈRES — Mise en ligne sur Vercel (10 minutes)

**Principe :** le site public est ouvert à tous. L'espace administrateur est à l'adresse `/admin` (aucun bouton ne mène à cette page) et il est protégé par un **mot de passe**. Les produits, prix, photos et coordonnées sont enregistrés dans une **base de données en ligne** : un changement fait par l'administrateur apparaît sur **tous les appareils**, en quelques secondes.

---

## Les 5 étapes

### 1. Envoyer le dossier sur Vercel
Le dossier complet doit être envoyé, avec les sous-dossiers **`api/`** et **`images/`**.

- **Avec GitHub :** créez un dépôt, envoyez tout le contenu du dossier (*Add file → Upload files*, glissez tout). Puis sur <https://vercel.com/new> : choisissez le dépôt → **Deploy** (rien à modifier).
- **Ou en ligne de commande :** dans le dossier, tapez `npx vercel --prod`.

### 2. Créer la base de données (1 minute)
Projet Vercel → onglet **Storage** → **Create Database** → choisir **Upstash (Redis)** → offre **gratuite** → **Connect to Project**.
Vercel ajoute tout seul les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN`. Vous n'avez rien à copier.

### 3. Choisir le mot de passe administrateur
Projet → **Settings → Environment Variables** → ajoutez :

| Nom | Valeur |
|---|---|
| `ADMIN_PASSWORD` | un mot de passe **long** (10 caractères minimum, idéalement 16) |
| `SESSION_SECRET` *(recommandé)* | une longue suite de caractères au hasard |

### 4. Redéployer (obligatoire)
Onglet **Deployments** → menu **⋯** du dernier déploiement → **Redeploy**. Sans cela, les variables des étapes 2 et 3 ne sont pas prises en compte.

### 5. Premier démarrage
1. Ouvrez `https://votre-site.vercel.app/admin` et connectez-vous.
2. Onglet **Sauvegarde** → **Importer le catalogue initial**.
3. Onglet **Produits** : corrigez les **prix** et les **stocks**, ajoutez les **photos**.
4. Ouvrez le site sur un autre téléphone : les changements sont là.

---

## Utilisation quotidienne

| Je veux… | Je fais… |
|---|---|
| Changer un **prix** ou un **stock** | Onglet Produits → je tape dans la case : c'est enregistré tout de suite |
| Mettre en **promo** | **Modifier** → j'indique l'**ancien prix** (plus élevé) → je coche *En promotion* |
| **Ajouter un produit** | **+ Ajouter un produit** → fiche → **Photo** (depuis le téléphone) → Enregistrer |
| Changer **WhatsApp, horaires, adresse, message qui défile** | Onglet **Coordonnées** |
| **Sauvegarder** | Onglet Sauvegarde → *Télécharger la sauvegarde* (une fois par semaine) |

Les photos sont réduites automatiquement et enregistrées en ligne. La session se ferme après 30 minutes d'inactivité (et au bout de 12 h au plus). Pensez à **Déconnexion** sur un téléphone partagé.

## Sécurité
- Seule la connaissance du mot de passe donne accès aux modifications ; le serveur refuse toute modification sans session valide.
- Après 8 mots de passe faux, l'adresse IP est bloquée pendant 15 minutes.
- Changer `ADMIN_PASSWORD` (puis redéployer) ferme immédiatement toutes les sessions.
- Ne partagez jamais le mot de passe par message non protégé. Ne le mettez pas dans les fichiers du site.

## Dépannage

| Message ou symptôme | Solution |
|---|---|
| « Mode démonstration » sur `/admin` | Le dossier `api/` n'a pas été envoyé : renvoyer le dossier **complet** |
| « Base de données non connectée » | Étape 2 faite ? Puis **Redeploy** (étape 4) |
| « ADMIN_PASSWORD doit être défini » | Étape 3 puis **Redeploy** |
| « Importez d'abord le catalogue initial » | Onglet Sauvegarde → *Importer le catalogue initial* |
| Des vignettes de marque à la place des photos | Normal tant que la photo du produit n'est pas ajoutée (fiche produit → Photo) |
| Plus aucune image du site ne s'affiche | Le dossier **`images/`** n'a pas été envoyé : le renvoyer en entier |
| « Session expirée » | Se reconnecter |

## Essayer sur son ordinateur (facultatif)
Avec Node.js installé : `node dev-server.js`, puis ouvrir <http://localhost:3000> (administration : `/admin`, mot de passe de test affiché dans le terminal). La base est alors en mémoire et se vide à l'arrêt.

## Fichiers
`index.html`, `style.css`, `app.js` (site) · `admin.html`, `admin.js`, `admin.css` (administration) · `store.js` (lien avec le serveur) · `api/` (serveur : lecture publique, actions protégées, photos) · `vercel.json` (en-têtes de sécurité, adresse `/admin`) · `data.js`, `catalogue.js` (catalogue de départ) · `images/` (logos et photos).

## À vérifier avec la boutique avant la remise
- Les **prix** et **stocks** de départ sont des estimations : à corriger dans l'espace administrateur.
- Environ un tiers des produits n'a pas encore de photo : à ajouter depuis l'administration.
- Le **logo** fourni affiche « Sere et Frères » dans l'image : prévoir une version corrigée.
- Les commandes passent par **WhatsApp** (pas de paiement en ligne).
