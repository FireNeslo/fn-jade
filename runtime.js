(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('virtual-dom')) :
  typeof define === 'function' && define.amd ? define(['virtual-dom'], factory) :
  (global.vJade = factory(global.virtualDom));
}(this, function (virtualDom) { 'use strict';

  function sentenceCase(str) {
    str || (str = '');
    return str.replace(/([A-Z])/g, function (_, match) {
      return ' ' + match.toLowerCase();
    }).replace(/[_\- ]+(.)/g, ' $1').trim();
  }

  function kebabize(str) {
    return sentenceCase(str).replace(/[ ]/g, '-');
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  function EventHook(event, callback) {
    this.event = event;
    this.callback = callback;
  }
  EventHook.prototype.hook = function hook(node) {
    node.addEventListener(this.event, this.callback);
  };
  EventHook.prototype.unhook = function hook(node) {
    node.removeEventListener(this.event, this.callback);
  };

  function PropertyHook(property, value) {
    this.property = property;
    this.value = value;
  }
  PropertyHook.prototype.hook = function hook(node) {
    node[this.property] = this.value;
  };

  function classHelper(className) {
    if (Array.isArray(className)) {
      return className.map(classHelper).join(' ');
    }
    if ((typeof className === 'undefined' ? 'undefined' : _typeof(className)) === 'object') {
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
    if ('object' == (typeof styles === 'undefined' ? 'undefined' : _typeof(styles))) {
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
    var ret = [];
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      var type = typeof node === 'undefined' ? 'undefined' : _typeof(node);
      if (type === 'object' && !(node instanceof virtualDom.VNode)) {
        if (attributes['[innerHTML]'] && node['[innerHTML]']) {
          attributes['[innerHTML]'] += node['[innerHTML]'];
          delete node['[innerHTML]'];
        }
        Object.assign(attributes, node);
        continue;
      }
      if (node == null) continue;
      ret.push(type !== 'object' ? new virtualDom.VText(node) : node);
    }
    for (var attr in attributes) {
      if (attr[0] === '[') {
        properties[attr] = new PropertyHook(attr.slice(1, -1), attributes[attr]);
        delete attributes[attr];
      }
      if (attr[0] === '(') {
        properties[attr] = new EventHook(attr.slice(1, -1), attributes[attr]);
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
    return new virtualDom.VNode(tag, properties, ret, null, attributes.xmlns);
  }

  return element;

}));