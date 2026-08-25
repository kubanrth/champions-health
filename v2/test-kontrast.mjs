/* Kontrast sekcji ze szkłem (kontakt + etapy), mierzony Z PIKSELI. Szkło przepuszcza zdjęcie, więc
   o czytelności decyduje to, co akurat jest pod spodem — z samego CSS-a tego nie
   widać. Metoda: dwa zrzuty tej samej klatki (z tekstem i z `color:transparent`),
   rdzeń litery to NAJJAŚNIEJSZY zmieniony piksel (piksele brzegowe antyaliasingu
   są dowolnie blisko tła), tło to najjaśniejszy piksel pola na zrzucie bez tekstu.
   Zrzuty są w obrębie okna, nie `fullPage`: `fullPage` rozciąga okno, a sekcja
   kontaktu ma `min-height:100svh`, więc układ pod spodem by się przesunął.
   Uruchomienie: node test-kontrast.mjs [bazowy-url] */
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';

const BAZA = process.argv[2] || 'http://localhost:3000/champions-health/v2/';
const PROG = { tytul: 3, etykieta: 4.5, wpis: 4.5, wybor: 4.5, zgoda: 4.5, pigDt: 4.5, pigDd: 4.5 };
// ta sama sekcja żyje w dwóch miejscach pod innymi klasami — obie mierzymy tak samo
const STRONY = [
  { url: '', sek: '#kontakt', pola: { tytul: '.form-tytul', etykieta: 'label[for="kt-imie"]',
      wpis: '#kt-imie', wybor: '.kontakt-form .pw-btn', zgoda: '.kontakt-zgoda span',
      pigDt: '.kontakt-dane div dt', pigDd: '.kontakt-dane div dd' },
    imie: '#kt-imie', tel: '#kt-tel', select: '.kontakt-form select' },
  { url: 'kontakt.html', sek: '.kt-sek', pola: { tytul: '.kt-forma h2', etykieta: 'label[for="kt-imie"]',
      wpis: '#kt-imie', wybor: '.kt-pole .pw-btn', zgoda: '.kt-zgoda span',
      pigDt: '.kt-pig span', pigDd: '.kt-pig b' },
    imie: '#kt-imie', tel: '#kt-tel', select: '.kt-pole select' },
  // ta sama sekcja trafiła też na podstrony usług (te same klasy `kt-*`)
  { url: 'uslugi/ortopedia.html', sek: '#kontakt', pola: { tytul: '.kt-forma h3', etykieta: 'label[for="kt-imie"]',
      wpis: '#kt-imie', wybor: '.kt-pole .pw-btn', zgoda: '.kt-zgoda span',
      pigDt: '.kt-pig span', pigDd: '.kt-pig b' },
    imie: '#kt-imie', tel: '#kt-tel', select: '.kt-pole select' },
];
// Pudełko pola zawiera własną, jasną krawędź szkła, a przy promieniu 14 px łuk
// narożnika wchodzi jeszcze w wcięcie 8 px — wtedy to krawędź, a nie tło pod
// literami, wychodzi jako najjaśniejszy piksel i pomiar stoi w miejscu.
const WCIECIE = { wpis: 15, wybor: 15 };
// Strzałka listy wyboru leży w pudełku przycisku — bez większego wcięcia z prawej
// to ona wychodzi jako „najciemniejsze tło pod tekstem".
const PRAWO = { wybor: 44 };

const lum = (r, g, b) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };

const kontrast = (a, b, [x0, y0, x1, y1], ciemny) => {  // a = z tekstem, b = bez
  // jasny tekst: rdzeń litery i najgorsze tło to wartości NAJJAŚNIEJSZE,
  // ciemny tekst: odwrotnie — inaczej łapiemy piksel brzegowy antyaliasingu
  const gorzej = (p, q) => ciemny ? Math.min(p, q) : Math.max(p, q);
  let tlo = ciemny ? 1 : 0, litera = ciemny ? 1 : 0, zmian = 0;
  for (let y = Math.max(0, y0); y < Math.min(b.height, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(b.width, x1); x++) {
      const i = (y * b.width + x) * 4;
      tlo = gorzej(tlo, lum(b.data[i], b.data[i + 1], b.data[i + 2]));
      if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) {
        zmian++; litera = gorzej(litera, lum(a.data[i], a.data[i + 1], a.data[i + 2]));
      }
    }
  return zmian < 10 ? null : (Math.max(litera, tlo) + .05) / (Math.min(litera, tlo) + .05);
};

