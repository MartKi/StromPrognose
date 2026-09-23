// Åbner siden i en rigtig browser og skriver backtest-tabellen ud. Bruges af .github/workflows/backtest.yml.
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8000/';
const b = await chromium.launch();
const p = await b.newPage();
p.on('console', m => m.type() === 'error' && console.log('browser:', m.text()));
await p.goto(url);
await p.waitForFunction(() => document.getElementById('status').textContent !== 'Henter priser og vejrdata…', null, { timeout: 120000 });
const r = await p.evaluate(() => ({
  status: document.getElementById('status').textContent,
  error: document.getElementById('error').textContent,
  honest: state?.honest, bt: state?.bt,
}));
await b.close();
const f = v => v == null ? '–' : v.toFixed(1);
const lines = [`Status: ${r.status}`, r.error ? `Fejl: ${r.error}` : '', `Ærlig backtest: ${r.honest ? 'ja' : 'nej'}`, '',
  '| Døgn frem | Med tysk vejr | Uden tysk vejr | Forskel | Naivt | Timer |', '|---|---|---|---|---|---|'];
let sm = 0, sd = 0, sn = 0;
for (const [d, a] of Object.entries(r.bt?.byLead || {})) {
  lines.push(`| ${d} | ${f(a.mae)} | ${f(a.noDE)} | ${Math.round((1 - a.mae / a.noDE) * 100)} % | ${f(a.naive)} | ${a.n} |`);
  sm += a.mae * a.n; sd += a.noDE * a.n; sn += a.n;
}
if (sn) lines.push(`| Alle | ${f(sm / sn)} | ${f(sd / sn)} | ${Math.round((1 - sm / sd) * 100)} % | | ${sn} |`);
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) (await import('fs')).appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
