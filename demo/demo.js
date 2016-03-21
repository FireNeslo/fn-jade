var template = require('./index.jade.js')
var create = require('virtual-dom').create
window.data = {
  things: ['From', 'the', 'other', 'side'],
  stuff: 3
}

var output = template.call(data, data)

console.log(output)

output.map(create).map(document.body.appendChild, document.body)

