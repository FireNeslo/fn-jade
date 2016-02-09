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

  var CONDITIONAL = /^(if|else|unless)/;

  var eachTemplate = template("OBJECT.map(function each(VALUE, KEY){\n  DECLARATIONS\n  return BLOCK\n})");

  var reduceTemplate = template("OBJECT.reduce(function each(nodes, VALUE, KEY){\n  DECLARATIONS\n  return nodes.concat(BLOCK);\n}, [])");

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

    traverse(babylon.parse(';' + value), {
      ExpressionStatement: function ExpressionStatement(_ref) {
        var node = _ref.node;

        expressions.push(node.expression);
      },
      ReferencedIdentifier: function ReferencedIdentifier(_ref2) {
        var node = _ref2.node;

        if (node.name in compiler.declared) return;
        compiler.declared[node.name] = true;
      },
      VariableDeclarator: function VariableDeclarator(_ref3) {
        var node = _ref3.node;

        var expression = node.init;
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
              var consequent = this.visitBlock(nodes[i].block);
              conditions.push(extractExpression(nodes[i].val.slice(7), this));
              consequents.push(consequent);
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
                if (expression.type === 'SpreadElement') {
                  expression = expression.argument;
                }
                expression = babelTypes.conditionalExpression(condition, consequent, expression);
              } else if (alternate) {
                if (alternate.type === 'SpreadElement') {
                  expression = alternate.argument;
                }
                expression = babelTypes.conditionalExpression(condition, consequent, alternate);
              } else {
                expression = babelTypes.conditionalExpression(condition, consequent, babelTypes.unaryExpression('void', babelTypes.numericLiteral(0)));
              }
            }
            try {
              result.push(babelTypes.spreadElement(expression));
            } catch (e) {
              debugger;
            }
          } else {
            expression = this.visit(nodes[i]);
            if (expression) result.push(expression);
          }
        }
        if (result.length === 1) {
          if (result[0].type === 'SpreadElement') {
            return result[0].argument;
          }
          return result[0];
        }
        return babelTypes.arrayExpression(result);
      }
    }, {
      key: "visitDoctype",
      value: function visitDoctype() {
        return babelTypes.unaryExpression('void', babelTypes.numericLiteral(0));
      }
    }, {
      key: "visitTag",
      value: function visitTag(tag, create) {
        console.log('enter tag');
        if (tag.code) tag.block.nodes.push(tag.code);
        if (!tag.attrs.length) {
          create = babelTypes.callExpression(this.create, [babelTypes.stringLiteral(tag.name), this.visitBlock(tag.block)]);
        } else {
          create = babelTypes.callExpression(this.create, [babelTypes.stringLiteral(tag.name), this.visitAttributes(tag.attrs), this.visitBlock(tag.block)]);
        }
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

        console.log('visit attributes', attrs);
        return babelTypes.objectExpression(attrs.map(function (attr) {
          return babelTypes.objectProperty(babelTypes.stringLiteral(attr.name), extractExpression(attr.val, _this));
        }));
      }
    }, {
      key: "visitCode",
      value: function visitCode(code) {
        console.log('code');
        return extractExpression(code.val, this);
      }
    }, {
      key: "visitEach",
      value: function visitEach(node) {
        console.log('enter each');

        this.declared[node.key] = false;
        this.declared[node.val] = false;
        var declarations = this.declarations;
        this.declarations = [];
        var elements = this.visitBlock(node.block);
        var declare = this.declarations.length ? babelTypes.variableDeclaration('var', this.declarations) : null;
        var elements = Object.assign(each({
          BLOCK: elements,
          DECLARATIONS: declare,
          OBJECT: extractExpression(node.obj, this),
          VALUE: extractExpression(node.val, this),
          KEY: extractExpression(node.key, this)
        }), {
          loc: {
            start: { line: node.line }
          }
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

  function fnJade(template) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return jade.render(template, Object.assign({ compiler: ElementCreateCompiler, template: template }, options));
  }

  console.log(fnJade("\nstyle= require('./field.sass')\nif league\n  .fts-fantasy_field(\n    class=\"fts-fantasy_field_\" + league.gameType\n    style=background)\n    content\n    .fts-players_section\n      each position in positions\n        .fts-players_section_row_wrapper\n          .fts-players_section_row\n            each player in playersFor(fantasyPlayerCollection, position)\n              ft-player(\n                gameweek=gameweek.id\n                fantasy-player=player.id\n                price-context=priceContext\n                context=context)\n            if context == 'edit'\n              each slot in requiredSlots(fantasyPlayerCollection, position)\n                .fts-players_section_required\n              each slot in freeSlots(fantasyPlayerCollection, position)\n                .fts-players_section_free\n            unless context == 'show'\n              .fts-field_placeholder(\n                class=placeholderClass(fantasyTeam, position))\n                unless playersFor(fantasyPlayerCollection, position).length\n                  =l[position]\n\n      .fts-subs_section_title\n        h3=l.substitutions\n      .fts-players_section_row_wrapper\n        .fts-substitution_row\n          each slot in benchSlots\n            - var player = playerAtSlot(fantasyPlayerCollection, slot)\n            if player\n              ft-player(\n                gameweek=gameweek.id\n                fantasy-player=player.id\n                price-context=priceContext\n                context=context\n                bench-slot=slot)\n            else\n              .fts-players_section_required\n            if context != 'show'\n              .fts-field_placeholder\n                if !player\n                  = benchOrdinal(slot)\n"));

  return fnJade;

}));