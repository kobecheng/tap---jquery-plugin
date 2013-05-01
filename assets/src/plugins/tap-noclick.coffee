#tap-noclick.coffee
# ----------
# Setup the app
define ( require, exports, module ) ->
  $ = require "jquery"
  
  $.fn.tapNoClick = (setting) ->

    @on "touchstart", (event) ->
      console.log event.targetTouchse[0]
      do setting.startCall

    @on "touchend", (event) ->
      do setting.endCall

    @on "click", (event) ->
      do event.preventDefault
    
  module.exports = $

# END define
