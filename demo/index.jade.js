var $ = require("../runtime");module.exports= function template($ctx$ = this) {
  var nothing = $ctx$.nothing,
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
      while (a < 100) {
        children = children.concat([
          $("li", {}, [++a])
        ]);
      }
      return children;
    }.call(this, [])])
  ];
}