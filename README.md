# Andre Rizzo - Personal Link Hub

Sito statico premium mobile-first compatibile con GitHub Pages.

## Quick edit guide

### Replace profile image
- Sovrascrivi il file `assets/andrerizzo_profile_img.jpg` con la tua nuova immagine (consigliato formato quadrato, almeno 900x900).
- Se cambi nome file, aggiorna i riferimenti in `index.html` e nei meta `og:image`.

### Edit links and grouped cards
- Modifica le card nella sezione `#links` di `index.html`.
- Ogni card usa `a.link-card` con:
  - titolo: `.card-title`
  - descrizione: `.card-subtitle`
  - tracking hook: attributo `data-track`

### Connect contact form later
- Form attuale: fallback `mailto` gestito in `js/main.js`.
- Per Formspree/Netlify Forms:
  - imposta `action` e `method` del form in `index.html`
  - mantieni i `name` esistenti (`fullName`, `phone`, `requestType`, `email`, `message`)
  - sostituisci/disattiva la logica `mailto` in `initContactForm()` dentro `js/main.js`.

### Deploy on GitHub Pages
- Push su branch pubblicato (es. `main`).
- In GitHub: `Settings > Pages`, seleziona branch/folder root.
- Il sito serve direttamente `index.html`, con pagine legali in `privacy.html` e `terms.html`.
