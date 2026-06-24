# to_do — finding aids cadastre napoléonien (par département)

Suivi de la moisson FranceArchives → Supabase. Objectif : pour chaque
département, descendre l'arbre XML (RDF) du/des instrument(s) de recherche
jusqu'à **tous les documents de cadastre napoléonien** (tableaux d'assemblage,
sections, feuilles) numérisés.

## Organisation du dossier

- Un **sous-dossier par département** (`calvados/`, …).
- Tu y déposes le(s) fichier(s) finding aid RDF/XML ; je les range et les renomme
  `findingaid_<plage>_<id>.xml` (`<plage>` = tranche alpha des communes couvertes).
- Chaque sous-dossier a un `NOTES.md` détaillant ses finding aids et leur statut.
- Ce `README.md` porte le **tableau de synthèse maître** (mis à jour à ta demande).

## Comment lire l'arbre (rappel)

Le RDF d'un finding aid (racine) ne contient **ni IIIF ni licence** : seulement
le titre, le service (institution) et la liste des `facomponent` enfants
(`rico:includesOrIncluded`). IIIF + licence n'apparaissent qu'**en descendant
dans les facomponents** jusqu'aux feuilles — c'est ce que fait le harvester
(`harvest/harvest_francearchives.py`), à lancer **en local** (FranceArchives
bloque les fetchs serveur).

→ Les colonnes **licence** et **iiif dispo** ne peuvent donc être renseignées
qu'**au 1er run local** du harvester sur un échantillon de feuilles.

---

## Tableau de synthèse — amont du harvester

