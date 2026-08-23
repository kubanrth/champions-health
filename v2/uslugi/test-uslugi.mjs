// Regresja podstron usług. Wymaga `node serve.mjs` w korzeniu workspace'u.
//   node sites/champions-health/v2/uslugi/test-uslugi.mjs         — same testy
//   node sites/champions-health/v2/uslugi/test-uslugi.mjs --foto  — plus zrzuty
//
// Sprawdza na trzech szerokościach: brak błędów konsoli i 4xx, brak przepełnienia
// w poziomie, obecność wszystkich sekcji, dojście linków do rodzeństwa, kontrast
// tekstu na szkle oraz to, że wjazd sekcji faktycznie odsłania treść.
import puppeteer from 'puppeteer';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const tu = dirname(fileURLToPath(import.meta.url));
const uslugi = JSON.parse(readFileSync(join(tu, 'dane.json'), 'utf8'));
const BAZA = 'http://localhost:3000/champions-health/v2/uslugi/';
const FOTO = process.argv.includes('--foto');
const KAT = join(tu, '../../../..', 'temporary screenshots');
let bledy = 0;
const zle = (co, szcz) => { console.log('  BŁĄD ' + co, szcz ?? ''); bledy++; };

// względna luminancja wg WCAG
const kontrast = (a, b) => {
  const L = c => {
    const [r, g, bl] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(v => {
      const s = v / 255; return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
    });
    return .2126 * r + .7152 * g + .0722 * bl;
  };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + .05) / (y + .05);
};

const przegladarka = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

for (const u of uslugi) {
  console.log(`\n— ${u.slug}`);
  for (const [w, h] of [[1440, 900], [820, 1180], [390, 844]]) {
    const p = await przegladarka.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const konsola = [], sieć = [];
    p.on('console', m => m.type() === 'error' && konsola.push(m.text()));
    p.on('response', r => r.status() >= 400 && sieć.push(`${r.status()} ${r.url()}`));

    await p.goto(BAZA + u.slug + '.html', { waitUntil: 'networkidle2' });
    // Przewijamy całą stronę, żeby IntersectionObserver odsłonił wszystkie sekcje.
    // PUŁAPKA: strona ma `html{scroll-behavior:smooth}`, więc zwykłe `scrollTo(0,y)`
    // w ciasnej pętli nigdy nie dojeżdża — każdy kolejny skok restartuje płynny
    // przewijak od bieżącej pozycji i strona pełznie o kilkadziesiąt pikseli.
    // Stąd `behavior:'instant'` i krok równy wysokości okna z pauzą na klatkę IO.
    await p.evaluate(async () => {
      const krok = Math.round(innerHeight * .8);
      for (let y = 0; y < document.body.scrollHeight; y += krok) {
        scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 90));
      }
      scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 1000));
    });

    const r = await p.evaluate(() => {
      const wid = document.documentElement.clientWidth;   // NIE innerWidth: przy emulacji mobilnej kłamie
      const poza = [...document.querySelectorAll('body *')]
        .filter(e => e.getBoundingClientRect().right > wid + 1)
        .map(e => e.className || e.tagName).slice(0, 4);
      const st = e => e && getComputedStyle(e);
      const kafel = document.querySelector('.kafel');
      return {
        przepelnienie: document.documentElement.scrollWidth - wid,
        poza,
        sekcje: ['.pg-hero', '.kafle', '.proza', '.kroki', '#kontakt', '.inne']
          .filter(s => !document.querySelector(s)),
        ukryte: [...document.querySelectorAll('[data-rv]')]
          .filter(e => +st(e).opacity < .9).length,
        obrazy: [...document.images].filter(i => !i.complete || !i.naturalWidth)
          .map(i => i.getAttribute('src')),
        linki: [...document.querySelectorAll('.inna')].map(a => a.getAttribute('href')),
        h1: document.querySelector('h1')?.textContent.trim(),
        // kontrast opisu kafla na szkle — najciemniejszy tekst na stronie
        para: kafel ? [st(kafel.querySelector('p')).color, st(kafel).backgroundColor] : null,
        szklo: kafel ? st(kafel).backdropFilter : '',
      };
    });

    if (r.przepelnienie > 0) zle(`przepełnienie ${r.przepelnienie}px @${w}`, r.poza);
    if (r.sekcje.length) zle(`brak sekcji @${w}`, r.sekcje);
    if (r.ukryte) zle(`${r.ukryte} bloków nie wjechało @${w}`);
    if (r.obrazy.length) zle(`obrazy nie wczytane @${w}`, r.obrazy);
    if (konsola.length) zle(`konsola @${w}`, konsola.slice(0, 3));
    if (sieć.length) zle(`4xx/5xx @${w}`, sieć.slice(0, 3));
    if (r.h1 !== u.tytul) zle(`h1 @${w}`, r.h1);
    if (!/blur/.test(r.szklo)) zle(`kafel bez szkła @${w}`, r.szklo);
    if (r.linki.length !== uslugi.length - 1) zle(`linki do rodzeństwa @${w}`, r.linki.length);
    for (const l of r.linki)
      if (!existsSync(join(tu, l))) zle(`martwy link @${w}`, l);

    // kontrast liczymy raz — na szkle tło elementu jest półprzezroczyste, więc
    // realnym tłem jest czerń strony; bierzemy ostrzejszy z dwóch wariantów
    if (w === 1440 && r.para) {
      const k = Math.min(kontrast(r.para[0], 'rgb(5,7,6)'), kontrast(r.para[0], 'rgb(28,30,29)'));
      if (k < 4.5) zle(`kontrast opisu kafla ${k.toFixed(2)}:1`);
      else console.log(`  kontrast opisu kafla ${k.toFixed(2)}:1`);
    }

    if (FOTO && w === 1440) {
      if (!existsSync(KAT)) mkdirSync(KAT, { recursive: true });
      await p.screenshot({ path: join(KAT, `uslugi-${u.slug}.png`), fullPage: true });
    }
    console.log(`  ${w}×${h} ${bledy ? '' : 'ok'}`);
    await p.close();
  }
}

