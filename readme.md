# fn-jade v1

Create a simple template function from jade templates.

## Installation
```bash
$ npm i -S FireNeslo/fn-jade
```

## Example
```js
var options = {
  pretty: true
}
var template = `
main
  each post in posts
    article
      header
        h3= post.title
      section= post.content
      footer
        i= post.author || 'Admin'
        `

console.log(vJade(template, options))

/*
function template(context) {
  var posts = context.posts;
  return ($("main", posts.map(function each(post, $index) {
    return ($("article", [
      $("header", $("h3", post.title)),
      $("section", post.content),
      $("footer", $("i", post.author || 'Admin'))
    ]));
  })));
}
*/
```
