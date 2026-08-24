# ANSWER KEY — powrót do starego designu formularza

**Stan: 25/25 zaliczone** (przegląd 2026-08-24, weryfikacja wykonana, nie deklarowana).

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
- [x] AK17 (zmieniony, D10): `kontakt.html` ma ten sam materiał co strona główna — VERIFY: `kontakt.html` dalej ma `.kt-sek` i `.kt-forma` (bez `.kontakt-form`), a `.kt-forma` i `.kt-pig` mają `backdropFilter` z `blur` i `brightness` < 1
- [x] AK18: reszta strony bez regresji — VERIFY: `node v2/test-hero.mjs` kończy się 36 × „ok" i bez linii „BŁĄD"
- [x] AK19: brak nowych sekcji i pól ponad spec — VERIFY: w `#kontakt` nie ma elementów `.kt-pig`, `.kon-baner` ani dodatkowych `input` poza wymienionymi w AK10
- [x] AK20: nagłówek lewej kolumny mieści się w dwóch wierszach na desktopie (jak na zrzucie) — VERIFY: przy 1440 i 1280 `h2.getBoundingClientRect().height / lineHeight` zaokrąglone = 2
- [x] AK21: pola są jaśniejsze od tafli, na której leżą — VERIFY: piksel w środku pola vs piksel tafli obok: jasność pola min. 1,5× większa (pomiar na 1440, 1280, 390; wynik 2,3×)
- [x] AK22: autouzupełnianie nie wstawia własnego tła — VERIFY: w obu arkuszach jest reguła `input:-webkit-autofill` z `-webkit-box-shadow` w kolorze zmierzonym z wyrenderowanego szkła (`rgb(100,92,91)`) i `-webkit-text-fill-color:#fff`
- [x] AK23: cały tekst sekcji ≥ 4,5:1 (tytuł karty ≥ 3:1) na obu stronach — VERIFY: `node v2/test-kontakt.mjs` kończy się kodem 0; mierzy tytuł, etykietę, wpisany tekst, listę wyboru, zgodę RODO i obie linie pastylki na 1440/1280/390 dla `index` i `kontakt.html`
- [x] AK24: bez rozmycia tła sekcja dalej jest czytelna — VERIFY: w obu arkuszach jest `@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px)))` ustawiający pełne `background-color` tafli i pastylek
- [x] AK25: pomiar kontrastu jest odporny na animacje i na krawędź szkła — VERIFY: `test-kontakt.mjs` zamraża animacje przed zrzutami i wcina pudełko pola o 15 px; trzy kolejne uruchomienia dają ten sam wynik
