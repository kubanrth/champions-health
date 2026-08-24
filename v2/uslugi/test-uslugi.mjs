// Regresja podstron usług. Wymaga `node serve.mjs` w korzeniu workspace'u.
//   node sites/champions-health/v2/uslugi/test-uslugi.mjs         — same testy
//   node sites/champions-health/v2/uslugi/test-uslugi.mjs --foto  — plus zrzuty
//
// Sprawdza na trzech szerokościach: brak błędów konsoli i 4xx, brak przepełnienia
// w poziomie, obecność wszystkich sekcji, dojście linków do rodzeństwa, kontrast
// tekstu na szkle oraz to, że wjazd sekcji faktycznie odsłania treść.
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
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

// Kontrast wg WCAG. Tekst na tej stronie jest półprzezroczysty
// (rgba(11,13,12,.72)), więc trzeba go najpierw NAŁOŻYĆ na tło — liczenie
// z samych składowych RGB z pominięciem alfy zawyża wynik prawie dwukrotnie
// i przepuściłoby napis, który realnie nie przechodzi progu.
const rozbij = c => {
  const n = c.match(/[\d.]+/g).map(Number);
  return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
};
const nalozony = (przod, tlo) => {
  const f = rozbij(przod), t = rozbij(tlo);
  return { r: f.r * f.a + t.r * (1 - f.a),
           g: f.g * f.a + t.g * (1 - f.a),
           b: f.b * f.a + t.b * (1 - f.a) };
};
const lum = ({ r, g, b }) => {
  const k = v => { const s = v / 255; return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; };
  return .2126 * k(r) + .7152 * k(g) + .0722 * k(b);
};
const kontrast = (przod, tlo) => {
  const [x, y] = [lum(nalozony(przod, tlo)), lum(rozbij(tlo))].sort((p, q) => q - p);
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
      // pas usług jest lazy — bez poziomego przejazdu dalsze karty słusznie
      // nie ładują zdjęć i test fałszywie krzyczy „obraz nie wczytany"
      const pas = document.querySelector('[data-pas]');
      if (pas) {
        pas.scrollTo({ left: pas.scrollWidth, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 250));
        pas.scrollTo({ left: 0, behavior: 'instant' });
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
        sekcje: ['.pg-hero', '.kafle', '.proza', '#kontakt', '.inne']
          .filter(s => !document.querySelector(s)),
        ukryte: [...document.querySelectorAll('[data-rv]')]
          .filter(e => +st(e).opacity < .9).length,
        obrazy: [...document.images].filter(i => !i.complete || !i.naturalWidth)
          .map(i => i.getAttribute('src')),
        linki: [...document.querySelectorAll('.inna')].map(a => a.getAttribute('href')),
        h1: document.querySelector('h1')?.textContent.trim(),
        para: kafel ? [st(kafel.querySelector('p')).color, st(kafel.closest('section')).backgroundColor] : null,
        // szkło zostało tylko na ciemnym pasie kontaktu — jak na home
        szklo: st(document.querySelector('.kont-karta'))?.backdropFilter ?? '',
      };
    });

    if (r.przepelnienie > 0) zle(`przepełnienie ${r.przepelnienie}px @${w}`, r.poza);
    if (r.sekcje.length) zle(`brak sekcji @${w}`, r.sekcje);
    if (r.ukryte) zle(`${r.ukryte} bloków nie wjechało @${w}`);
    if (r.obrazy.length) zle(`obrazy nie wczytane @${w}`, r.obrazy);
    if (konsola.length) zle(`konsola @${w}`, konsola.slice(0, 3));
    if (sieć.length) zle(`4xx/5xx @${w}`, sieć.slice(0, 3));
    if (r.h1 !== u.tytul) zle(`h1 @${w}`, r.h1);
    if (!/blur/.test(r.szklo)) zle(`pas kontaktu bez szkła @${w}`, r.szklo);
    if (r.linki.length !== uslugi.length - 1) zle(`linki do rodzeństwa @${w}`, r.linki.length);
    for (const l of r.linki)
      if (!existsSync(join(tu, l))) zle(`martwy link @${w}`, l);

    // kontrast liczymy raz — na szkle tło elementu jest półprzezroczyste, więc
    // realnym tłem jest czerń strony; bierzemy ostrzejszy z dwóch wariantów
    // kafle mają pełne wypełnienia (szare i ciemne), więc tło bierzemy z pomiaru
    if (w === 1440 && r.para) {
      const k = kontrast(r.para[0], r.para[1]);
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

// --- kontrast: mierzony na pikselach, nie szacowany -----------------------
// Sześć podstron dzieli jeden szablon, więc kolory i tła są identyczne —
// pełny przemiar leci raz, na jednej stronie. Metoda: chowamy SAM TEKST
// (`color:transparent`, NIE `visibility:hidden` — to schowałoby też tło
// elementu i mierzylibyśmy goły korpus strony), robimy zrzut kadru i czytamy
// realne piksele pod napisem. Zrzut musi być kadrem viewportu, nie `fullPage`:
// poświaty i raster są `position:fixed`, więc w pełnym zrzucie malują się
// tylko na górze i niżej wyszłoby tło JAŚNIEJSZE, niż jest naprawdę.
console.log('\n— kontrast tekstu (piksele, ortopedia @1440)');
{
  const ROLE = [
    ['.pg-lead', 'lead heroju'],
    ['.kafel p', 'opis kafla'], ['.kafel i', 'numer kafla'],
    ['.fakty dt', 'etykieta faktu'], ['.fakty dd', 'wartość faktu'],
    ['.claim-line', 'wielka linia'],
    ['.proza p', 'proza'], ['.dla-kogo li', 'punkt „dla kogo"'],
    ['.kont-in p', 'lead kontaktu'], ['.kont-karta dt', 'etykieta kontaktu'],
    ['.kont-karta dd', 'dana kontaktowa'],
    ['.inna span', 'etykieta karty usługi'], ['.inna b', 'tytuł karty usługi'],
    ['footer.site span', 'stopka'],
  ];
  const p = await przegladarka.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(BAZA + 'ortopedia.html', { waitUntil: 'networkidle2' });
  await p.evaluate(async () => {
    const k = Math.round(innerHeight * .8);
    for (let y = 0; y < document.body.scrollHeight; y += k) {
      scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 90));
    }
  });
  // NAJPIERW kolory — po wstrzyknięciu `color:transparent` getComputedStyle
  // zwraca rgba(0,0,0,0) dla każdego napisu i wszystko wychodzi 1:1.
  const pisma = await p.evaluate(sel => sel.map(x => {
    const e = document.querySelector(x);
    if (!e) return null;
    const st = getComputedStyle(e);
    return { kolor: st.color, rozmiar: parseFloat(st.fontSize),
             waga: parseInt(st.fontWeight, 10) || 400 };
  }), ROLE.map(r => r[0]));

  // dopiero teraz tekst na przezroczysty — razem z potomkami, bo dt/dd mają
  // własne reguły koloru i nie dziedziczą po rodzicu
  await p.evaluate(sel => {
    const st = document.createElement('style');
    st.textContent = sel.map(x => `${x},${x} *`).join(',') + '{color:transparent!important}';
    document.head.append(st);
  }, ROLE.map(r => r[0]));

  for (const [i_, [sel, nazwa]] of ROLE.entries()) {
    const el = await p.$(sel);
    if (!el || !pisma[i_]) { zle('brak elementu do pomiaru', sel); continue; }
    const info = await p.evaluate(e => {
      e.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top),
               w: Math.round(r.width), h: Math.round(r.height) };
    }, el);
    Object.assign(info, pisma[i_]);
    await new Promise(r => setTimeout(r, 120));
    const png = PNG.sync.read(await p.screenshot());

    // średnie tło pod napisem; pomijamy 2 px marginesu, żeby nie łapać obwódki
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let y = info.y + 2; y < info.y + info.h - 2; y++) {
      if (y < 0 || y >= png.height) continue;
      for (let x = info.x + 2; x < info.x + info.w - 2; x++) {
        if (x < 0 || x >= png.width) continue;
        const i = (png.width * y + x) << 2;
        sr += png.data[i]; sg += png.data[i + 1]; sb += png.data[i + 2]; n++;
      }
    }
    if (!n) { zle('pusty kadr pomiaru', sel); continue; }
    const tlo = `rgb(${sr / n},${sg / n},${sb / n})`;
    const k = kontrast(info.kolor, tlo);
    // WCAG: duży tekst (≥24 px, albo ≥18,66 px przy wadze ≥700) ma próg 3:1
    const duzy = info.rozmiar >= 24 || (info.rozmiar >= 18.66 && info.waga >= 700);
    const prog = duzy ? 3 : 4.5;
    const opis = `  ${nazwa.padEnd(24)} ${k.toFixed(2)}:1 (próg ${prog})`;
    if (k < prog) zle(opis.trim()); else console.log(opis);
  }
  await p.close();
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

