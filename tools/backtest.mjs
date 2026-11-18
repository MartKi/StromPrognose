// Åbner siden med ?backtest=1 i en rigtig browser, så den henter Open-Meteos gamle prognoser og regner backtesten.
// Resultatet gemmes i data/backtest.json, som siden læser. Bruges af .github/workflows/backtest.yml.
import { chromium } from 'playwright';
import { writeFileSync, appendFileSync } from 'fs';
const url = process.argv[2] || 'http://localhost:8000/?backtest=1';
const b = await chromium.launch();
const p = await b.newPage();
const t0 = Date.now(), sec = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
p.on('console', m => m.type() === 'error' && console.log(`[${sec()}] browser:`, m.text().slice(0, 200)));
p.on('requestfailed', r => console.log(`[${sec()}] kald fejlede: ${r.failure()?.errorText} ${r.url().slice(0, 100)}`));
await p.goto(url);
await p.waitForFunction(() => document.getElementById('status').textContent !== 'Henter priser og vejrdata…', null, { timeout: 10 * 60e3 });   // vejrdata kan tage flere forsøg
console.log(`[${sec()}] Priser og prognose vist`);
await p.waitForFunction(() => state?.btStatus !== 'pending', null, { timeout: 30 * 60e3 });
const r = await p.evaluate(() => ({ status: state.btStatus, error: state.btError, external: state.btExternal, bt: state.bt }));
await b.close();
if (r.status !== 'done') {
  // Er Open-Meteo nede, er det ikke en fejl i koden: siden viser den forrige backtest, og næste planlagte kørsel prøver igen.
  // Derfor kun en advarsel, så der ikke sendes en fejlmail. Alt andet får kørslen til at fejle.
  if (r.external) { console.log(`::warning::Backtesten blev ikke regnet, fordi Open-Meteo fejlede (${r.error}). data/backtest.json beholdes uændret.`); process.exit(0); }
  console.log(`Backtesten fejlede: ${r.error}. data/backtest.json beholdes uændret.`); process.exit(1);
}
console.log(`[${sec()}] Backtest færdig`);

writeFileSync('data/backtest.json', JSON.stringify(r.bt) + '\n');
const f = v => v == null ? '–' : v.toFixed(1);
const lines = ['| Døgn frem | Med tysk vejr | Uden tysk vejr | Forskel | Naivt | Timer |', '|---|---|---|---|---|---|'];
let sm = 0, sd = 0, sn = 0;
for (const [d, a] of Object.entries(r.bt.byLead)) {
  lines.push(`| ${d} | ${f(a.mae)} | ${f(a.noDE)} | ${Math.round((1 - a.mae / a.noDE) * 100)} % | ${f(a.naive)} | ${a.n} |`);
  sm += a.mae * a.n; sd += a.noDE * a.n; sn += a.n;
}
if (sn) lines.push(`| Alle | ${f(sm / sn)} | ${f(sd / sn)} | ${Math.round((1 - sm / sd) * 100)} % | | ${sn} |`);
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
