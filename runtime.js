(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('virtual-dom')) :
  typeof define === 'function' && define.amd ? define(['virtual-dom'], factory) :
  (global.vJade = factory(global.virtualDom));
}(this, function (virtualDom) { 'use strict';

  var babelHelpers = {};
  babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };
  babelHelpers;

  function element(tag, attributes, children) {
    if (!Array.isArray(children)) {
      children = [children];
    }
    return new virtualDom.VNode(tag, { attributes: attributes }, children.map(function (node) {
      if (node == null) return new virtualDom.VText('');
      return (typeof node === 'undefined' ? 'undefined' : babelHelpers.typeof(node)) !== 'object' ? new virtualDom.VText(node) : node;
    }));
  }

  return element;

}));