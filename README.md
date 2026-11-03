# StromPrognose

Strømpris for Vestdanmark (DK1): kendte day-ahead priser plus en prognose op til en måned frem (vælg 7 dage, 14 dage eller 1 måned på siden).

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
- **Horisont:** vejrprognosen hentes 16 døgn frem. Til dag 10 bruges den fuldt, fra dag 10 til 16 glider den over mod en uge-tendens, og efter dag 16 bruges kun uge-tendensen.
- **Uge-tendens:** normalt vejr (snit af de seneste 3 uger pr. time) skubbet med halvdelen af GFS-ensemblets afvigelse fra normalt (Open-Meteo Ensemble API, 31 beregninger, ca. 5 uger frem), udglattet over 7 døgn. Ensemblet kalibreres mod vejrprognosen på de første 7 døgn. Kan det ikke hentes, bruges kun normalt vejr. Dagene vises falmet, fordi de kun viser niveau, døgnrytme, weekend og en svag tendens.
- **Usikkerhed:** dag 1 til 7 fra backtesten; derefter vokser båndet mod modellens fejl med kun normalt vejr, målt på de seneste 2 uger.
- **Ærlig backtest:** workflowet genskaber de seneste 3 ugers prognoser med de vejrprognoser, der fandtes dengang (Open-Meteo Previous Runs API), og sammenligner med samme model uden tysk vejr og med gættet "samme time for en uge siden".
- `.github/workflows/backtest.yml` regner backtesten hver nat (og når siden ændres) ved at åbne siden med `?backtest=1`, og gemmer resultatet i `data/backtest.json`. Siden læser kun filen, så den ikke afhænger af Open-Meteos tjeneste for gamle prognoser. Fejler tjenesten, beholdes den forrige fil.

## Morgenbesked på Telegram

`.github/workflows/telegram.yml` sender hver morgen (ca. kl. 6 dansk tid) dagens kendte priser og prognosen for i morgen.

1. Skriv til **@BotFather** i Telegram, send `/newbot` og følg trinnene. Du får et token.
2. Skriv en besked til din nye bot, og åbn `https://api.telegram.org/bot<TOKEN>/getUpdates`. Tallet ved `"chat":{"id":...}` er dit chat-id.
3. I repoet: **Settings → Secrets and variables → Actions**. Opret secrets `TELEGRAM_BOT_TOKEN` og `TELEGRAM_CHAT_ID`.
4. Valgfrit under fanen **Variables**: `TELEGRAM_INKL_MOMS` = `ja` og `TELEGRAM_TILLAEG_ORE` = fx `90` (nettarif, elafgift og leverandørtillæg).
5. Test: **Actions → Morgenbesked på Telegram → Run workflow**.

Uden secrets skrives beskeden kun i kørslens log.
