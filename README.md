# StromPrognose

Strømpris for Vestdanmark (DK1): kendte day-ahead priser plus en 7-dages prognose ud fra vindvejr.

**Åbn siden:** https://martki.github.io/StromPrognose/

## Sådan hænger det sammen

- `index.html` er hele appen. Den henter priser fra `data/prices.json` og prøver samtidig Energi Data Service direkte; den nyeste vinder.
- `.github/workflows/update-prices.yml` henter priserne hver time til `data/prices.json` og committer kun, når de er ændret.
- Vejret hentes direkte fra Open-Meteo i browseren. Fejler det, vises de kendte priser stadig, bare uden prognose.

## Første gang

Kør workflowet manuelt: fanen **Actions** → **Opdater strømpriser** → **Run workflow**.
Derefter kører det selv hver time.

## Prognosemodellen

- Regression på dansk og nordtysk vind, sol i DK og DE, temperatur, time på døgnet, weekend og helligdage.
- **Ærlig backtest:** siden genskaber de seneste 3 ugers prognoser med de vejrprognoser, der fandtes dengang (Open-Meteo Previous Runs API), og sammenligner med samme model uden tysk vejr og med gættet "samme time for en uge siden".
- `.github/workflows/backtest.yml` kører backtesten i en rigtig browser, hver gang siden ændres, og viser tabellen i kørslens oversigt.

## Morgenbesked på Telegram

`.github/workflows/telegram.yml` sender hver morgen (ca. kl. 6 dansk tid) dagens kendte priser og prognosen for i morgen.

1. Skriv til **@BotFather** i Telegram, send `/newbot` og følg trinnene. Du får et token.
2. Skriv en besked til din nye bot, og åbn `https://api.telegram.org/bot<TOKEN>/getUpdates`. Tallet ved `"chat":{"id":...}` er dit chat-id.
3. I repoet: **Settings → Secrets and variables → Actions**. Opret secrets `TELEGRAM_BOT_TOKEN` og `TELEGRAM_CHAT_ID`.
4. Valgfrit under fanen **Variables**: `TELEGRAM_INKL_MOMS` = `ja` og `TELEGRAM_TILLAEG_ORE` = fx `90` (nettarif, elafgift og leverandørtillæg).
5. Test: **Actions → Morgenbesked på Telegram → Run workflow**.

Uden secrets skrives beskeden kun i kørslens log.
