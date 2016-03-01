var template = require('./index.jade.js')
var create = require('virtual-dom').create
window.data = {user: {}}

var output = template(data)

console.log(output)

document.body.appendChild(create(output[0]))
