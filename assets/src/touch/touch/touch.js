// Generated by CoffeeScript 1.6.2
define(function(require, exports, module) {
  var $, Mustache, tpl;

  $ = require("jquery");
  Mustache = require("mustache");
  tpl = require("./tpl/touch.tpl");
  return $("#touch").html(Mustache.render(tpl));
});
