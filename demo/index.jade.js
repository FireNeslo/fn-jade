var $ = require("../runtime");module.exports= function template($ctx$ = this) {
  return [$("button", {
    "(click)": e => window.console.log("hello")
  }, [`Hello`])];
}