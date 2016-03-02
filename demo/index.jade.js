var $ = require("../runtime");module.exports= function template($ctx$ = this) {
  var things = $ctx$.things,
    thingy = $ctx$.thingy;
  return [$("button", {
      "(click)": e => window.console.log("hello")
    }, [`Hello`]),
    $("h1", {}, [`Here is an each over undefined`]), ...(things || []).reduce((nodes, thingy, $index) => {
      return nodes.concat([thingy]);
    }, [])
  ];
}