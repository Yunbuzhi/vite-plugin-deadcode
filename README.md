# vite-plugin-deadcode

searching deadcode for vue-project.

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
    inputDir: 'src',  // 检查目录，默认为src
    outDir: 'dist'  // deadcode输出目录，默认为dist
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

"npm run vite:deadcode".