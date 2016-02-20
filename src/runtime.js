import {VNode, VText} from "virtual-dom"

function classHelper(className) {
  if(Array.isArray(className)) {
    return className.map(classHelper).join(' ')
  }
  if(typeof className === 'object') {
    return Object.keys(className).filter(c => className[c]).join(' ')
  }
  return className
}


export default function element(tag, attributes, children) {
  if(!Array.isArray(children)) {
    children = [children]
  }
  if(Array.isArray(attributes.class)) {
    attributes.class = classHelper(attributes.class)
  }
  for(var attr in attributes) {
    if(attributes[attr] == null || attributes[attr] === false) {
      delete attributes[attr]
    }
    if(Array.isArray(attributes[attr])) {
      attributes[attr] = attributes[attr].pop()
    }
  }
  return new VNode(tag, {attributes}, children.map( node => {
    if(node == null) return new VText('')
    return typeof node !== 'object' ? new VText(node) : node
  }))
}
