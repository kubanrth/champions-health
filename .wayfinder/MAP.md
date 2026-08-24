# MAP — powrót do starego designu formularza (strona główna)

Wzorzec: commit `0b6c3d2` (v2/index.html), sekcja `.kontakt`. Zrzut od klienta zgadza się
z tym commitem 1:1 — zweryfikowane renderem, nie z pamięci.

## D1: Przywracamy układ z 0b6c3d2
- Decyzja: sekcja kontaktu na stronie głównej wraca do układu: zdjęcie w tle na całą
  sekcję, lewa kolumna (nagłówek + lead + siatka danych 2×2 z wersalikowymi etykietami),
  prawa kolumna — karta formularza ze szkła.
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

## Out of bounds
- `kontakt.html`, `blog.html`, `zespol.html`, `uslugi*`, stopka — nie ruszamy.
- Hero, talia kart, sekcja etapów, zespół, FAQ — nie ruszamy.
- Żadnych nowych pól, nowych sekcji ani zmian treści poza danymi z D4.
- Bez zmian w wysyłce formularza (dalej wersja demonstracyjna, bez backendu).
