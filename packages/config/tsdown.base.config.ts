import { defineConfig } from 'tsdown'
import { visualizer } from 'rollup-plugin-visualizer'

const plugins = []

if (process.env.ANALYZE === 'true') {
  plugins.push(visualizer({
    open: true,
    filename: 'stats.html',
    template: 'treemap',
  }))
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  plugins,
})
