#tap.coffee
#
#tap模块
#jquery插件模式,最后暴露新的jquery
#
#touchstart--触发后给绑定对象addClass:ui-hover
#
#touchmove--触发后给绑定对象removeClass:ui-hover
#
#touchend--触发后给绑定对象removeClass:ui-hover,且执行参数传进来的endCallback
#
# -------------------------
#代码实例
#var $ = require(./../tap)
#
#$(selector).tap endCallback
#---------------------------
#
define ( require, exports, module ) ->
  $ = require "jquery"
  
  $.fn.tap= (endCallback) ->

    @on "touchstart", (event) ->
      $(event.target).addClass "ui-hover"

    @on "touchend", (event) ->
      $(event.target).removeClass "ui-hover"
      do endCallback

    @on "click", (event) ->
      do event.preventDefault

    @on "touchmove", (event) ->
      $(event.target).removeClass "ui-hover"
    
  module.exports = $

# END define
