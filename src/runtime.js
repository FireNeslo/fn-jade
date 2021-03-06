import {VNode, VText} from "virtual-dom"
import kebabize from './kebabize'

function EventHook(event, callback) {
  this.event = event
  this.callback = callback
}
EventHook.prototype.hook = function hook(node) {
  node.addEventListener(this.event, this.callback)
}
EventHook.prototype.unhook = function hook(node) {
  node.removeEventListener(this.event, this.callback)
}

function PropertyHook(property, value) {
  this.property = property
  this.value = value
}
PropertyHook.prototype.hook = function hook(node) {
  node[this.property] = this.value
  if(node.render) node.render()
};


function classHelper(className) {
  if(Array.isArray(className)) {
    return className.map(classHelper).join(' ')
  }
  if(typeof className === 'object') {
    return Object.keys(className).filter(c => className[c]).join(' ')
  }
  return className
}

function styleHelper(styles) {
  if(!styles) return
  if(Array.isArray(styles)) {
    return styles.map(styleHelper).join(';')
  }
  if('object' == typeof styles) {
    return Object.keys(styles).map((key)=> {
      return kebabize(key) + ':' + styles[key]
    }).join(';')
  }
  return styles
}

export default function element(tag, attributes, children) {
  var properties = {attributes}
  if(!Array.isArray(children)) {
    children = [children]
  }
  if(attributes.key) {
    properties.key = attributes.key
  }
  if(attributes.class) {
    attributes.class = classHelper(attributes.class)
  }
  if(attributes.style) {
    attributes.style = styleHelper(attributes.style)
  }
  var ret = []
  for(var i = 0; i < children.length; i++) {
    var node = children[i]
    if(node == null) continue
    var type = typeof node
    if(type === 'object' && !(node.type === "VirtualNode")) {
      if(attributes['[innerHTML]'] && node['[innerHTML]']) {
        attributes['[innerHTML]'] += node['[innerHTML]']
        delete node['[innerHTML]']
      }
      Object.assign(attributes, node)
      continue
    }
    ret.push(type !== 'object' ? new VText(node) : node)
  }
  for(var attr in attributes) {
    if(attr[0] === '[') {
      properties[attr] = new PropertyHook(attr.slice(1, -1), attributes[attr])
      delete attributes[attr]
    }
    if(attr[0] === '*') {
      properties[attr] = attributes[attr]
      delete attributes[attr]
    }
    if(attr[0] === '(') {
      properties[attr] = new EventHook(attr.slice(1, -1), attributes[attr])
      delete attributes[attr]
    }
    if(attributes[attr] == null || attributes[attr] === false) {
      delete attributes[attr]
      continue
    }
    if(Array.isArray(attributes[attr])) {
      attributes[attr] = attributes[attr].pop()
    }
    attributes[attr] = '' + attributes[attr]
  }
  return new VNode(tag, properties, ret, null, attributes.xmlns)
}
