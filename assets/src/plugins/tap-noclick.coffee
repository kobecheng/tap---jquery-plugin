#tap-noclick.coffee
# ----------
# Setup the app
define ( require, exports, module ) ->
  $ = require "jquery"
  
  $.fn.tapNoClick = (setting) ->

    @on "touchstart", (event) ->
      do setting.startCall

    @on "touchend", (event) ->
      do setting.endCall

    @on "click", (event) ->
      do event.preventDefault
    
  module.exports = $

# END define
