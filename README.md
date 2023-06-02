# vite-plugin-deadcode

searching deadcode of vue-project for vite.

## Install

```bash
npm install vite-plugin-deadcode --save-dev
# or
yarn add vite-plugin-deadcode -D
```

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite'
import deadcodePlugins from 'vite-plugin-deadcode'

export default defineConfig({
  plugins: [deadcodePlugins({
    inputDir: 'src',
    outDir: 'dist',
    breakBuild: true,
  })]
})
```


```json
// package.json
{
  "scripts": {
    "vite:deadcode": "DEAD_CODE=true vite build"
  }
}
```

At last "npm run vite:deadcode", and waiting for the process complete.
