import {VNode, VText} from "virtual-dom"

function isChildren(node={}) {
  return Array.isArray(node) ||
    typeof node === 'string' ||
    node.type === 'VirtualText' ||
    node.type === 'VirtualNode'
}

export default function element(tag, attributes, children) {
  if(isChildren(attributes)) {
    children = Array.isArray(attributes) ?
      attributes : [attributes]
    attributes = null
  }
  return new VNode(tag, {attributes}, children.map( node => {
    if(!node) return new VText('')
    return typeof node === 'string' ? new VText(node) : node
  }))
}
