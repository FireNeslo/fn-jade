import jade from "jade"
import compiler from "./compiler"

export default function fnJade(template, options={}) {
  return jade.render(template, Object.assign({compiler, template}, options))
}


console.log(
fnJade(`
doctype html
style!= require('./slider.sass')
.ft-slider-thumb(left)
.ft-slider-rail
.ft-slider-thumb(right)
`, {
  pretty: true
})
)