const CIEMNY = new Set(['pigDt', 'pigDd', 'wpis', 'wybor']);  // ciemny tekst na jasnym tle
const pomiar = async (p, S, sel, m, ciemny, prawo) => {
  const box = await p.evaluate(([sel, m, prawo]) => {
    const e = document.querySelector(sel); if (!e) return null;
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
    const b = e.getBoundingClientRect();
    return [Math.round(b.x + m), Math.round(b.y + m), Math.round(b.right - prawo), Math.round(b.bottom - m)];
  }, [sel, m || 0, prawo || m || 0]);
  if (!box) return null;
  await new Promise(r => setTimeout(r, 250));
  const zTekstem = PNG.sync.read(await p.screenshot());
  await p.evaluate(S => document.head.insertAdjacentHTML('beforeend',
    // UWAGA: nie zerujemy tu tła listy wyboru — `background-image:none` zdejmuje
    // razem ze strzałką całe szklane wypełnienie i pomiar łapie ciemną taflę.
    // Strzałka jest identyczna na obu zrzutach, a wcięcie 15 px i tak ją wycina.
    `<style id="przezr">${S.sek} *{color:transparent!important;-webkit-text-fill-color:transparent!important}</style>`), S);
  await new Promise(r => setTimeout(r, 150));
  const bez = PNG.sync.read(await p.screenshot());
  await p.evaluate(() => document.getElementById('przezr').remove());
  return kontrast(zTekstem, bez, box, ciemny);
};

// Bez ramki granicę pola wyznacza samo wypełnienie — WCAG 1.4.11 wymaga dla
// elementów sterujących 3:1 wobec sąsiadującej powierzchni. Próbka: wnętrze pola
// kontra tafla tuż nad nim (odstęp między etykietą a polem to czysta tafla).
const granica = async (p, sel) => {
  const pkt = await p.evaluate(sel => {
    const e = document.querySelector(sel);
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
    const b = e.getBoundingClientRect(), x = Math.round(b.right - 30);
    return { pole: [x, Math.round(b.y + b.height / 2)], tafla: [x, Math.round(b.y - 5)] };
  }, sel);
  await new Promise(r => setTimeout(r, 250));
  const png = PNG.sync.read(await p.screenshot());
  const L = ([x, y]) => { const i = (y * png.width + x) * 4;
    return lum(png.data[i], png.data[i + 1], png.data[i + 2]); };
  const a = L(pkt.pole), c = L(pkt.tafla);
  return (Math.max(a, c) + .05) / (Math.min(a, c) + .05);
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
      const v = await pomiar(p, S, sel, WCIECIE[k], CIEMNY.has(k), PRAWO[k]);
      if (v == null) { zle++; wynik.push(`${k}: BRAK`); continue; }
      if (v < PROG[k]) zle++;
      wynik.push(`${k} ${v.toFixed(2)}:1${v < PROG[k] ? ' ZA MAŁO' : ''}`);
    }
    const gr = await granica(p, S.pola.wpis);
    if (gr < 3) zle++;
    wynik.push(`granica ${gr.toFixed(2)}:1${gr < 3 ? ' ZA MAŁO' : ''}`);
    const zly = wynik.some(t => /ZA MAŁO|BRAK/.test(t));
    console.log(`${(S.url || 'index') + ' ' + w}×${h}`, (zly ? 'BŁĄD  ' : 'ok    ') + wynik.join('  '));
    await p.close();
  }
