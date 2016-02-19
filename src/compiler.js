import {expressionStatement, sequenceExpression} from "babel-types"
import {spreadElement, functionDeclaration} from "babel-types"
import {objectExpression, objectProperty} from "babel-types"
import {arrayExpression, callExpression} from "babel-types"
import {blockStatement, returnStatement} from "babel-types"
import {stringLiteral, identifier} from "babel-types"
import {templateLiteral, conditionalExpression} from "babel-types"
import {logicalExpression, unaryExpression} from "babel-types"
import {variableDeclaration, assignmentExpression} from "babel-types"
import {VariableDeclarator, memberExpression} from "babel-types"
import {numericLiteral} from "babel-types"

import {js_beautify as beautify} from "js-beautify"
import template from "babel-template";
import generate from "babel-generator";
import traverse from "babel-traverse"
import {parse} from "babylon"

const CONDITIONAL = /^(if|else|unless)/

var eachTemplate = template(`OBJECT.map(function each(VALUE, KEY){
  DECLARATIONS
  return BLOCK
})`)

var reduceTemplate = template(`OBJECT.reduce(function each(nodes, VALUE, KEY){
  DECLARATIONS
  return nodes.concat(BLOCK);
}, [])`)

function each(object, template) {
  if(object.BLOCK.elements) {
    template = reduceTemplate(object)
  } else {
    template = eachTemplate(object)
  }
  try {
    return spreadElement(template.expression)
  } catch(e) {
    debugger
  }
}

function extractExpression(value, compiler, expressions=[]) {
  traverse(parse(';'+value), {
    ExpressionStatement({node}) {
      expressions.push(node.expression)
    },
    ReferencedIdentifier({node}) {
      if (node.name in compiler.declared) return;
      compiler.declared[node.name] = true
    },
    VariableDeclarator({node}) {
      var expression = node.init
      if(!compiler.declared[node.id.name]) {
        compiler.declared[node.id.name] = false
      }
      compiler.declarations.push(node)
    }
  })
  return expressions.length > 1 ?
    sequenceExpression(expressions) :
    expressions[0]
}

export default class ElementCreateCompiler {
  constructor(node, options) {
  	this.node = node;
  	this.options = options;
  }
  compile(root) {
    this.create = identifier('$')
    this.context = identifier('context')
    var declarations = this.declarations = []
    this.declared = {
      global: false,
      require: false,
      window: false
    }
    var nodes = this.visit(this.node)
    var block = [ returnStatement(nodes) ]
    for(var key of Object.keys(this.declared)) {
      if(this.declared[key]) {
        this.declarations.unshift(
          VariableDeclarator(
            identifier(key),
            memberExpression(this.context, identifier(key))
          )
        )
      }
    }
    if(declarations.length) {
      block.unshift(
        variableDeclaration('var', declarations),
      )
    }
    this.imports = []
    this.ast = functionDeclaration(
      identifier('template'),
      [this.context],
      blockStatement(block)
    )

    var generated = generate(this.ast, {
      retainLines: !!this.options.pretty,
      compact: !this.options.pretty
    })
    if(this.options.pretty) {
      generated.code = beautify(generated.code, {
        indent_size: 2,
        preserve_newlines: false
      })
    }
    return `buf.push(${JSON.stringify(generated.code)})`
  }
  visit(node, index, parent) {
    return this['visit' + node.type](node, index, parent);
  }
  visitBlock(block) {
    var nodes = block.nodes, result = []
    var conditions = [], consequents = [], expression
    for(var i = 0; i < nodes.length; i++) {
      if(CONDITIONAL.test(nodes[i].val)) {
        conditions = [], consequents = []
        conditions.push(extractExpression(nodes[i].val.slice(2), this))
        consequents.push(this.visitBlock(nodes[i].block))
        while(/^else if/.test(nodes[++i] && nodes[i].val)) {
          var consequent = this.visitBlock(nodes[i].block)
          conditions.push(extractExpression(nodes[i].val.slice(7), this))
          consequents.push(consequent)
        }
        if(/^else/.test(nodes[i] && nodes[i].val)) {
          var alternate = this.visitBlock(nodes[i].block)
        } else {
          i -= 1
        }

        for (var j = conditions.length-1; j >= 0; j--) {
          var condition =  conditions[j]
          var consequent = consequents[j]

          if(expression) {
            if(expression.type === 'SpreadElement') {
              expression = expression.argument
            }
            expression =
              conditionalExpression(condition, consequent, expression)
          } else if(alternate) {
            if(alternate.type === 'SpreadElement') {
              expression = alternate.argument
            }
            expression =
              conditionalExpression(condition, consequent, alternate)
          } else {
            expression = conditionalExpression(condition, consequent,
              unaryExpression('void', numericLiteral(0))
            )
          }
        }
        try {
          result.push(spreadElement(expression))
        } catch(e) {
          debugger
        }
      } else {
        expression = this.visit(nodes[i])
        if(expression) result.push(expression)
      }
    }
    if(result.length === 1) {
      if(result[0].type === 'SpreadElement') {
        return result[0].argument
      }
      return result[0]
    }
    return arrayExpression(result)
  }
  visitDoctype() {
    return unaryExpression('void', numericLiteral(0))
  }
  visitTag(tag, create) {
    if(tag.code) tag.block.nodes.push(tag.code)
    create = callExpression(this.create, [
      stringLiteral(tag.name),
      this.visitAttributes(tag.attrs),
      this.visitBlock(tag.block)
    ])
    return Object.assign(create, {
      loc: {
        start: {line: tag.line }
      }
    })
  }
  visitAttributes(attrs) {
    var map = {}
    for(var attr of attrs) {
      map[attr.name] || (map[attr.name] = [])
      map[attr.name].push(extractExpression(attr.val, this))
    }
    var ret = []
    return objectExpression(Object.keys(map).map(attr =>
      objectProperty(
        stringLiteral(attr),
        map[attr].length > 1 ? arrayExpression(map[attr]) : map[attr][0]
      )
    ))
  }
  visitCode(code) {
    return extractExpression(code.val, this)
  }
  visitEach(node) {
    this.declared[node.key] = false
    this.declared[node.val] = false
    var declarations = this.declarations
    this.declarations = []
    var elements = this.visitBlock(node.block)
    var declare = this.declarations.length ?
      variableDeclaration('var', this.declarations) : null
    var elements = Object.assign(each({
      BLOCK: elements,
      DECLARATIONS: declare,
      OBJECT: extractExpression(node.obj, this),
      VALUE: extractExpression(node.val, this),
      KEY: extractExpression(node.key, this)
    }), {
      loc: {
        start: {line: node.line}
      }
    })
    this.declarations = declarations
    return elements
  }
  visitText(node) {
    return extractExpression('`'+node.val.replace(/#{/g, '${')+'`', this)
  }
}
