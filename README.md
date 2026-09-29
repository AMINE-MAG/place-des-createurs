# Place des Créateurs — Site vitrine

Site one-page HTML/CSS/JS vanilla (aucun framework) pour l'événement **Place des Créateurs** — 12 & 13 décembre 2026, Cowool Grenoble.

## Structure du projet

    /
    ├── index.html
    ├── style.css
    ├── script.js
    ├── assets/
    │   ├── data.json         ← TOUT le contenu éditable
    │   ├── images/           (vide — le site est typographique + SVG inline)
    │   ├── videos/           (vide — prêt si besoin plus tard)
    │   └── icons/            (vide — les icônes sont inline dans index.html)
    └── README.md

---

## 1. Modifier le contenu sans toucher au code

**Tout passe par `assets/data.json`.** Ce fichier contient trois grandes parties :

- `config` — liens, email, date cible du compte à rebours
- `i18n.fr` — tout le texte français
- `i18n.en` — tout le texte anglais

Les clés se correspondent d'une langue à l'autre. Si vous modifiez une clé en français, modifiez la même en anglais.

### Changer les tarifs des stands

Dans `i18n.fr.stands.list` (et `i18n.en.stands.list`) :

    {
      "name": "Stand standard",
      "surface": "3 m²",
      "price": "X €",
      "features": ["Table", "2 chaises", "Électricité"]
    }

Remplacez `"X €"` par le vrai prix (par exemple `"180 €"`). Ajoutez ou retirez des lignes dans `features` au besoin.

### Ajouter ou modifier un exposant

Dans `i18n.fr.exhibitors.list` :

    {
      "icon": "bread",
      "name": "[Exposant 01]",
      "specialty": "[Boulangerie]"
    }

Icônes disponibles : `bread`, `honey`, `cheese`, `olive`, `chili`, `jar`. Pour en ajouter une, voir le sprite `<svg>` en haut de `index.html` (chercher `ico-bread`).

### Modifier le lien du formulaire de candidature

Dans `config` en haut du fichier :

    "formUrl": "https://forms.gle/VOTRE-LIEN"

### Modifier les autres liens

Toujours dans `config` :

- `mapsUrl` — lien Google Maps
- `instagramUrl` / `facebookUrl` — réseaux sociaux
- `email` — adresse de contact
- `legalUrl` / `privacyUrl` — mentions légales et politique de confidentialité
- `countdownTarget` — date cible du compte à rebours au format ISO
- `defaultLang` — `"fr"` par défaut

---

## 2. Compte à rebours

Il cible la date ISO dans `config.countdownTarget` :

    "countdownTarget": "2026-12-12T10:00:00+01:00"

Le `+01:00` correspond à l'heure d'hiver de Paris (CET). Si la date ou l'heure change, mettez à jour cette valeur. Le format est `AAAA-MM-JJTHH:MM:SS+HH:MM`.

---

## 3. Langue et traduction

- Langue par défaut : `fr` (défini par `config.defaultLang`).
- Le choix de l'utilisateur est conservé dans le navigateur (`localStorage`, clé `pdc-lang`).
- Le sélecteur FR/EN est en haut à droite du header.
- Pour ajouter une langue : dupliquez le bloc `fr` dans `i18n`, renommez-le (par exemple `es`), traduisez, puis ajoutez un bouton dans le header (`.lang__btn` avec `data-lang="es"`).

---

## 4. Remplacer le favicon

Le favicon est en SVG inline dans le `<head>` de `index.html` :

    <link rel="icon" href="data:image/svg+xml,...">

Pour utiliser un fichier externe, remplacez la data-URI par `assets/icons/favicon.svg`.

---

## 5. Image de partage (Open Graph)

Ajoutez une image `assets/images/og-place-des-createurs.jpg` au format **1200 × 630 px**, puis vérifiez la balise dans `index.html` :

    <meta property="og:image" content="assets/images/og-place-des-createurs.jpg">

Cette image apparaît lorsqu'un lien vers le site est partagé sur les réseaux sociaux ou dans une messagerie.

---

## 6. Accessibilité

- Contrastes AA vérifiés sur toutes les combinaisons utilisées.
- Navigation clavier complète, focus visible sur tous les éléments interactifs.
- `prefers-reduced-motion` respecté : toutes les animations sont neutralisées si l'utilisateur l'a demandé dans son système.
- Skip link « Aller au contenu » en tête de page.
- Attributs ARIA sur les onglets, le menu burger, le compte à rebours et les boutons icônes.

---

## 7. Performance

- Aucun framework, aucune dépendance externe en dehors de Google Fonts.
- Icônes en SVG inline : zéro requête réseau supplémentaire.
- CSS et JS servis en un seul fichier chacun.
- Si vous ajoutez des photos réelles, pensez à `loading="lazy"` sur celles situées sous la ligne de flottaison.

---

## 8. Servir le site en local

À cause du `fetch()` qui charge `data.json`, il faut un petit serveur local. L'ouverture directe via `file://` ne fonctionnera pas.

    python3 -m http.server 8000
    # puis ouvrir http://localhost:8000

Ou avec Node.js :

    npx serve .

---

## 9. Ce qu'il reste à compléter avant mise en ligne

- [ ] Remplacer les `X €` / `Y €` / `Z €` par les vrais tarifs des stands
- [ ] Coller l'URL du formulaire de candidature dans `config.formUrl`
- [ ] Compléter les `[À COMPLÉTER]` dans `i18n.fr` et `i18n.en` :
    - accès (tram, bus, parking)
    - accessibilité PMR
    - ateliers et animations
    - critères d'éligibilité supplémentaires
- [ ] Remplacer les exposants placeholders par les vrais noms une fois la sélection faite
- [ ] Ajouter les mentions légales et la politique de confidentialité (ou lier vers des pages existantes)
- [ ] Ajouter l'image Open Graph (`assets/images/og-place-des-createurs.jpg`, 1200×630)
- [ ] Vérifier que le lien Google Maps pointe bien sur l'adresse exacte
- [ ] Compléter ou supprimer les réseaux sociaux si non utilisés

---

## 10. Mise en ligne

Le site est entièrement statique. Il peut être déployé sur n'importe quel hébergeur de fichiers :

- **Netlify / Vercel** : glisser-déposer le dossier complet.
- **GitHub Pages** : pousser le dossier sur une branche `gh-pages`.
- **Hébergeur classique (OVH, Infomaniak, etc.)** : envoyer les fichiers par FTP à la racine du domaine.

Aucune configuration serveur particulière n'est nécessaire, aucun backend, aucune base de données.

---

## 11. Support

Pour toute modification structurelle (nouvelle section, changement de design), adressez-vous à la personne qui a développé le site. Pour toute modification de **contenu** (textes, tarifs, exposants, liens), le fichier `assets/data.json` suffit et ne nécessite aucune connaissance en programmation.
