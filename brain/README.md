# Atlas des hypothèses

Carte autonome publiée sous `/brain/`. Le code de l'interface est public, mais les fiches et les relations sont chiffrées dans `index.html` par AES-256-GCM avec une clé dérivée d'un mot de passe aléatoire (PBKDF2-SHA256, 310 000 itérations). Le déchiffrement se fait dans le navigateur ; le mot de passe n'est envoyé à aucun serveur. Intégrer le contenu chiffré à la page évite un second chargement réseau au déverrouillage.

Les sources en clair et le mot de passe sont conservés **hors de ce dépôt**, dans `../brain-private/assumptions.json`, `../brain-private/properties.json` et `../brain-private/password.txt`. Pour publier une modification :

```text
node brain/encrypt.mjs ../brain-private/assumptions.json brain/index.html ../brain-private/password.txt ../brain-private/properties.json
```

Ne jamais committer ces deux fichiers privés. Une page statique ne peut pas empêcher l'accès à son HTML ou au fichier chiffré et ne protège pas contre une attaque hors ligne si le mot de passe est faible. Ne pas placer ici de travaux de recherche non publiés ou d'autres informations sensibles sans une vraie authentification côté serveur.

L'atlas comporte deux cartes distinctes : hypothèses de difficulté et propriétés de sécurité. Les graphes distinguent trois types de liens : parcours d'étude, variante et implication. Une implication entre notions ne constitue jamais une preuve de sécurité d'un schéma. Le corpus est une sélection de départ, non un catalogue exhaustif.
