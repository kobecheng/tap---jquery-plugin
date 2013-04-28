# Layout of this APP
# ------------------
# Three parts
#
define ( require, exports, module ) ->
  $ = require "../plugins/tap-noclick"

  $ ->
    $("body").append """
      <a id="touch" href="http://g.cn" class="test">test</a>
    """

    touchStart = (event) ->
      target = if window.event then window.event.srcElement else event.target
      $(target)
        .removeClass("test")
        .addClass("touch")

    touchEnd = (event) ->
      target = if window.event then window.event.srcElement else event.target
      $(target)
        .removeClass("touch")
        .addClass("end")

    setting =
      startCall: touchStart
      endCall: touchEnd

    $("#touch").tapNoClick setting
