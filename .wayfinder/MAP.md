# MAP — powrót do starego designu formularza (strona główna)

Wzorzec: commit `0b6c3d2` (v2/index.html), sekcja `.kontakt`. Zrzut od klienta zgadza się
z tym commitem 1:1 — zweryfikowane renderem, nie z pamięci.

## D8: Dane jako pastylki, pola formularza jasne (korekta 2026-08-24)
- Decyzja: dane kontaktowe w białych pastylkach (mikroetykieta + wartość w jednym
  wierszu), a pola formularza na białym tle z ciemnym tekstem. Tafla szkła
  przyciemniona do `rgba(9,17,13,.46)`.
- Why: klient: „zamień to na pillsy" i „nie podoba mi się ten ciemny look w środku".
  Przy jasnych polach biała tafla dawała etykietom 3,7:1 — stąd przyciemnienie tafli,
  nie pól.
- Done looks like: 4 pastylki po 48 px wysokości; pola `background:#fff`, tekst
  `#0B0D0C`; etykiety i zgoda ≥ 4,5:1.

## D1: Przywracamy układ z 0b6c3d2
- Decyzja: sekcja kontaktu na stronie głównej wraca do układu: zdjęcie w tle na całą
  sekcję, lewa kolumna (nagłówek + lead + siatka danych 2×2 z wersalikowymi etykietami),
  prawa kolumna — karta formularza ze szkła. (Siatka danych zastąpiona pastylkami — patrz D8.)
- Why: klient wskazał ten wygląd zrzutem i słowami „wracamy do starego designu".
- Done looks like: sekcja ma `.kontakt-tlo`, `.kontakt-lewo` z `<dl class="kontakt-dane">`
  (4 pary dt/dd) i `.kontakt-form` z rozmyciem tła.

## D2: Czarny pasek za lewą kolumną znika
- Decyzja: usuwamy `.kontakt-lewo::before` — prostokątne przyciemnienie pod nagłówkiem
  i danymi. Zostaje wyłącznie miękka gradacja całej sekcji (`.kontakt::after`).
