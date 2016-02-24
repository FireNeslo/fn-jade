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

  function sentenceCase(str) {
    str || (str = '');
    return str.replace(/([A-Z])/g, function (_, match) {
      return ' ' + match.toLowerCase();
    }).replace(/[_\- ]+(.)/g, ' $1').trim();
  }

  function kebabize(str) {
    return sentenceCase(str).replace(/[ ]/g, '-');
  }

  function classHelper(className) {
    if (Array.isArray(className)) {
      return className.map(classHelper).join(' ');
    }
    if ((typeof className === 'undefined' ? 'undefined' : babelHelpers.typeof(className)) === 'object') {
      return Object.keys(className).filter(function (c) {
        return className[c];
      }).join(' ');
    }
    return className;
  }

  function styleHelper(styles) {
    if (!styles) return;
    if (Array.isArray(styles)) {
      return styles.map(styleHelper).join(';');
    }
    if ('object' == (typeof styles === 'undefined' ? 'undefined' : babelHelpers.typeof(styles))) {
      return Object.keys(styles).map(function (key) {
        return kebabize(key) + ':' + styles[key];
      }).join(';');
    }
    return styles;
  }

  function element(tag, attributes, children) {
    var properties = { attributes: attributes };
    if (!Array.isArray(children)) {
      children = [children];
    }
    if (attributes.key) {
      properties.key = attributes.key;
      delete attributes.key;
    }
    if (attributes.class) {
      attributes.class = classHelper(attributes.class);
    }
    if (attributes.style) {
      attributes.style = styleHelper(attributes.style);
    }
    for (var attr in attributes) {
      if (attr[0] === '[') {
        properties[attr.slice(1, -1)] = attributes[attr];
        delete attributes[attr];
      }
      if (attributes[attr] == null || attributes[attr] === false) {
        delete attributes[attr];
        continue;
      }
      if (Array.isArray(attributes[attr])) {
        attributes[attr] = attributes[attr].pop();
      }
      attributes[attr] = '' + attributes[attr];
    }
    var ret = [];
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      if (node == null) continue;
      ret.push((typeof node === 'undefined' ? 'undefined' : babelHelpers.typeof(node)) !== 'object' ? new virtualDom.VText(node) : node);
    }
    return new virtualDom.VNode(tag, properties, ret);
  }

  return element;

}));