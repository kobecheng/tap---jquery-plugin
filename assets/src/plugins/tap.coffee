# tap Model
#
# jquery插件模式,最后暴露加入"tap"的jquery
#
# touchstart--触发后,记录触摸位置 并addClass:ui-hover
#
# touchmove--触发后,获取触摸移动后的位置
# 如果移出绑定元素,则removeClass:tap-active
# 如果没移出绑定元素,则addClass:tap-active
#
# touchend--触发后给绑定对象removeClass:tap-active
# 如果移出绑定元素,则不执行endCallback
# 如果没移出绑定元素,则执行endCallback
#
# - -------------------------
# 代码实例
# var $ = require(./../tap)
#
# $(selector).tap endCallback
# ---------------------------
#
define ( require, exports, module ) ->
  $ = require "jquery"
  
  $.fn.tap = (endCallback) ->
    startTarget = ""
    startX = ""
    startY = ""
    moveOut = false # 是否移出元素外
    elBound = "" # 元素的左，上，右和下分别相对浏览器视窗的位置
    noScroll = true
    boundMargin = 50
    activeClass = "tap-active"

    # 判断是否支持touch,如果不支持touch就用mouse相关事件代替
    supportTouch = 'ontouchend' in document
    events =
      start: if supportTouch then 'touchstart' else 'mousedown'
      move: if supportTouch then 'touchmove' else 'mousemove'
      end: if supportTouch then 'touchend' else 'mouseup'

# 两个工具函数

    # 功能:获取坐标对应的DOM元素
    # 根据横纵坐标值 iX(clientX) 和 iY 获取对象 oElement 。 oElement 必须支持和响应鼠标事件。
    # 提供的坐标是客户区坐标。客户区的左上角为 (0,0)。
    getTargetByCoords = (x,y) ->
      el = document.elementFromPoint x, y

      if el.nodeType is 3
        return el.parentNode
      else
        return el

    # 功能:获取事件对象元素
    getTarget = (e) ->
      el = e.target

      if el
        if el.nodeType is 3
          return el.parentNode
        else
          return el

      touch = e.targetTouches[0]
      return getTargetByCoords touch.clientX, touch.clientY

# END 工具函数


# event handler------start,move,end

    # begin onStart
    onStart= (e) ->
      target = getTarget e

      return if not target

      $(target).addClass activeClass

      startX = e.clientX
      startY = e.clientY

      if not startX or not startY
        touch = e.targetTouches[0]

        startX = e.clientX
        startY = e.clientY

      startTarget = target

      elBound = if noScroll then do target.getBoundingClientRect else null

    # END onStart


    # begin onMove
    onMove= (e) ->
      return if not startTarget # 没有触摸,就没有startTarget

      do e.preventDefault if noScroll

      x = e.clientX
      y = e.clientY

      target = e.target
      if not target or not x or not y
        touch = e.changedTouches[0]

        x = touch.clientX if not x
        y = touch.clientY if not y

        moveTarget = getTargetByCoords x, y

      if noScroll
        if x > elBound.left - boundMargin and x < elBound.right + boundMargin and y > elBound.top - boundMargin and y < elBound.bottom + boundMargin
          moveOut = false
          $(target).addClass activeClass
        else
          moveOut = true
          $(target).removeClass activeClass
    # END onMove

    # begin onEnd
    onEnd = (e) ->
      return if not startTarget # 没有触摸,就没有startTarget

      target = e.target

      $(target).removeClass activeClass

      if not moveOut
        do endCallback
    # END onEnd


# END event handler------start,move,end

    # begin  绑定事件
    # no-click
    @on "click", (event) ->
      do event.stopPropagation
      do event.preventDefault

    # 监听start,move,end
    $(@)[0].addEventListener events.start, onStart, false
    $(@)[0].addEventListener events.move, onMove, false
    $(@)[0].addEventListener events.end, onEnd, false

    # END 绑定事件

  module.exports = $

# END define
