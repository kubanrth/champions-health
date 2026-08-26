# Legia Medical - strona www

Statyczna strona kliniki (HTML/CSS/JS, bez frameworków i bez builda).
Podgląd: https://champions-health.vercel.app - docelowo medical.legia.com.

## Struktura

Wszystko siedzi w `v2/`. Każda podstrona to osobny plik html ze stylami w środku,
wspólne rzeczy (nawigacja, menu na telefonie, popup "Umów wizytę", listy wyboru w formularzu)
są w `wspolne.js`.

- `index.html` - strona główna
- `uslugi.html` + `uslugi/*.html` - zakres opieki i 6 podstron usług
- `zespol.html`
- `blog.html`, `wpis.html` - lista wpisów i przykładowy wpis
- `kontakt.html` - mapa, dojazd, formularz
- `img/` - zdjęcia (webp) i logo (svg)

Fonty ciągną się z Google Fonts i Fontshare, nie ma ich w repo.

## Uruchomienie

Wystarczy dowolny serwer statyczny, np. `python3 -m http.server 8000` w katalogu repo
i wejść na http://localhost:8000/v2/

## Deploy

Vercel, projekt statyczny. `vercel.json` robi redirect z `/` na `/v2/` i dokłada nagłówki
(CSP, X-Frame-Options itd.).

Uwaga: jest tam też `X-Robots-Tag: noindex` - na czas prac strona nie jest indeksowana.
Przy przejściu na docelową domenę trzeba tę linijkę usunąć.

CSP w `vercel.json` przepuszcza tylko własną domenę, Google Fonts i mapę Google. Jak podepniecie
wysyłkę formularza do zewnętrznego serwisu albo zdjęcia z innego CDN-u, trzeba dopisać ten host
do `form-action` / `connect-src` / `img-src`, inaczej przeglądarka to zablokuje.

## Co zostało do zrobienia po stronie kliniki

- formularz "Umów wizytę" ma walidację, ale nigdzie nie wysyła - trzeba podpiąć backend / CRM
  (pola: imie, tel, email, temat, specjalista, tresc + checkbox zgody)
- ceny, liczby i czasy w treści są przykładowe, do potwierdzenia
- zdjęcia zespołu i zdjęcia na hero / kartach usług są ilustracyjne, do podmiany na własne
- zgoda w formularzu odsyła do polityki prywatności, której jeszcze nie ma - dodać podstronę i link
- logo mówi "Legia Medical", a tytuły, stopka i mail dalej "Champions Health" - przy zmianie nazwy
  przejść po tekstach