| Département | Lien XML arbre | Licence | IIIF dispo | Harvester | INSEE à réconcilier |
|---|---|---|---|---|---|
| **Val-d'Oise (95)** — FRAD095 | [findingaid « Plans du cadastre napoléonien (1812-1852) » `5570bf08…`](https://francearchives.gouv.fr/findingaid/5570bf08e62dc0163111f6d39f6c2ca96ee67bbc) (racine = branche plans, 187 communes) | ✅ OK (manuelle, svc 34471) | ✅ OK (manifeste valdoise.fr) | scout recon-only (voir ci-dessous) | ⚠️ 5 cas (~19 feuilles) → [détail](INSEE_a_reconcilier.md#val-doise-95--insee-non-résolu-19-feuilles-5-cas) |
| **Seine-Saint-Denis (93)** — FRAD093 · *pilote* | [findingaid `2679af1…`](https://francearchives.gouv.fr/findingaid/2679af120dcec5557878b634c3701f842b1d806e) · sous-nœud [facomponent « Plans cadastraux » `8c9077ce…`](https://francearchives.gouv.fr/facomponent/8c9077ce3826a2676417514c55903ae704aff91b) | ✅ OK | ✅ OK | 🟡 **en cours** — `python harvest_francearchives.py 8c9077ce3826a2676417514c55903ae704aff91b facomponent` | ⚠️ 2 communes absentes → re-run (Aubervilliers 93001, Saint-Denis 93066) |
| **Calvados (14)** — FRAD014 | A→D : [findingaid `d17231b4…`](https://francearchives.gouv.fr/findingaid/d17231b4a0689ac142534b2a6ee4fc0c190338a1)<br>E→Le Me : [findingaid `c89ef2c4…`](https://francearchives.gouv.fr/findingaid/c89ef2c4dfe0d59b57752e97961d4f0b9d067601) | ✅ OK (manuelle, svc 33495) | ❌ pas de IIIF (visionneuse ARK calvados.fr) | ⚠️ harvester à adapter (cf. note) — `…d17231b4…` + `…c89ef2c4…` | — (pas encore moissonné) |

### Légende statuts
- **Lien XML arbre** : URL du finding aid FranceArchives (le `.rdf` est l'export téléchargé).
- **Licence** : ⏳ à déterminer · ✅ confirmée (voir [`licences_par_service.md`](licences_par_service.md)) · ⚠️ à vérifier.
  ⚠️ Les manifestes/RDF de ces fonds **ne portent pas** la licence → table manuelle par service.
- **IIIF dispo** : ⏳ à déterminer · ✅ manifeste IIIF présent · ❌ pas de IIIF (visionneuse ARK simple).
- **Harvester** : commande à lancer · 🟡 en cours · ✅ moissonné (→ `seed_*.sql`).

### 🧩 Réconciliation INSEE (run futur dédié, sans recrawl)
Cases non résolues lors des moissons, à rejouer seules → [`INSEE_a_reconcilier.md`](INSEE_a_reconcilier.md).

- **SSD (93)** — 2 communes **absentes** (nœud sauté) : Aubervilliers `93001`,
  Saint-Denis `93066`. → **re-run** idempotent du harvester (`delete where left(insee,2)='93'` puis recharge), puis vérifier leur présence.
- **Val-d'Oise (95)** — 5 cas (~19 feuilles) d'**INSEE non résolu** :
  - 3 hameaux/anciennes communes (Arthieul→Magny-en-Vexin, Gadancourt→Avernes, Gouzangrez→Commeny) ;
  - 1 commune actuelle ratée par geo.api (Saint-Gratien `95555`) ;
  - 1 cas « parent = section » (Le Bois de Boissy) sans commune captée.

**Stratégie d'appariement (run futur)**
1. Hameaux/anciennes communes : commune actuelle = 1ᵉʳ token entre parenthèses du
   libellé `location` → geo.api `nom=<token>&codeDepartement=95` (plan rattaché à
   la commune actuelle, nom historique gardé en métadonnée).
2. Communes ratées par geo.api (Saint-Gratien, Pierrefitte-sur-Seine…) → enrichir
   `COMMUNE_ALIAS` ou requêter avec le département.
3. Cas « parent = section » → remonter d'un cran dans l'arbre / exploiter le sujet
   `location` de la feuille, au cas par cas.
4. Cible : brancher un **référentiel des communes historiques** (COG INSEE) plutôt
   que le seul geo.api.

### 🔧 Test live des feuilles (échantillons) — résultat
Vérifié en réel sur 3 feuilles « Tableau d'assemblage » déposées :

| Dépt | Cote | Année | IIIF | Image / manifeste |
|---|---|---|---|---|
| Calvados | 3P/1963 | 1829 | ❌ | `archives.calvados.fr/ark:/…` (visionneuse) |
| Calvados | 3P/1930 | 1809 | ❌ | `archives.calvados.fr/ark:/…` (visionneuse) |
| Val-d'Oise | 3 P 1854 | 1819 | ✅ | `archives.valdoise.fr/ark:/…/manifest` |

**Deux enseignements pipeline :**
1. **Calvados n'expose pas de IIIF** : feuilles avec `dcterms:source` ARK
   (`archives.calvados.fr`) + vignette, **sans** `#iiif_manifest`. Le harvester
   exige un manifeste pour retenir une feuille → **il sauterait toutes les
   feuilles Calvados**. À adapter : retenir aussi les feuilles à `dcterms:source`
   ARK (archive_url/image) sans manifeste.
2. **Licence non détectable** depuis le manifeste (Val-d'Oise : seul `attribution`,
   pas de champ `license`). → renseigner via [`licences_par_service.md`](licences_par_service.md).

---

## ⚠️ Points d'attention par département

### Seine-Saint-Denis (93) — département pilote
- Fonds testé en premier (cf. `harvest/README.md`). Licence **OK** + **IIIF OK**.
- Le fichier déposé est un **sous-nœud** (`facomponent` « Plans cadastraux »,
  `8c9077ce…`), pas la racine : le lancer en mode `facomponent`.
- Arbre : 1799-1983 (filtrer la période napoléonienne via `--year-min/--year-max`).
- Détail : voir [`seine-saint-denis/NOTES.md`](seine-saint-denis/NOTES.md).

### Calvados (14)
- Fonds découpé alphabétiquement en plusieurs finding aids (FRAD014). Déposés :
  - **A → D** (`d17231b4…`, Ablon → Ducy-Sainte-Marguerite) — 198 sous-nœuds.
  - **E → Le Me** (`c89ef2c4…`, Écrammeville → Le-Mesnil-Villement) — 153 sous-nœuds.
- **Manque encore** la/les tranche(s) **Le Me → Z** : à récupérer et déposer dans `a_traiter/`.

Détail : voir [`calvados/NOTES.md`](calvados/NOTES.md).
