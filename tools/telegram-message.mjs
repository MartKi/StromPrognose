// Bygger morgenbeskeden ud fra sidens beregnede tilstand (kendte timepriser, prognose og backtest).
const TZ = 'Europe/Copenhagen', H = 3600e3;
const fKey = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const fH = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' });
const fDay = new Intl.DateTimeFormat('da-DK', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const dayKey = t => fKey.format(t), hour = t => +fH.format(t) % 24, hh = t => String(hour(t)).padStart(2, '0') + '.00';

// Billigste eller dyreste sammenhængende vindue på `len` timer
function window(rows, len, cheapest) {
  let best = null;
  for (let i = 0; i + len <= rows.length; i++) {
    const a = rows.slice(i, i + len);
    if (a.at(-1).t - a[0].t !== (len - 1) * H) continue;
    const avg = a.reduce((s, r) => s + r.p, 0) / len;
    if (!best || (cheapest ? avg < best.avg : avg > best.avg)) best = { t: a[0].t, avg };
  }
  return best;
}

export function buildMessage(state, now, { vat = false, addon = 0, url = 'https://martki.github.io/StromPrognose/' } = {}) {
  const disp = p => (p + addon) * (vat ? 1.25 : 1), n = p => Math.round(disp(p));
  const rows = [...state.known.map(r => ({ t: r.t, p: r.p, f: false })),
                ...state.fc.filter(r => r.t > state.lastKnown).map(r => ({ t: r.t, p: r.p, f: true }))];
  const today = dayKey(now);
  let tomorrow = today; for (let t = now; tomorrow === today; t += H) tomorrow = dayKey(t);   // første time i næste døgn, også ved sommertidsskifte
  const days = [today, tomorrow].map(k => ({ k, rows: rows.filter(r => dayKey(r.t) === k) })).filter(d => d.rows.length);
  if (!days.length) return null;

  // Farver relativt til de to døgn: nederste tredjedel grøn, øverste rød
  const all = days.flatMap(d => d.rows.map(r => r.p)).sort((a, b) => a - b), q = x => all[Math.floor(x * (all.length - 1))];
  const lo = q(1 / 3), hi = q(2 / 3), sq = p => p <= lo ? '🟩' : p >= hi ? '🟥' : '🟨';
  const mae1 = state.bt?.byLead?.[1]?.mae;

  const out = [`⚡ <b>Strømpris DK1</b>`, `<i>${vat || addon ? 'Pris' : 'Spotpris'} i øre/kWh, ${vat ? 'inkl. moms' : 'ekskl. moms'}${addon ? ` og ${addon} øre tillæg` : ''}</i>`];
  for (const d of days) {
    const isToday = d.k === today, forecast = d.rows.some(r => r.f);
    // I dag tæller kun timerne fra nu af; resten af døgnet er allerede brugt
    const ahead = isToday ? d.rows.filter(r => r.t + H > now) : d.rows;
    const ps = d.rows.map(r => r.p), avg = ps.reduce((s, x) => s + x, 0) / ps.length;
    const mn = d.rows.reduce((m, r) => r.p < m.p ? r : m), mx = d.rows.reduce((m, r) => r.p > m.p ? r : m);
    const cheap = window(ahead, 3, true), dear = window(ahead, 3, false), ca = forecast ? 'ca. ' : '';
    const label = `${isToday ? 'I dag' : 'I morgen'}, ${fDay.format(d.rows[0].t)}`;
    out.push('', `<b>${label}</b> ${forecast ? `(prognose${mae1 ? `, typisk fejl ± ${Math.round(mae1 * (vat ? 1.25 : 1))} øre` : ''})` : '(kendte priser)'}`);
    out.push(`Snit ${ca}${n(avg)} · laveste ${n(mn.p)} kl. ${hh(mn.t)} · højeste ${n(mx.p)} kl. ${hh(mx.t)}`);
    if (cheap) out.push(`🟢 Billigst${isToday ? ' resten af dagen' : ''}: ${hh(cheap.t)} til ${hh(cheap.t + 3 * H)}, snit ${ca}${n(cheap.avg)}`);
    if (dear) out.push(`🔴 Dyrest: ${hh(dear.t)} til ${hh(dear.t + 3 * H)}, snit ${ca}${n(dear.avg)}`);
    const byH = new Map(d.rows.map(r => [hour(r.t), r]));
    out.push([0, 6, 12, 18].map(h0 => `<code>${String(h0).padStart(2, '0')}</code> ` + [0, 1, 2, 3, 4, 5].map(i => byH.has(h0 + i) ? sq(byH.get(h0 + i).p) : '⬜').join('')).join('\n'));
  }
  if (days.length === 1) out.push('', '<i>Prognose for i morgen mangler, fordi vejrdata ikke kunne hentes.</i>');
  out.push('', `<a href="${url}">Se hele ugen</a>`);
  return out.join('\n');
}
