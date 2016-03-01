var jade = require('..')
var fs = require('fs')


var file = fs.readFileSync(__dirname+'/index.jade')


var output = jade(file, {pretty: true})


fs.writeFileSync(
  __dirname+'/index.jade.js',
  'var $ = require("../runtime");module.exports= '+output)