// Wejście z karty „Zakresu opieki" na stronie głównej. Klik w kartę przewija
// do niej (sec.__doKarty), więc link na karcie musi ubić to zachowanie — inaczej
// strona odjeżdża w bok w chwili nawigacji.
console.log('\n— wejście z karty na stronie głównej');
{
  const p = await przegladarka.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3000/champions-health/v2/', { waitUntil: 'networkidle2' });
  await p.evaluate(() => scrollTo({ top: innerHeight * 2.2, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 1600));

  const linki = await p.$$eval('.deal-track .card-link', as => as.map(a => a.getAttribute('href')));
  if (linki.length !== uslugi.length) zle('linków na kartach', linki.length);
  const oczek = uslugi.map(u => `uslugi/${u.slug}.html`);
  if (JSON.stringify(linki) !== JSON.stringify(oczek)) zle('kolejność linków', linki);

  // realnie klikalny (nie przykryty) i faktycznie nawiguje
  const cel = await p.$('.deal-track .card.focus .card-link') || await p.$('.deal-track .card-link');
  const trafia = await p.evaluate(e => {
    const r = e.getBoundingClientRect();
    return e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  }, cel);
  if (!trafia) zle('link na karcie przykryty innym elementem');
  else {
    await Promise.all([p.waitForNavigation({ waitUntil: 'domcontentloaded' }), cel.click()]);
    const u = p.url();
    if (!/\/uslugi\/[a-z-]+\.html$/.test(u)) zle('klik nie doszedł na podstronę', u);
    else console.log('  klik z karty →', u.split('/').pop());
  }
  await p.close();
}

await przegladarka.close();
console.log(bledy ? `\n${bledy} błędów` : '\nwszystko ok');
process.exitCode = bledy ? 1 : 0;
