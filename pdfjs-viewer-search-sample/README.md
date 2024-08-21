# [excitation](../../) pdf.js viewer search sample

This sample embeds the default pdf.js web viewer application (as used in the Firefox browser) in an iframe, allowing users to work with excerpts within a powerful PDF reader that enables sophisticated searching.

## Embedding pdf.js

To use this sample you need to clone [pdf.js](https://github.com/mozilla/pdf.js) and build it, following the instructions in the project README.

```sh
# Clone the repo and cd in
git clone git@github.com:mozilla/pdf.js.git
cd pdf.js

# Install canvas to prevent it from building the older version from source
npm install canvas@next

# Install all dependencies of pdf.js
npm install

# Bundle pdf.js
npx gulp generic
```

Once you have built the project using `gulp generic` (I used `npx gulp generic`), copy the contents of the `build\generic` folder of that repo into the `public\pdfjs` folder.

## Building and running this sample

```zsh
cd pdfjs-viewer-search-sample
npm install
npm run dev
```

Then aim your browser at the indicated VITE dev endpoint, which for me is [http://localhost:5173/](http://localhost:5173/)

