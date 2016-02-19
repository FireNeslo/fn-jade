require('babel-core/register')
global.babelHelpers = require('babel-helpers')
var jade = require("jade")
var compiler = require("./compiler").default

module.exports = function fnJade(template, options) {
  options || (options = {})
  return jade.render(template, Object.assign({compiler, template}, options))
}

