(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('virtual-dom')) :
  typeof define === 'function' && define.amd ? define(['virtual-dom'], factory) :
  (global.vJade = factory(global.virtualDom));
}(this, function (virtualDom) { 'use strict';

  function isChildren() {
    var node = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    return Array.isArray(node) || typeof node === 'string' || node.type === 'VirtualText' || node.type === 'VirtualNode';
  }

  function element(tag, attributes, children) {
    if (isChildren(attributes)) {
      children = Array.isArray(attributes) ? attributes : [attributes];
      attributes = null;
    }
    return new virtualDom.VNode(tag, { attributes: attributes }, children.map(function (node) {
      return typeof node === 'string' ? new virtualDom.VText(node) : node;
    }));
  }

  return element;

}));