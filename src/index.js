import jade from "jade"
import compiler from "./compiler"


export default function vJade(template, options={}) {
  return jade.render(template, Object.assign({compiler, template}, options))
}

console.log(
  vJade(`
main
  - var posts = user.posts

  each post in posts
    if post.author
      h1= post.author
    else if post.user
      h1= post.user.name
    else
      h1 Admin
  `, {
    pretty: true
  })
)
