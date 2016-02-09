import jade from "jade"
import compiler from "./compiler"


export default function vJade(template, options={}) {
  return jade.render(template, Object.assign({compiler, template}, options))
}

console.log(
  vJade(`
main
  each post in posts
    article
      header
        h3= post.title
      section= post.content
      footer
        i= post.author || 'Admin'
  `, {
    pretty: true
  })
)
