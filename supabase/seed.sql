-- ==================================================================
-- Données d'amorçage (DÉMO) — à remplacer par de vrais liens.
--
-- ⚠️ Les URLs ci-dessous sont les pages de recherche / portails fournis
-- en exemple, PAS des liens directs vers les plans d'une commune précise.
-- Elles servent uniquement à vérifier l'affichage de l'annuaire. Le vrai
-- travail (retrouver le lien direct par commune) est précisément ce qui
-- sera crowdsourcé en V0.1.
--
-- INSEE des communes de démo :
--   25056 Besançon (Doubs)        39300 Lons-le-Saunier (Jura)
--   31555 Toulouse (Haute-Garonne) 21231 Dijon (Côte-d'Or)
-- ==================================================================

insert into document (insee, type, section_lettre, feuille_num, annee, archive_url, statut) values
  -- Doubs (portail Mnesys)
  ('25056', 'tableau_assemblage', null, null, 1832,
   'https://portail-archives.doubs.fr/search/form/e8978457-7836-44a9-882e-a7fd3d1df7c2', 'lien'),

  -- Jura (portail Ligeo)
  ('39300', 'tableau_assemblage', null, null, 1828,
   'https://archives39.fr/search/form/0a4fae72-ee28-4663-ac8f-e4a4e89ebc68', 'lien'),
  ('39300', 'section', 'A', null, 1828,
   'https://archives39.fr/search/form/0a4fae72-ee28-4663-ac8f-e4a4e89ebc68', 'lien'),
  ('39300', 'section', 'B', null, 1828,
   'https://archives39.fr/search/form/0a4fae72-ee28-4663-ac8f-e4a4e89ebc68', 'lien'),

  -- Haute-Garonne
  ('31555', 'tableau_assemblage', null, null, 1830,
   'https://archives.haute-garonne.fr/archive/recherche/cadastre/n:111', 'lien'),

  -- Côte-d'Or (visualiseur EAD)
  ('21231', 'tableau_assemblage', null, null, 1834,
   'https://archives.cotedor.fr/console/ir_ead_visu.php?eadid=FRAD021_000000905&ir=23318', 'lien');
