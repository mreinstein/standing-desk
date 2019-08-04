import resolve from 'rollup-plugin-node-resolve'
 

export default {
  input: 'client.js',
  output: {
    file: 'public/bundle.js',
    format: 'iife',
    name: 'deskClient'
  },
  plugins: [
    resolve()
  ]
}
