/* Kontrast sekcji kontaktu, mierzony Z PIKSELI. Szkło przepuszcza zdjęcie, więc
   o czytelności decyduje to, co akurat jest pod spodem — z samego CSS-a tego nie
   widać. Metoda: dwa zrzuty tej samej klatki (z tekstem i z `color:transparent`),
   rdzeń litery to NAJJAŚNIEJSZY zmieniony piksel (piksele brzegowe antyaliasingu
   są dowolnie blisko tła), tło to najjaśniejszy piksel pola na zrzucie bez tekstu.
   Zrzuty są w obrębie okna, nie `fullPage`: `fullPage` rozciąga okno, a sekcja
   kontaktu ma `min-height:100svh`, więc układ pod spodem by się przesunął.
   Uruchomienie: node test-kontakt.mjs [bazowy-url] */
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';

const BAZA = process.argv[2] || 'http://localhost:3000/champions-health/v2/';
const PROG = { tytul: 3, etykieta: 4.5, wpis: 4.5, wybor: 4.5, zgoda: 4.5, pigDt: 4.5, pigDd: 4.5 };
// ta sama sekcja żyje w dwóch miejscach pod innymi klasami — obie mierzymy tak samo
const STRONY = [
  { url: '', sek: '#kontakt', pola: { tytul: '.form-tytul', etykieta: 'label[for="kt-imie"]',
      wpis: '#kt-imie', wybor: '#kt-temat', zgoda: '.kontakt-zgoda span',
      pigDt: '.kontakt-dane div dt', pigDd: '.kontakt-dane div dd' },
    imie: '#kt-imie', tel: '#kt-tel', select: '.kontakt-form select' },
  { url: 'kontakt.html', sek: '.kt-sek', pola: { tytul: '.kt-forma h2', etykieta: 'label[for="kt-imie"]',
      wpis: '#kt-imie', wybor: '#kt-temat', zgoda: '.kt-zgoda span',
      pigDt: '.kt-pig span', pigDd: '.kt-pig b' },
    imie: '#kt-imie', tel: '#kt-tel', select: '.kt-pole select' },
];
// Pudełko pola zawiera własną, jasną krawędź szkła, a przy promieniu 14 px łuk
// narożnika wchodzi jeszcze w wcięcie 8 px — wtedy to krawędź, a nie tło pod
// literami, wychodzi jako najjaśniejszy piksel i pomiar stoi w miejscu.
const WCIECIE = { wpis: 15, wybor: 15 };

const lum = (r, g, b) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };

const kontrast = (a, b, [x0, y0, x1, y1]) => {          // a = z tekstem, b = bez
  let tlo = 0, litera = 0, zmian = 0;
  for (let y = Math.max(0, y0); y < Math.min(b.height, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(b.width, x1); x++) {
      const i = (y * b.width + x) * 4;
      tlo = Math.max(tlo, lum(b.data[i], b.data[i + 1], b.data[i + 2]));
      if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) {
        zmian++; litera = Math.max(litera, lum(a.data[i], a.data[i + 1], a.data[i + 2]));
      }
    }
  return zmian < 10 ? null : (Math.max(litera, tlo) + .05) / (Math.min(litera, tlo) + .05);
};

const pomiar = async (p, S, sel, m) => {
  const box = await p.evaluate((sel, m) => {
    const e = document.querySelector(sel); if (!e) return null;
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
    const b = e.getBoundingClientRect();
    return [Math.round(b.x + m), Math.round(b.y + m), Math.round(b.right - m), Math.round(b.bottom - m)];
  }, sel, m || 0);
  if (!box) return null;
  await new Promise(r => setTimeout(r, 250));
  const zTekstem = PNG.sync.read(await p.screenshot());
  await p.evaluate(S => document.head.insertAdjacentHTML('beforeend',
    `<style id="przezr">${S.sek} *{color:transparent!important;-webkit-text-fill-color:transparent!important}
     ${S.select}{background-image:none!important}</style>`), S);
  await new Promise(r => setTimeout(r, 150));
  const bez = PNG.sync.read(await p.screenshot());
  await p.evaluate(() => document.getElementById('przezr').remove());
  return kontrast(zTekstem, bez, box);
};

const b = await puppeteer.launch();
let zle = 0;
for (const S of STRONY)
  for (const [w, h] of [[1440, 900], [1280, 720], [390, 844]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.goto(BAZA + S.url, { waitUntil: 'networkidle0' });
    await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), S.sek);
    await new Promise(r => setTimeout(r, 900));
    // zamrożenie ruchu: oba zrzuty muszą pokazywać tę samą klatkę, inaczej
    // „zmieniony piksel" łapie animację zamiast litery
    await p.evaluate(() => document.head.insertAdjacentHTML('beforeend',
      '<style>*,*::before,*::after{animation:none!important;transition:none!important}</style>'));
    await p.evaluate(S => {                             // wpisany tekst też trzeba zmierzyć
      document.querySelector(S.imie).value = 'Jan Kowalski';
      document.querySelector(S.tel).value = '+48 600 100 200';
    }, S);
    const wynik = [];
    for (const [k, sel] of Object.entries(S.pola)) {
      const v = await pomiar(p, S, sel, WCIECIE[k]);
      if (v == null) { zle++; wynik.push(`${k}: BRAK`); continue; }
      if (v < PROG[k]) zle++;
      wynik.push(`${k} ${v.toFixed(2)}:1${v < PROG[k] ? ' ZA MAŁO' : ''}`);
    }
    const zly = wynik.some(t => /ZA MAŁO|BRAK/.test(t));
    console.log(`${(S.url || 'index') + ' ' + w}×${h}`, (zly ? 'BŁĄD  ' : 'ok    ') + wynik.join('  '));
    await p.close();
  }
await b.close();
if (zle) process.exitCode = 1;
