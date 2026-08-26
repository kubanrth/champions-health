/* Wspólne zachowania wszystkich podstron:
   1) pop-up „Umów wizytę" — wybór: zadzwonić czy napisać,
   2) listy wyboru w stylu strony — natywny <select> zostaje pod spodem, więc
      bez JS-u formularz dalej działa, a walidacja i wysyłka nic nie wiedzą
      o podmianie.
   Jeden plik zamiast kopii w siedmiu stronach; style wstrzykuje sam, żeby
   dokładanie go do kolejnej strony było jednym <script>. */
(() => {
  const TELEFON = '+48223182000';
  const TELEFON_ETYKIETA = '22 318 20 00';

  const styl = document.createElement('style');
  styl.textContent = `
.uw::backdrop{background:rgba(6,12,9,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.uw{border:0;padding:0;max-width:min(92vw,430px);width:100%;border-radius:26px;
  background:#F1F1F1;color:#0B0D0C;box-shadow:0 50px 90px -40px rgba(0,0,0,.6)}
.uw[open]{animation:uw-in .32s cubic-bezier(.22,.8,.25,1)}
@keyframes uw-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.uw-in{padding:clamp(22px,3vw,30px)}
.uw h2{margin:0;font-size:22px;font-weight:500;letter-spacing:-.02em}
.uw p{margin:6px 0 0;font-size:14.5px;line-height:1.5;color:rgba(11,13,12,.62)}
.uw-opcje{display:grid;gap:10px;margin-top:20px}
.uw-opcja{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;
  background:#fff;color:#0B0D0C;text-decoration:none;
  transition:transform .3s cubic-bezier(.22,.8,.25,1),background-color .3s cubic-bezier(.22,.8,.25,1)}
.uw-opcja:hover{background:#E9E9E6;transform:translateY(-1px)}
.uw-opcja:focus-visible{outline:2px solid #0B0D0C;outline-offset:2px}
.uw-opcja i{flex:none;width:38px;height:38px;border-radius:50%;background:#0B0D0C;color:#fff;
  display:grid;place-items:center}
.uw-opcja svg{width:17px;height:17px}
.uw-opcja b{display:block;font-size:15.5px;font-weight:500;letter-spacing:-.01em}
.uw-opcja span{display:block;font-size:13px;color:rgba(11,13,12,.6)}
.uw-zamknij{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;border-radius:50%;
  background:rgba(11,13,12,.06);color:#0B0D0C;cursor:pointer;display:grid;place-items:center;
  transition:background-color .3s cubic-bezier(.22,.8,.25,1)}
.uw-zamknij:hover{background:rgba(11,13,12,.12)}
.uw-zamknij:focus-visible{outline:2px solid #0B0D0C;outline-offset:2px}

/* --- lista wyboru --------------------------------------------------------- */
/* Lista jedzie do body i jest position:fixed. Powod: pola formularza maja
   backdrop-filter, ktory wypycha je na wlasna warstwe kompozytowa i wtedy
   maluja sie NAD lista, choc ta ma wyzszy z-index. Wyjscie poza formularz
   omija cala te uklada warstw.
   UWAGA: w tym bloku nie ma odwrotnych apostrofow - to wnetrze szablonu JS. */
.pw{position:relative}
.pw-natywna{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);
  clip-path:inset(50%);white-space:nowrap}
.pw-btn{width:100%;text-align:left;font:inherit;cursor:pointer;position:relative}
.pw-btn.pw-pusta{color:#232624}
.pw-btn::after{content:"";position:absolute;top:50%;right:16px;width:9px;height:9px;
  margin-top:-3px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;
  transform:rotate(45deg);transition:transform .3s cubic-bezier(.22,.8,.25,1)}
.pw.otwarta .pw-btn::after{transform:rotate(-135deg);margin-top:1px}
.pw-lista{position:fixed;z-index:2000;top:0;left:0;width:0;visibility:hidden;margin:0;padding:6px;
  list-style:none;max-height:min(320px,50vh);overflow:auto;border-radius:18px;background:#fff;
  color:#0B0D0C;box-shadow:0 30px 60px -28px rgba(0,0,0,.55),0 0 0 1px rgba(11,13,12,.08);
  opacity:0;transform:translateY(-6px);pointer-events:none;
  transition:opacity .22s cubic-bezier(.22,.8,.25,1),transform .22s cubic-bezier(.22,.8,.25,1)}
.pw-lista.otwarta{opacity:1;transform:none;pointer-events:auto;visibility:visible}
.pw-lista li{padding:11px 14px;border-radius:12px;font-size:15px;line-height:1.35;cursor:pointer}
.pw-lista li[aria-selected="true"]{background:#0B0D0C;color:#fff}
.pw-lista li.wskazana:not([aria-selected="true"]){background:#EDEDEA}
.pw-lista li[data-grupa]{padding:12px 14px 4px;font-size:11px;font-weight:500;letter-spacing:.07em;
  text-transform:uppercase;color:rgba(11,13,12,.5);cursor:default}
/* --- mobile: przycisk Menu w pasku, szuflada i plywajaca pastylka CTA ------
   UWAGA: w tym bloku nie ma odwrotnych apostrofow - to wnetrze szablonu JS. */
/* Napis „Menu" ma byc czarny (zyczenie klienta). Nad ciemnym zdjeciem hero czarny
   tekst bez podkladu ma ~1,5:1, wiec siedzi na jasnej pastylce - tej samej, co
   reszta przyciskow na stronie. Na jasnych podstronach wyglada tak samo. */
.mnu-btn{display:none;align-items:center;gap:10px;height:40px;padding:0 16px;border:0;
  margin-left:auto;border-radius:999px;
  background:#F1F1F1;color:#0B0D0C;font:inherit;font-size:16px;font-weight:500;cursor:pointer;
  transition:background-color .3s cubic-bezier(.22,.8,.25,1)}
.mnu-btn:hover{background:#fff}
.mnu-btn i{width:9px;height:9px;border-radius:50%;background:currentColor;display:block}
.mnu{position:fixed;inset:0;z-index:400;background:#0B0D0C;color:#fff;
  display:flex;flex-direction:column;padding:18px 24px calc(28px + env(safe-area-inset-bottom));
  opacity:0;visibility:hidden;transform:translateY(-8px);
  transition:opacity .3s cubic-bezier(.22,.8,.25,1),transform .35s cubic-bezier(.22,.8,.25,1),visibility .3s}
.mnu.otwarte{opacity:1;visibility:visible;transform:none}
.mnu-gora{display:flex;align-items:center;justify-content:space-between;height:44px}
.mnu-gora img{height:24px;width:auto}
.mnu-lista{margin:auto 0;display:grid;gap:6px}
.mnu-lista a{font-size:clamp(2rem,10vw,2.9rem);line-height:1.1;letter-spacing:-.03em;font-weight:500;
  color:#fff;padding:6px 0}
.mnu-stopka{display:grid;gap:10px;font-size:15px;color:rgba(255,255,255,.66)}
.mnu-stopka a{color:rgba(255,255,255,.86)}
.mnu .btn-uw{display:inline-flex;align-items:center;justify-content:space-between;gap:16px;
  height:56px;padding:0 6px 0 22px;border-radius:999px;background:#fff;color:#0B0D0C;
  font-size:16px;font-weight:500;margin-bottom:20px}
.mnu .btn-uw i{width:44px;height:44px;border-radius:50%;background:#0B0D0C;color:#fff;
  display:grid;place-items:center}
.mnu .btn-uw svg{width:17px;height:17px}
/* Pastylka startuje na calą szerokosc kadru, a po pierwszym scrollu zsuwa sie
   symetrycznie do wlasnej szerokosci (--fab-waska liczy JS z zawartosci).
   Zwezanie idzie na width, bo scaleX sciskaloby napis razem z tlem.
   (Bez odwrotnych apostrofow - to wnetrze szablonu JS.) */
.fab{position:fixed;z-index:250;left:50%;
  bottom:calc(14px + env(safe-area-inset-bottom) + var(--pasek-dolny,0px));
  transform:translateX(-50%);display:none;align-items:center;justify-content:space-between;
  gap:14px;height:56px;width:calc(100vw - 40px);
  padding:0 6px 0 24px;border-radius:999px;background:#F1F1F1;color:#0B0D0C;
  font-size:16.5px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;
  box-shadow:0 18px 40px -18px rgba(0,0,0,.55);
  transition:width .55s cubic-bezier(.22,.8,.25,1),transform .35s cubic-bezier(.22,.8,.25,1),
    opacity .3s cubic-bezier(.22,.8,.25,1)}
.fab.zwezona{width:var(--fab-waska,auto)}
/* na jasnych sekcjach pastylka odwraca kolory, zeby nie zlewala sie z tlem */
.fab.ciemna{background:#0B0D0C;color:#fff;box-shadow:0 18px 40px -18px rgba(0,0,0,.4)}
.fab.ciemna i{background:#fff;color:#0B0D0C}
.fab i{width:44px;height:44px;flex:none;border-radius:50%;background:#0B0D0C;color:#fff;
  display:grid;place-items:center}
.fab svg{width:16px;height:16px}
.fab:active{transform:translateX(-50%) scale(.97)}
body.mnu-otwarte{overflow:hidden}
body.mnu-otwarte .fab{opacity:0;pointer-events:none}
/* --- uklad paska (zyczenie klienta): menu na srodku okna, po prawej przycisk
   „Umow wizyte" i logo przy samej krawedzi. Siatka 1fr auto 1fr trzyma menu
   dokladnie na srodku niezaleznie od szerokosci prawej grupy. */
/* pasek na cala szerokosc: przy --nav-w 1100px logo konczylo sie 170 px przed
   krawedzia okna, a ma byc przy samej krawedzi.
   (W tym bloku nie ma odwrotnych apostrofow - to wnetrze szablonu JS.) */
.nav-in{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;
  width:100%;max-width:none}
.nav .menu{grid-column:2;justify-self:center;margin:0}
.nav-prawo{grid-column:3;justify-self:end;display:flex;align-items:center;gap:16px}
.nav .cta{margin-left:0}
.nav .brand{margin-right:0}
.nav .brand img{height:44px}
/* Miedzy 760 a 1080 px menu i prawa grupa nie miesza sie w rownych polowkach
   (siatka 1fr auto 1fr wymusza symetrie) - logo wystawalo o 7-17 px poza kadr.
   Ponizej progu wszystko sciesniamy, zeby srodkowanie menu dalo sie utrzymac. */
@media(max-width:1180px){.nav .brand img{height:38px}}
@media(max-width:1080px){
  .nav-in{gap:14px}
  .nav .menu{gap:18px}
  .nav .cta{padding:0 14px}
  .nav-prawo{gap:12px}
  .nav .brand img{height:32px}
}
@media(max-width:760px){
  /* na telefonie wracamy do: logo z lewej, „Menu" z prawej */
  .nav-in{display:flex}
  .nav-prawo{margin-right:auto}
}

/* pasek chowa sie przy scrollu w dol, wraca przy scrollu w gore - inaczej
   przy stalym pasku naglowki sekcji zostaja przyciete tuz pod nim */
.nav.schowana{transform:translateY(-100%)}
@media(max-width:760px){
  .mnu-btn{display:inline-flex}
  .nav .menu,.nav .cta{display:none}
  .fab{display:inline-flex}
  /* miejsce pod plywajaca pastylke, zeby nie zaslaniala ostatniego wiersza */
  footer.site{padding-bottom:calc(94px + env(safe-area-inset-bottom))}
}

/* --- odsłanianie tekstu znak po znaku (te same wartosci co na glownej) ---- */
.reveal .word{display:inline-block;white-space:nowrap;overflow:hidden;vertical-align:bottom;
  padding-bottom:.16em;margin-bottom:-.16em}
.reveal .char{display:inline-block;transform:translateY(115%);
  transition:transform .33s cubic-bezier(.25,.46,.45,.94) calc(var(--i) * 16ms)}
.reveal.pokaz .char{transform:none}
@media(prefers-reduced-motion:reduce){
  .reveal .char{transform:none;transition:none}
  .uw[open]{animation:none}
  .pw-lista,.pw-btn::after{transition:none}
}`;
  document.head.appendChild(styl);

  const IKONA = {
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 16.9v2.6a1.7 1.7 0 0 1-1.9 1.7 16.8 16.8 0 0 1-7.3-2.6 16.5 16.5 0 0 1-5.1-5.1A16.8 16.8 0 0 1 3.5 6.2 1.7 1.7 0 0 1 5.2 4.3h2.6a1.7 1.7 0 0 1 1.7 1.5c.1.8.3 1.6.6 2.4a1.7 1.7 0 0 1-.4 1.8l-1.1 1.1a13.6 13.6 0 0 0 5.1 5.1l1.1-1.1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.4.6a1.7 1.7 0 0 1 1.4 1.6Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.4" width="18" height="13.2" rx="2.6"/><path d="m3.6 7 7.3 5.2a2 2 0 0 0 2.2 0L20.4 7"/></svg>',
    zamknij: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    strzalka: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  };

  // --- 1) pop-up ------------------------------------------------------------
  // „Napisz do nas" ZAWSZE prowadzi na podstronę kontaktu, nawet jeśli bieżąca
  // strona ma własny formularz niżej (decyzja klienta: przenieść, nie przewijać).
  const doFormularza = (location.pathname.includes('/uslugi/') ? '../' : '') + 'kontakt.html#formularz';

  const okno = document.createElement('dialog');
  okno.className = 'uw';
  okno.setAttribute('aria-labelledby', 'uw-tyt');
  okno.innerHTML = `<div class="uw-in">
    <button class="uw-zamknij" type="button" aria-label="Zamknij">${IKONA.zamknij}</button>
    <h2 id="uw-tyt">Umów wizytę</h2>
    <p>Wybierz, jak wolisz się z nami skontaktować.</p>
    <div class="uw-opcje">
      <a class="uw-opcja" href="tel:${TELEFON}"><i>${IKONA.tel}</i>
        <span><b>Zadzwoń</b><span>${TELEFON_ETYKIETA} · pon.–pt. 8:00–20:00</span></span></a>
      <a class="uw-opcja" href="${doFormularza}" data-uw-pisz><i>${IKONA.mail}</i>
        <span><b>Napisz do nas</b><span>Formularz - oddzwonimy tego samego dnia</span></span></a>
    </div>
  </div>`;
  document.body.appendChild(okno);

  okno.querySelector('.uw-zamknij').addEventListener('click', () => okno.close());
  // kliknięcie w tło (poza kartą) zamyka — `dialog` sam tego nie robi
  okno.addEventListener('click', e => { if (e.target === okno) okno.close(); });
  okno.querySelector('[data-uw-pisz]').addEventListener('click', () => okno.close());

  // podpinamy po treści, nie po klasie — „Umów wizytę" jest i w pasku, i na
  // kartach, i w heroju. Funkcja, bo elementy mobilne powstają dopiero niżej.
  const podepnijUW = zakres => {
    for (const a of zakres.querySelectorAll('a'))
      if (a.textContent.trim() === 'Umów wizytę')
        a.addEventListener('click', e => { e.preventDefault(); okno.showModal(); });
  };
  podepnijUW(document);

  // --- 1b) mobile: Menu w pasku + pływająca pastylka ------------------------
  // Budowane z JS-u, bo ten sam pasek jest w siedmiu plikach. Linki bierzemy
  // z istniejącego `.menu`, więc szuflada nie może się rozjechać z nawigacją.
  {
    const pasek = document.querySelector('.nav-in');
    const menu = document.querySelector('.nav .menu');
    if (pasek && menu) {
      const przycisk = document.createElement('button');
      przycisk.type = 'button';
      przycisk.className = 'mnu-btn';
      przycisk.setAttribute('aria-expanded', 'false');
      przycisk.innerHTML = 'Menu<i aria-hidden="true"></i>';
      pasek.appendChild(przycisk);

      const logo = document.querySelector('.nav .brand img:not([aria-hidden])')
        || document.querySelector('.nav .brand img');
      const szuflada = document.createElement('div');
      szuflada.className = 'mnu';
      szuflada.hidden = false;
      szuflada.innerHTML = '<div class="mnu-gora">'
        + '<img src="' + (logo ? logo.getAttribute('src') : '') + '" alt="Legia Medical">'
        + '<button type="button" class="mnu-btn" data-mnu-x>Zamknij<i aria-hidden="true"></i></button>'
        + '</div><nav class="mnu-lista"></nav>'
        + '<a class="btn-uw" href="#">Umów wizytę<i>' + IKONA.strzalka + '</i></a>'
        + '<div class="mnu-stopka">'
        + '<a href="tel:' + TELEFON + '">' + TELEFON_ETYKIETA + '</a>'
        + '<a href="mailto:info@championshealth.pl">info@championshealth.pl</a>'
        + '<span>Legionistów 3, Książenice · pon.–pt. 8:00–20:00</span></div>';
      for (const a of menu.querySelectorAll('a'))
        szuflada.querySelector('.mnu-lista').appendChild(a.cloneNode(true));
      document.body.appendChild(szuflada);

      const fab = document.createElement('a');
      fab.className = 'fab';
      fab.href = '#';
      fab.innerHTML = 'Umów wizytę<i>' + IKONA.strzalka + '</i>';
      document.body.appendChild(fab);
      podepnijUW(szuflada);                 // CTA w szufladzie
      fab.addEventListener('click', e => { e.preventDefault(); okno.showModal(); });

      // szerokość docelowa mierzona z zawartości, bo w CSS-ie jej nie da się zapisać
      const zmierzFab = () => {
        fab.style.transition = 'none';
        fab.style.width = 'auto';
        const w = Math.ceil(fab.getBoundingClientRect().width);
        fab.style.width = '';
        fab.style.setProperty('--fab-waska', w + 'px');
        void fab.offsetWidth;
        fab.style.transition = '';
      };
      zmierzFab();
      addEventListener('resize', zmierzFab);
      // Kolory pastylki zalezne od tego, co pod nia lezy. Sekcje ze zdjeciem nie
      // maja wlasnego tla (jest w <img>), wiec ida z listy; reszte rozstrzyga
      // pierwszy nieprzezroczysty `background-color` w gore drzewa.
      const CIEMNE = '.hero,.pg-hero,.kt-sek,.etapy,.kontakt,.kont,footer.site';
      const kolorFab = () => {
        const r = fab.getBoundingClientRect();
        fab.style.pointerEvents = 'none';
        const el = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                             Math.round(r.top + r.height / 2));
        fab.style.pointerEvents = '';
        if (!el) return;
        if (el.closest(CIEMNE)) { fab.classList.remove('ciemna'); return; }
        let e = el, rgb = null;
        while (e && e !== document.documentElement) {
          const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
          if (m && (m.length < 4 || Number(m[3]) > .5)) { rgb = m.map(Number); break; }
          e = e.parentElement;
        }
        const jasne = !rgb || (.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]) / 255 > .55;
        fab.classList.toggle('ciemna', jasne);
      };
      // Pasek adresu przeglądarki na telefonie potrafi zasłonić dolną część
      // okna układu — `position:fixed` tego nie widzi i pastylka chowa się pod
      // nim. `visualViewport` mówi, ile realnie widać; różnicę oddajemy w CSS.
      const vv = window.visualViewport;
      if (vv) {
        const zasloniete = () => fab.style.setProperty('--pasek-dolny',
          Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) + 'px');
        vv.addEventListener('resize', zasloniete);
        vv.addEventListener('scroll', zasloniete);
        zasloniete();
      }
      let raf = null;
      // Pasek na podstronach stoi na stale i przycinal naglowki sekcji tuz pod
      // soba. Strona glowna ma wlasna logike (data-nav-auto) - tam nie ruszamy.
      // UWAGA: `pasek` jest już zajęte wyżej (`.nav-in`) — ta sama nazwa w tym
      // bloku wywalała cały skrypt („Cannot access 'pasek' before initialization"),
      // razem z szufladą i pastylką.
      const pasekNav = document.querySelector('.nav');
      if (pasekNav && !pasekNav.hasAttribute('data-nav-auto')) {
        pasekNav.style.transition = 'transform .35s cubic-bezier(.22,.8,.25,1)';
        let ostatni = scrollY;
        addEventListener('scroll', () => {
          if (!matchMedia('(max-width:760px)').matches) { pasekNav.classList.remove('schowana'); return; }
          if (document.body.classList.contains('mnu-otwarte')) return;
          const y = scrollY;
          // `ostatni` przesuwamy TYLKO przy ruchu ponad próg — inaczej drobne
          // drgnięcie w górę po serii małych kroków w dół odwracało kierunek
          if (Math.abs(y - ostatni) > 6) {
            pasekNav.classList.toggle('schowana', y > ostatni && y > 140);
            ostatni = y;
          }
        }, { passive: true });
      }

      const stanFab = () => {
        fab.classList.toggle('zwezona', scrollY > 80);
        raf ||= requestAnimationFrame(() => { raf = null; kolorFab(); });
      };
      addEventListener('scroll', stanFab, { passive: true });
      stanFab();
      setTimeout(kolorFab, 400);            // po ułożeniu się strony

      const przelacz = stan => {
        szuflada.classList.toggle('otwarte', stan);
        document.body.classList.toggle('mnu-otwarte', stan);
        przycisk.setAttribute('aria-expanded', String(stan));
      };
      przycisk.addEventListener('click', () => przelacz(!szuflada.classList.contains('otwarte')));
      szuflada.querySelector('[data-mnu-x]').addEventListener('click', () => przelacz(false));
      for (const a of szuflada.querySelectorAll('a')) a.addEventListener('click', () => przelacz(false));
      addEventListener('keydown', e => e.key === 'Escape' && przelacz(false));
    }
  }

  // --- 2) odsłanianie tekstu znak po znaku ----------------------------------
  // Zmierzone na myhealthprac.com: znak jedzie translateY(100%) → 0, czas 0,33 s,
  // rozjazd 16 ms. Strona główna ma własną, starszą kopię tego kodu w <script>,
  // dlatego pomijamy elementy już podzielone — inaczej podzieliłoby je dwa razy.
  {
    const bezRuchu = matchMedia('(prefers-reduced-motion:reduce)').matches;
    for (const el of document.querySelectorAll('[data-reveal]')) {
      if (el.querySelector('.word')) continue;
      const tekst = el.textContent.trim();
      el.setAttribute('aria-label', tekst);       // czytnik czyta zdanie, nie litery
      if (bezRuchu) continue;
      const frag = document.createDocumentFragment();
      let i = 0;
      for (const kawalek of tekst.split(/(\s+)/)) {
        if (!kawalek) continue;
        if (/^\s+$/.test(kawalek)) { frag.appendChild(document.createTextNode(' ')); continue; }
        const slowo = document.createElement('span');
        slowo.className = 'word';
        for (const znak of [...kawalek]) {
          const c = document.createElement('span');
          c.className = 'char';
          c.style.setProperty('--i', i++);
          c.textContent = znak;
          slowo.appendChild(c);
        }
        frag.appendChild(slowo);
      }
      el.textContent = '';
      el.appendChild(frag);
      new IntersectionObserver((e, o) => {
        if (!e[0].isIntersecting) return;
        el.classList.add('pokaz');
        o.disconnect();
      }, { threshold: .4 }).observe(el);
      console.assert(el.getAttribute('aria-label').replace(/\s+/g, '')
                  === el.textContent.replace(/\s+/g, ''), 'odsłanianie zmieniło treść');
    }
  }

  // --- 3) listy wyboru ------------------------------------------------------
  for (const [nr, sel] of [...document.querySelectorAll('select')].entries()) {
    const opcje = [...sel.querySelectorAll('option')];
    const box = document.createElement('div');
    box.className = 'pw';
    sel.parentNode.insertBefore(box, sel);
    box.appendChild(sel);
    sel.classList.add('pw-natywna');
    sel.tabIndex = -1;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = (sel.className.replace('pw-natywna', '').trim() + ' pw-btn').trim();
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const etykieta = sel.id && document.querySelector(`label[for="${sel.id}"]`);
    if (etykieta) {
      if (!etykieta.id) etykieta.id = `pw-et-${nr}`;
      btn.setAttribute('aria-labelledby', `${etykieta.id} pw-wartosc-${nr}`);
      btn.id = `pw-wartosc-${nr}`;
    }

    const lista = document.createElement('ul');
    lista.className = 'pw-lista';
    lista.setAttribute('role', 'listbox');
    lista.id = `pw-lista-${nr}`;
    btn.setAttribute('aria-controls', lista.id);

    const pozycje = [];
    for (const o of opcje) {
      if (o.disabled) continue;               // podpowiedź „Wybierz…" siedzi na przycisku
      if (o.parentElement.tagName === 'OPTGROUP' && o === o.parentElement.firstElementChild) {
        const g = document.createElement('li');
        g.textContent = o.parentElement.label;
        g.dataset.grupa = '1';
        lista.appendChild(g);
      }
      const li = document.createElement('li');
      li.textContent = o.textContent;
      li.setAttribute('role', 'option');
      li.id = `pw-${nr}-${pozycje.length}`;
      li.setAttribute('aria-selected', String(o.selected));
      li.dataset.wartosc = o.value || o.textContent;
      lista.appendChild(li);
      pozycje.push({ li, o });
    }

    box.append(btn);
    document.body.appendChild(lista);         // patrz komentarz przy .pw-lista

    let wskazana = Math.max(0, pozycje.findIndex(p => p.o.selected));
    const odswiez = () => {
      const wybrana = pozycje.find(p => p.o.selected);
      btn.textContent = wybrana ? wybrana.o.textContent : opcje[0].textContent;
      for (const p of pozycje) p.li.setAttribute('aria-selected', String(p.o.selected));
      // podpowiedź ciemniejsza niż zwykły placeholder: na szarym polu 2F3230
      // dawało 4,2:1, a to jedyna etykieta listy, dopóki nic nie wybrano
      btn.classList.toggle('pw-pusta', !wybrana);
    };
    const wskaz = i => {
      wskazana = (i + pozycje.length) % pozycje.length;
      pozycje.forEach((p, j) => p.li.classList.toggle('wskazana', j === wskazana));
      lista.setAttribute('aria-activedescendant', pozycje[wskazana].li.id);
      pozycje[wskazana].li.scrollIntoView({ block: 'nearest' });
    };
    const ustaw = () => {                    // lista siedzi w body, wiec sama liczy pozycje
      const r = btn.getBoundingClientRect();
      const wysokosc = lista.offsetHeight || 240;
      const podSpodem = innerHeight - r.bottom - 16;
      lista.style.left = r.left + 'px';
      lista.style.width = r.width + 'px';
      lista.style.top = (podSpodem < Math.min(wysokosc, 220) && r.top > podSpodem
        ? r.top - Math.min(wysokosc, r.top - 16) - 8
        : r.bottom + 8) + 'px';
      lista.style.maxHeight = Math.max(140, Math.min(320,
        podSpodem < 200 && r.top > podSpodem ? r.top - 24 : podSpodem)) + 'px';
    };
    const otworz = () => {
      box.classList.add('otwarta');
      btn.setAttribute('aria-expanded', 'true');
      ustaw();
      wskaz(Math.max(0, pozycje.findIndex(p => p.o.selected)));
    };
    const zamknij = () => {
      box.classList.remove('otwarta');
      lista.classList.remove('otwarta');
      btn.setAttribute('aria-expanded', 'false');
    };
    // lista nie jest juz dzieckiem .pw, wiec klasa musi trafic i na nia
    const obserwuj = new MutationObserver(() =>
      lista.classList.toggle('otwarta', box.classList.contains('otwarta')));
    obserwuj.observe(box, { attributes: true, attributeFilter: ['class'] });
    addEventListener('scroll', () => box.classList.contains('otwarta') && zamknij(), { passive: true });
    addEventListener('resize', () => box.classList.contains('otwarta') && ustaw());
    const wybierz = i => {
      pozycje.forEach((p, j) => { p.o.selected = j === i; });
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      odswiez(); zamknij(); btn.focus();
    };

    btn.addEventListener('click', () => box.classList.contains('otwarta') ? zamknij() : otworz());
    for (const [i, p] of pozycje.entries()) {
      p.li.addEventListener('click', () => wybierz(i));
      p.li.addEventListener('mousemove', () => wskaz(i));
    }
    btn.addEventListener('keydown', e => {
      const otwarta = box.classList.contains('otwarta');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!otwarta) return otworz();
        wskaz(wskazana + (e.key === 'ArrowDown' ? 1 : -1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        otwarta ? wybierz(wskazana) : otworz();
      } else if (e.key === 'Escape' && otwarta) { e.preventDefault(); zamknij(); }
      else if (e.key === 'Tab' && otwarta) zamknij();
    });
    document.addEventListener('click', e => {
      if (!box.contains(e.target) && !lista.contains(e.target)) zamknij();
    });

    odswiez();
  }
})();
