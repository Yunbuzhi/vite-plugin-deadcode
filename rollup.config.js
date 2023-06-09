import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';


export default {
  input: "./src/index.js", // 入口文件
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
    },
    {
      file: "dist/index.mjs",
      format: "es"
    }
  ],
  plugins: [
    resolve(),
    json(),
    commonjs(),
    terser()
  ]
};