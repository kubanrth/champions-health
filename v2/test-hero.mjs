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
        // puls: trzy kółka rozchodzące się od kropki, z rozjazdem faz
        puls: (() => { const ringi = [...j.querySelector('.jt-dot').querySelectorAll('i')];
          const delays = ringi.map(r2 => getComputedStyle(r2).animationDelay);
          return ringi.length === 3
              && ringi.every(r2 => getComputedStyle(r2).animationName === 'jt-puls')
              && new Set(delays).size === 3; })(),
      };
    }, c));
    await p.mouse.move(w - 40, h - 40);          // zwolnij, zanim sprawdzisz następny
    await new Promise(r => setTimeout(r, 400));
  }
  const zle = out.filter(o => !o.ukryty && (!o.rozsunieta || !o.kartaWKadrze || o.kropkaNaTekscie
                                            || !o.opisNiepusty || !o.krojLegii || !o.puls));
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
      etykietaWidoczna: +getComputedStyle(document.querySelector('.deal-head')).opacity > 0.99,
      // nagłówek Revolut-style nie może nachodzić na karty
      naglowekNadKartami: document.querySelector('.deal-head').getBoundingClientRect().bottom
                        <= m.top + 1,
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
  // strzałki talii + skok po kliknięciu karty (2026-08-22, wzór herodot.com)
  const talia = await p.evaluate(async () => {
    const sec = document.querySelector('.deal');
    const focus = () => [...document.querySelectorAll('[data-card]')].findIndex(c => c.classList.contains('focus'));
    const czekaj = ms => new Promise(r => setTimeout(r, ms));
    sec.__doKarty(2); await czekaj(1500);
    const skok = focus();
    document.querySelector('[data-deal-next]').click(); await czekaj(1400);
    const poNext = focus();
    document.querySelector('[data-deal-prev]').click(); await czekaj(1400);
    const poPrev = focus();
    const wFokusie = [...document.querySelectorAll('[data-card]')][poPrev];
    // strzałka nie może być przykryta kartami — sprawdzamy realny cel kliknięcia
    const sd = document.querySelector('[data-deal-next]').getBoundingClientRect();
    const cel = document.elementFromPoint(sd.left + sd.width / 2, sd.top + sd.height / 2);
    const strzalkaKlikalna = cel === document.querySelector('[data-deal-next]') || cel?.closest('[data-deal-next]');
    const txt = wFokusie.querySelector('.card-txt');
    return { skok, poNext, poPrev, strzalkaKlikalna: !!strzalkaKlikalna,
      tekstWidoczny: +getComputedStyle(txt).opacity > 0.9,
      tekstNiepusty: txt.textContent.trim().length > 60 };
  });
  const tOk = talia.skok === 2 && talia.poNext === 3 && talia.poPrev === 2
           && talia.tekstWidoczny && talia.tekstNiepusty && talia.strzalkaKlikalna;
  console.log(`${w}×${h} talia`, tOk ? 'ok' : 'BŁĄD ' + JSON.stringify(talia));
  if (!tOk) process.exitCode = 1;
  await p.evaluate(() => window.scrollTo(0, 150));
  await new Promise(r => setTimeout(r, 1200));

  const mOk = przed.spoczynek && przed.pelnyKadr && po.zwiniete && po.trafiaWKarte
           && po.kartaWUwadze && po.kartaNaWierzchu && po.kartaPelneKrycie
           && po.heroOddane && po.etykietaWidoczna && po.naglowekNadKartami && po.lukRozlozony && po.napisyBiale && wroc.cofniete && wroc.pelnyKadr;
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
      const dh = parseFloat(getComputedStyle(document.querySelector('.ring')).getPropertyValue('--dh'));
      return k.getBoundingClientRect().width > dh - 6
          && +getComputedStyle(k.querySelector('.krag-txt')).opacity > 0.9;
    });
  }
  const rOk = ring.pojawily && ring.lukiZgodne && ring.wKadrze && ring.opisy && ring.tresc && rozwija;
  console.log(`${w}×${h} pierścień`, rOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ ring, rozwija }));
  if (!rOk) process.exitCode = 1;

  // --- odsłanianie tekstu znak po znaku ------------------------------------
  await p.evaluate(() => document.querySelector('.claim').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 1800));
  const rev = await p.evaluate(() => {
    const el = document.querySelector('.claim [data-reveal]');
    const slowa = [...el.querySelectorAll('.word')];
    const znaki = [...el.querySelectorAll('.char')];
    const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.04;
    return {
      podzielone: znaki.length > 20 && slowa.length > 2,
      // podział nie może zgubić ani dołożyć znaku
      trescCala: el.getAttribute('aria-label').replace(/\s+/g, '') === el.textContent.replace(/\s+/g, ''),
      // znaki to osobne inline-block — bez nowrap słowo łamie się w środku
      bezLamaniaSlow: slowa.every(w => w.getBoundingClientRect().height < lh * 1.6),
      pokazane: el.classList.contains('pokaz'),
      naMiejscu: znaki.every(c => Math.abs(new DOMMatrix(getComputedStyle(c).transform).f) < 0.5),
      // sygnatura ma trzymać się jednej linii aż do układu mobilnego (760 px)
      jednaLinia: innerWidth < 761 || el.getBoundingClientRect().height
                  < parseFloat(getComputedStyle(el).fontSize) * 1.5,
      wKadrze: (() => { const t = el.getBoundingClientRect(),
        c = document.querySelector('.claim-in').getBoundingClientRect();
        return t.left >= c.left - 1 && t.right <= c.right + 1; })(),
    };
  });
  const revOk = rev.podzielone && rev.trescCala && rev.bezLamaniaSlow && rev.pokazane
           && rev.naMiejscu && rev.jednaLinia && rev.wKadrze;
  console.log(`${w}×${h} odsłanianie`, revOk ? 'ok' : 'BŁĄD ' + JSON.stringify(rev));
  if (!revOk) process.exitCode = 1;

  // --- zespół: marquee, strzałki, wizytówka --------------------------------
  await p.evaluate(() => document.querySelector('#zespol').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 700));
  const zBaza = await p.evaluate(async () => {
    const s = document.querySelector('.tm');
    const oryg = [...document.querySelectorAll('[data-tm-set]')[0].querySelectorAll('[data-tm]')];
    const klon = document.querySelector('[data-tm-belt]').children[1];
    const a = s.__mq.x();
    await new Promise(r => setTimeout(r, 1000));
    return {
      ile: oryg.length,
      komplet: oryg.every(c => c.dataset.imie && c.dataset.spec && c.dataset.opis && c.dataset.dosw),
      // nagłówek zespołu: pełna szerokość (karty schodzą do krawędzi) + odsłanianie znak po znaku
      naglowekSzeroki: (() => { const h = document.querySelector('.tm-head h2').getBoundingClientRect();
        return h.left < 80 && h.right > innerWidth - 120; })(),
      naglowekOdslania: document.querySelectorAll('.tm-head h2 .char').length > 10,
      // pętla wymaga drugiej kopii zestawu, niewidocznej dla czytników i Taba
      klonUkryty: klon?.getAttribute('aria-hidden') === 'true'
               && [...klon.querySelectorAll('button')].every(b2 => b2.tabIndex === -1),
      // tempo zmierzone na referencji: ~80 px/s w lewo
      tempo: +(s.__mq.x() - a).toFixed(1),
      // zmiany 2026-08-22: biała sekcja, napisy NA karcie, karta >= 300 px
      tloBiale: getComputedStyle(document.querySelector('.tm')).backgroundColor === 'rgb(255, 255, 255)',
      napisyNaKarcie: oryg.every(c => c.querySelector('.tm-in .tm-nazwa')),
      kartaDuza: oryg[0].getBoundingClientRect().width >= 298,
      sygnaturaPoZespole: document.querySelector('.claim').getBoundingClientRect().top
                        > document.querySelector('.tm').getBoundingClientRect().top,
    };
  });
  const zPetla = await p.evaluate(async () => {
    const s = document.querySelector('.tm');
    const o = document.querySelector('[data-tm-set]').offsetWidth
      + parseFloat(getComputedStyle(document.querySelector('[data-tm-belt]')).gap);
    s.__mq.skok(-(o - 30));
    await new Promise(r => setTimeout(r, 600));
    const m = new DOMMatrix(getComputedStyle(document.querySelector('[data-tm-belt]')).transform);
    return { zawinelo: m.e > -o && m.e <= 0 };
  });
  const zStrzalka = await p.evaluate(async () => {
    const s = document.querySelector('.tm');
    const przed = s.__mq.x();
    document.querySelector('[data-tm-next]').click();
    await new Promise(r => setTimeout(r, 700));
    const dalej = s.__mq.x() - przed;                 // krok ~-270 + dryf ~-56
    const przed2 = s.__mq.x();
    document.querySelector('[data-tm-prev]').click();
    await new Promise(r => setTimeout(r, 700));
    return { dalej: +dalej.toFixed(0), wstecz: +(s.__mq.x() - przed2).toFixed(0) };
  });
  await p.evaluate(() => {
    const k = [...document.querySelectorAll('.tm-card')]
      .find(c => { const r = c.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
    k.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const zOkno = await p.evaluate(() => {
    const d = document.querySelector('[data-wiz]'), r = d.getBoundingClientRect();
    const karta = [...document.querySelectorAll('[data-tm]')].find(c => c.dataset.imie
      === d.querySelector('[data-wiz-imie]').textContent);
    return {
      otwarte: d.open,
      wKadrze: r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1,
      zgodne: !!karta && d.querySelector('[data-wiz-spec]').textContent === karta.dataset.spec,
      maCta: !!d.querySelector('[data-wiz-cta]'),
    };
  });
  await p.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));
  const zZamk = await p.evaluate(() => ({
    zamkniete: !document.querySelector('[data-wiz]').open,
    fokusWrocil: document.activeElement?.classList.contains('tm-card'),
  }));
  const zOk = zBaza.ile === 14 && zBaza.komplet && zBaza.klonUkryty
           && zBaza.naglowekSzeroki && zBaza.naglowekOdslania
           && zBaza.tloBiale && zBaza.napisyNaKarcie && zBaza.kartaDuza && zBaza.sygnaturaPoZespole
           && zBaza.tempo < -60 && zBaza.tempo > -100
           && zPetla.zawinelo && zStrzalka.dalej < -250 && zStrzalka.wstecz > 120
           && zOkno.otwarte && zOkno.wKadrze && zOkno.zgodne && zOkno.maCta
           && zZamk.zamkniete && zZamk.fokusWrocil;
  console.log(`${w}×${h} zespół`, zOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ zBaza, zPetla, zStrzalka, zOkno, zZamk }));
  if (!zOk) process.exitCode = 1;

  await p.close();
}
await b.close();
