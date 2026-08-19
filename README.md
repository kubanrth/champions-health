# Champions Health — prototyp strony głównej

Klinika medycyny sportowej i rehabilitacji przy Legii Warszawa.
Prototyp redesignu strony `champions-health-gold.vercel.app` (docelowo `medical.legia.com`).

## Co to jest

Jeden plik `index.html`, bez zależności i bez build stepa. Zdjęcia w `img/`.

Układ, wymiary, skala typograficzna i krzywe animacji są **zmierzone z komponentów Framera**,
nie dobrane na oko:

| Sekcja | Źródło | Zmierzone |
|---|---|---|
| Cała strona | Aura Healthtech App (INSAIM DESIGN) | siatka 1320, skala typograficzna, promienie, parallax hero 0,4× |
| Zakres opieki | Fluid Mosaic (DariStudio) | soczewka `w(d) = 0,415 + exp(−(d/0,340)²)` |
| Ścieżka pacjenta | Workflow cards (Nirmiti Kale) | karty 240/264, sprężyna ζ=0,78 ω=21 rad/s |
| Zespół | Team Member Carousel (felix strobel) | karty 340×500 / 360×520, sprężyna ω=18,5 rad/s |
| FAQ | FAQ Flow (Darius Pasecinic) | pozycje 900×80 r24, sprężyna ζ=0,79 ω=7,14 rad/s |
| Nawigacja | Floating Pill Nav (Omer Mirza) | wskaźnik dopasowany do pudełka aktywnej pozycji |

Kolorystyka to barwy Legii na kremowej bazie Aury. Pełna specyfikacja i pułapki:
`notes/champions-health.md` w repozytorium roboczym.

## Uruchomienie lokalnie

```
python3 -m http.server 8000
```

## Status treści

Prototyp na potrzeby prezentacji. **Ceny, czas diagnostyki i część zdjęć są poglądowe**
i wymagają potwierdzenia przez klienta. Zdjęcia zespołu w przygotowaniu — na obecnej
stronie klienta wszystkie 14 osób ma podstawione te same dwa portrety.
