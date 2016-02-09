(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('virtual-dom')) :
  typeof define === 'function' && define.amd ? define(['virtual-dom'], factory) :
  (global.vJade = factory(global.virtualDom));
}(this, function (virtualDom) { 'use strict';

  function element(tag, attributes, children) {
    if (!Array.isArray(children)) {
      children = [children];
    }
    return new virtualDom.VNode(tag, { attributes: attributes }, children.map(function (node) {
      if (!node) return new virtualDom.VText('');
      return typeof node === 'string' ? new virtualDom.VText(node) : node;
    }));
  }

  return element;

}));