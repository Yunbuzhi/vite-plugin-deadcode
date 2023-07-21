# vite-plugin-deadcode

Searching deadcode for vue-project.

First of all, your project must support command `$vite build`

## Install

```bash
$npm install vite-plugin-deadcode --save-dev
# or
$yarn add vite-plugin-deadcode -D
```

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite'
import deadcodePlugins from 'vite-plugin-deadcode'

export default defineConfig({
  plugins: [deadcodePlugins({
    inputDir: 'src',  // serarch path, default: src
    outDir: 'dist'  // the path where deadcode output, default: dist
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
Then `$npm run vite:deadcode`, When the process finish,

you'll see file `${outDir}/file.txt`,
<image src="https://raw.githubusercontent.com/Tyrion1024/vite-plugin-deadcode/dev/static/file_txt.jpg" style="margin: 10px"/>

And file `${outDir}/code.txt`.
<image src="https://raw.githubusercontent.com/Tyrion1024/vite-plugin-deadcode/dev/static/code_txt.jpg" style="margin: 10px"/>
