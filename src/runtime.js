import {VNode, VText} from "virtual-dom"

export default function element(tag, attributes, children) {
  if(!Array.isArray(children)) {
    children = [children]
  }
  console.log(tag, attributes)
  if(Array.isArray(attributes.class)) {
    attributes.class = attributes.class.join(' ')
  }
  return new VNode(tag, {attributes}, children.map( node => {
    if(node == null) return new VText('')
    return typeof node !== 'object' ? new VText(node) : node
  }))
}