// Sekcja etapów: herb płynie pod tekstem, więc kontrast zależy od pozycji scrolla —
// mierzymy w kilku miejscach przejazdu, dla nagłówka i dla wiersza przy środku ekranu.
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto(BAZA, { waitUntil: 'networkidle0' });
  const y0 = await p.evaluate(() => document.querySelector('.etapy').getBoundingClientRect().top + scrollY);
  for (const d of [-250, 0, 120, 400]) {
    await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y0 + d);
    await new Promise(r => setTimeout(r, 700));
    await p.evaluate(() => document.head.insertAdjacentHTML('beforeend',
      '<style id="mroz">*,*::before,*::after{animation:none!important;transition:none!important}</style>'));
    await new Promise(r => setTimeout(r, 150));
    const pola = await p.evaluate(() => {
      // tylko elementy w pełni widoczne i spod paska nawigacji — inaczej pomiar
      // łapie jasny pasek albo urwany wiersz zamiast tła pod literami
      const r = e => { if (!e) return null; const q = e.getBoundingClientRect();
        if (q.top < 80 || q.bottom > innerHeight - 8) return null;
        return [Math.round(q.x), Math.round(q.y), Math.round(q.right), Math.round(q.bottom)]; };
      const srodek = innerHeight / 2;
      const wiersz = [...document.querySelectorAll('.etap')]
        .map(e => { const q = e.getBoundingClientRect(); return { e, d: Math.abs(q.top + q.height / 2 - srodek) }; })
        .sort((a, b) => a.d - b.d)[0]?.e;
      return { naglowek: r(document.querySelector('.etapy-naglowek')),
        tytul: r(wiersz?.querySelector('.etap-tytul')), kiedy: r(wiersz?.querySelector('.etap-kiedy')) };
    });
    const zTekstem = PNG.sync.read(await p.screenshot());
    await p.evaluate(() => document.head.insertAdjacentHTML('beforeend',
      '<style id="pz">.etapy *{color:transparent!important;-webkit-text-fill-color:transparent!important}</style>'));
    await new Promise(r => setTimeout(r, 150));
    const bez = PNG.sync.read(await p.screenshot());
    await p.evaluate(() => { document.getElementById('pz').remove(); document.getElementById('mroz').remove(); });
    const wynik = Object.entries(pola).map(([k, bb]) => {
      if (!bb) return `${k} —`;                       // poza kadrem, nie ma czego mierzyć
      const v = kontrast(zTekstem, bez, bb);
      if (v == null) { zle++; return `${k}: BRAK`; }
      if (v < 4.5) zle++;
      return `${k} ${v.toFixed(2)}:1${v < 4.5 ? ' ZA MAŁO' : ''}`;
    });
    const zly = wynik.some(t => /ZA MAŁO|BRAK/.test(t));
    console.log(`etapy ${w}×${h} @${String(d).padStart(4)}`, (zly ? 'BŁĄD  ' : 'ok    ') + wynik.join('  '));
  }
  // herb ma płynąć: `--h` musi się zmienić między górą a dołem przejazdu
  const h1 = await p.evaluate(y => { scrollTo({ top: y, behavior: 'instant' });
    return getComputedStyle(document.querySelector('.etapy-herb')).getPropertyValue('--h'); }, y0 - 250);
  await new Promise(r => setTimeout(r, 300));
  await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y0 + 700);
  await new Promise(r => setTimeout(r, 300));
  const h3 = await p.evaluate(() => getComputedStyle(document.querySelector('.etapy-herb')).getPropertyValue('--h'));
  const plynie = Math.abs(Number(h1) - Number(h3)) > .15;
  if (!plynie) zle++;
  console.log(`herb płynie ${w}×${h}`, plynie ? `ok    ${Number(h1).toFixed(2)} → ${Number(h3).toFixed(2)}`
    : `BŁĄD  ${h1} → ${h3}`);
  await p.close();
}

// Bezpieczniki wjazdu. Stan początkowy („schowane") chowa prawdziwe dane
// kontaktowe, więc obie drogi wyjścia muszą działać: bez JS-u klasa `.anim`
// nigdy nie powstaje, a przy zredukowanym ruchu wjazd jest wyłączony.
const widoczne = async (bezJs) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  if (bezJs) await p.setJavaScriptEnabled(false);
  else await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(BAZA, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelector('#kontakt').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 300));
  const o = await p.evaluate(() => ['.kontakt-form', '.kontakt-pole', '.kontakt-dane div',
    '.kontakt-lead'].map(s => Number(getComputedStyle(document.querySelector(s)).opacity)));
  await p.close();
  return o;
};
for (const [nazwa, bezJs] of [['bez JS', true], ['zredukowany ruch', false]]) {
  const o = await widoczne(bezJs);
  const ok = o.every(v => v === 1);
  if (!ok) zle++;
  console.log(`moduł widoczny (${nazwa})`, ok ? 'ok' : 'BŁĄD ' + JSON.stringify(o));
}
await b.close();
if (zle) process.exitCode = 1;
