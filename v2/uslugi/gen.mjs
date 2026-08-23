// Generator podstron usług: szablon.html + dane.json → uslugi/<slug>.html
// Sześć podstron różni się wyłącznie treścią, więc jest jeden szablon i jedno
// miejsce edycji. Uruchamiać po każdej zmianie szablonu albo danych:
//     node sites/champions-health/v2/uslugi/gen.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const tu = dirname(fileURLToPath(import.meta.url));
const szablon = readFileSync(join(tu, 'szablon.html'), 'utf8');
const uslugi = JSON.parse(readFileSync(join(tu, 'dane.json'), 'utf8'));

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const u of uslugi) {
  const pola = {
    ...u,
    meta: esc(u.lead),
    tytulAtr: esc(u.tytul),
    faktyHtml: u.fakty.map(([k, v]) =>
      `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n      '),
    zakresHtml: u.zakres.map(([t, o], i) =>
      `<article class="kafel" data-rv><i>${String(i + 1).padStart(2, '0')}</i>` +
      `<h3>${t}</h3><p>${o}</p></article>`).join('\n      '),
    opisHtml: `<p>${u.opis[0]}</p>`,   // reszta akapitów czeka w dane.json, strona bierze jeden
    dlaKogoHtml: u.dlaKogo.map(l => `<li>${l}</li>`).join('\n        '),
    // pozostałe pięć usług jako karty w anatomii slidera z home
    inneHtml: uslugi.filter(x => x.slug !== u.slug).map(x =>
      `<a class="inna" href="${x.slug}.html">` +
      `<img src="../img/${x.foto}" alt="" loading="lazy" style="object-position:${x.pozycja}">` +
      `<span>${x.nr} / ${x.dzial}</span><b>${x.tytul}</b></a>`).join('\n      '),
  };

  const html = szablon.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    assert(k in pola, `szablon woła {{${k}}}, a dane tego nie mają (${u.slug})`);
    return pola[k];
  });
  // cicha literówka w nazwie pola zostawiłaby {{...}} w wyniku — łapiemy to tutaj
  assert(!/\{\{/.test(html), `nierozwinięte pole w ${u.slug}.html`);
  writeFileSync(join(tu, `${u.slug}.html`), html);
  console.log(`${u.slug}.html  ${(html.length / 1024).toFixed(1)} kB`);
}
console.log(`\n${uslugi.length} podstron gotowych`);
