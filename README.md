# StromPrognose

Strømpris for Vestdanmark (DK1): kendte day-ahead priser plus en 7-dages prognose ud fra vindvejr.

**Åbn siden:** https://martki.github.io/StromPrognose/

## Sådan hænger det sammen

- `index.html` er hele appen. Den henter priser fra `data/prices.json` og prøver samtidig Energi Data Service direkte; den nyeste vinder.
- `.github/workflows/update-prices.yml` henter hver time priserne (`data/prices.json`) og Energinets vind- og solprognoser for DK1 (`data/forecasts.json`), og committer kun når data er ændret.
- Vejret hentes direkte fra Open-Meteo i browseren. Fejler det, vises de kendte priser stadig, bare uden prognose.

## Første gang

Kør workflowet manuelt: fanen **Actions** → **Opdater strømpriser** → **Run workflow**.
Derefter kører det selv hver time.

## Prognosemodellen

- Regression på dansk og nordtysk vind, sol i DK og DE, temperatur, time på døgnet, weekend og helligdage.
- Energinets vind- og solprognose for næste døgn bruges kun, hvis den forbedrer backtesten.
- **Ærlig backtest:** siden genskaber de seneste 3 ugers prognoser med de vejrprognoser, der fandtes dengang (Open-Meteo Previous Runs API), og sammenligner med gættet "samme time for en uge siden".
