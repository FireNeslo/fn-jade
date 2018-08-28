var babel = require('rollup-plugin-babel')

module.exports =  {
  input: [ 'src/index.js', 'src/runtime.js' ],
  plugins: [ babel({presets: [
    ['@babel/preset-env', {
      modules: false
    }]
  ]}) ],
  format: 'umd',
  name: 'vJade'
};
