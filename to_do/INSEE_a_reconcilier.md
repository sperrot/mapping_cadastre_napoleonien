# Cas à réconcilier — futur run d'appariement commune → INSEE

Cases non résolues lors des moissons, à reprendre **sans recrawler tout l'arbre**
(cf. METHODOLOGIE.md §4) : un run dédié qui ne rejoue que ces entrées.

Deux familles :
- **Communes absentes** (nœud sauté transitoirement) → à récupérer par re-run.
- **INSEE non résolu** (commune ancienne/hameau, ou nom raté par geo.api) → à
  mapper vers l'INSEE actuel.

---

## Seine-Saint-Denis (93) — communes ABSENTES (saut transitoire)

À récupérer par re-run du harvester (idempotent : `delete … where left(insee,2)='93'`
puis recharge). Vérifier leur présence ensuite.

| Commune | INSEE | Cause |
|---|---|---|
| Aubervilliers | 93001 | nœud sauté pendant le crawl |
| Saint-Denis | 93066 | nœud sauté pendant le crawl |

---

## Val-d'Oise (95) — INSEE non résolu (~19 feuilles, 5 cas)

Le libellé porte souvent la **commune actuelle entre parenthèses** :
`Arthieul (Magny-en-Vexin, Val-d'Oise, France)`. Piste d'appariement : parser le
1er terme parenthétique et résoudre via geo.api (+ `codeDepartement=95`).

| Libellé brut (commune captée) | Commune actuelle (parenthèse) | Type de cas | Piste INSEE |
|---|---|---|---|
| Arthieul (Magny-en-Vexin, …) | Magny-en-Vexin | ancienne commune / hameau | rattacher à Magny-en-Vexin |
| Gadancourt (Avernes, …) | Avernes | ancienne commune / hameau | rattacher à Avernes |
| Gouzangrez (Commeny, …) | Commeny | ancienne commune / hameau | rattacher à Commeny |
| « Section A, Le Bois de Boissy » / « Section B, Le Village » | — (commune indéterminée) | **parent = section** : commune jamais captée (ni titre parent ni location exploitables) | à retrouver (Boissy-l'Aillerie ?) via l'arbre / la cote |
| Saint-Gratien (Val-d'Oise, …) | Saint-Gratien (95555) | **commune actuelle** ratée par le `nom` flou de geo.api (cf. Pierrefitte-sur-Seine) | alias / requête `codeDepartement=95` |

---

## Stratégie d'appariement (run futur)

1. **Hameaux / anciennes communes** : extraire la commune actuelle = 1er token
   entre parenthèses du libellé `location` → geo.api `nom=<token>&codeDepartement=95`.
   (NB : le plan reste rattaché à la commune actuelle ; on pourra garder le nom
   historique en métadonnée.)
2. **Communes actuelles ratées par geo.api** (Saint-Gratien, Pierrefitte-sur-Seine,
   Montreuil-sous-Bois) → enrichir `COMMUNE_ALIAS` ou requêter avec le département.
3. **Cas « parent = section »** (Le Bois de Boissy) : la commune n'a pas été captée ;
   nécessite de remonter d'un cran dans l'arbre ou d'exploiter le sujet `location`
   de chaque feuille — à traiter au cas par cas.
4. Idéalement, brancher un **référentiel des communes historiques** (COG INSEE /
   communes fusionnées) plutôt que le seul geo.api.
