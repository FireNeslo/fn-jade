import jade from "jade"
import compiler from "./compiler"


export default function vJade(template, options={}) {
  return jade.render(template, Object.assign({compiler}, options))
}

console.log(
  vJade(`
main(role="main")
  each post in posts
    - var title = post.title
    article
      header: h3= post.title
      section= post.content
      footer: i= post.author || 'Admin'
  `)
)
