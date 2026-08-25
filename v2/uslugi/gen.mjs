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

// Ikony zakresu — ten sam język co kółka etapów na stronie głównej:
// siatka 24, kontur 1.4, zaokrąglone końce. Klucz z trzeciej pozycji `zakres`
// w dane.json. Reguła: w obrębie jednej strony żadna ikona się nie powtarza.
const IKONY = {
  osoba: '<circle cx="9" cy="7.6" r="3.3"/><path d="M3.4 19.6a5.6 5.6 0 0 1 11.2 0"/><path d="M15.8 9.2l1.9 1.9 3.4-3.9"/>',
  stetoskop: '<path d="M6 3v5.2a4 4 0 0 0 8 0V3"/><path d="M4.4 3h3.2M12.4 3h3.2"/><path d="M10 12.4v2.3a4.6 4.6 0 0 0 9.2 0v-1.1"/><circle cx="19.2" cy="11.2" r="2"/>',
  hantla: '<path d="M3.6 9.4v5.2M6.8 7.4v9.2M17.2 7.4v9.2M20.4 9.4v5.2"/><path d="M6.8 12h10.4"/>',
  wykres: '<path d="M3.4 20.4h17.2"/><path d="M7 20.4v-4.6M11.6 20.4v-8M16.2 20.4v-5.4M20.8 20.4v-11"/>',
  tarcza: '<path d="M12 21s7.4-3.7 7.4-9.1V5.7L12 3 4.6 5.7v6.2C4.6 17.3 12 21 12 21Z"/><path d="M7.6 12.1h2.2l1.4-2.5 1.9 4.3 1.2-1.8h1.9"/>',
  kalendarz: '<rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.4"/><path d="M3.4 10h17.2M8.2 3.4v3.4M15.8 3.4v3.4"/><path d="M7.6 13.6h2.2M11 13.6h2.2M14.4 13.6h2.2M7.6 17h2.2M11 17h2.2"/>',
  powrot: '<path d="M20.2 12a8.2 8.2 0 1 1-2.6-6"/><path d="M20.4 3.6v4.6h-4.6"/>',
  rozmowa: '<path d="M3.4 7.2a2.6 2.6 0 0 1 2.6-2.6h7.4a2.6 2.6 0 0 1 2.6 2.6v3.6a2.6 2.6 0 0 1-2.6 2.6H8.2L4.6 16.4v-2.8a2.6 2.6 0 0 1-1.2-2.2Z"/><path d="M18.2 8.6h.2a2.4 2.4 0 0 1 2.4 2.4v3.4a2.4 2.4 0 0 1-1.2 2.1v2.6l-3.2-2.6h-3"/>',
  dokument: '<path d="M13.4 3.4H7a2.4 2.4 0 0 0-2.4 2.4v12.4A2.4 2.4 0 0 0 7 20.6h10a2.4 2.4 0 0 0 2.4-2.4V9.4Z"/><path d="M13.4 3.4v6h6"/><path d="M8.4 13h7.2M8.4 16.4h5"/>',
  siec: '<circle cx="12" cy="4.8" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M10.6 6.8 6.2 15.8M13.4 6.8l4.4 9M7.2 18h9.6"/>',
  fale: '<path d="M3.6 15.6a8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 8.4 8.4"/><path d="M7.2 15.6A4.8 4.8 0 0 1 12 10.8a4.8 4.8 0 0 1 4.8 4.8"/><path d="M10.6 15.6A1.4 1.4 0 0 1 12 14.2a1.4 1.4 0 0 1 1.4 1.4"/><path d="M3.6 19.4h16.8"/>',
  kosc: '<path d="M8.4 15.6 15.6 8.4"/><path d="M8.4 15.6a2.4 2.4 0 1 0-3 3 2.4 2.4 0 1 0 3 3 2.4 2.4 0 0 0 3-3Z"/><path d="M15.6 8.4a2.4 2.4 0 1 0 3-3 2.4 2.4 0 1 0-3-3 2.4 2.4 0 0 0-3 3Z"/>',
  zabieg: '<path d="M20.4 3.6 9.8 14.2l-2.4 4.8 4.8-2.4L20.4 3.6Z"/><path d="M14.6 8.8 4.4 19"/><path d="M3.4 20.6h4"/>',
  serce: '<path d="M12 20.4s-6.6-3.8-6.6-8.4a3.7 3.7 0 0 1 6.6-2.3 3.7 3.7 0 0 1 6.6 2.3c0 4.6-6.6 8.4-6.6 8.4Z"/><path d="M6.8 4.4h10.4"/>',
  iskra: '<path d="M13.4 2.6 5.6 13.4h5.2l-.8 8 8-11h-5.2Z"/>',
  rece: '<path d="M9.6 12.4V5.6a1.6 1.6 0 0 1 3.2 0v5.2"/><path d="M12.8 10.4a1.6 1.6 0 0 1 3.2 0v1.6"/><path d="M16 11.6a1.6 1.6 0 0 1 3.2 0v3.2a5.6 5.6 0 0 1-5.6 5.6h-2a5.6 5.6 0 0 1-5.6-5.6v-2.4"/><path d="M6 12.4a1.6 1.6 0 0 1 3.2 0"/>',
  waga: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3"/><path d="M8.4 8.6h7.2"/><path d="M12 16.6v-4.4l2.6-1.6"/>',
  talerz: '<circle cx="10.6" cy="12" r="7"/><circle cx="10.6" cy="12" r="3.4"/><path d="M19.4 4.6v14.8M17.4 4.6v4.2a2 2 0 0 0 4 0V4.6"/>',
  pigulka: '<rect x="2.8" y="9" width="18.4" height="6" rx="3" transform="rotate(-40 12 12)"/><path d="M9.4 8.2 15.8 14.6"/>',
  apteczka: '<rect x="3.4" y="7" width="17.2" height="13" rx="2.6"/><path d="M8.6 7V5.4a1.8 1.8 0 0 1 1.8-1.8h3.2a1.8 1.8 0 0 1 1.8 1.8V7"/><path d="M12 10.6v5.8M9.1 13.5h5.8"/>',
  tablica: '<rect x="3.4" y="4" width="17.2" height="11.6" rx="2.2"/><path d="M12 15.6v4.8M8.4 20.4h7.2"/><path d="M7.6 11.6l2.8-3.2 2.4 2.2 3.6-3.8"/>',
  grupa: '<circle cx="9" cy="8.4" r="2.8"/><path d="M3.6 18.4a5.4 5.4 0 0 1 10.8 0"/><path d="M15.6 6.2a2.8 2.8 0 0 1 0 5.4"/><path d="M16.8 13.8a5.4 5.4 0 0 1 3.6 4.6"/>',
};
const ikona = n => { assert(n in IKONY, `nieznana ikona: ${n}`);
  return '<svg class="kafel-ikona" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    IKONY[n] + '</svg>'; };

for (const u of uslugi) {
  const pola = {
    ...u,
    meta: esc(u.lead),
    tytulAtr: esc(u.tytul),
    zakresHtml: u.zakres.map(([t, o, ik]) =>
      `<article class="kafel" data-rv>${ikona(ik)}` +
      `<div><h3>${t}</h3><p>${o}</p></div></article>`).join('\n      '),
    opisHtml: `<p>${u.opis[0]}</p>`,   // reszta akapitów czeka w dane.json, strona bierze jeden
    dlaKogoHtml: u.dlaKogo.map(([t, ik]) =>
      `<li>${ikona(ik)}<span>${t}</span></li>`).join('\n        '),
    // Pozostałe pięć usług jako karty w anatomii slidera z home.
    // BEZ podpisu „01 / Dział" i Z pastylką „Otwórz" (decyzja klienta, 35b009a).
    // Uwaga historyczna: ta zmiana żyła najpierw tylko w wygenerowanych plikach,
    // więc pierwsze `node gen.mjs` po niej cicho przywróciło numerki i skasowało
    // pastylkę. Wszystko, co ma przetrwać regenerację, musi być TUTAJ.
    inneHtml: uslugi.filter(x => x.slug !== u.slug).map(x =>
      `<a class="inna" href="${x.slug}.html">` +
      `<img src="../img/${x.foto}" alt="" loading="lazy" style="object-position:${x.pozycja}">` +
      `<b>${x.tytul}</b><span class="inna-pill">Otwórz<i>` +
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ` +
      `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
      `<path d="M7 17 17 7M9 7h8v8"/></svg></i></span></a>`).join('\n      '),
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
