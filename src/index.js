import jade from 'jade'
import compiler from './compiler'

export default function fnJade(template, options) {
  options || (options = {})
  return jade.render(template, Object.assign({compiler, template}, options))
}

