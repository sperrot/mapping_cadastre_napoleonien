# Val-d'Oise (95) — FRAD095

Service FranceArchives : `service/34471` (Archives départementales du Val-d'Oise).

## Finding aid du fonds cadastre

| Fichier | ID FranceArchives | Titre | Cotes | Période | Enfants niv.1 | Statut |
|---|---|---|---|---|---|---|
| [`findingaid_plans-cadastre-napoleonien_5570bf08….xml`](findingaid_plans-cadastre-napoleonien_5570bf08e62dc0163111f6d39f6c2ca96ee67bbc.xml) | `5570bf08e62dc0163111f6d39f6c2ca96ee67bbc` | « Plans du cadastre napoléonien (1812-1852) » | `3 P 1835 à 3313` · `FRAD095_00020` | 1812 → 1852 | 187 | déposé, **scout recon à lancer** |

## Particularité

La **racine elle-même** est déjà la branche « Plans du cadastre napoléonien »
(titre explicite) → le scout l'isole directement, ses 187 enfants sont les
communes. Pas de finding aid frère à chercher : le fonds tient en un seul arbre.

## Commande scout — reconnaissance seule (`--recon-only`)

```bash
cd harvest
python scout_cadastre.py 5570bf08e62dc0163111f6d39f6c2ca96ee67bbc findingaid \
    --recon-only --insecure
```

- `--recon-only` : isole la/les branche(s) + vérifie **licence** et **IIIF** sur un
  échantillon, **sans** lancer le harvester.
- `--insecure` : neutralise la vérif TLS (utile si l'environnement n'a pas la CA /
  passe par un proxy ; sinon facultatif).
- Période par défaut du scout : 1790-1860 (cohérent avec 1812-1852).

Quand la moisson est validée, relancer **sans** `--recon-only` et **avec** `--run` :

```bash
python scout_cadastre.py 5570bf08e62dc0163111f6d39f6c2ca96ee67bbc findingaid \
    --run --out seed_val-doise.sql --insecure
```
