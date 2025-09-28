import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

export default defineConfig([
  {
    input: 'src/github-download/index.js',
    output: {
      file: 'dist/github-download.js',
      format: 'esm',
      name: 'GithubDownload'
    },
    plugins: [
      resolve(),
      terser()
    ]
  }
])
