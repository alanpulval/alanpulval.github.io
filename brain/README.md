# Atlas des hypothèses

Carte autonome publiée sous `/brain/`. Le code de l'interface est public, mais les fiches et les relations sont chiffrées dans `index.html` par AES-256-GCM avec une clé dérivée d'un mot de passe aléatoire (PBKDF2-SHA256, 310 000 itérations). Le déchiffrement se fait dans le navigateur ; le mot de passe n'est envoyé à aucun serveur. Intégrer le contenu chiffré à la page évite un second chargement réseau au déverrouillage.

Les sources en clair et le mot de passe sont conservés **hors de ce dépôt**, dans `../brain-private/assumptions.json`, `../brain-private/properties.json`, `../brain-private/encryption.json`, `../brain-private/complexity.json`, `../brain-private/models.json`, `../brain-private/advanced-properties.json` et `../brain-private/password.txt`. Pour publier une modification :

```text
node brain/encrypt.mjs ../brain-private/assumptions.json brain/index.html ../brain-private/password.txt ../brain-private/properties.json ../brain-private/encryption.json ../brain-private/complexity.json ../brain-private/models.json ../brain-private/advanced-properties.json
```

Ne jamais committer les fichiers privés. Une page statique ne peut pas empêcher l'accès à son HTML ou au fichier chiffré et ne protège pas contre une attaque hors ligne si le mot de passe est faible. Ne pas placer ici de travaux de recherche non publiés ou d'autres informations sensibles sans une vraie authentification côté serveur.

L'atlas comporte quatre cartes distinctes : hypothèses de difficulté, propriétés de sécurité, classes de complexité et modèles de preuve. Les deux premières distinguent parcours d'étude, variante et implication ; la troisième distingue inclusions démontrées, comparaisons ouvertes et liens d'étude ; la quatrième rassemble restrictions d'adversaire, oracles idéalisés, setup et cadre de composition. Une inclusion n'affirme pas que les classes sont distinctes. Le corpus est une sélection de départ, non un catalogue exhaustif.
