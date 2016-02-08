(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jade'), require('babel-types'), require('babel-template'), require('babel-generator'), require('babel-traverse'), require('babylon')) :
  typeof define === 'function' && define.amd ? define(['jade', 'babel-types', 'babel-template', 'babel-generator', 'babel-traverse', 'babylon'], factory) :
  (global.vJade = factory(global.jade,global.babelTypes,global.template,global.generate,global.traverse,global.babylon));
}(this, function (jade,babelTypes,template,generate,traverse,babylon) { 'use strict';

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

  var CONDITIONAL = /^(if|else|unless)/;

  var eachTemplate = template("OBJECT.map(function each(VALUE, KEY){\n  return BLOCK\n})");

  var reduceTemplate = template("OBJECT.reduce(function each(nodes, VALUE, KEY){\n  return nodes.concat(BLOCK);\n}, [])");

  function each(object) {
    if (object.BLOCK.elements.length === 1) {
      object.BLOCK = object.BLOCK.elements[0];
      return babelTypes.spreadElement(eachTemplate(object).expression);
    }
    return babelTypes.spreadElement(reduceTemplate(object).expression);
  }

  function extractExpression(value, compiler) {
    var expressions = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    traverse(babylon.parse(';' + value), {
      ExpressionStatement: function ExpressionStatement(_ref) {
        var node = _ref.node;

        expressions.push(node.expression);
      },
      ReferencedIdentifier: function ReferencedIdentifier(_ref2) {
        var node = _ref2.node;

        if (node.name in compiler.declared) return;
        compiler.declared[node.name] = true;
        console.log(node.name);
      },
      VariableDeclarator: function VariableDeclarator(_ref3) {
        var node = _ref3.node;

        var expression = node.init;
        if (expression) {
          expression = babelTypes.unaryExpression('void', babelTypes.assignmentExpression('=', node.id, node.init));
          expressions.push(expression);
          node.init = null;
        }
        if (!compiler.declared[node.id.name]) {
          compiler.declared[node.id.name] = false;
        }
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
        this.create = babelTypes.identifier('$');
        this.context = babelTypes.identifier('context');
        this.declarations = [];
        this.declared = {};
        this.imports = [];
        this.ast = babelTypes.functionDeclaration(babelTypes.identifier('template'), [this.context], babelTypes.blockStatement([babelTypes.variableDeclaration('var', this.declarations), babelTypes.returnStatement(this.visit(this.node))]));
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.keys(this.declared)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            if (this.declared[key]) {
              this.declarations.push(babelTypes.VariableDeclarator(babelTypes.identifier(key), babelTypes.memberExpression(this.context, babelTypes.identifier(key))));
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

        return "buf.push(" + JSON.stringify(generate(this.ast).code) + ")";
      }
    }, {
      key: "visit",
      value: function visit(node, index, parent) {
        return this['visit' + node.type](node, index, parent);
      }
    }, {
      key: "visitBlock",
      value: function visitBlock(block) {
        var nodes = block.nodes,
            result = [];
        var conditions = [],
            consequents = [],
            expression;
        for (var i = 0; i < nodes.length; i++) {
          if (CONDITIONAL.test(nodes[i].val)) {
            conditions = [], consequents = [];
            conditions.push(extractExpression(nodes[i].val.slice(2), this));
            consequents.push(this.visitBlock(nodes[i].block));
            while (/^else if/.test(nodes[++i] && nodes[i].val)) {
              conditions.push(extractExpression(nodes[i].val.slice(7), this));
              consequents.push(this.visitBlock(nodes[i].block));
            }
            if (/^else/.test(nodes[i] && nodes[i].val)) {
              var alternate = this.visitBlock(nodes[i].block);
            } else {
              i -= 1;
            }

            for (var j = conditions.length - 1; j >= 0; j--) {
              var condition = conditions[j];
              var consequent = consequents[j];

              if (expression) {
                expression = babelTypes.conditionalExpression(condition, consequent, expression);
              } else if (alternate) {
                expression = babelTypes.conditionalExpression(condition, consequent, alternate);
              } else {
                expression = babelTypes.logicalExpression('&&', condition, consequent);
              }
            }
            result.push(babelTypes.spreadElement(expression));
          } else {
            expression = this.visit(nodes[i]);
            if (expression) result.push(expression);
          }
        }
        return babelTypes.arrayExpression(result);
      }
    }, {
      key: "visitTag",
      value: function visitTag(tag) {
        if (tag.code) tag.block.nodes.push(tag.code);
        return babelTypes.callExpression(this.create, [babelTypes.stringLiteral(tag.name), this.visitAttributes(tag.attrs), this.visitBlock(tag.block)]);
      }
    }, {
      key: "visitAttributes",
      value: function visitAttributes(attrs) {
        var _this = this;

        return babelTypes.objectExpression(attrs.map(function (attr) {
          return babelTypes.objectProperty(babelTypes.stringLiteral(attr.name), extractExpression(attr.val, _this));
        }));
      }
    }, {
      key: "visitCode",
      value: function visitCode(code) {
        return extractExpression(code.val, this);
      }
    }, {
      key: "visitCodeBlock",
      value: function visitCodeBlock(code) {
        if (code[0].val.indexOf('if') === 0) {
          if (code[1] && code[1].val.indexOf('else')) {
            return [babelTypes.conditionalExpression(extractExpression(code[0].val.slice(2), this), this.visitBlock(code[0].block), this.visitBlock(code[1].block))];
          }
        }
        return code.map(function (code) {
          return extractExpression(code.val);
        }, this);
      }
    }, {
      key: "visitEach",
      value: function visitEach(node) {
        this.declared[node.key] = false;
        this.declared[node.val] = false;
        var declarations = this.declarations;
        this.declarations = [];
        var elements = each({
          BLOCK: this.visitBlock(node.block),
          OBJECT: extractExpression(node.obj, this),
          VALUE: extractExpression(node.val, this),
          KEY: extractExpression(node.key, this)
        });
        this.declarations = declarations;
        return elements;
      }
    }, {
      key: "visitText",
      value: function visitText(node) {
        return extractExpression('`' + node.val.replace(/#{/g, '${') + '`', this);
      }
    }]);
    return ElementCreateCompiler;
  }();

  function vJade(template) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return jade.render(template, Object.assign({ compiler: ElementCreateCompiler }, options));
  }

  console.log(vJade("\nmain(role=\"main\")\n  each post in posts\n    - var title = post.title\n    article\n      header: h3= post.title\n      section= post.content\n      footer: i= post.author || 'Admin'\n  "));

  return vJade;

}));