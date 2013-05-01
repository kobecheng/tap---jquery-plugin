# Layout of this APP
# ------------------
# Require plugins
#
define ( require, exports, module ) ->
  #$ = require "../plugins/tap-noclick"
  
  $ = require "../plugins/tap"


  $ ->
    $("body").append """
      <a id="touch" href="http://g.cn" class="test">test</a>
    """
    ###
    setting =
      startCall:  ->
        console.log 1
      endCall: ->
        console.log 2

    $("#touch").tapNoClick setting
    ###
    endcall = ->
      alert 'end'

    $('#touch').tap endcall

