require('babel-register')({presets: ['es2015', 'stage-0']})
console.log('babel register done')
var fnJade = require('../src').default
var through = require('through2')
var path = require('path')
var directory = path.resolve(__dirname, '../src')

module.exports = function fnJadeify(file, options) {
  if(file.indexOf('.jade') < 0) return through()
  return through(function(buffer, enc, cb) {
    var template = buffer.toString()
    var $ = `var $ = require('${directory}/runtime')\n`
    try {
      console.log("Module stuff")
      var module = $ + 'module.exports = ' + fnJade(template, {
        filename: file,
        pretty: true
      })
      console.log("Module", module)
    } catch (err) {
      console.log(file)
      console.log(err)
    }
    this.push(new Buffer(module))
    cb()
  })
}
