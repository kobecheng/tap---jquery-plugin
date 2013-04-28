# Util.StateMachine
#
# state machine for View
# control the UI

define ( require, exports, module ) ->
  _ = require "underscore"
  Backbone = require "backbone"

  StateMachine = ->

  _.extend StateMachine::, Backbone.Events

  StateMachine::add = (view) ->
    @on "change", (curr) ->
      if curr is view
        view.activate()
      else
        view.deactivate()
    , @

    view.active = =>
      @.trigger "change", view

  module.exports = StateMachine

# END define