// podstrona zespołu: siatka Team Member Pro — 14 kart, nakładka odsłania
// treść na hover/klik, brak przepełnienia, czysta konsola
console.log('\n— zespol.html');
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await przegladarka.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const konsola = [];
  p.on('console', m => m.type() === 'error' && konsola.push(m.text()));
  await p.goto('http://localhost:3000/champions-health/v2/zespol.html', { waitUntil: 'networkidle2' });
  await p.evaluate(async () => {
    const k = Math.round(innerHeight * .8);
    for (let y = 0; y < document.body.scrollHeight; y += k) {
      scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 90));
    }
    await new Promise(r => setTimeout(r, 900));
  });
  const r = await p.evaluate(() => {
    const wid = document.documentElement.clientWidth;
    return {
      osoby: document.querySelectorAll('.tm-karta').length,
      przepelnienie: document.documentElement.scrollWidth - wid,
      ukryte: [...document.querySelectorAll('[data-rv]')]
        .filter(e => +getComputedStyle(e).opacity < .9).length,
      kontakt: !!document.querySelector('#kontakt'),
      cel: document.querySelector('.tm-head .btn')?.getAttribute('href'),
      inicjaly: [...document.querySelectorAll('.tm-kadr b')].every(b => /^[A-ZŁ]{2}$/.test(b.textContent)),
    };
  });
  if (r.osoby !== 14) zle(`kart ${r.osoby} @${w}`);
  if (r.przepelnienie > 0) zle(`przepełnienie ${r.przepelnienie}px @${w}`);
  if (r.ukryte) zle(`${r.ukryte} bloków nie wjechało @${w}`);
  if (!r.kontakt || r.cel !== '#kontakt') zle(`CTA nagłówka @${w}`, r.cel);
  if (!r.inicjaly) zle(`inicjały @${w}`);
  if (konsola.length) zle(`konsola @${w}`, konsola.slice(0, 3));
  // nakładka: najazd na pierwszą kartę odsłania słowa i trzyma kontrast
  if (w === 1440) {
    // po pętli scrolla strona stoi na dole — karta jest nad kadrem i mouse.move
    // trafiałby w ujemne współrzędne; najpierw dosuwamy ją do widoku
    await p.evaluate(() => document.querySelector('.tm-karta')
      .scrollIntoView({ block: 'center', behavior: 'instant' }));
    await new Promise(rr => setTimeout(rr, 300));
    const cel2 = await p.$('.tm-karta');
    const q = await cel2.boundingBox();
    await p.mouse.move(q.x + q.width / 2, q.y + q.height / 3);
    // sekwencja: podpis .3s → panel .22+.65s → słowa od .5s (ostatnie ~1.2s)
    await new Promise(rr => setTimeout(rr, 1800));
    const n = await p.evaluate(() => {
      const k = document.querySelector('.tm-karta');
      const sl = [...k.querySelectorAll('.tm-cytat span')];
      const btn = k.querySelector('.tm-nakladka .btn');
      const q = btn.getBoundingClientRect();
      // panel wjeżdża transformem — mierzymy realne przesunięcie w pionie
      const m = new DOMMatrix(getComputedStyle(k.querySelector('.tm-panel')).transform);
      return { op: Math.abs(m.m42) < 2 ? 1 : 0,
               widoczne: sl.filter(e => +getComputedStyle(e).opacity > .9).length,
               razem: sl.length,
               podpis: +getComputedStyle(k.querySelector('.tm-pods b')).opacity,
               cel2: btn.getAttribute('href'),
               // pigułka realnie klikalna, nie przykryta
               trafia: btn.contains(document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2)) };
    });
    // choreografia: tuż po najechaniu podpis MA znikać, a panel jeszcze stać
    await p.mouse.move(10, 10);
    await new Promise(rr => setTimeout(rr, 700));
    await p.mouse.move(q.x + q.width / 2, q.y + q.height / 3);
    await new Promise(rr => setTimeout(rr, 120));
    const wczesnie = await p.evaluate(() => {
      const k = document.querySelector('.tm-karta');
      const m = new DOMMatrix(getComputedStyle(k.querySelector('.tm-panel')).transform);
      return { podpis: +getComputedStyle(k.querySelector('.tm-pods b')).opacity,
               panelDroga: m.m42 };
    });
    // po 120 ms: podpis już w drodze (<0.9), panel jeszcze nie ruszył (delay 220 ms)
    if (wczesnie.podpis > .9) zle('podpis nie chowa się pierwszy', wczesnie);
    if (Math.abs(wczesnie.panelDroga) < 300) zle('panel ruszył przed podpisem', wczesnie);
    await new Promise(rr => setTimeout(rr, 1700));
    if (n.op < .95) zle('panel nie dojechał na hover', n);
    else if (n.widoczne !== n.razem) zle('słowa nakładki nie weszły', n);
    else if (n.podpis > .1) zle('podpis nie znika na hover', n.podpis);
    else if (n.cel2 !== '#kontakt' || !n.trafia) zle('pigułka nakładki', n);
    else console.log(`  nakładka: ${n.widoczne}/${n.razem} słów, podpis schowany, pigułka klikalna`);
  }
  console.log(`  ${w}×${h} ${bledy ? '' : 'ok'}`);
  await p.close();
}

