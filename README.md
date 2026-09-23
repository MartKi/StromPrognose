# StromPrognose

Strømpris for Vestdanmark (DK1): kendte day-ahead priser plus en 7-dages prognose ud fra vindvejr.

**Åbn siden:** https://martki.github.io/StromPrognose/

## Sådan hænger det sammen

- `index.html` er hele appen. Den henter priser fra `data/prices.json` og prøver samtidig Energi Data Service direkte; den nyeste vinder.
- `.github/workflows/update-prices.yml` henter priserne hver time og committer `data/prices.json`, når der er nye priser (typisk én gang i døgnet efter kl. 13).
- Vejret hentes direkte fra Open-Meteo i browseren. Fejler det, vises de kendte priser stadig, bare uden prognose.

## Første gang

Kør workflowet manuelt: fanen **Actions** → **Opdater strømpriser** → **Run workflow**.
Derefter kører det selv hver time.
