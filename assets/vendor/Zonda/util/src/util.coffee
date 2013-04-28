# util.coffee
define ( require, exports, module ) ->

  module.exports =
    base64: require "./base64/base64"
    dialog: require "./dialog/dialog"
    StateMachine: require "./StateMachine/StateMachine"
    slide: require "./slide/slide"

# END define
