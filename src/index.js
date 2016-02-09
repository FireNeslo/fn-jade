import jade from "jade"
import compiler from "./compiler"
import $ from "./runtime"

export default function vJade(template, options={}) {
  return jade.render(template, Object.assign({compiler, template}, options))
}
