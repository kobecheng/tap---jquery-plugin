# Layout of this APP
# ------------------
#
# One parts
#
# @touch
define ( require, exports, module ) ->
  $ = require "jquery"
  Mustache = require "mustache"
  tpl = require "./tpl/touch.tpl"

  $("#touch").html Mustache.render tpl
