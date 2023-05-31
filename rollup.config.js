import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

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
  plugins: [resolve({extensions: ['.js', '.cjs', '.mjs']}), json(), commonjs()]
};