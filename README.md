# THE FINALS Rank Overlay V1

Overlay pronto per OBS e TikTok LIVE Studio.

## Link esempio dopo il deploy

Dopo averlo caricato su Vercel, userai un link simile:

```text
https://TUO-PROGETTO.vercel.app/?embarkIdName=erdragon32&embarkIdNumber=2577
```

Oppure:

```text
https://TUO-PROGETTO.vercel.app/?player=erdragon32%232577
```

## Parametri utili

- `embarkIdName=erdragon32`
- `embarkIdNumber=2577`
- `player=erdragon32%232577`
- `leaderboard=s10`
- `platform=crossplay`
- `textColor=ff0015ff`
- `backgroundColor=000000ff`
- `borderColor=d0021bff`
- `borderWidth=5`
- `refresh=60`

## Esempio con colori

```text
https://TUO-PROGETTO.vercel.app/?embarkIdName=erdragon32&embarkIdNumber=2577&textColor=ff0015ff&backgroundColor=000000ff&borderColor=d0021bff&borderWidth=5&leaderboard=s10
```

## OBS

Aggiungi:

- Source: Browser
- Width: 470
- Height: 160
- URL: il link del tuo overlay

## TikTok LIVE Studio

Aggiungi una sorgente tipo:

- Link Source
- Web Source
- Browser Source

e incolla il link del tuo overlay.

## Nota importante

Funziona solo se il giocatore è presente nella leaderboard pubblica.
Di solito i dati pubblici coprono la top leaderboard disponibile.
