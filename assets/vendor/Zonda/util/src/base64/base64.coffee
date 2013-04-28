###

Zonda Base64.coffee (c) Degas
https://github.com/smallsmallwolf/Zonda

jQuery port (c) 2010 Carlo Zottmann
http://github.com/carlo/jquery-base64

Original code (c) 2010 Nick Galbreath
http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

###

define ( require, exports, module ) ->
  _ = require "underscore"
  _PADCHAR = "="
  _ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

  # 转成字符串，中文转成Unicode形式
  JSON_stringify = (string) ->
    json = JSON.stringify string
    json.replace /[\u007f-\uffff]/g, (c) ->
      return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4)

  _getbyte64 = (s,i) ->
    # This is oddly fast, except on Chrome/V8.
    # Minimal or no improvement in performance by using a
    # object with properties mapping chars to value (eg. 'A': 0)
    idx = _ALPHA.indexOf s.charAt(i)

    if idx is -1
      throw "Cannot decode base64"
    
    return idx

  _decode = (s) ->
    pads = 0
    imax = s.length
    x = []

    s = String(s)

    if imax is 0
      return s

    if imax % 4 isnt 0
      throw "Cannot decode base64"

    if s.charAt(imax - 1) is _PADCHAR
      pads = 1

      if s.charAt(imax - 2) is _PADCHAR
        pads = 2

      # either way, we want to ignore this last block
      imax -= 4

    for i in [0...imax] by 4
      b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12) | (_getbyte64(s, i + 2) << 6) | _getbyte64(s, i + 3);
      x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));

    switch pads
      when 1
        b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12) | (_getbyte64(s, i + 2) << 6)
        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff))

      when 2
        b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12)
        x.push(String.fromCharCode(b10 >> 16))

    return x.join ""
  # END _decode

  _getbyte = (s, i) ->
    x = s.charCodeAt(i)

    if x > 255
      throw "INVALID_CHARACTER_ERR: DOM Exception 5"

    return x

  _encode = (s) ->
    if arguments.length isnt 1
      throw "SyntaxError: exactly one argument required"

    s = String(s)

    x = []
    imax = s.length - s.length % 3

    if s.length is 0
      return s

    for i in [0...imax] by 3
      b10 = (_getbyte(s, i) << 16) | (_getbyte(s, i + 1) << 8) | _getbyte(s, i + 2)
      x.push(_ALPHA.charAt(b10 >> 18))
      x.push(_ALPHA.charAt((b10 >> 12) & 0x3F))
      x.push(_ALPHA.charAt((b10 >> 6) & 0x3f))
      x.push(_ALPHA.charAt(b10 & 0x3f))

    switch s.length - imax
      when 1
        b10 = _getbyte(s, i) << 16
        x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 0x3F) + _PADCHAR + _PADCHAR)

      when 2
        b10 = (_getbyte(s, i) << 16) | (_getbyte(s, i + 1) << 8)
        x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 0x3F) + _ALPHA.charAt((b10 >> 6) & 0x3f) + _PADCHAR)

    return x.join("")
  # END _encode

  module.exports =
    decode : (s) ->
      s = _decode s
      JSON.parse s
    encode : (s) ->
      s = JSON_stringify s
      _encode s

# END define
