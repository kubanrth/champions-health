# Legia Medical (Champions Health) — strona internetowa

Klinika medycyny sportowej i rehabilitacji przy Legii Warszawa.
Docelowy adres: `medical.legia.com`. Podgląd: https://champions-health.vercel.app

## Co to jest

Statyczna strona: HTML + CSS + JavaScript, bez frameworków, bez zależności i bez
kroku budowania. Każda podstrona to jeden plik `.html` ze stylami w środku;
wspólne zachowania (nawigacja, menu mobilne, pop-up „Umów wizytę", listy wyboru,
odsłanianie tekstu) są w `v2/wspolne.js`.

```
v2/
  index.html                 strona główna
  uslugi.html                zakres opieki (lista usług)
  uslugi/
    medycyna-sportowa.html   ┐
    ortopedia.html           │
    fizjoterapia.html        │ podstrony usług
    dietetyka.html           │
    trening.html             │
    edukacja.html            ┘
  zespol.html                zespół
  blog.html                  lista wpisów
  wpis.html                  przykładowy wpis
  kontakt.html               kontakt: mapa, dojazd, formularz
  wspolne.js                 wspólny skrypt
  img/                       zdjęcia i logo (WebP + SVG)
vercel.json                  przekierowanie / → /v2/ i nagłówki HTTP
```

Fonty ładowane z Google Fonts (Inter, Archivo, Mulish) i Fontshare — bez plików lokalnych.

## Uruchomienie lokalnie

Dowolny serwer plików statycznych, np.:

```
python3 -m http.server 8000
```

i otworzyć `http://localhost:8000/v2/`.

## Wdrożenie

Strona jest hostowana na Vercel jako projekt statyczny (bez build stepa).
`vercel.json` ustawia przekierowanie z `/` na `/v2/` oraz nagłówki bezpieczeństwa
(CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `nosniff`).

**Przed publikacją pod docelową domeną** usunąć nagłówek `X-Robots-Tag: noindex, nofollow`
z `vercel.json` — na czas prac blokuje indeksowanie przez wyszukiwarki.

## Do uzupełnienia po stronie kliniki

- **Formularz „Umów wizytę"** ma walidację w przeglądarce, ale nie wysyła danych —
  wysyłkę trzeba podpiąć do własnego backendu / CRM (pola: `imie`, `tel`, `email`,
  `temat`, `specjalista`, `tresc`, zgoda `kt-rodo`).
- **Ceny, liczby i czasy** (np. czas do diagnostyki) są poglądowe — do potwierdzenia.
- **Zdjęcia zespołu** — do podmiany na sesję zdjęciową; zdjęcia hero i kart usług
  są ilustracyjne (wygenerowane) i można je zastąpić własnymi.
- **Polityka prywatności** — zgoda w formularzu odwołuje się do dokumentu, którego
  strona jeszcze nie zawiera; dodać podstronę i link.
- **Nazwa** — logo pokazuje „Legia Medical", a tytuły stron, stopka, adres e-mail
  i treści mówią „Champions Health"; przy zmianie nazwy przejść przez teksty.
