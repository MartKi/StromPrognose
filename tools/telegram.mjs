// Åbner siden i Chromium, bygger morgenbeskeden og sender den til Telegram.
// Uden TELEGRAM_BOT_TOKEN skrives beskeden bare i loggen (tør-kørsel).
import { chromium } from 'playwright';
import { appendFileSync } from 'fs';
import { buildMessage } from './telegram-message.mjs';

const url = process.argv[2] || 'http://localhost:8000/';
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat, INKL_MOMS, TILLAEG_ORE, GITHUB_OUTPUT } = process.env;

const b = await chromium.launch();
const p = await b.newPage();
await p.goto(url);
await p.waitForFunction(() => document.getElementById('status').textContent !== 'Henter priser og vejrdata…', null, { timeout: 120000 });
const state = await p.evaluate(() => state && { known: state.known, fc: state.fc, lastKnown: state.lastKnown, bt: state.bt });
await b.close();
if (!state) throw new Error('Siden kunne ikke beregne priser');

const text = buildMessage(state, Date.now(), { vat: /^(1|ja|true)$/i.test(INKL_MOMS || ''), addon: +TILLAEG_ORE || 0 });
if (!text) throw new Error('Ingen priser for i dag');
console.log(text);

if (!token || !chat) { console.log('\nTELEGRAM_BOT_TOKEN eller TELEGRAM_CHAT_ID mangler, så beskeden er ikke sendt.'); process.exit(0); }
const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
});
const j = await r.json();
if (!j.ok) throw new Error('Telegram svarede: ' + JSON.stringify(j));
console.log('\nSendt til Telegram.');
if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, 'sent=true\n');
