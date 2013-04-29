# Layout of this APP
# ------------------
# Require plugins
#
define ( require, exports, module ) ->
  $ = require "../plugins/tap-noclick"

  $ ->
    $("body").append """
      <a id="touch" href="http://g.cn" class="test">test</a>
    """
    ###
    touchStart = (event) ->
      target = if window.event then window.event.srcElement else event.target
      $(target)
        .removeClass("test")
        .addClass("touch")

    touchEnd = (event) ->
      target = if window.event then window.event.srcElement else event.target
      console.log target
      $(target)
        .removeClass("touch")
        .addClass("test")

    setting =
      startCall: touchStart
      endCall: touchEnd
    ###

    endCallback = (event) ->
      alert 1

    $("#touch").tap endCallback
