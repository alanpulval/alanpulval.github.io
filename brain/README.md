# Atlas des hypothèses

Carte autonome publiée sous `/brain/`. Le code de l'interface est public, mais les fiches et les relations sont uniquement dans `data.enc.json`, chiffré par AES-256-GCM avec une clé dérivée d'un mot de passe aléatoire (PBKDF2-SHA256, 310 000 itérations). Le déchiffrement se fait dans le navigateur ; le mot de passe n'est envoyé à aucun serveur.

La source en clair et le mot de passe sont conservés **hors de ce dépôt**, dans `../brain-private/assumptions.json` et `../brain-private/password.txt`. Pour publier une modification :

```text
node brain/encrypt.mjs ../brain-private/assumptions.json brain/data.enc.json ../brain-private/password.txt
```

Ne jamais committer ces deux fichiers privés. Une page statique ne peut pas empêcher l'accès à son HTML ou au fichier chiffré et ne protège pas contre une attaque hors ligne si le mot de passe est faible. Ne pas placer ici de travaux de recherche non publiés ou d'autres informations sensibles sans une vraie authentification côté serveur.

Le graphe distingue trois types de liens : parcours d'étude, variante et implication. Seules les deux implications entre DLP, CDH et DDH sont présentées comme des conséquences logiques, dans un même groupe. Le corpus est une sélection de départ, non un catalogue exhaustif.
