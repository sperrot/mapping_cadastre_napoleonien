#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sonde — descend un fonds FranceArchives jusqu'aux premières FEUILLES réelles
et affiche, pour chacune, son manifeste IIIF et ses sources d'image (dao).

But : trancher « ce département est-il IIIF ? » sans ambiguïté (utile quand le
scout renvoie IIIF=❌ : feuilles sans manifeste = non-IIIF, ou non numérisées).

À lancer EN LOCAL (réutilise le contournement anti-robot du harvester).

Usage :
    python probe_leaf.py c89ef2c4dfe0d59b57752e97961d4f0b9d067601 findingaid -k 4
"""

import argparse
from rdflib import URIRef

import harvest_francearchives as H
from harvest_francearchives import (
    BASE, RICO, RDFS, DCTERMS, fetch_graph, eid_of, leaf_manifest,
)


def first_leaves(etype, eid, k, seen, found):
    if len(found) >= k or eid in seen:
        return
    seen.add(eid)
    g = fetch_graph(etype, eid)
    if g is None:
        return
    subj = URIRef(f"{BASE}/{etype}/{eid}")
    children = [eid_of(str(o)) for o in g.objects(subj, RICO.includesOrIncluded)]
    if not children:
        found.append((eid, g, subj))
        return
    for c in children:
        if len(found) >= k:
            return
        first_leaves("facomponent", c, k, seen, found)


def main():
    ap = argparse.ArgumentParser(description="Sonde feuilles FranceArchives (IIIF ?)")
    ap.add_argument("eid")
    ap.add_argument("etype", nargs="?", default="findingaid",
                    choices=["findingaid", "facomponent"])
    ap.add_argument("-k", type=int, default=4, help="nb de feuilles à sonder")
    a = ap.parse_args()

    seen, found = set(), []
    first_leaves(a.etype, a.eid, a.k, seen, found)

    print(f"\n=== {len(found)} feuille(s) sondée(s) sous {a.etype}/{a.eid} ===\n")
    for eid, g, subj in found:
        title = next((str(o) for o in g.objects(subj, RICO.title)), "") \
            or next((str(o) for o in g.objects(subj, RDFS.label)), "")
        man = leaf_manifest(g, subj)
        daos = [str(src) for inst in g.objects(subj, RICO.hasInstantiation)
                for src in g.objects(inst, DCTERMS.source)]
        print(f"- {title}  ({eid})")
        print(f"    manifeste IIIF : {man or 'AUCUN'}")
        print(f"    dao / sources  : {daos or 'aucune'}")
        print()


if __name__ == "__main__":
    main()
