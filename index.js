(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jade'), require('@babel/types'), require('js-beautify'), require('@babel/template'), require('@babel/generator'), require('@babel/traverse'), require('@babel/parser')) :
	typeof define === 'function' && define.amd ? define(['jade', '@babel/types', 'js-beautify', '@babel/template', '@babel/generator', '@babel/traverse', '@babel/parser'], factory) :
	(global.vJade = factory(global.jade,global.types,global.jsBeautify,global.template,global.generate,global.traverse,global.parser));
}(this, (function (jade,types,jsBeautify,template,generate,traverse,parser) { 'use strict';

jade = jade && jade.hasOwnProperty('default') ? jade['default'] : jade;
template = template && template.hasOwnProperty('default') ? template['default'] : template;
generate = generate && generate.hasOwnProperty('default') ? generate['default'] : generate;
traverse = traverse && traverse.hasOwnProperty('default') ? traverse['default'] : traverse;

function _AwaitValue(value) {
  this.wrapped = value;
}

function _AsyncGenerator(gen) {
  var front, back;

  function send(key, arg) {
    return new Promise(function (resolve, reject) {
      var request = {
        key: key,
        arg: arg,
        resolve: resolve,
        reject: reject,
        next: null
      };

      if (back) {
        back = back.next = request;
      } else {
        front = back = request;
        resume(key, arg);
      }
    });
  }

  function resume(key, arg) {
    try {
      var result = gen[key](arg);
      var value = result.value;
      var wrappedAwait = value instanceof _AwaitValue;
      Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
        if (wrappedAwait) {
          resume("next", arg);
          return;
        }

        settle(result.done ? "return" : "normal", arg);
      }, function (err) {
        resume("throw", err);
      });
    } catch (err) {
      settle("throw", err);
    }
  }

  function settle(type, value) {
    switch (type) {
      case "return":
        front.resolve({
          value: value,
          done: true
        });
        break;

      case "throw":
        front.reject(value);
        break;

      default:
        front.resolve({
          value: value,
          done: false
        });
        break;
    }

    front = front.next;

    if (front) {
      resume(front.key, front.arg);
    } else {
      back = null;
    }
  }

  this._invoke = send;

  if (typeof gen.return !== "function") {
    this.return = undefined;
  }
}

if (typeof Symbol === "function" && Symbol.asyncIterator) {
  _AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
    return this;
  };
}

_AsyncGenerator.prototype.next = function (arg) {
  return this._invoke("next", arg);
};

_AsyncGenerator.prototype.throw = function (arg) {
  return this._invoke("throw", arg);
};

_AsyncGenerator.prototype.return = function (arg) {
  return this._invoke("return", arg);
};

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var eachTemplate = template("(OBJECT || []).map((VALUE, KEY)=> {\n  return BLOCK\n})");
var reduceTemplate = template("(OBJECT || []).reduce((nodes, VALUE, KEY)=> {\n  return nodes.concat(BLOCK);\n}, [])");
var whileTemplate = template("(function(children) {\n  while(CONDITION) {children = children.concat(BLOCK)}\n  return children\n}.call(this, []))");
var assignTemplate = template("(e => BINDING = e.target[PROPERTY])");
var eventTemplate = template("(e => BINDING)");

function each(object, template$$1) {
  if (object.BLOCK.elements) {
    template$$1 = reduceTemplate(object);
  } else {
    template$$1 = eachTemplate(object);
  }

  try {
    return types.spreadElement(template$$1.expression);
  } catch (e) {
    debugger;
  }
}