- Why: wprost z polecenia („bez tego czarnego paska"); to on tworzy widoczną krawędź.
- Done looks like: `getComputedStyle(.kontakt-lewo,'::before').backgroundImage === 'none'`.

## D3: Zdjęcie w tle = obecne, meczowe
- Decyzja: `img/kontakt-tlo.jpg` (to, które jest teraz w tle), nie stare `img/kontakt.png`.
- Why: „z tym zdjęciem co teraz jest w tle".
- Done looks like: `.kontakt-tlo` ma `src` kończący się na `kontakt-tlo.jpg` i wczytuje się.

## D4: Dane kontaktowe — nowe
- Decyzja: `info@championshealth.pl`, `Legionistów 3, Książenice`.
- Why: wybór klienta; dwie godziny temu wyrównaliśmy na te dane resztę serwisu, a rozjazd
  adresów na jednej stronie byłby realnym błędem.
- Done looks like: w sekcji nie ma ciągów `info@legia.pl` ani `Łazienkowska`.

## D5: Pola formularza — komplet z obecnej wersji
- Decyzja: 6 pól (imię, telefon, e-mail, temat zgłoszenia, preferowany specjalista,
  wiadomość) + wymagana zgoda RODO. Nie wracamy do czterech pól ze zrzutu.
- Why: wybór klienta; zgoda przy zbieraniu danych kontaktowych to wymóg, a listy wyboru
  są już zbudowane i przetestowane.
- Done looks like: 5 pól tekstowych/list + `textarea` + `input[type=checkbox][required]`;
  pusty formularz nie przechodzi walidacji.

## D6: Zmiana dotyczy wyłącznie strony głównej
- Decyzja: `kontakt.html` i podstrony zostają bez zmian.
- Why: polecenie mówi „na głównej stronie".
- Done looks like: `kontakt.html` dalej ma `.kt-sek` i białą kartę formularza.

## D7: Czytelność bez paska jest warunkiem, nie życzeniem
- Decyzja: po usunięciu paska tekst lewej kolumny musi mieć min. 4,5:1 wobec tła.
  Jeśli sama gradacja sekcji nie wystarczy — wzmacniamy gradację, nie przywracamy paska.
- Why: biały tekst na jasnym fragmencie zdjęcia bywa nieczytelny; to już się w tym
  projekcie zdarzyło kilka razy (nagłówek hero miał 1,02:1).
- Done looks like: zmierzony kontrast nagłówka, leadu i danych ≥ 4,5:1 na 1440/1280/390.

## D9: Liquid glass jako materiał całej sekcji kontaktu
- Decyzja: pastylki, tafla formularza i pola są z jednego materiału — przepuszczają
  i rozmywają zdjęcie, mają świetlną krawędź u góry i miękki cień. Hierarchię robi
  GRUBOŚĆ szkła, nie kolor: powierzchnie zewnętrzne (pastylki, tafla) przyciemniają
  tło filtrem `brightness` < 1, wewnętrzne (pola) je rozjaśniają.
- Why: klient poprosił o „full liquid glass", a wcześniejsze białe pola i biała
  tafla albo znikały na jasnym kadrze, albo wyglądały jak dziury. Przyciemnienie
  filtrem zamiast czarną płachtą zostawia kolor zdjęcia i to właśnie czyta się
  jako szkło. Rozjaśnianie jest bezpieczne tylko WEWNĄTRZ przyciemnionej tafli —
  pastylki z `brightness(1.7)` nad jasnym fragmentem zdjęcia wyszły białe i tekst
  na nich zniknął (zmierzone 1,05:1 na `kontakt.html`).
- Done looks like: `node v2/test-kontrast.mjs` zielony na obu stronach; jasność pola
  min. 1,5× większa od tafli obok.

## D10: Ta sama sekcja na `kontakt.html` dostaje ten sam materiał (uchyla D6)
- Decyzja: `kontakt.html` zmienia się razem ze stroną główną — tylko materiał
  (szkło zamiast białej karty), bez zmian układu, treści i pól.
- Why: to ten sam komponent w dwóch miejscach; zostawiony biały wyglądałby na
  pomyłkę. Zakres zmiany jest kosmetyczny i objęty tym samym pomiarem.
- Done looks like: `.kt-forma` i `.kt-pig` mają szkło; `test-kontrast.mjs` mierzy
  obie strony; układ, treść i lista pól bez zmian.

## D11: Pastylki zostają białe, szkło jest tylko materiałem formularza
- Decyzja: dane kontaktowe to białe pastylki z ciemnym tekstem (obie strony);
  szkło zostaje na tafli formularza i polach.
- Why: wybór klienta. Ma to też twardą zaletę: pełna biel trzyma kontrast
  niezależnie od tego, co akurat świeci na zdjęciu (5,1:1 i 19,5:1, te same na
  każdej szerokości i na obu stronach), i odcina blok danych od karty formularza.
- Done looks like: `.kontakt-dane div` i `.kt-pig` mają `background` `#fff`; pomiar
  kontrastu pastylek nie zmienia się między szerokościami.

## D12: Wjazd modułu kontaktu
- Decyzja: po wejściu sekcji w kadr moduł wjeżdża z rozjazdem — nagłówek znak po
  znaku (istniejący mechanizm `data-reveal`), potem lead, cztery pastylki po kolei,
  tafla formularza i na końcu pola. Ruch jedzie na `translate`/`scale`, nie na
  `transform`, żeby hover pastylki nie dziedziczył opóźnienia wjazdu.
- Why: prośba klienta („ładna animacja pojawiania się całego modułu"); rozjazd
  prowadzi wzrok od nagłówka do formularza zamiast wywalać wszystko naraz.
- Done looks like: `wjazd` w `test-hero.mjs` zielony; bez JS-u i przy
  `prefers-reduced-motion:reduce` moduł jest w pełni widoczny (AK27).

## D13: Bez obwódek — granicę robi wypełnienie, wnętrze pola ma odwrotną polaryzację
- Decyzja: tafla i pola tracą białą ramkę i świetlną krawędź. Pola stają się
  JASNYMI studzienkami z ciemnym tekstem; granicę wyznacza kontrast wypełnienia
  (4,6–7,0:1) plus miękkie zagłębienie u góry. Kwadracik zgody dostaje tę samą
  materię, z pełną bielą i ciemną fajką po zaznaczeniu.
- Why: prośba klienta („usuń tę białą ramkę"). Bez ramki granica pola musi wynikać
  z czegoś innego — WCAG 1.4.11 wymaga 3:1 dla elementów sterujących. Białe litery
  potrzebują ciemnego pola, a widoczna granica — jasnego; przy jednym kadrze obie
  rzeczy naraz się nie mieszczą, więc wnętrze pola ma odwrotną polaryzację niż tafla.
- Done looks like: `borderTopWidth` = 0 na tafli i polach; `granica` ≥ 3:1
  w `test-kontrast.mjs`; tekst w polu i podpowiedź listy ≥ 4,5:1.

## D14: Herb jako motyw tła sekcji etapów
- Decyzja: plik klienta `herb glass.png` ląduje w sekcji etapów jako duży motyw tła
  (szerokość 190vh), NAD przyciemnieniem sekcji, i płynie po skosie razem ze
  scrollem — 9vw w bok i 15vh w pionie na całym przejeździe, przy `rotate(-12deg)`.
  Krycie 0,34.
- Why: prośba klienta. Plik jest szkłem — wnętrze przezroczyste, widać tylko
  krawędzie — więc pod przyciemnieniem ginął; nad nim czyta się jako tafla herbu.
- Done looks like: `herb płynie` i blok `etapy` w `test-kontrast.mjs` zielone.
- Uwaga: to kształt herbu Legii. Zgoda klubu na użycie — po stronie klienta.

## D15: Kierunek lotu — prawy górny róg → lewy dolny (uzupełnia D14)
- Decyzja: herb powiększony do 230vh, przejazd 26vw w bok i 28vh w pionie,
  z prawego górnego rogu do lewego dolnego.
- Why: prośba klienta. Techniczna pułapka: przejazd musi stać PRZED `rotate`
  w `transform`, bo składanie idzie od prawej — po obrocie herb leciałby wzdłuż
  własnego skosu, nie po przekątnej ekranu.
- Done looks like: przy wjeździe sekcji herb jest w prawej górnej części kadru,
  przy wyjeździe w lewej dolnej; kontrast tekstu dalej ≥ 4,5:1.

## Out of bounds
- `blog.html`, `zespol.html`, `uslugi*`, stopka — nie ruszamy.
- `kontakt.html` — tylko materiał sekcji formularza (D10); układ, treść i pola bez zmian.
- Hero, talia kart, sekcja etapów, zespół, FAQ — nie ruszamy.
- Żadnych nowych pól, nowych sekcji ani zmian treści poza danymi z D4.
- Bez zmian w wysyłce formularza (dalej wersja demonstracyjna, bez backendu).
