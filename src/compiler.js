import {expressionStatement, sequenceExpression} from "babel-types"
import {spreadElement, functionDeclaration} from "babel-types"
import {objectExpression, objectProperty} from "babel-types"
import {arrayExpression, callExpression} from "babel-types"
import {blockStatement, returnStatement} from "babel-types"
import {stringLiteral, identifier, unaryExpression} from "babel-types"
import {templateLiteral, conditionalExpression} from "babel-types"
import {variableDeclaration, assignmentExpression} from "babel-types"
import {VariableDeclarator, memberExpression} from "babel-types"
import {numericLiteral, assignmentPattern} from "babel-types"

import {js_beautify as beautify} from "js-beautify"
import template from "babel-template";
import generate from "babel-generator";
import traverse from "babel-traverse"
import {parse} from "babylon"

const CONDITIONAL = /^(if|else|unless)/

var eachTemplate = template(`(OBJECT || []).map((VALUE, KEY)=> {
  return BLOCK
})`)

var reduceTemplate = template(`(OBJECT || []).reduce((nodes, VALUE, KEY)=> {
  return nodes.concat(BLOCK);
}, [])`)

var whileTemplate = template(`(function(children) {
  while(CONDITION) {children = children.concat(BLOCK)}
  return children
}.call(this, []))`)

var assignTemplate = template(`(e => BINDING = e.target[PROPERTY])`)
var eventTemplate = template(`(e => BINDING)`)

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
  if(value && value.trim && /^{[\s\S]*}$/m.test(value.trim())) {
    value = '(' + value + ')'
  }
  var program = parse('; '+value)

  traverse(program, {
    ReferencedIdentifier({node}) {
      if (node.name in compiler.declared) return;
      compiler.declared[node.name] = true
    }
  })
  traverse(program, {
    ExpressionStatement({node}) {
      expressions.push(node.expression)
    },
    VariableDeclarator({node}) {
      var expression = assignmentExpression('=', node.id, node.init)
      delete node.init
      if(!compiler.declared[node.id.name]) {
        compiler.declared[node.id.name] = false
      }
      expressions.push(unaryExpression('void', expression))
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
    this.context = identifier('$ctx$')
    var declarations = this.declarations = []
    this.declared = {
      Array: false,
      Object: false,
      global: false,
      require: false,
      window: false,
      Date: false
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
        variableDeclaration('var', declarations)
      )
    }
    this.imports = []
    this.ast = functionDeclaration(
      identifier('template'),
      [assignmentPattern(this.context, identifier('this'))],
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
    try {
      return this['visit' + node.type](node, index, parent);
    } catch(e) {
      if(this['visit' + node.type]) {
        console.error(e.stack)
      } else {
        console.warn(node.type + ' is not currently supported.')
      }
      return
    }
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
  }
  visitComment() {
  }
  visitBlockComment() {
  }
  visitTag(tag, create) {
    if(tag.code) {
      tag.block.nodes.push(tag.code)
      if(tag.code.block && tag.code.block.nodes && tag.code.block.nodes.length) {
        tag.block.nodes = tag.block.nodes.concat(tag.code.block.nodes)
      }
    }
    create = callExpression(this.create, [
      stringLiteral(tag.name),
      this.visitAttributes(tag.attrs, tag.attributeBlocks),
      this.visitBlock(tag.block)
    ])
    return Object.assign(create, {
      loc: {
        start: {line: tag.line }
      }
    })
  }
  visitAttributes(attrs, blocks=[]) {
    var map = {}
    for(var attr of attrs) {
      var expression = extractExpression(attr.val, this)
      if(attr.name[0] === '[' && attr.name[1] === '(') {
        var event = attr.name.slice(2, -2)
        var handler = assignTemplate({
          BINDING: expression,
          PROPERTY: stringLiteral(event)
        })
        attr.name = '[' + event + ']'
        map['('+event+'Changed)'] = [ handler.expression ]
      } else if(attr.name[0] === '(') {
        expression = eventTemplate({BINDING: expression}).expression
      }
      map[attr.name] || (map[attr.name] = [])
      map[attr.name].push(expression)
    }
    var ret = objectExpression(Object.keys(map).map(attr =>
      objectProperty(
        stringLiteral(attr),
        map[attr].length > 1 ? arrayExpression(map[attr]) : map[attr][0]
      )
    ))
    if(blocks.length) {
      ret = template(`Object.assign(ATTRS, BLOCKS)`)({
        ATTRS: ret,
        BLOCKS: blocks.map(block => extractExpression(block, this))
      }).expression
    }
    return ret
  }
  visitCode(code, index) {
    var isPureElse = false
    if(/^while /.test(code.val)) {
      var CONDITION = extractExpression(code.val.slice(5), this)
      var BLOCK = this.visitBlock(code.block)
      return spreadElement(whileTemplate({CONDITION, BLOCK}).expression)
    } else if(/^if /.test(code.val)) {
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
    var expression = extractExpression(code.val, this)
    if(!code.escape && expression.type === 'StringLiteral') {
      return objectExpression([
        objectProperty(stringLiteral('[innerHTML]'), expression)
      ])
    }
    return code.buffer ? expression : unaryExpression('void', expression)
  }
  visitEach(node) {
    var elements = this.visitBlock(node.block)
    var object = extractExpression(node.obj, this)

    return Object.assign(each({
      BLOCK: elements,
      OBJECT: object,
      VALUE: identifier(node.val),
      KEY: identifier(node.key)
    }), {
      loc: {
        start: {line: node.line}
      }
    })
  }
  visitText(node) {
    return extractExpression('`'+node.val.replace(/#{/g, '${')+'`', this)
  }
  get currentChain() {
    return this.chain[this.depth]
  }
}