function extractExpression(value, compiler) {
  var expressions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (value && value.trim && /^{[\s\S]*}$/m.test(value.trim())) {
    value = '(' + value + ')';
  }

  var program = parser.parse('; ' + value);
  traverse(program, {
    ReferencedIdentifier: function ReferencedIdentifier(_ref) {
      var node = _ref.node;
      if (node.name in compiler.declared) return;
      compiler.declared[node.name] = true;
    }
  });
  traverse(program, {
    ExpressionStatement: function ExpressionStatement(_ref2) {
      var node = _ref2.node;
      expressions.push(node.expression);
    },
    VariableDeclarator: function VariableDeclarator$$1(_ref3) {
      var node = _ref3.node;
      var expression = types.assignmentExpression('=', node.id, node.init);
      delete node.init;

      if (!compiler.declared[node.id.name]) {
        compiler.declared[node.id.name] = false;
      }

      expressions.push(types.unaryExpression('void', expression));
      compiler.declarations.push(node);
    }
  });
  return expressions.length > 1 ? types.sequenceExpression(expressions) : expressions[0];
}

var ElementCreateCompiler =
/*#__PURE__*/
function () {
  function ElementCreateCompiler(node, options) {
    _classCallCheck(this, ElementCreateCompiler);

    this.node = node;
    this.options = options;
  }

  _createClass(ElementCreateCompiler, [{
    key: "compile",
    value: function compile(root) {
      this.depth = 0;
      this.chain = [];
      this.create = types.identifier('$');
      this.context = types.identifier('$ctx$');
      var declarations = this.declarations = [];
      this.declared = {
        Array: false,
        Object: false,
        global: false,
        require: false,
        window: false,
        Date: false
      };
      var nodes = this.visit(this.node);
      var block = [types.returnStatement(nodes)];

      var _arr = Object.keys(this.declared);

      for (var _i = 0; _i < _arr.length; _i++) {
        var key = _arr[_i];

        if (this.declared[key]) {
          this.declarations.unshift(types.VariableDeclarator(types.identifier(key), types.memberExpression(this.context, types.identifier(key))));
        }
      }

      if (declarations.length) {
        block.unshift(types.variableDeclaration('var', declarations));
      }

      this.imports = [];
      this.ast = types.functionDeclaration(types.identifier('template'), [types.assignmentPattern(this.context, types.identifier('this'))], types.blockStatement(block));
      var generated = generate(this.ast, {
        retainLines: !!this.options.pretty,
        compact: !this.options.pretty
      });

      if (this.options.pretty) {
        generated.code = jsBeautify.js_beautify(generated.code, {
          indent_size: 2,
          preserve_newlines: false
        });
      }

      return "buf.push(".concat(JSON.stringify(generated.code), ")");
    }
  }, {
    key: "visit",
    value: function visit(node, index, parent) {
      try {
        return this['visit' + node.type](node, index, parent);
      } catch (e) {
        if (this['visit' + node.type]) {
          console.error(e.stack);
        } else {
          console.warn(node.type + ' is not currently supported.');
        }

        return;
      }
    }
  }, {
    key: "visitBlock",
    value: function visitBlock(block) {
      try {
        this.depth++;
        this.chain[this.depth] = [];
        var result = block.nodes.map(this.visit, this);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.currentChain[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var ifs = _step.value;
            result[ifs[0]] = types.spreadElement(this.makeCondition(result, block.nodes, ifs));
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        this.depth--;
        return types.arrayExpression(result.filter(function (a) {
          return a;
        }));
      } catch (e) {
        console.error(e.stack);
        return types.arrayExpression([]);
      }
    }
  }, {
    key: "makeCondition",
    value: function makeCondition(result, nodes, indices) {
      if (indices[0] == null) return types.arrayExpression([]);
      var condition = result[indices[0]];
      result[indices[0]] = null;
      var consequent = this.visitBlock(nodes[indices[0]].block);

      if (condition) {
        var alternate = this.makeCondition(result, nodes, indices.slice(1));
        return types.conditionalExpression(condition, consequent, alternate);
      } else if (indices[0]) {
        return consequent;
      }
    }
  }, {
    key: "visitDoctype",
    value: function visitDoctype() {}
  }, {
    key: "visitComment",
    value: function visitComment() {}
  }, {
    key: "visitBlockComment",
    value: function visitBlockComment() {}
  }, {
    key: "visitTag",
    value: function visitTag(tag, create) {
      if (tag.code) {
        tag.block.nodes.push(tag.code);

        if (tag.code.block && tag.code.block.nodes && tag.code.block.nodes.length) {
          tag.block.nodes = tag.block.nodes.concat(tag.code.block.nodes);
        }
      }

      create = types.callExpression(this.create, [types.stringLiteral(tag.name), this.visitAttributes(tag.attrs, tag.attributeBlocks), this.visitBlock(tag.block)]);
      return Object.assign(create, {
        loc: {
          start: {
            line: tag.line
          }
        }
      });
    }
  }, {
    key: "visitAttributes",
    value: function visitAttributes(attrs) {
      var _this = this;

      var blocks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var map = {};
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = attrs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var attr = _step2.value;
          var expression = extractExpression(attr.val, this);

          if (attr.name[0] === '[' && attr.name[1] === '(') {
            var event = attr.name.slice(2, -2);
            var handler = assignTemplate({
              BINDING: expression,
              PROPERTY: types.stringLiteral(event)
            });
            attr.name = '[' + event + ']';
            map['(' + event + 'Changed)'] = [handler.expression];
          } else if (attr.name[0] === '(') {
            expression = eventTemplate({
              BINDING: expression
            }).expression;
          }

          map[attr.name] || (map[attr.name] = []);
          map[attr.name].push(expression);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var ret = types.objectExpression(Object.keys(map).map(function (attr) {
        return types.objectProperty(types.stringLiteral(attr), map[attr].length > 1 ? types.arrayExpression(map[attr]) : map[attr][0]);
      }));

      if (blocks.length) {
        ret = template("Object.assign(ATTRS, BLOCKS)")({
          ATTRS: ret,
          BLOCKS: blocks.map(function (block) {
            return extractExpression(block, _this);
          })
        }).expression;
      }

      return ret;
    }
  }, {
    key: "visitCode",
    value: function visitCode(code, index) {
      var isPureElse = false;

      if (/^while /.test(code.val)) {
        var CONDITION = extractExpression(code.val.slice(5), this);
        var BLOCK = this.visitBlock(code.block);
        return types.spreadElement(whileTemplate({
          CONDITION: CONDITION,
          BLOCK: BLOCK
        }).expression);
      } else if (/^if /.test(code.val)) {
        this.currentChain.push([index]);
        return extractExpression(code.val.slice(2), this);
      } else if (/^else if /.test(code.val)) {
        this.currentChain[this.currentChain.length - 1].push(index);
        return extractExpression(code.val.slice(7), this);
      } else if (/^else/.test(code.val)) {
        this.currentChain[this.currentChain.length - 1].push(index);
        return;
      }

      if (isPureElse) return;
      var expression = extractExpression(code.val, this);

      if (!code.escape && code.buffer) {
        return types.objectExpression([types.objectProperty(types.stringLiteral('[innerHTML]'), expression)]);
      }

      return code.buffer ? expression : types.unaryExpression('void', expression);
    }
  }, {
    key: "visitEach",
    value: function visitEach(node) {
      var elements = this.visitBlock(node.block);
      var object = extractExpression(node.obj, this);
      return Object.assign(each({
        BLOCK: elements,
        OBJECT: object,
        VALUE: types.identifier(node.val),
        KEY: types.identifier(node.key)
      }), {
        loc: {
          start: {
            line: node.line
          }
        }
      });
    }
  }, {
    key: "visitText",
    value: function visitText(node) {
      return extractExpression('`' + node.val.replace(/#{/g, '${') + '`', this);
    }
  }, {
    key: "currentChain",
    get: function get() {
      return this.chain[this.depth];
    }
  }]);

  return ElementCreateCompiler;
}();

function fnJade(template$$1, options) {
  options || (options = {});
  return jade.render(template$$1, Object.assign({
    compiler: ElementCreateCompiler,
    template: template$$1
  }, options));
}

return fnJade;

})));
