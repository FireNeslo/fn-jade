var $ = require("../runtime");module.exports= function template($ctx$ = this) {
  var stuff = $ctx$.stuff,
    nothing = $ctx$.nothing,
    things = $ctx$.things,
    thingy = $ctx$.thingy,
    a;
  return [$("button", {
      "(click)": e => window.console.log("hello")
    }, [`Hello`]),
    $("h1", {}, [`Here is an each`]), ...(things || []).reduce((nodes, thingy, $index) => {
      return nodes.concat([
        $("p", {}, [thingy])
      ]);
    }, []),
    $("h1", {}, [`Here is an each over undefined`]), ...(nothing || []).reduce((nodes, thingy, $index) => {
      return nodes.concat([
        $("p", {}, [thingy])
      ]);
    }, []),
    $("h1", {}, [`Here is a while`]),
    $("ul", {}, [void void(a = 0), void(a += 5), ...function(children) {
      while (a < 10) {
        children = children.concat([
          $("li", {}, [++a])
        ]);
      }
      return children;
    }.call(this, [])]),
    $("h1", Object.assign({
      "herp": "derp"
    }, {
      derp: stuff
    }), [`Here is dynamic attributes`])
  ];
}