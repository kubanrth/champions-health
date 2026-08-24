# ANSWER KEY — powrót do starego designu formularza

**Stan: 31/31 zaliczone** (przegląd 2026-08-24, weryfikacja wykonana, nie deklarowana).

- [x] AK1: sekcja `#kontakt` na stronie głównej ma zdjęcie w tle `.kontakt-tlo` — VERIFY: `document.querySelector('#kontakt .kontakt-tlo')` niepuste i `complete && naturalWidth>0`
- [x] AK2: zdjęcie w tle to `kontakt-tlo.jpg` — VERIFY: `.kontakt-tlo` ma `src` kończący się `kontakt-tlo.jpg`
- [x] AK3: lewa kolumna ma nagłówek „Zacznij od rozmowy z koordynatorem" — VERIFY: `.kontakt-lewo h2` textContent równy tej frazie
- [x] AK4: lead pod nagłówkiem obecny — VERIFY: `.kontakt-lead` textContent zaczyna się od „Piętnaście minut"
- [x] AK5: dane w czterech pastylkach — VERIFY: `.kontakt-dane div` = 4, każda o wysokości 48 px i `border-radius` 999px; `.kontakt-dane dt` = 4 i `dd` = 4
- [x] AK6: mikroetykiety w pastylkach wersalikami — VERIFY: `getComputedStyle(.kontakt-dane dt)` → `textTransform==='uppercase'`, `fontSize==='11px'`
- [x] AK7: czarny pasek za lewą kolumną usunięty — VERIFY: `getComputedStyle(.kontakt-lewo,'::before').backgroundImage === 'none'`
- [x] AK8: tafla formularza ze szkła — VERIFY: `getComputedStyle(.kontakt-form)` → `backdropFilter` zawiera `blur` i `brightness` mniejszy od 1 (szkło przyciemnia tło filtrem, nie czarną płachtą), `borderRadius==='26px'`, tło półprzezroczyste białe
- [x] AK9: dane kontaktowe nowe — VERIFY: `#kontakt` innerHTML zawiera `info@championshealth.pl` i `Legionistów 3, Książenice`, NIE zawiera `info@legia.pl` ani `Łazienkowska`
- [x] AK10: komplet 6 pól + zgoda — VERIFY: w `#kontakt` 3 × `input[type=text|tel|email]`, 2 × `select`, 1 × `textarea`, 1 × `input[type=checkbox][required]`
- [x] AK11: pusty formularz nie przechodzi — VERIFY: klik w `button[type=submit]`, komunikat w `[role=status]` pasuje do `/Uzupełnij|Zaznacz/`
- [x] AK12: wypełniony formularz daje potwierdzenie — VERIFY: wypełnić 3 pola, wybrać obie listy, zaznaczyć zgodę, kliknąć wyślij → komunikat pasuje do `/demonstracyjny/`
- [x] AK13: kontrast tekstu lewej kolumny ≥ 4,5:1 — VERIFY: zrzut z tekstem i zrzut z `color:transparent`, maks. jasność tła pod `h2`, `.kontakt-lead`, `.kontakt-dane dd`; policzyć kontrast wobec bieli na 1440, 1280 i 390
- [x] AK14: układ dwukolumnowy na desktopie, jednokolumnowy na wąskim — VERIFY: przy 1440 `.kontakt-form` left > `.kontakt-lewo` left; przy 390 `gridTemplateColumns` to jedna wartość
- [x] AK15: brak przewijania poziomego — VERIFY: `scrollWidth - innerWidth <= 0` na 1440, 1280, 820, 390
- [x] AK16: konsola bez błędów i bez 404 — VERIFY: nasłuch `pageerror`, `console.error` i odpowiedzi ≥ 400 przy wejściu na stronę główną
- [x] AK17 (zmieniony, D10+D11): `kontakt.html` ma ten sam materiał co strona główna — VERIFY: `kontakt.html` dalej ma `.kt-sek` i `.kt-forma` (bez `.kontakt-form`); `.kt-forma` ma `backdropFilter` z `blur` i `brightness` < 1, a `.kt-pig` jest białe (`backgroundColor === 'rgb(255, 255, 255)'`), tak samo jak `.kontakt-dane div`
- [x] AK18: reszta strony bez regresji — VERIFY: `node v2/test-hero.mjs` kończy się 36 × „ok" i bez linii „BŁĄD"
- [x] AK19: brak nowych sekcji i pól ponad spec — VERIFY: w `#kontakt` nie ma elementów `.kt-pig`, `.kon-baner` ani dodatkowych `input` poza wymienionymi w AK10
- [x] AK20: nagłówek lewej kolumny mieści się w dwóch wierszach na desktopie (jak na zrzucie) — VERIFY: przy 1440 i 1280 `h2.getBoundingClientRect().height / lineHeight` zaokrąglone = 2
- [x] AK21 (zmieniony, D13): granicę pola robi wypełnienie, nie ramka — VERIFY: sprawdzenie `granica` w `test-kontrast.mjs`: piksel wnętrza pola vs piksel tafli tuż nad nim ≥ 3:1 (WCAG 1.4.11 dla elementów sterujących); wynik 4,6–7,0:1 na obu stronach
- [x] AK22: autouzupełnianie nie wstawia własnego tła — VERIFY: w obu arkuszach jest reguła `input:-webkit-autofill` z `-webkit-box-shadow` w kolorze zmierzonym z wyrenderowanego szkła (`rgb(168,166,166)`) i `-webkit-text-fill-color:#0B0D0C`
- [x] AK23: cały tekst sekcji ≥ 4,5:1 (tytuł karty ≥ 3:1) na obu stronach — VERIFY: `node v2/test-kontrast.mjs` kończy się kodem 0; mierzy tytuł, etykietę, wpisany tekst, listę wyboru, zgodę RODO i obie linie pastylki na 1440/1280/390 dla `index` i `kontakt.html`
- [x] AK24: bez rozmycia tła sekcja dalej jest czytelna — VERIFY: w obu arkuszach jest `@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px)))` ustawiający pełne `background-color` tafli i pastylek
- [x] AK26: cały moduł wjeżdża z rozjazdem, nie pojawia się skokiem — VERIFY: bez klasy `.pokaz` (przy wyłączonych przejściach) `.kontakt-form` ma `opacity` < .05; po wejściu sekcji w kadr `.kontakt-form`, `.kontakt-pole`, `.kontakt-dane div` i `.kontakt-lead` mają `opacity` > .9; sprawdzenie `wjazd` w `test-hero.mjs`
- [x] AK27: stan początkowy wjazdu nie może ukryć danych kontaktowych na stałe — VERIFY: `test-kontrast.mjs` wchodzi na stronę bez JS-u i z `prefers-reduced-motion:reduce`; w obu przypadkach cztery elementy modułu mają `opacity` równe 1
- [x] AK28: żadnych białych obwódek wokół tafli i pól — VERIFY: `getComputedStyle` dla `.kontakt-form`, `.kt-forma` oraz pól: `borderTopWidth === '0px'`; w `boxShadow` tafli nie ma świetlnej krawędzi (`inset 0 1px 0`), a pola mają zagłębienie (`inset` z ujemnym rozmyciem)
- [x] AK29: kwadracik zgody jest własny, nie systemowy — VERIFY: `getComputedStyle('.kontakt-zgoda input').appearance === 'none'`, promień 7 px, po zaznaczeniu tło `rgb(255, 255, 255)` z fajką w `background-image`; to samo dla `.kt-zgoda input`
- [x] AK30: herb Legii jest motywem tła sekcji etapów i płynie po skosie ze scrollem — VERIFY: `.etapy-herb` istnieje, ma `background-image` z `herb-glass.png`, szerokość ≥ 150vh; sprawdzenie `herb płynie` w `test-kontrast.mjs`: `--h` zmienia się o > 0,15 między górą a dołem przejazdu
- [x] AK31: herb nie psuje czytelności sekcji — VERIFY: blok `etapy` w `test-kontrast.mjs`: nagłówek, tytuł wiersza i etykieta ≥ 4,5:1 na 1440 i 390, mierzone w czterech miejscach przejazdu (bez herbu 10:1, z herbem przy `opacity:.5` spadało do 3,9:1 — stąd .34)
- [x] AK25: pomiar kontrastu jest odporny na animacje i na krawędź szkła — VERIFY: `test-kontrast.mjs` zamraża animacje przed zrzutami i wcina pudełko pola o 15 px; trzy kolejne uruchomienia dają ten sam wynik