// blog.html: featured + 6 starszych, brak przepełnienia, obrazy, konsola
console.log('\n— blog.html');
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await przegladarka.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const konsola = [];
  p.on('console', m => m.type() === 'error' && konsola.push(m.text()));
  await p.goto('http://localhost:3000/champions-health/v2/blog.html', { waitUntil: 'networkidle2' });
  await p.evaluate(async () => {
    const k = Math.round(innerHeight * .8);
    for (let y = 0; y < document.body.scrollHeight; y += k) {
      scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 90));
    }
    await new Promise(r => setTimeout(r, 900));
  });
  const r = await p.evaluate(() => {
    const wid = document.documentElement.clientWidth;
    return {
      glowny: !!document.querySelector('.blog-glowny'),
      starsze: document.querySelectorAll('.blog-siatka .post').length,
      przepelnienie: document.documentElement.scrollWidth - wid,
      ukryte: [...document.querySelectorAll('[data-rv]')]
        .filter(e => +getComputedStyle(e).opacity < .9).length,
      obrazy: [...document.images].filter(i => !i.complete || !i.naturalWidth).length,
      kontakt: !!document.querySelector('#kontakt'),
    };
  });
  if (!r.glowny) zle(`brak wpisu głównego @${w}`);
  if (r.starsze !== 6) zle(`starszych wpisów ${r.starsze} @${w}`);
  if (r.przepelnienie > 0) zle(`przepełnienie ${r.przepelnienie}px @${w}`);
  if (r.ukryte) zle(`${r.ukryte} bloków nie wjechało @${w}`);
  if (r.obrazy) zle(`obrazy nie wczytane @${w}`, r.obrazy);
  if (!r.kontakt) zle(`brak #kontakt @${w}`);
  if (konsola.length) zle(`konsola @${w}`, konsola.slice(0, 3));
  console.log(`  ${w}×${h} ${bledy ? '' : 'ok'}`);
  await p.close();
}

// strzałki pasa „Pozostałe zakresy" przewijają o kartę
{
  const p = await przegladarka.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(BAZA + 'ortopedia.html', { waitUntil: 'networkidle2' });
  await p.evaluate(() => document.querySelector('.inne-pas').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 900));
  const przed = await p.$eval('[data-pas]', e => e.scrollLeft);
  await p.click('[data-pas-d]');
  await new Promise(r => setTimeout(r, 700));
  const po = await p.$eval('[data-pas]', e => e.scrollLeft);
  if (po - przed < 200) zle('strzałka pasa nie przewija', { przed, po });
  else console.log(`\n— pas usług: strzałka przewija o ${Math.round(po - przed)}px`);
  await p.close();
}

await przegladarka.close();
console.log(bledy ? `\n${bledy} błędów` : '\nwszystko ok');
process.exitCode = bledy ? 1 : 0;
