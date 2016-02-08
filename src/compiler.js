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


import template from "babel-template";
import generate from "babel-generator";
import traverse from "babel-traverse"
import {parse} from "babylon"

const CONDITIONAL = /^(if|else|unless)/

var eachTemplate = template(`OBJECT.map(function each(VALUE, KEY){
  return BLOCK
})`)

var reduceTemplate = template(`OBJECT.reduce(function each(nodes, VALUE, KEY){
  return nodes.concat(BLOCK);
}, [])`)

function each(object) {
  if(object.BLOCK.elements.length === 1) {
    object.BLOCK = object.BLOCK.elements[0]
    return spreadElement(eachTemplate(object).expression)
  }
  return spreadElement(reduceTemplate(object).expression)
}

function extractExpression(value, compiler, expressions=[]) {
  traverse(parse(';'+value), {
    ExpressionStatement({node}) {
      expressions.push(node.expression)
    },
    ReferencedIdentifier({node}) {
      if (node.name in compiler.declared) return;
      compiler.declared[node.name] = true
      console.log(node.name)
    },
    VariableDeclarator({node}) {
      var expression = node.init
      if(expression) {
        expression = unaryExpression('void',
          assignmentExpression('=', node.id, node.init), 
        )
        expressions.push(expression)
        node.init = null
      }
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
    this.declarations = []
    this.declared = {}
    this.imports = []
    this.ast = functionDeclaration(
      identifier('template'),
      [this.context],
      blockStatement([
        variableDeclaration('var', this.declarations),
        returnStatement(
          this.visit(this.node)
        )
      ])
    )
    for(var key of Object.keys(this.declared)) {
      if(this.declared[key]) {
        this.declarations.push(
          VariableDeclarator(
            identifier(key),
            memberExpression(this.context, identifier(key))
          )
        )
      }
    }
    return `buf.push(${JSON.stringify(generate(this.ast).code)})`
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
          conditions.push(extractExpression(nodes[i].val.slice(7), this))
          consequents.push(this.visitBlock(nodes[i].block))
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
            expression =
              conditionalExpression(condition, consequent, expression)
          } else if(alternate) {
            expression =
              conditionalExpression(condition, consequent, alternate)
          } else {
            expression = logicalExpression('&&', condition, consequent)
          }
        }
        result.push(spreadElement(expression))
      } else {
        expression = this.visit(nodes[i])
        if(expression) result.push(expression)
      }
    }
    return arrayExpression(result)
  }
  visitTag(tag) {
    if(tag.code) tag.block.nodes.push(tag.code)
    return callExpression(this.create, [
      stringLiteral(tag.name),
      this.visitAttributes(tag.attrs),
      this.visitBlock(tag.block)
    ])
  }
  visitAttributes(attrs) {
    return objectExpression(attrs.map(attr =>
      objectProperty(
        stringLiteral(attr.name),
        extractExpression(attr.val, this)
      )
    ))
  }
  visitCode(code) {
    return extractExpression(code.val, this)
  }
  visitCodeBlock(code) {
    if(code[0].val.indexOf('if') === 0) {
      if(code[1] && code[1].val.indexOf('else')) {
        return [conditionalExpression(
          extractExpression(code[0].val.slice(2), this),
          this.visitBlock(code[0].block),
          this.visitBlock(code[1].block)
        )]
      }
    }
    return code.map(code => extractExpression(code.val), this)
  }
  visitEach(node) {
    this.declared[node.key] = false
    this.declared[node.val] = false
    var declarations = this.declarations
    this.declarations = []
    var elements = each({
      BLOCK: this.visitBlock(node.block),
      OBJECT: extractExpression(node.obj, this),
      VALUE: extractExpression(node.val, this),
      KEY: extractExpression(node.key, this)
    })
    this.declarations = declarations
    return elements
  }
  visitText(node) {
    return extractExpression('`'+node.val.replace(/#{/g, '${')+'`', this)
  }
}
