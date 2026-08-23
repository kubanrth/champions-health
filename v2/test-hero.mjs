// Strażnik hero: (1) kwadraciki na stawach liczone przez object-fit:cover z kartą
// rozsuwaną po najechaniu, (2) zwinięcie hero w kartę po przekroczeniu progu scrolla.
// Uruchom przy działającym serve.mjs:
//   node sites/champions-health/v2/test-hero.mjs
import puppeteer from 'puppeteer';
const STAWY = ['j-bark', 'j-lokiec', 'j-biodro', 'j-kolano', 'j-skok'];
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
for (const [w, h] of [[1440, 900], [1280, 720], [820, 1180]]) {
  const p = await b.newPage(), errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(String(e)));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3000/champions-health/v2/', { waitUntil: 'networkidle2' });
  await p.evaluate(() => document.fonts.ready);
  // bark zapala się dopiero po wjeździe kreski — czekamy na koniec animacji
  await p.waitForFunction(() => document.querySelector('.hero').classList.contains('bezkreski'),
    { timeout: 15000 }).catch(() => {});
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
      const j = document.querySelector('.' + cl);
      const H = document.querySelector('.hero').getBoundingClientRect();
      const d = j.querySelector('.jt-dot').getBoundingClientRect();
      const kreska = j.querySelector('.jt-kreska');
      const kr = kreska.getBoundingClientRect();
      const nz = j.querySelector('.jt-nazwa i'), op = j.querySelector('.jt-opis i');
      const rn = nz.getBoundingClientRect(), ro = op.getBoundingClientRect();
      const wys = j.querySelector('.jt-wys::before') ? null : getComputedStyle(j.querySelector('.jt-wys'), '::before');
      const zachodzi = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0
                              && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
      const wKadrze = r => r.top >= -1 && r.bottom <= H.height + 1 && r.left >= -1 && r.right <= H.width + 1;
      return {
        staw: cl,
        // kreska wysunięta na pełną długość
        kreskaWysunieta: new DOMMatrix(getComputedStyle(kreska).transform).a > 0.98 && kr.width > 80,
        // nazwa NAD kreską, opis POD kreską
        nazwaNad: rn.bottom <= kr.top + 2,
        opisPod: ro.top >= kr.bottom - 2,
        wKadrze: wKadrze(rn) && wKadrze(ro) && wKadrze(kr),
        kropkaNaTekscie: zachodzi(d, rn) || zachodzi(d, ro),
        opisNiepusty: nz.textContent.trim().length > 0 && op.textContent.trim().length > 0,
        krojStrony: getComputedStyle(nz).fontFamily.split(',')[0].trim()
          === getComputedStyle(document.body).fontFamily.split(',')[0].trim(),
        // to ma NIE być karta: żadnych zaokrągleń, ramki ani panelu z blurem
        bezKarty: wys.borderRadius === '0px' && wys.borderTopWidth === '0px'
                  && wys.backgroundImage === 'none'
                  && ['rgba(0, 0, 0, 0)', 'transparent', ''].includes(wys.backgroundColor)
                  && (wys.backdropFilter === 'none' || wys.backdropFilter === ''),
        kropkaBiala: (() => { const c = getComputedStyle(j.querySelector('.jt-dot'));
          return c.borderRadius === '50%' && c.backgroundColor === 'rgb(255, 255, 255)'; })(),
      };
    }, c));
    await p.mouse.move(w - 40, h - 40);          // zwolnij, zanim sprawdzisz następny
    await new Promise(r => setTimeout(r, 400));
  }
  const zle = out.filter(o => !o.ukryty && (!o.kreskaWysunieta || !o.nazwaNad || !o.opisPod
                                            || !o.wKadrze || o.kropkaNaTekscie || !o.opisNiepusty
                                            || !o.krojStrony || !o.bezKarty || !o.kropkaBiala));
  const ok = !zle.length && !errs.length && przepelnienie === 0;
  console.log(`${w}×${h}`, ok ? 'ok' : 'BŁĄD ' + JSON.stringify({ zle, errs, przepelnienie }));
  if (!ok) process.exitCode = 1;
  // --- wjazd: kreska po stawach + nagłówek --------------------------------
  {
    const q = await b.newPage();
    await q.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await q.evaluateOnNewDocument(() => {
      window.__log = [];
      const obs = new MutationObserver(ms => { for (const m of ms) {
        const t = m.target;
        if (t.classList?.contains('jt') && t.classList.contains('zapalony') && !t.__z) {
          t.__z = 1; window.__log.push([t.className.split(' ')[1], performance.now()]);
          // czwarta kropka musi ZAPALIĆ SIĘ NA BARKU, dopiero potem zjechać na łokieć
          if (t.classList.contains('j-lokiec'))
            window.__start = [parseFloat(t.style.left), parseFloat(t.style.top)]; }
        if (t.classList?.contains('hero') && t.classList.contains('tekst') && !window.__t) {
          window.__t = 1; window.__log.push(['tekst', performance.now()]);
          const tor = document.querySelector('[data-tor] path');
          // napis wychodzi dopiero, gdy kreska jest rozciągnięta na jego szerokość
          const lok = document.querySelector('.j-lokiec').getBoundingClientRect();
          const h1r = document.querySelector('.hero-copy h1').getBoundingClientRect();
          window.__wtedy = {
            // prawy koniec kreski w chwili wjazdu tekstu vs prawa krawędź nagłówka
            koniecKreski: lok.x + lok.width / 2 + parseFloat(tor.style.strokeDasharray),
            prawaNaglowka: h1r.right,
            widocznaKreska: +getComputedStyle(tor.parentNode).opacity > .5 }; }
      }});
      addEventListener('DOMContentLoaded', () =>
        obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] }));
    });
    await q.goto('http://localhost:3000/champions-health/v2/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4200));
    const log = await q.evaluate(() => window.__log);
    const kolej = log.filter(l => l[0] !== 'tekst').map(l => l[0]);
    const czasy = Object.fromEntries(log);
    const kopia = await q.evaluate(() => {
      const c = document.querySelector('.hero-copy');
      // ramka sięga teraz aż do kreski (tekst z niej wyjeżdża),
      // więc położenie mierzymy po samym nagłówku, nie po ramce
      const g = c.querySelector('h1');
      const r = g.getBoundingClientRect();
      const bk = document.querySelector('.j-lokiec').getBoundingClientRect();
      const H = document.querySelector('.hero').getBoundingClientRect();
      return { widoczna: +getComputedStyle(g).opacity > 0.9,
        nadBarkiem: r.bottom <= bk.top + 2,
        start: window.__start, wtedy: window.__wtedy,
        // nagłówek czyta się bez przyciemnienia TYLKO dlatego, że stoi
        // w ciemnej kolumnie zdjęcia — pilnujemy, żeby z niej nie wyjechał
        wKolumnie: r.left >= parseFloat(getComputedStyle(
          document.querySelector('.hero')).getPropertyValue('--kx')) - 2,
        bezPrzyciemnienia: getComputedStyle(document.querySelector('.hero'), '::before')
          .backgroundImage === 'none',
        koniec: [parseFloat(bk.left ?? 0) || bk.x + bk.width / 2, bk.y + bk.height / 2],
        kreskaZnikla: +getComputedStyle(document.querySelector('.jt-tor')).opacity < .1,
        kropekWidocznych: [...document.querySelectorAll('.jt')]
          .filter(j => +getComputedStyle(j).opacity > .5).length,
        wKadrze: r.top >= -1 && r.right <= H.width + 1,
        wierszy: Math.round(r.height / parseFloat(getComputedStyle(g).lineHeight)),
        // tekst ląduje nad kreską (z niej wyjeżdża) i tuż nad jego dłonią,
        // a przy krótkim oknie nie może wjechać pod nawigację
        luz: bk.top - r.bottom,
        podNawigacja: r.top - document.querySelector('.nav').getBoundingClientRect().bottom,
        tekst: g.textContent.trim() };
    });
    const wOk = (h > 800 || w > 800)
      // kolejność zapalania: kostka → kolano → biodro → bark
      && JSON.stringify(kolej.slice(0, 4))
         === JSON.stringify(['j-skok', 'j-kolano', 'j-biodro', 'j-lokiec'])
      // piąty punkt (bark) wraca dopiero po wjeździe, gdy znacznik z niego zjechał
      && kolej[4] === 'j-bark' && czasy['j-bark'] > czasy['tekst']
      // każdy kolejny punkt wyraźnie po poprzednim, nie wszystkie naraz
      // punkty jeden po drugim, ale szybko — cała czwórka poniżej sekundy
      && czasy['j-kolano'] - czasy['j-skok'] > 90
      && czasy['j-biodro'] - czasy['j-kolano'] > 90
      && czasy['j-lokiec'] - czasy['j-biodro'] > 90
      && czasy['j-lokiec'] - czasy['j-skok'] < 700
      // 4. kropka zapala się na barku i dopiero potem zjeżdża w dół na łokieć
      && kopia.start && kopia.koniec[1] - kopia.start[1] > 60
      && Math.abs(kopia.koniec[0] - kopia.start[0]) > 40
      // napis wyjeżdża, gdy kreska jeszcze ucieka w prawo
      && czasy['tekst'] > czasy['j-lokiec'] + 500
      && kopia.wtedy && kopia.wtedy.widocznaKreska
      && kopia.wtedy.koniecKreski >= kopia.wtedy.prawaNaglowka - 8
      // na końcu zostają same kropki
      && kopia.kreskaZnikla && kopia.kropekWidocznych === 5
      && kopia.widoczna && kopia.nadBarkiem && kopia.wKadrze
      && (w < 900 || (kopia.wKolumnie && kopia.wierszy === 2
                      && kopia.luz > 40 && kopia.podNawigacja > 8))
      && kopia.bezPrzyciemnienia
      && /Kontuzje/.test(kopia.tekst);
    // zjazd w dół (hero zwija się w kartę) i powrót na górę = wjazd gra od nowa.
    // Kropki muszą zgasnąć zaraz po starcie morfu — inaczej wiszą nad gotową kartą.
    const gasniecie = await q.evaluate(() => new Promise(res => {
      const hero = document.querySelector('.hero'), k = document.querySelector('.j-kolano');
      const t0 = performance.now(); let morf = null;
      new MutationObserver(() => { if (hero.classList.contains('morphed') && morf === null)
        morf = performance.now(); }).observe(hero, { attributes: true, attributeFilter: ['class'] });
      scrollTo(0, 900);
      const tik = () => {
        if (morf !== null && +getComputedStyle(k).opacity < .08)
          return res(Math.round(performance.now() - morf));
        if (performance.now() - t0 > 3000) return res(9999);
        requestAnimationFrame(tik);
      };
      requestAnimationFrame(tik);
    }));
    await new Promise(r => setTimeout(r, 1500));
    const zwinal = await q.evaluate(() => document.querySelector('.hero').classList.contains('morphed'));
    // przy rozwijaniu nie może mignąć komplet kropek, zanim ruszy powtórka
    const migniecie = await q.evaluate(() => new Promise(res => {
      let max = 0; const t0 = performance.now();
      scrollTo(0, 0);
      const tik = () => {
        max = Math.max(max, [...document.querySelectorAll('.jt')]
          .filter(j => +getComputedStyle(j).opacity > .08).length);
        if (performance.now() - t0 > 420) return res(max);
        requestAnimationFrame(tik);
      };
      requestAnimationFrame(tik);
    }));
    await new Promise(r => setTimeout(r, 400));
    const odNowa = await q.evaluate(() => ({
      gra: !document.querySelector('.hero').classList.contains('bezkreski'),
      zapalonych: document.querySelectorAll('.jt.zapalony').length }));
    await new Promise(r => setTimeout(r, 2600));
    const poPowtorce = await q.evaluate(() => ({
      zapalonych: document.querySelectorAll('.jt.zapalony').length,
      tekst: document.querySelector('.hero').classList.contains('tekst') }));
    const powtorka = zwinal && odNowa.gra && odNowa.zapalonych < 5
                     && poPowtorce.zapalonych === 5 && poPowtorce.tekst
                     && gasniecie < 300 && migniecie <= 2;
    console.log(`${w}×${h} wjazd hero`, wOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ kolej, czasy, kopia }));
    console.log(`${w}×${h} powtórka wjazdu`, powtorka ? 'ok'
      : 'BŁĄD ' + JSON.stringify({ zwinal, gasniecie, migniecie, odNowa, poPowtorce }));
    if (!powtorka) process.exitCode = 1;
    if (!wOk) process.exitCode = 1;
    await q.close();
  }

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
      // Revolut składa całą sekcję jedną wagą (Aeonik Medium 500) — u nas Inter
      jednaWaga: ['.deal-head h2', '.card-in h3', '.card-cta', '.card-lab']
        .every(sel => { const c = getComputedStyle(document.querySelector(sel));
          return c.fontWeight === '500' && c.fontFamily.startsWith('Inter'); }),
      // metryki akapitu 1:1 z revolut.com (18/24 w bloku 600 px, dwa wiersze)
      akapitJakRevolut: (() => { const pa = document.querySelector('.deal-head p'), c = getComputedStyle(pa);
        const zwezony = innerWidth < 500 || innerHeight <= 820;
        return (zwezony || (c.fontSize === '18px' && c.lineHeight === '24px'))
            && pa.getBoundingClientRect().height / parseFloat(c.lineHeight) <= 3.4; })(),
    };
  });
  // szybki zjazd w głąb i powrót — morf ma wrócić do pełnego kadru,
  // a nie przylecieć z boku (cel liczony z offsetów, nie z rect-u toru)
  await p.evaluate(() => window.scrollTo(0, 2400));
  await new Promise(r => setTimeout(r, 1500));
  await p.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1800));
  const poSzybkim = await p.evaluate(() => {
    const m = document.querySelector('.morph').getBoundingClientRect();
    const H = document.querySelector('.hero').getBoundingClientRect();
    return Math.abs(m.left - H.left) < 2 && Math.abs(m.width - H.width) < 2;
  });
  await p.evaluate(() => window.scrollTo(0, 150));
  await new Promise(r => setTimeout(r, 1700));
  // slider nie może przeskoczyć poza kartę 01, dopóki morf leci
  const naKarcie1 = await p.evaluate(() =>
    [...document.querySelectorAll('[data-card]')].findIndex(c => c.classList.contains('focus')) <= 0);

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
    // strzałki usunięte — nawigacja to klik w kartę i scroll
    [...document.querySelectorAll('[data-card]')][3].click(); await czekaj(1400);
    const poNext = focus();
    [...document.querySelectorAll('[data-card]')][2].click(); await czekaj(1400);
    const poPrev = focus();
    const wFokusie = [...document.querySelectorAll('[data-card]')][poPrev];
    // karta w fokusie musi dać się kliknąć — to jedyna nawigacja po usunięciu strzałek
    const kb = wFokusie.getBoundingClientRect();
    const cel = document.elementFromPoint(kb.left + kb.width / 2, kb.top + kb.height / 2);
    const strzalkaKlikalna = !!cel?.closest('[data-card]');
    const txt = wFokusie.querySelector('.card-txt');
    return { skok, poNext, poPrev, kartaKlikalna: !!strzalkaKlikalna,
      tekstWidoczny: +getComputedStyle(txt).opacity > 0.9,
      tekstNiepusty: txt.textContent.trim().length > 60 };
  });
  const tOk = talia.skok === 2 && talia.poNext === 3 && talia.poPrev === 2
           && talia.tekstWidoczny && talia.tekstNiepusty && talia.kartaKlikalna;
  console.log(`${w}×${h} talia`, tOk ? 'ok' : 'BŁĄD ' + JSON.stringify(talia));
  if (!tOk) process.exitCode = 1;
  await p.evaluate(() => window.scrollTo(0, 150));
  await new Promise(r => setTimeout(r, 1200));

  const mOk = przed.spoczynek && przed.pelnyKadr && po.zwiniete && po.trafiaWKarte
           && po.kartaWUwadze && po.kartaNaWierzchu && po.kartaPelneKrycie
           && poSzybkim && naKarcie1
           && po.heroOddane && po.etykietaWidoczna && po.naglowekNadKartami && po.akapitJakRevolut && po.jednaWaga && po.lukRozlozony && po.napisyBiale && wroc.cofniete && wroc.pelnyKadr;
  console.log(`${w}×${h} przejście`, mOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ przed, po, wroc, poSzybkim, naKarcie1 }));
  if (!mOk) process.exitCode = 1;

  // --- etapy opieki --------------------------------------------------------
  // wjazd: skala .9 → 1 wiązana ze scrollem (zmierzone na myhealthprac)
  const wjazd = await p.evaluate(async () => {
    const sec = document.querySelector('.etapy');
    const y = sec.getBoundingClientRect().top + scrollY;
    const czekaj = ms => new Promise(r => setTimeout(r, ms));
    const s2 = () => +new DOMMatrix(getComputedStyle(sec).transform).a.toFixed(3);
    window.scrollTo(0, y - innerHeight * 1.15); await czekaj(500);
    const daleko = s2();
    window.scrollTo(0, y - innerHeight * 0.55); await czekaj(500);
    const wpol = s2();
    window.scrollTo(0, y - innerHeight * 0.1); await czekaj(500);
    const blisko = s2();
    return { daleko, wpol, blisko };
  });
  const wOk = Math.abs(wjazd.daleko - 0.9) < 0.02
           && wjazd.wpol > wjazd.daleko && wjazd.wpol < wjazd.blisko
           && Math.abs(wjazd.blisko - 1) < 0.02;
  console.log(`${w}×${h} wjazd etapów`, wOk ? 'ok' : 'BŁĄD ' + JSON.stringify(wjazd));
  if (!wOk) process.exitCode = 1;

  await p.evaluate(() => document.querySelector('.etapy').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 1800));
  const etapy = await p.evaluate(() => {
    const sec = document.querySelector('.etapy'), S = sec.getBoundingClientRect();
    const et = [...sec.querySelectorAll('.etap')];
    const c = getComputedStyle(et[0]);
    const ty = getComputedStyle(et[0].querySelector('.etap-tytul'));
    const ik = et[0].querySelector('.etap-ikona').getBoundingClientRect();
    return {
      ile: et.length,
      nazwy: et.map(e => e.querySelector('.etap-kiedy').textContent.trim()),
      pojawily: sec.classList.contains('widoczne')
             && et.every(e => +getComputedStyle(e).opacity > 0.9),
      // zmierzone u nich: kreska przerywana nad wierszem, padding 32, kółko 70, tytuł 23,76/500
      kreska: c.borderTopStyle === 'dashed' && c.borderTopWidth === '1px',
      kolko: Math.abs(ik.width - 70) < 16 && Math.abs(ik.height - ik.width) < 2,
      tytul: ty.fontWeight === '500'
          && (innerWidth < 1400 || Math.abs(parseFloat(ty.fontSize) - 23.76) < 2),
      komplet: et.every(e => e.querySelector('.etap-kiedy').textContent.trim()
                          && e.querySelector('.etap-tytul').textContent.trim()
                          && e.querySelectorAll('.etap-punkty li').length >= 3),
      wKadrze: et.every(e => { const r = e.getBoundingClientRect();
        return r.left - S.left >= -1 && r.right - S.left <= S.width + 1; }),
      tlo: !!sec.querySelector('.etapy-tlo'),
    };
  });
  const eOk = etapy.ile === 5
           && ['Koordynator','Diagnoza','Realizacja','Testy kontrolne','Profilaktyka']
              .every((n, i) => etapy.nazwy[i] === n)
           && etapy.pojawily && etapy.kreska && etapy.kolko
           && etapy.tytul && etapy.komplet && etapy.wKadrze && etapy.tlo;
  console.log(`${w}×${h} etapy`, eOk ? 'ok' : 'BŁĄD ' + JSON.stringify(etapy));
  if (!eOk) process.exitCode = 1;

  // --- FAQ 1:1 z revolut.com ----------------------------------------------
  await p.evaluate(() => document.querySelector('#faq').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 700));
  await p.click('#faq .q');
  await new Promise(r => setTimeout(r, 800));
  const faq = await p.evaluate(() => {
    const h2 = getComputedStyle(document.querySelector('.faq-head h2'));
    const q = getComputedStyle(document.querySelector('.q'));
    const wiersz = document.querySelector('.qa');
    const odp = document.querySelector('.qa.on .a');
    return {
      // rozmiary referencyjne dotyczą 1440 — niżej mają prawo maleć
      naglowek: h2.fontWeight === '500' && h2.textAlign === 'center'
             && (innerWidth < 1300 || Math.abs(parseFloat(h2.fontSize) - 51.79) < 6),
      pytanie: q.fontWeight === '500'
            && (innerWidth < 1300 || Math.abs(parseFloat(q.fontSize) - 24) < 3),
      tor: innerWidth < 1100
        || Math.abs(document.querySelector('.faq').getBoundingClientRect().width - 1000) < 40,
      wloskowaLinia: getComputedStyle(wiersz).borderBottomWidth === '1px',
      rozwija: odp && odp.getBoundingClientRect().height > 20,
      // otwarty wiersz to minus, nie obrócony plus
      minus: getComputedStyle(document.querySelector('.qa.on .q i')).transform === 'none',
    };
  });
  const fOk = faq.naglowek && faq.pytanie && faq.tor && faq.wloskowaLinia && faq.rozwija && faq.minus;
  console.log(`${w}×${h} FAQ`, fOk ? 'ok' : 'BŁĄD ' + JSON.stringify(faq));
  if (!fOk) process.exitCode = 1;

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
      // sygnatura: duża, dosunięta do lewej, do dwóch wierszy
      doLewej: document.querySelector('.claim-in').getBoundingClientRect().left < 80,
      // jedna linia na całą szerokość — rozmiar musi ustąpić na wąskim oknie
      duza: parseFloat(getComputedStyle(el).fontSize) >= (innerWidth >= 1200 ? 38 : 22),
      jednaLinia: innerWidth < 761 || el.getBoundingClientRect().height
                  < parseFloat(getComputedStyle(el).fontSize) * 1.6,
      naCalosc: (() => { const t = el.getBoundingClientRect(),
        c = document.querySelector('.claim-in').getBoundingClientRect();
        return innerWidth < 761 || t.right > c.right - 90; })(),
      wKadrze: (() => { const t = el.getBoundingClientRect(),
        c = document.querySelector('.claim-in').getBoundingClientRect();
        return t.left >= c.left - 1 && t.right <= c.right + 1; })(),
    };
  });
  const revOk = rev.podzielone && rev.trescCala && rev.bezLamaniaSlow && rev.pokazane
           && rev.naMiejscu && rev.doLewej && rev.duza && rev.jednaLinia && rev.naCalosc && rev.wKadrze;
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

  // --- blog + kontakt ------------------------------------------------------
  const blog = await p.evaluate(() => {
    const s2 = document.querySelector('#blog');
    const posty = [...s2.querySelectorAll('.post')];
    const zespol = document.querySelector('#zespol').getBoundingClientRect().top;
    const faq = document.querySelector('#faq').getBoundingClientRect().top;
    const b2 = s2.getBoundingClientRect().top;
    return { ile: posty.length,
      // blog ma leżeć między zespołem a FAQ
      miedzy: b2 > zespol && b2 < faq,
      komplet: posty.every(a => a.querySelector('img') && a.querySelector('h3 a')
                             && a.querySelector('p').textContent.trim().length > 30) };
  });
  await p.evaluate(() => document.querySelector('#kontakt').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 1200));
  await p.click('.kontakt-form button[type=submit]');
  await new Promise(r => setTimeout(r, 400));
  const pusty = await p.evaluate(() => document.querySelector('[data-form-nota]').textContent);
  await p.type('[name=imie]', 'Jan Kowalski');
  await p.type('[name=tel]', '600100200');
  await p.type('[name=email]', 'jan@example.com');
  await p.click('.kontakt-form button[type=submit]');
  await new Promise(r => setTimeout(r, 400));
  const kontakt = await p.evaluate(prz => {
    const nota = document.querySelector('[data-form-nota]');
    const lewo = document.querySelector('.kontakt-lewo').getBoundingClientRect();
    const form = document.querySelector('.kontakt-form').getBoundingClientRect();
    return {
      // dane po lewej, formularz po prawej (na wąskim ekranie jeden pod drugim)
      uklad: innerWidth < 901 || form.left > lewo.left,
      // zdjęcie w tle wypadło (rozmyty kadr + dwa przyciemnienia = mgła);
      // pilnujemy tego, co je zastąpiło: cztery wiersze danych z przerywaną kreską
      wiersze: document.querySelectorAll('.kontakt-dane div').length === 4
        && getComputedStyle(document.querySelector('.kontakt-dane div')).borderTopStyle === 'dashed',
      // pola muszą być widoczne — obramowanie kontra tło pola min. 3:1 (WCAG dla UI)
      poleWidoczne: (() => {
        const i = document.querySelector('.kontakt-form input'), cs = getComputedStyle(i);
        const L = c => { const n = c.match(/[\d.]+/g).map(Number), a = n.length > 3 ? n[3] : 1;
          const [r, g, b] = n.slice(0, 3).map(v => { v = v * a / 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
          return .2126 * r + .7152 * g + .0722 * b; };
        const lo = Math.min(L(cs.borderTopColor), L(cs.backgroundColor)), hi = Math.max(L(cs.borderTopColor), L(cs.backgroundColor));
        return (hi + .05) / (lo + .05) >= 3 && i.getBoundingClientRect().height >= 44;
      })(),
      pustyBlokuje: /Uzupełnij/.test(prz),
      wypelnionyPrzechodzi: /Dziękujemy/.test(nota.textContent),
      etykiety: [...document.querySelectorAll('.kontakt-form input,.kontakt-form textarea')]
        .every(i => i.closest('label')),
    };
  }, pusty);
  const bkOk = blog.ile === 3 && blog.miedzy && blog.komplet
            && kontakt.uklad && kontakt.wiersze && kontakt.poleWidoczne && kontakt.pustyBlokuje
            && kontakt.wypelnionyPrzechodzi && kontakt.etykiety;
  console.log(`${w}×${h} blog+kontakt`, bkOk ? 'ok' : 'BŁĄD ' + JSON.stringify({ blog, kontakt }));
  if (!bkOk) process.exitCode = 1;

  await p.close();
}
await b.close();
