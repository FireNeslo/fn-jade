var babel = require('rollup-plugin-babel')

module.exports =  {
  entry: 'src/index.js',
  plugins: [ babel() ],
  moduleName: 'vJade',
  format: 'umd'
};
