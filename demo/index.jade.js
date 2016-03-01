var $ = require("../runtime");module.exports= function template($ctx$ = this) {
  var user = $ctx$.user;
  return [$("input", {
    "(valueChanged)": e => user.name = e.target["value"],
    "[value]": user.name
  }, [])];
}