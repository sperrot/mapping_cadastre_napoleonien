# Calvados (14) — FRAD014

Service FranceArchives : `service/33495` (Archives départementales du Calvados).

## Finding aids du fonds cadastre

| Fichier | Plage communes | ID FranceArchives | Identifiant cote | Enfants niv.1 | Statut |
|---|---|---|---|---|---|
| [`findingaid_A-D_d17231b4….xml`](findingaid_A-D_d17231b4a0689ac142534b2a6ee4fc0c190338a1.xml) | A → D (Ablon → Ducy-Ste-Marguerite) | `d17231b4a0689ac142534b2a6ee4fc0c190338a1` | `FRAD014_Cadastre_Ablon_Ducy-Sainte-Marguerite` | 198 | déposé, **harvester à lancer** |
| [`findingaid_E-LeMe_c89ef2c4….xml`](findingaid_E-LeMe_c89ef2c4dfe0d59b57752e97961d4f0b9d067601.xml) | E → Le Me (Écrammeville → Le-Mesnil-Villement) | `c89ef2c4dfe0d59b57752e97961d4f0b9d067601` | `FRAD014_Cadastre_Ecrammeville_Le-Mesnil-Villement` | 153 | déposé, **harvester à lancer** |
| _(manquant)_ | Le Me → Z | — | — | — | **à récupérer** |

## Structure RDF observée (racine A→D)

- `rico:title` = « Cadastre (communes de A à D) »
- `rico:hasOrHadManager` → `service/33495`
- 198 × `rico:includesOrIncluded` → `facomponent/<id>` (communes / sous-fonds)
- **Pas** de manifeste IIIF ni de licence à ce niveau → descendre l'arbre.
- Un `#record` (FindingAid) + une `#record_inst1` (export CSV : `…0338a1.csv`).

## ⚠️ Feuilles Calvados : pas de IIIF (test live)

Échantillons : [`sample_feuille_TA-1829_520f5e70.xml`](sample_feuille_TA-1829_520f5e70.xml),
[`sample_feuille_TA-1809_53c5b834.xml`](sample_feuille_TA-1809_53c5b834.xml).

- Pas de `#iiif_manifest`. La feuille porte un `dcterms:source` ARK vers la
  visionneuse AD14 (`https://archives.calvados.fr/ark:/52329/…`) + une vignette
  `_img-notice.jpg`. **Donc IIIF ❌, mais image numérisée disponible.**
- Licence : **OK** (confirmée, service 33495 → [`../licences_par_service.md`](../licences_par_service.md)).
- **Impact harvester** : `harvest_francearchives.py` ne retient une feuille que si
  `leaf_manifest` trouve un `/manifest` → il **sauterait les feuilles Calvados**.
  À adapter : accepter une feuille sans manifeste dès qu'elle a un `dcterms:source`
  ARK (le mettre en `archive_url`/`image_url`, `iiif_manifest = null`).

## À faire

1. Récupérer les finding aids frères (E→Z) du cadastre FRAD014 sur FranceArchives,
   les déposer ici → je les range et complète le tableau.
2. Lancer le harvester en local sur A→D pour révéler licence + IIIF réels :
   ```bash
   cd harvest
   python harvest_francearchives.py d17231b4a0689ac142534b2a6ee4fc0c190338a1 > seed_calvados_A-D.sql
   ```
   Reporter dans le tableau maître : licence détectée (`overlay_ok`) et présence IIIF.
