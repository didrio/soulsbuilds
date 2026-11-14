# Legacy data scripts (2022, reference only)

These scripts produced the JSON in `src/data/` in April 2022. They are kept so T7 (game data v2) can see
how each file was shaped. **They no longer run** and are excluded from lint, typecheck and formatting:

- `get*.js`: scraped tables from rankedboost.com with `node-fetch` + `cheerio` (ESM imports, but the package
  was never `"type": "module"`; cheerio 1.0 also dropped the default export; the site's markup has changed).
  `getWeapons.js` / `getShields.js` also fetched each item's detail page for stat requirements.
- `sort*.js`: CommonJS post-processing that built the name-keyed lookups (`armorIndexed.json`,
  `skillsIndexed.json`, `weaponsAndShields.json`).
- `downloadImages.js`: a browser-console snippet used on rankedboost pages to download item icons into
  `public/assets/` (compressed by hand afterwards).
- `buildDataJson.js` + `importData.js`: an abandoned plan to push the data into Firestore with a service-account
  key. Don't revive it: game data stays static in the bundle, and keys never live in the repo.
- `firebaseConfig.js`: an old copy of the public web config, now in `src/firebase.js`.

Do not add a new data or image source without the owner's OK (licensing). See `docs/data.md`.
