# app.coffee
# setup the app
define ( require, exports, module ) ->
  Util = require "util"

  stateMachine = new Util.StateMachine

  main_view =
    activate: ->
      alert "main_view active!"
    deactivate: ->
      console.log "main_view deactive!"

  sub_view =
    activate: ->
      alert "sub_view active!"
    deactivate: ->
      console.log "sub_view deactive!"

  list_view =
    activate: ->
      alert "list_view active!"
    deactivate: ->
      console.log "list_view deactive!"

  stateMachine.add main_view
  stateMachine.add sub_view
  stateMachine.add list_view

  window.main_view = main_view
  window.sub_view = sub_view
  window.list_view = list_view

  Util.dialog
    title: "Hello"
    content: "call me maybe~"
    backdrop: false
    button:
      "checkout": ->
        alert "checkout"
      "test": ->
        alert "test"

  Util.dialog.open()

  console.log typeof $("#zonda-util-dialog")[0]

# END define
