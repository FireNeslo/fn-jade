(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jade'), require('babel-types'), require('js-beautify'), require('babel-template'), require('babel-generator'), require('babel-traverse'), require('babylon')) :
  typeof define === 'function' && define.amd ? define(['jade', 'babel-types', 'js-beautify', 'babel-template', 'babel-generator', 'babel-traverse', 'babylon'], factory) :
  (global.vJade = factory(global.jade,global.babelTypes,global.jsBeautify,global.template,global.generate,global.traverse,global.babylon));
}(this, function (jade,babelTypes,jsBeautify,template,generate,traverse,babylon) { 'use strict';

  jade = 'default' in jade ? jade['default'] : jade;
  template = 'default' in template ? template['default'] : template;
  generate = 'default' in generate ? generate['default'] : generate;
  traverse = 'default' in traverse ? traverse['default'] : traverse;

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  babelHelpers;

  var eachTemplate = template("(OBJECT || []).map((VALUE, KEY)=> {\n  return BLOCK\n})");

  var reduceTemplate = template("(OBJECT || []).reduce((nodes, VALUE, KEY)=> {\n  return nodes.concat(BLOCK);\n}, [])");

  var whileTemplate = template("(function(children) {\n  while(CONDITION) {children = children.concat(BLOCK)}\n  return children\n}.call(this, []))");

  var assignTemplate = template("(e => BINDING = e.target[PROPERTY])");
  var eventTemplate = template("(e => BINDING)");

  function each(object, template) {
    if (object.BLOCK.elements) {
      template = reduceTemplate(object);
    } else {
      template = eachTemplate(object);
    }
    try {
      return babelTypes.spreadElement(template.expression);
    } catch (e) {
      debugger;
    }
  }

  function extractExpression(value, compiler) {
    var expressions = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    console.log(value);
    if (value && value.trim && /^{[\s\S]*}$/m.test(value.trim())) {
      value = '(' + value + ')';
    }
    var program = babylon.parse('; ' + value);

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
      VariableDeclarator: function VariableDeclarator(_ref3) {
        var node = _ref3.node;

        var expression = babelTypes.assignmentExpression('=', node.id, node.init);
        delete node.init;
        if (!compiler.declared[node.id.name]) {
          compiler.declared[node.id.name] = false;
        }
        expressions.push(babelTypes.unaryExpression('void', expression));
        compiler.declarations.push(node);
      }
    });
    return expressions.length > 1 ? babelTypes.sequenceExpression(expressions) : expressions[0];
  }

  var ElementCreateCompiler = function () {
    function ElementCreateCompiler(node, options) {
      babelHelpers.classCallCheck(this, ElementCreateCompiler);

      this.node = node;
      this.options = options;
    }

    babelHelpers.createClass(ElementCreateCompiler, [{
      key: "compile",
      value: function compile(root) {
        this.depth = 0;
        this.chain = [];
        this.create = babelTypes.identifier('$');
        this.context = babelTypes.identifier('$ctx$');
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
        var block = [babelTypes.returnStatement(nodes)];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.keys(this.declared)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            if (this.declared[key]) {
              this.declarations.unshift(babelTypes.VariableDeclarator(babelTypes.identifier(key), babelTypes.memberExpression(this.context, babelTypes.identifier(key))));
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        if (declarations.length) {
          block.unshift(babelTypes.variableDeclaration('var', declarations));
        }
        this.imports = [];
        this.ast = babelTypes.functionDeclaration(babelTypes.identifier('template'), [babelTypes.assignmentPattern(this.context, babelTypes.identifier('this'))], babelTypes.blockStatement(block));

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
        return "buf.push(" + JSON.stringify(generated.code) + ")";
      }
    }, {
      key: "visit",
      value: function visit(node, index, parent) {
        try {
          return this['visit' + node.type](node, index, parent);
        } catch (e) {
          console.error(e.stack);
          return babelTypes.arrayExpression([]);
        }
      }
    }, {
      key: "visitBlock",
      value: function visitBlock(block) {
        try {
          this.depth++;
          this.chain[this.depth] = [];
          var result = block.nodes.map(this.visit, this);
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = this.currentChain[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var ifs = _step2.value;

              result[ifs[0]] = babelTypes.spreadElement(this.makeCondition(result, block.nodes, ifs));
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          this.depth--;
          return babelTypes.arrayExpression(result.filter(function (a) {
            return a;
          }));
        } catch (e) {
          console.error(e.stack);
          return babelTypes.arrayExpression([]);
        }
      }
    }, {
      key: "makeCondition",
      value: function makeCondition(result, nodes, indices) {
        if (indices[0] == null) return babelTypes.arrayExpression([]);
        var condition = result[indices[0]];
        result[indices[0]] = null;
        var consequent = this.visitBlock(nodes[indices[0]].block);
        if (condition) {
          var alternate = this.makeCondition(result, nodes, indices.slice(1));
          return babelTypes.conditionalExpression(condition, consequent, alternate);
        } else if (indices[0]) {
          return consequent;
        }
      }
    }, {
      key: "visitDoctype",
      value: function visitDoctype() {
        return;
      }
    }, {
      key: "visitComment",
      value: function visitComment() {
        return;
      }
    }, {
      key: "visitTag",
      value: function visitTag(tag, create) {
        if (tag.code) {
          tag.block.nodes.push(tag.code);
          if (tag.code.block && tag.code.block.nodes && tag.code.block.nodes.length) {
            tag.block.nodes = tag.block.nodes.concat(tag.code.block.nodes);
          }
        }
        create = babelTypes.callExpression(this.create, [babelTypes.stringLiteral(tag.name), this.visitAttributes(tag.attrs, tag.attributeBlocks), this.visitBlock(tag.block)]);
        return Object.assign(create, {
          loc: {
            start: { line: tag.line }
          }
        });
      }
    }, {
      key: "visitAttributes",
      value: function visitAttributes(attrs) {
        var _this = this;

        var blocks = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        var map = {};
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = attrs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var attr = _step3.value;

            var expression = extractExpression(attr.val, this);
            if (attr.name[0] === '[' && attr.name[1] === '(') {
              var event = attr.name.slice(2, -2);
              var handler = assignTemplate({
                BINDING: expression,
                PROPERTY: babelTypes.stringLiteral(event)
              });
              attr.name = '[' + event + ']';
              map['(' + event + 'Changed)'] = [handler.expression];
            } else if (attr.name[0] === '(') {
              expression = eventTemplate({ BINDING: expression }).expression;
            }
            map[attr.name] || (map[attr.name] = []);
            map[attr.name].push(expression);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        var ret = babelTypes.objectExpression(Object.keys(map).map(function (attr) {
          return babelTypes.objectProperty(babelTypes.stringLiteral(attr), map[attr].length > 1 ? babelTypes.arrayExpression(map[attr]) : map[attr][0]);
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
          return babelTypes.spreadElement(whileTemplate({ CONDITION: CONDITION, BLOCK: BLOCK }).expression);
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
        return code.buffer ? expression : babelTypes.unaryExpression('void', expression);
      }
    }, {
      key: "visitEach",
      value: function visitEach(node) {
        var elements = this.visitBlock(node.block);
        var object = extractExpression(node.obj, this);

        return Object.assign(each({
          BLOCK: elements,
          OBJECT: object,
          VALUE: babelTypes.identifier(node.val),
          KEY: babelTypes.identifier(node.key)
        }), {
          loc: {
            start: { line: node.line }
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

  function fnJade(template, options) {
    options || (options = {});
    return jade.render(template, Object.assign({ compiler: ElementCreateCompiler, template: template }, options));
  }

  return fnJade;

}));