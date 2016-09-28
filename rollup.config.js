var babel = require('rollup-plugin-babel')

module.exports =  {
  entry: 'src/index.js',
  plugins: [ babel({presets: ['es2015-rollup']}) ],
  moduleName: 'vJade',
  format: 'umd'
};
