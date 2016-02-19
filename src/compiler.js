import {expressionStatement, sequenceExpression} from "babel-types"
import {spreadElement, functionDeclaration} from "babel-types"
import {objectExpression, objectProperty} from "babel-types"
import {arrayExpression, callExpression} from "babel-types"
import {blockStatement, returnStatement} from "babel-types"
import {stringLiteral, identifier} from "babel-types"
import {templateLiteral, conditionalExpression} from "babel-types"
import {variableDeclaration, assignmentExpression} from "babel-types"
import {VariableDeclarator, memberExpression} from "babel-types"
import {numericLiteral} from "babel-types"

import {js_beautify as beautify} from "js-beautify"
import template from "babel-template";
import generate from "babel-generator";
import traverse from "babel-traverse"
import {parse} from "babylon"

const CONDITIONAL = /^(if|else|unless)/

var eachTemplate = template(`OBJECT.map((VALUE, KEY)=> {
  DECLARATIONS
  return BLOCK
})`)

var reduceTemplate = template(`OBJECT.reduce((nodes, VALUE, KEY)=> {
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
    this.depth = 0
    this.chain = []
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
    try {
      this.depth++
      this.chain[this.depth] = []
      var result = block.nodes.map(this.visit, this)
      for(var ifs of this.currentChain) {
        result[ifs[0]] = spreadElement(this.makeCondition(result, block.nodes, ifs))
      }
      this.depth--
      return arrayExpression(result.filter(a => a))
    } catch(e) {
      console.error(e.stack)
      return arrayExpression([])
    }
  }
  makeCondition(result, nodes, indices) {
    if(indices[0] == null) return arrayExpression([])
    var condition = result[indices[0]]
    result[indices[0]] = null
    var consequent = this.visitBlock(nodes[indices[0]].block)
    if(condition) {
      var alternate = this.makeCondition(result, nodes, indices.slice(1))
      return conditionalExpression(condition, consequent, alternate)
    } else if(indices[0]) {
      return consequent
    }
  }
  visitDoctype() {
    return
  }
  visitComment() {
    return
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
  visitCode(code, index) {
    var isPureElse = false
    if(/^if /.test(code.val)) {
      this.currentChain.push([index])
      return extractExpression(code.val.slice(2), this)
    } else if (/^else if /.test(code.val)) {
      this.currentChain[this.currentChain.length - 1].push(index)
      return extractExpression(code.val.slice(7), this)
    } else if (/^else/.test(code.val)) {
      this.currentChain[this.currentChain.length - 1].push(index)
      return
    }
    if(isPureElse) return
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
  get currentChain() {
    return this.chain[this.depth]
  }
}
