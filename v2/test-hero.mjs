// Strażnik hero: (1) kwadraciki na stawach liczone przez object-fit:cover z kartą
// rozsuwaną po najechaniu, (2) zwinięcie hero w kartę po przekroczeniu progu scrolla.
// Uruchom przy działającym serve.mjs:
//   node sites/champions-health/v2/test-hero.mjs
import puppeteer from 'puppeteer';
const STAWY = ['j-bark', 'j-biodro', 'j-kolano', 'j-skok'];
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
for (const [w, h] of [[1440, 900], [1280, 720], [820, 1180]]) {
  const p = await b.newPage(), errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(String(e)));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3000/champions-health/v2/', { waitUntil: 'networkidle2' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 800));
  const przepelnienie = await p.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const out = [];
  for (const c of STAWY) {
    const bb = await (await p.$('.' + c)).boundingBox();
    if (!bb) { out.push({ staw: c, ukryty: true }); continue; }
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await new Promise(r => setTimeout(r, 800));
    out.push(await p.evaluate(cl => {
      const j = document.querySelector('.' + cl), k = j.querySelector('.jt-card');
      const H = document.querySelector('.hero').getBoundingClientRect();
      const kr = k.getBoundingClientRect(), d = j.querySelector('.jt-dot').getBoundingClientRect();
      const tekst = [...k.children].map(e => e.getBoundingClientRect());
      const zachodzi = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0
                              && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
      return {
        staw: cl,
        rozsunieta: getComputedStyle(k).clipPath.replace(/\s/g, '') === 'inset(0pxround16px)',
        kartaWKadrze: kr.top >= -1 && kr.bottom <= H.height + 1 && kr.left >= -1 && kr.right <= H.width + 1,
        kropkaNaTekscie: tekst.some(t => zachodzi(d, t)),
        opisNiepusty: [...k.children].every(e => e.textContent.trim().length > 0),
        krojLegii: getComputedStyle(k.querySelector('strong')).fontFamily.includes('Archivo'),
      };
    }, c));
    await p.mouse.move(w - 40, h - 40);          // zwolnij, zanim sprawdzisz następny
    await new Promise(r => setTimeout(r, 400));
  }
  const zle = out.filter(o => !o.ukryty && (!o.rozsunieta || !o.kartaWKadrze || o.kropkaNaTekscie
                                            || !o.opisNiepusty || !o.krojLegii));
  const ok = !zle.length && !errs.length && przepelnienie === 0;
  console.log(`${w}×${h}`, ok ? 'ok' : 'BŁĄD ' + JSON.stringify({ zle, errs, przepelnienie }));
  if (!ok) process.exitCode = 1;
  // --- zwinięcie hero w kartę „Medycyna sportowa" -------------------------
  const przed = await p.evaluate(() => {
    const m = document.querySelector('.morph').getBoundingClientRect();
    const H = document.querySelector('.hero').getBoundingClientRect();
    return { spoczynek: !document.querySelector('.hero').classList.contains('morphed'),
             pelnyKadr: Math.round(m.width) === Math.round(H.width) };
  });
  await p.evaluate(() => window.scrollTo(0, 150));
  await new Promise(r => setTimeout(r, 1800));
  const po = await p.evaluate(() => {
    const m = document.querySelector('.morph').getBoundingClientRect();
    const karty = [...document.querySelectorAll('[data-card]')];
    const c2 = karty[0].getBoundingClientRect();
    const bliskie = (a, b) => Math.abs(a - b) <= 2;
    return {
      zwiniete: document.querySelector('.hero').classList.contains('morphed'),
      // morf musi wylądować dokładnie na karcie 02 — inaczej przekazanie mrugnie
      trafiaWKarte: bliskie(m.x, c2.x) && bliskie(m.y, c2.y)
                 && bliskie(m.width, c2.width) && bliskie(m.height, c2.height),
      kartaWUwadze: karty[0].classList.contains('focus'),
      kartaNaWierzchu: karty.every((c, i) => i === 0 || +c.style.zIndex <= +karty[0].style.zIndex),
      kartaPelneKrycie: +getComputedStyle(karty[0]).opacity > 0.99,
      // sekcja ma białe tło — napisy na kartach muszą zostać białe, nie odziedziczyć ciemnego
      napisyBiale: karty.every(k => getComputedStyle(k.querySelector('h3')).color === 'rgb(255, 255, 255)')
                && getComputedStyle(document.querySelector('.morph-in h3')).color === 'rgb(255, 255, 255)',
      // łuk ma być rozłożony, nie w stosie
      lukRozlozony: Math.abs(karty[1].getBoundingClientRect().x - karty[0].getBoundingClientRect().x) > karty[0].offsetWidth * .9,
      heroOddane: getComputedStyle(document.querySelector('.hero')).opacity === '0',
      etykietaWidoczna: +getComputedStyle(document.querySelector('.deal-label')).opacity > 0.99,
    };
  });
  await p.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1600));
  const wroc = await p.evaluate(() => {
    const m = document.querySelector('.morph').getBoundingClientRect();
    const H = document.querySelector('.hero').getBoundingClientRect();
    return { cofniete: !document.querySelector('.hero').classList.contains('morphed'),
             pelnyKadr: Math.round(m.width) === Math.round(H.width) };
  });
  const mOk = przed.spoczynek && przed.pelnyKadr && po.zwiniete && po.trafiaWKarte
           && po.kartaWUwadze && po.kartaNaWierzchu && po.kartaPelneKrycie
           && po.heroOddane && po.etykietaWidoczna && po.lukRozlozony && po.napisyBiale && wroc.cofniete && wroc.pelnyKadr;
  console.log(`${w}×${h} przejście`, mOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ przed, po, wroc }));
  if (!mOk) process.exitCode = 1;

  // --- pierścień kroków wokół ramienia ------------------------------------
  await p.evaluate(() => document.querySelector('.ring').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 2200));
  const ring = await p.evaluate(() => {
    const s = document.querySelector('.ring'), S = s.getBoundingClientRect();
    const ks = [...s.querySelectorAll('[data-krag]')];
    const pier = matchMedia('(min-width:901px)').matches;
    const dh = parseFloat(getComputedStyle(s).getPropertyValue('--dh'));
    return {
      uklad: pier ? 'pierścień' : 'lista',
      pojawily: s.classList.contains('widoczne'),
      // w pierścieniu łuki muszą być narysowane, w liście ich nie ma
      lukiZgodne: pier ? s.querySelectorAll('.ring-lines circle').length > 40
                       : s.querySelectorAll('.ring-lines circle').length === 0,
      // krąg musi zmieścić się w sekcji także po powiększeniu
      wKadrze: ks.every(k => { const r = k.getBoundingClientRect();
        const zapas = pier ? (dh - r.width) / 2 : 0;
        return r.left - zapas >= S.left - 1 && r.right + zapas <= S.right + 1; }),
      // na liście opisy są widoczne od razu, w pierścieniu dopiero po najechaniu
      opisy: pier ? ks.every(k => +getComputedStyle(k.querySelector('.krag-txt')).opacity < 0.1)
                  : ks.every(k => +getComputedStyle(k.querySelector('.krag-txt')).opacity > 0.9),
      tresc: ks.every(k => k.querySelector('.krag-lab').textContent.trim()
                        && k.querySelector('.krag-txt').textContent.trim()),
    };
  });
  let rozwija = true;
  if (ring.uklad === 'pierścień') {
    const kb = await (await p.$('.krag')).boundingBox();
    await p.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2);
    await new Promise(r => setTimeout(r, 900));
    rozwija = await p.evaluate(() => {
      const k = document.querySelector('.krag');
      return k.getBoundingClientRect().width > 180
          && +getComputedStyle(k.querySelector('.krag-txt')).opacity > 0.9;
    });
  }
  const rOk = ring.pojawily && ring.lukiZgodne && ring.wKadrze && ring.opisy && ring.tresc && rozwija;
  console.log(`${w}×${h} pierścień`, rOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ ring, rozwija }));
  if (!rOk) process.exitCode = 1;

  await p.close();
}
await b.close();
