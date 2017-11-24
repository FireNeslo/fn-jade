var babel = require('rollup-plugin-babel')

module.exports =  {
  input: [ 'src/index.js', 'src/runtime.js' ],
  plugins: [ babel({presets: ['es2015-rollup']}) ],
  format: 'umd',
  name: 'vJade'
};
