/**
 * Sinon.JS 1.6.0, 2013/02/18
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Contributors: https://github.com/cjohansen/Sinon.JS/blob/master/AUTHORS
 *
 * (The BSD License)
 * 
 * Copyright (c) 2010-2013, Christian Johansen, christian@cjohansen.no
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 *     * Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright notice,
 *       this list of conditions and the following disclaimer in the documentation
 *       and/or other materials provided with the distribution.
 *     * Neither the name of Christian Johansen nor the names of his contributors
 *       may be used to endorse or promote products derived from this software
 *       without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var sinon = (function () {
"use strict";

var buster = (function (setTimeout, B) {
    var isNode = typeof require == "function" && typeof module == "object";
    var div = typeof document != "undefined" && document.createElement("div");
    var F = function () {};

    var buster = {
        bind: function bind(obj, methOrProp) {
            var method = typeof methOrProp == "string" ? obj[methOrProp] : methOrProp;
            var args = Array.prototype.slice.call(arguments, 2);
            return function () {
                var allArgs = args.concat(Array.prototype.slice.call(arguments));
                return method.apply(obj, allArgs);
            };
        },

        partial: function partial(fn) {
            var args = [].slice.call(arguments, 1);
            return function () {
                return fn.apply(this, args.concat([].slice.call(arguments)));
            };
        },

        create: function create(object) {
            F.prototype = object;
            return new F();
        },

        extend: function extend(target) {
            if (!target) { return; }
            for (var i = 1, l = arguments.length, prop; i < l; ++i) {
                for (prop in arguments[i]) {
                    target[prop] = arguments[i][prop];
                }
            }
            return target;
        },

        nextTick: function nextTick(callback) {
            if (typeof process != "undefined" && process.nextTick) {
                return process.nextTick(callback);
            }
            setTimeout(callback, 0);
        },

        functionName: function functionName(func) {
            if (!func) return "";
            if (func.displayName) return func.displayName;
            if (func.name) return func.name;
            var matches = func.toString().match(/function\s+([^\(]+)/m);
            return matches && matches[1] || "";
        },

        isNode: function isNode(obj) {
            if (!div) return false;
            try {
                obj.appendChild(div);
                obj.removeChild(div);
            } catch (e) {
                return false;
            }
            return true;
        },

        isElement: function isElement(obj) {
            return obj && obj.nodeType === 1 && buster.isNode(obj);
        },

        isArray: function isArray(arr) {
            return Object.prototype.toString.call(arr) == "[object Array]";
        },

        flatten: function flatten(arr) {
            var result = [], arr = arr || [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                result = result.concat(buster.isArray(arr[i]) ? flatten(arr[i]) : arr[i]);
            }
            return result;
        },

        each: function each(arr, callback) {
            for (var i = 0, l = arr.length; i < l; ++i) {
                callback(arr[i]);
            }
        },

        map: function map(arr, callback) {
            var results = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                results.push(callback(arr[i]));
            }
            return results;
        },

        parallel: function parallel(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                    callback = null;
                }
            }
            if (fns.length == 0) { return cb(null, []); }
            var remaining = fns.length, results = [];
            function makeDone(num) {
                return function done(err, result) {
                    if (err) { return cb(err); }
                    results[num] = result;
                    if (--remaining == 0) { cb(null, results); }
                };
            }
            for (var i = 0, l = fns.length; i < l; ++i) {
                fns[i](makeDone(i));
            }
        },

        series: function series(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                }
            }
            var remaining = fns.slice();
            var results = [];
            function callNext() {
                if (remaining.length == 0) return cb(null, results);
                var promise = remaining.shift()(next);
                if (promise && typeof promise.then == "function") {
                    promise.then(buster.partial(next, null), next);
                }
            }
            function next(err, result) {
                if (err) return cb(err);
                results.push(result);
                callNext();
            }
            callNext();
        },

        countdown: function countdown(num, done) {
            return function () {
                if (--num == 0) done();
            };
        }
    };

    if (typeof process === "object" &&
        typeof require === "function" && typeof module === "object") {
        var crypto = require("crypto");
        var path = require("path");

        buster.tmpFile = function (fileName) {
            var hashed = crypto.createHash("sha1");
            hashed.update(fileName);
            var tmpfileName = hashed.digest("hex");

            if (process.platform == "win32") {
                return path.join(process.env["TEMP"], tmpfileName);
            } else {
                return path.join("/tmp", tmpfileName);
            }
        };
    }

    if (Array.prototype.some) {
        buster.some = function (arr, fn, thisp) {
            return arr.some(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
        buster.some = function (arr, fun, thisp) {
                        if (arr == null) { throw new TypeError(); }
            arr = Object(arr);
            var len = arr.length >>> 0;
            if (typeof fun !== "function") { throw new TypeError(); }

            for (var i = 0; i < len; i++) {
                if (arr.hasOwnProperty(i) && fun.call(thisp, arr[i], i, arr)) {
                    return true;
                }
            }

            return false;
        };
    }

    if (Array.prototype.filter) {
        buster.filter = function (arr, fn, thisp) {
            return arr.filter(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
        buster.filter = function (fn, thisp) {
                        if (this == null) { throw new TypeError(); }

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fn != "function") { throw new TypeError(); }

            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (fn.call(thisp, val, i, t)) { res.push(val); }
                }
            }

            return res;
        };
    }

    if (isNode) {
        module.exports = buster;
        buster.eventEmitter = require("./buster-event-emitter");
        Object.defineProperty(buster, "defineVersionGetter", {
            get: function () {
                return require("./define-version-getter");
            }
        });
    }

    return buster.extend(B || {}, buster);
}(setTimeout, buster));
if (typeof buster === "undefined") {
    var buster = {};
}

if (typeof module === "object" && typeof require === "function") {
    buster = require("buster-core");
}

buster.format = buster.format || {};
buster.format.excludeConstructors = ["Object", /^.$/];
buster.format.quoteStrings = true;

buster.format.ascii = (function () {
    
    var hasOwn = Object.prototype.hasOwnProperty;

    var specialObjects = [];
    if (typeof global != "undefined") {
        specialObjects.push({ obj: global, value: "[object global]" });
    }
    if (typeof document != "undefined") {
        specialObjects.push({ obj: document, value: "[object HTMLDocument]" });
    }
    if (typeof window != "undefined") {
        specialObjects.push({ obj: window, value: "[object Window]" });
    }

    function keys(object) {
        var k = Object.keys && Object.keys(object) || [];

        if (k.length == 0) {
            for (var prop in object) {
                if (hasOwn.call(object, prop)) {
                    k.push(prop);
                }
            }
        }

        return k.sort();
    }

    function isCircular(object, objects) {
        if (typeof object != "object") {
            return false;
        }

        for (var i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) {
                return true;
            }
        }

        return false;
    }

    function ascii(object, processed, indent) {
        if (typeof object == "string") {
            var quote = typeof this.quoteStrings != "boolean" || this.quoteStrings;
            return processed || quote ? '"' + object + '"' : object;
        }

        if (typeof object == "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) {
            return "[Circular]";
        }

        if (Object.prototype.toString.call(object) == "[object Array]") {
            return ascii.array.call(this, object, processed);
        }

        if (!object) {
            return "" + object;
        }

        if (buster.isElement(object)) {
            return ascii.element(object);
        }

        if (typeof object.toString == "function" &&
            object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        for (var i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].obj) {
                return specialObjects[i].value;
            }
        }

        return ascii.object.call(this, object, processed, indent);
    }

    ascii.func = function (func) {
        return "function " + buster.functionName(func) + "() {}";
    };

    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var pieces = [];

        for (var i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii.call(this, array[i], processed));
        }

        return "[" + pieces.join(", ") + "]";
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = keys(object), prop, str, obj;
        var is = "";
        var length = 3;

        for (var i = 0, l = indent; i < l; ++i) {
            is += " ";
        }

        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii.call(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = ascii.constructorName.call(this, object);
        var prefix = cons ? "[" + cons + "] " : ""

        return (length + indent) > 80 ?
            prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" + is + "}" :
            prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attribute, pairs = [], attrName;

        for (var i = 0, l = attrs.length; i < l; ++i) {
            attribute = attrs.item(i);
            attrName = attribute.nodeName.toLowerCase().replace("html:", "");

            if (attrName == "contenteditable" && attribute.nodeValue == "inherit") {
                continue;
            }

            if (!!attribute.nodeValue) {
                pairs.push(attrName + "=\"" + attribute.nodeValue + "\"");
            }
        }

        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;

        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }

        var res = formatted + pairs.join(" ") + ">" + content + "</" + tagName + ">";

        return res.replace(/ contentEditable="inherit"/, "");
    };

    ascii.constructorName = function (object) {
        var name = buster.functionName(object && object.constructor);
        var excludes = this.excludeConstructors || buster.format.excludeConstructors || [];

        for (var i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] == "string" && excludes[i] == name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    };

    return ascii;
}());

if (typeof module != "undefined") {
    module.exports = buster.format;
}
/*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
/*global module, require, __dirname, document*/
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

var sinon = (function (buster) {
    var div = typeof document != "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;

    function isDOMNode(obj) {
        var success = false;

        try {
            obj.appendChild(div);
            success = div.parentNode == obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }

        return success;
    }

    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }

    function isFunction(obj) {
        return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }

    var sinon = {
        wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }

            if (typeof method != "function") {
                throw new TypeError("Method wrapper should be function");
            }

            var wrappedMethod = object[property];

            if (!isFunction(wrappedMethod)) {
                throw new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                    property + " as function");
            }

            if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                throw new TypeError("Attempted to wrap " + property + " which is already wrapped");
            }

            if (wrappedMethod.calledBefore) {
                var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
                throw new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }

            // IE 8 does not support hasOwnProperty on the window object.
            var owned = hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;

            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    delete object[property];
                }
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };

            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);

            return method;
        },

        extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }

                    // DONT ENUM bug, only care about toString
                    if (arguments[i].hasOwnProperty("toString") &&
                        arguments[i].toString != target.toString) {
                        target.toString = arguments[i].toString;
                    }
                }
            }

            return target;
        },

        create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        },

        deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }
            if (typeof a != "object" || typeof b != "object") {
                return a === b;
            }

            if (isElement(a) || isElement(b)) {
                return a === b;
            }

            if (a === b) {
                return true;
            }

            if ((a === null && b !== null) || (a !== null && b === null)) {
                return false;
            }

            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
                return false;
            }

            if (aString == "[object Array]") {
                if (a.length !== b.length) {
                    return false;
                }

                for (var i = 0, l = a.length; i < l; i += 1) {
                    if (!deepEqual(a[i], b[i])) {
                        return false;
                    }
                }

                return true;
            }

            var prop, aLength = 0, bLength = 0;

            for (prop in a) {
                aLength += 1;

                if (!deepEqual(a[prop], b[prop])) {
                    return false;
                }
            }

            for (prop in b) {
                bLength += 1;
            }

            if (aLength != bLength) {
                return false;
            }

            return true;
        },

        functionName: function functionName(func) {
            var name = func.displayName || func.name;

            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }

            return name;
        },

        functionToString: function toString() {
            if (this.getCall && this.callCount) {
                var thisValue, prop, i = this.callCount;

                while (i--) {
                    thisValue = this.getCall(i).thisValue;

                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }

            return this.displayName || "sinon fake";
        },

        getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;

            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }

            return config;
        },

        format: function (val) {
            return "" + val;
        },

        defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        },

        timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
                count == 2 && "twice" ||
                count == 3 && "thrice" ||
                (count || 0) + " times";
        },

        calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
                    return false;
                }
            }

            return true;
        },

        orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;

                return aId < bId ? -1 : 1;
            });
        },

        log: function () {},

        logError: function (label, err) {
            var msg = label + " threw exception: "
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }

            setTimeout(function () {
                err.message = msg + err.message;
                throw err;
            }, 0);
        },

        typeOf: function (value) {
            if (value === null) {
                return "null";
            }
            else if (value === undefined) {
                return "undefined";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        },

        createStubInstance: function (constructor) {
            if (typeof constructor !== "function") {
                throw new TypeError("The constructor should be a function.");
            }
            return sinon.stub(sinon.create(constructor.prototype));
        }
    };

    var isNode = typeof module == "object" && typeof require == "function";

    if (isNode) {
        try {
            buster = { format: require("buster-format") };
        } catch (e) {}
        module.exports = sinon;
        module.exports.spy = require("./sinon/spy");
        module.exports.stub = require("./sinon/stub");
        module.exports.mock = require("./sinon/mock");
        module.exports.collection = require("./sinon/collection");
        module.exports.assert = require("./sinon/assert");
        module.exports.sandbox = require("./sinon/sandbox");
        module.exports.test = require("./sinon/test");
        module.exports.testCase = require("./sinon/test_case");
        module.exports.assert = require("./sinon/assert");
        module.exports.match = require("./sinon/match");
    }

    if (buster) {
        var formatter = sinon.create(buster.format);
        formatter.quoteStrings = false;
        sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
        };
    } else if (isNode) {
        try {
            var util = require("util");
            sinon.format = function (value) {
                return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
        } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
        }
    }

    return sinon;
}(typeof buster == "object" && buster));

/* @depend ../sinon.js */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Match functions
 *
 * @author Maximilian Antoni (mail@maxantoni.de)
 * @license BSD
 *
 * Copyright (c) 2012 Maximilian Antoni
 */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function assertType(value, type, name) {
        var actual = sinon.typeOf(value);
        if (actual !== type) {
            throw new TypeError("Expected type of " + name + " to be " +
                type + ", but was " + actual);
        }
    }

    var matcher = {
        toString: function () {
            return this.message;
        }
    };

    function isMatcher(object) {
        return matcher.isPrototypeOf(object);
    }

    function matchObject(expectation, actual) {
        if (actual === null || actual === undefined) {
            return false;
        }
        for (var key in expectation) {
            if (expectation.hasOwnProperty(key)) {
                var exp = expectation[key];
                var act = actual[key];
                if (match.isMatcher(exp)) {
                    if (!exp.test(act)) {
                        return false;
                    }
                } else if (sinon.typeOf(exp) === "object") {
                    if (!matchObject(exp, act)) {
                        return false;
                    }
                } else if (!sinon.deepEqual(exp, act)) {
                    return false;
                }
            }
        }
        return true;
    }

    matcher.or = function (m2) {
        if (!isMatcher(m2)) {
            throw new TypeError("Matcher expected");
        }
        var m1 = this;
        var or = sinon.create(matcher);
        or.test = function (actual) {
            return m1.test(actual) || m2.test(actual);
        };
        or.message = m1.message + ".or(" + m2.message + ")";
        return or;
    };

    matcher.and = function (m2) {
        if (!isMatcher(m2)) {
            throw new TypeError("Matcher expected");
        }
        var m1 = this;
        var and = sinon.create(matcher);
        and.test = function (actual) {
            return m1.test(actual) && m2.test(actual);
        };
        and.message = m1.message + ".and(" + m2.message + ")";
        return and;
    };

    var match = function (expectation, message) {
        var m = sinon.create(matcher);
        var type = sinon.typeOf(expectation);
        switch (type) {
        case "object":
            if (typeof expectation.test === "function") {
                m.test = function (actual) {
                    return expectation.test(actual) === true;
                };
                m.message = "match(" + sinon.functionName(expectation.test) + ")";
                return m;
            }
            var str = [];
            for (var key in expectation) {
                if (expectation.hasOwnProperty(key)) {
                    str.push(key + ": " + expectation[key]);
                }
            }
            m.test = function (actual) {
                return matchObject(expectation, actual);
            };
            m.message = "match(" + str.join(", ") + ")";
            break;
        case "number":
            m.test = function (actual) {
                return expectation == actual;
            };
            break;
        case "string":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return actual.indexOf(expectation) !== -1;
            };
            m.message = "match(\"" + expectation + "\")";
            break;
        case "regexp":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return expectation.test(actual);
            };
            break;
        case "function":
            m.test = expectation;
            if (message) {
                m.message = message;
            } else {
                m.message = "match(" + sinon.functionName(expectation) + ")";
            }
            break;
        default:
            m.test = function (actual) {
              return sinon.deepEqual(expectation, actual);
            };
        }
        if (!m.message) {
            m.message = "match(" + expectation + ")";
        }
        return m;
    };

    match.isMatcher = isMatcher;

    match.any = match(function () {
        return true;
    }, "any");

    match.defined = match(function (actual) {
        return actual !== null && actual !== undefined;
    }, "defined");

    match.truthy = match(function (actual) {
        return !!actual;
    }, "truthy");

    match.falsy = match(function (actual) {
        return !actual;
    }, "falsy");

    match.same = function (expectation) {
        return match(function (actual) {
            return expectation === actual;
        }, "same(" + expectation + ")");
    };

    match.typeOf = function (type) {
        assertType(type, "string", "type");
        return match(function (actual) {
            return sinon.typeOf(actual) === type;
        }, "typeOf(\"" + type + "\")");
    };

    match.instanceOf = function (type) {
        assertType(type, "function", "type");
        return match(function (actual) {
            return actual instanceof type;
        }, "instanceOf(" + sinon.functionName(type) + ")");
    };

    function createPropertyMatcher(propertyTest, messagePrefix) {
        return function (property, value) {
            assertType(property, "string", "property");
            var onlyProperty = arguments.length === 1;
            var message = messagePrefix + "(\"" + property + "\"";
            if (!onlyProperty) {
                message += ", " + value;
            }
            message += ")";
            return match(function (actual) {
                if (actual === undefined || actual === null ||
                        !propertyTest(actual, property)) {
                    return false;
                }
                return onlyProperty || sinon.deepEqual(value, actual[property]);
            }, message);
        };
    }

    match.has = createPropertyMatcher(function (actual, property) {
        if (typeof actual === "object") {
            return property in actual;
        }
        return actual[property] !== undefined;
    }, "has");

    match.hasOwn = createPropertyMatcher(function (actual, property) {
        return actual.hasOwnProperty(property);
    }, "hasOwn");

    match.bool = match.typeOf("boolean");
    match.number = match.typeOf("number");
    match.string = match.typeOf("string");
    match.object = match.typeOf("object");
    match.func = match.typeOf("function");
    match.array = match.typeOf("array");
    match.regexp = match.typeOf("regexp");
    match.date = match.typeOf("date");

    if (commonJSModule) {
        module.exports = match;
    } else {
        sinon.match = match;
    }
}(typeof sinon == "object" && sinon || null));

/**
  * @depend ../sinon.js
  * @depend match.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy functions
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var spyCall;
    var callId = 0;
    var push = [].push;
    var slice = Array.prototype.slice;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function spy(object, property) {
        if (!property && typeof object == "function") {
            return spy.create(object);
        }

        if (!object && !property) {
            return spy.create(function () { });
        }

        var method = object[property];
        return sinon.wrapMethod(object, property, spy.create(method));
    }

    sinon.extend(spy, (function () {

        function delegateToCalls(api, method, matchAny, actual, notCalled) {
            api[method] = function () {
                if (!this.called) {
                    if (notCalled) {
                        return notCalled.apply(this, arguments);
                    }
                    return false;
                }

                var currentCall;
                var matches = 0;

                for (var i = 0, l = this.callCount; i < l; i += 1) {
                    currentCall = this.getCall(i);

                    if (currentCall[actual || method].apply(currentCall, arguments)) {
                        matches += 1;

                        if (matchAny) {
                            return true;
                        }
                    }
                }

                return matches === this.callCount;
            };
        }

        function matchingFake(fakes, args, strict) {
            if (!fakes) {
                return;
            }

            var alen = args.length;

            for (var i = 0, l = fakes.length; i < l; i++) {
                if (fakes[i].matches(args, strict)) {
                    return fakes[i];
                }
            }
        }

        function incrementCallCount() {
            this.called = true;
            this.callCount += 1;
            this.notCalled = false;
            this.calledOnce = this.callCount == 1;
            this.calledTwice = this.callCount == 2;
            this.calledThrice = this.callCount == 3;
        }

        function createCallProperties() {
            this.firstCall = this.getCall(0);
            this.secondCall = this.getCall(1);
            this.thirdCall = this.getCall(2);
            this.lastCall = this.getCall(this.callCount - 1);
        }

        var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
        function createProxy(func) {
            // Retain the function length:
            var p;
            if (func.length) {
                eval("p = (function proxy(" + vars.substring(0, func.length * 2 - 1) +
                    ") { return p.invoke(func, this, slice.call(arguments)); });");
            }
            else {
                p = function proxy() {
                    return p.invoke(func, this, slice.call(arguments));
                };
            }
            return p;
        }

        var uuid = 0;

        // Public API
        var spyApi = {
            reset: function () {
                this.called = false;
                this.notCalled = true;
                this.calledOnce = false;
                this.calledTwice = false;
                this.calledThrice = false;
                this.callCount = 0;
                this.firstCall = null;
                this.secondCall = null;
                this.thirdCall = null;
                this.lastCall = null;
                this.args = [];
                this.returnValues = [];
                this.thisValues = [];
                this.exceptions = [];
                this.callIds = [];
                if (this.fakes) {
                    for (var i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].reset();
                    }
                }
            },

            create: function create(func) {
                var name;

                if (typeof func != "function") {
                    func = function () { };
                } else {
                    name = sinon.functionName(func);
                }

                var proxy = createProxy(func);

                sinon.extend(proxy, spy);
                delete proxy.create;
                sinon.extend(proxy, func);

                proxy.reset();
                proxy.prototype = func.prototype;
                proxy.displayName = name || "spy";
                proxy.toString = sinon.functionToString;
                proxy._create = sinon.spy.create;
                proxy.id = "spy#" + uuid++;

                return proxy;
            },

            invoke: function invoke(func, thisValue, args) {
                var matching = matchingFake(this.fakes, args);
                var exception, returnValue;

                incrementCallCount.call(this);
                push.call(this.thisValues, thisValue);
                push.call(this.args, args);
                push.call(this.callIds, callId++);

                try {
                    if (matching) {
                        returnValue = matching.invoke(func, thisValue, args);
                    } else {
                        returnValue = (this.func || func).apply(thisValue, args);
                    }
                } catch (e) {
                    push.call(this.returnValues, undefined);
                    exception = e;
                    throw e;
                } finally {
                    push.call(this.exceptions, exception);
                }

                push.call(this.returnValues, returnValue);

                createCallProperties.call(this);

                return returnValue;
            },

            getCall: function getCall(i) {
                if (i < 0 || i >= this.callCount) {
                    return null;
                }

                return spyCall.create(this, this.thisValues[i], this.args[i],
                                        this.returnValues[i], this.exceptions[i],
                                        this.callIds[i]);
            },

            calledBefore: function calledBefore(spyFn) {
                if (!this.called) {
                    return false;
                }

                if (!spyFn.called) {
                    return true;
                }

                return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
            },

            calledAfter: function calledAfter(spyFn) {
                if (!this.called || !spyFn.called) {
                    return false;
                }

                return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
            },

            withArgs: function () {
                var args = slice.call(arguments);

                if (this.fakes) {
                    var match = matchingFake(this.fakes, args, true);

                    if (match) {
                        return match;
                    }
                } else {
                    this.fakes = [];
                }

                var original = this;
                var fake = this._create();
                fake.matchingAguments = args;
                push.call(this.fakes, fake);

                fake.withArgs = function () {
                    return original.withArgs.apply(original, arguments);
                };

                for (var i = 0; i < this.args.length; i++) {
                    if (fake.matches(this.args[i])) {
                        incrementCallCount.call(fake);
                        push.call(fake.thisValues, this.thisValues[i]);
                        push.call(fake.args, this.args[i]);
                        push.call(fake.returnValues, this.returnValues[i]);
                        push.call(fake.exceptions, this.exceptions[i]);
                        push.call(fake.callIds, this.callIds[i]);
                    }
                }
                createCallProperties.call(fake);

                return fake;
            },

            matches: function (args, strict) {
                var margs = this.matchingAguments;

                if (margs.length <= args.length &&
                    sinon.deepEqual(margs, args.slice(0, margs.length))) {
                    return !strict || margs.length == args.length;
                }
            },

            printf: function (format) {
                var spy = this;
                var args = slice.call(arguments, 1);
                var formatter;

                return (format || "").replace(/%(.)/g, function (match, specifyer) {
                    formatter = spyApi.formatters[specifyer];

                    if (typeof formatter == "function") {
                        return formatter.call(null, spy, args);
                    } else if (!isNaN(parseInt(specifyer), 10)) {
                        return sinon.format(args[specifyer - 1]);
                    }

                    return "%" + specifyer;
                });
            }
        };

        delegateToCalls(spyApi, "calledOn", true);
        delegateToCalls(spyApi, "alwaysCalledOn", false, "calledOn");
        delegateToCalls(spyApi, "calledWith", true);
        delegateToCalls(spyApi, "calledWithMatch", true);
        delegateToCalls(spyApi, "alwaysCalledWith", false, "calledWith");
        delegateToCalls(spyApi, "alwaysCalledWithMatch", false, "calledWithMatch");
        delegateToCalls(spyApi, "calledWithExactly", true);
        delegateToCalls(spyApi, "alwaysCalledWithExactly", false, "calledWithExactly");
        delegateToCalls(spyApi, "neverCalledWith", false, "notCalledWith",
            function () { return true; });
        delegateToCalls(spyApi, "neverCalledWithMatch", false, "notCalledWithMatch",
            function () { return true; });
        delegateToCalls(spyApi, "threw", true);
        delegateToCalls(spyApi, "alwaysThrew", false, "threw");
        delegateToCalls(spyApi, "returned", true);
        delegateToCalls(spyApi, "alwaysReturned", false, "returned");
        delegateToCalls(spyApi, "calledWithNew", true);
        delegateToCalls(spyApi, "alwaysCalledWithNew", false, "calledWithNew");
        delegateToCalls(spyApi, "callArg", false, "callArgWith", function () {
            throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
        });
        spyApi.callArgWith = spyApi.callArg;
        delegateToCalls(spyApi, "callArgOn", false, "callArgOnWith", function () {
            throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
        });
        spyApi.callArgOnWith = spyApi.callArgOn;
        delegateToCalls(spyApi, "yield", false, "yield", function () {
            throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
        });
        // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
        spyApi.invokeCallback = spyApi.yield;
        delegateToCalls(spyApi, "yieldOn", false, "yieldOn", function () {
            throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
        });
        delegateToCalls(spyApi, "yieldTo", false, "yieldTo", function (property) {
            throw new Error(this.toString() + " cannot yield to '" + property +
                "' since it was not yet invoked.");
        });
        delegateToCalls(spyApi, "yieldToOn", false, "yieldToOn", function (property) {
            throw new Error(this.toString() + " cannot yield to '" + property +
                "' since it was not yet invoked.");
        });

        spyApi.formatters = {
            "c": function (spy) {
                return sinon.timesInWords(spy.callCount);
            },

            "n": function (spy) {
                return spy.toString();
            },

            "C": function (spy) {
                var calls = [];

                for (var i = 0, l = spy.callCount; i < l; ++i) {
                    var stringifiedCall = "    " + spy.getCall(i).toString();
                    if (/\n/.test(calls[i - 1])) {
                        stringifiedCall = "\n" + stringifiedCall;
                    }
                    push.call(calls, stringifiedCall);
                }

                return calls.length > 0 ? "\n" + calls.join("\n") : "";
            },

            "t": function (spy) {
                var objects = [];

                for (var i = 0, l = spy.callCount; i < l; ++i) {
                    push.call(objects, sinon.format(spy.thisValues[i]));
                }

                return objects.join(", ");
            },

            "*": function (spy, args) {
                var formatted = [];

                for (var i = 0, l = args.length; i < l; ++i) {
                    push.call(formatted, sinon.format(args[i]));
                }

                return formatted.join(", ");
            }
        };

        return spyApi;
    }()));

    spyCall = (function () {

        function throwYieldError(proxy, text, args) {
            var msg = sinon.functionName(proxy) + text;
            if (args.length) {
                msg += " Received [" + slice.call(args).join(", ") + "]";
            }
            throw new Error(msg);
        }

        var callApi = {
            create: function create(spy, thisValue, args, returnValue, exception, id) {
                var proxyCall = sinon.create(spyCall);
                delete proxyCall.create;
                proxyCall.proxy = spy;
                proxyCall.thisValue = thisValue;
                proxyCall.args = args;
                proxyCall.returnValue = returnValue;
                proxyCall.exception = exception;
                proxyCall.callId = typeof id == "number" && id || callId++;

                return proxyCall;
            },

            calledOn: function calledOn(thisValue) {
                if (sinon.match && sinon.match.isMatcher(thisValue)) {
                    return thisValue.test(this.thisValue);
                }
                return this.thisValue === thisValue;
            },

            calledWith: function calledWith() {
                for (var i = 0, l = arguments.length; i < l; i += 1) {
                    if (!sinon.deepEqual(arguments[i], this.args[i])) {
                        return false;
                    }
                }

                return true;
            },

            calledWithMatch: function calledWithMatch() {
                for (var i = 0, l = arguments.length; i < l; i += 1) {
                    var actual = this.args[i];
                    var expectation = arguments[i];
                    if (!sinon.match || !sinon.match(expectation).test(actual)) {
                        return false;
                    }
                }
                return true;
            },

            calledWithExactly: function calledWithExactly() {
                return arguments.length == this.args.length &&
                    this.calledWith.apply(this, arguments);
            },

            notCalledWith: function notCalledWith() {
                return !this.calledWith.apply(this, arguments);
            },

            notCalledWithMatch: function notCalledWithMatch() {
                return !this.calledWithMatch.apply(this, arguments);
            },

            returned: function returned(value) {
                return sinon.deepEqual(value, this.returnValue);
            },

            threw: function threw(error) {
                if (typeof error == "undefined" || !this.exception) {
                    return !!this.exception;
                }

                if (typeof error == "string") {
                    return this.exception.name == error;
                }

                return this.exception === error;
            },

            calledWithNew: function calledWithNew(thisValue) {
                return this.thisValue instanceof this.proxy;
            },

            calledBefore: function (other) {
                return this.callId < other.callId;
            },

            calledAfter: function (other) {
                return this.callId > other.callId;
            },

            callArg: function (pos) {
                this.args[pos]();
            },

            callArgOn: function (pos, thisValue) {
                this.args[pos].apply(thisValue);
            },

            callArgWith: function (pos) {
                this.callArgOnWith.apply(this, [pos, null].concat(slice.call(arguments, 1)));
            },

            callArgOnWith: function (pos, thisValue) {
                var args = slice.call(arguments, 2);
                this.args[pos].apply(thisValue, args);
            },

            "yield": function () {
                this.yieldOn.apply(this, [null].concat(slice.call(arguments, 0)));
            },

            yieldOn: function (thisValue) {
                var args = this.args;
                for (var i = 0, l = args.length; i < l; ++i) {
                    if (typeof args[i] === "function") {
                        args[i].apply(thisValue, slice.call(arguments, 1));
                        return;
                    }
                }
                throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
            },

            yieldTo: function (prop) {
                this.yieldToOn.apply(this, [prop, null].concat(slice.call(arguments, 1)));
            },

            yieldToOn: function (prop, thisValue) {
                var args = this.args;
                for (var i = 0, l = args.length; i < l; ++i) {
                    if (args[i] && typeof args[i][prop] === "function") {
                        args[i][prop].apply(thisValue, slice.call(arguments, 2));
                        return;
                    }
                }
                throwYieldError(this.proxy, " cannot yield to '" + prop +
                    "' since no callback was passed.", args);
            },

            toString: function () {
                var callStr = this.proxy.toString() + "(";
                var args = [];

                for (var i = 0, l = this.args.length; i < l; ++i) {
                    push.call(args, sinon.format(this.args[i]));
                }

                callStr = callStr + args.join(", ") + ")";

                if (typeof this.returnValue != "undefined") {
                    callStr += " => " + sinon.format(this.returnValue);
                }

                if (this.exception) {
                    callStr += " !" + this.exception.name;

                    if (this.exception.message) {
                        callStr += "(" + this.exception.message + ")";
                    }
                }

                return callStr;
            }
        };
        callApi.invokeCallback = callApi.yield;
        return callApi;
    }());

    spy.spyCall = spyCall;

    // This steps outside the module sandbox and will be removed
    sinon.spyCall = spyCall;

    if (commonJSModule) {
        module.exports = spy;
    } else {
        sinon.spy = spy;
    }
}(typeof sinon == "object" && sinon || null));

/**
 * @depend ../sinon.js
 * @depend spy.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon*/
/**
 * Stub functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function stub(object, property, func) {
        if (!!func && typeof func != "function") {
            throw new TypeError("Custom stub should be function");
        }

        var wrapper;

        if (func) {
            wrapper = sinon.spy && sinon.spy.create ? sinon.spy.create(func) : func;
        } else {
            wrapper = stub.create();
        }

        if (!object && !property) {
            return sinon.stub.create();
        }

        if (!property && !!object && typeof object == "object") {
            for (var prop in object) {
                if (typeof object[prop] === "function") {
                    stub(object, prop);
                }
            }

            return object;
        }

        return sinon.wrapMethod(object, property, wrapper);
    }

    function getChangingValue(stub, property) {
        var index = stub.callCount - 1;
        var values = stub[property];
        var prop = index in values ? values[index] : values[values.length - 1];
        stub[property + "Last"] = prop;

        return prop;
    }

    function getCallback(stub, args) {
        var callArgAt = getChangingValue(stub, "callArgAts");

        if (callArgAt < 0) {
            var callArgProp = getChangingValue(stub, "callArgProps");

            for (var i = 0, l = args.length; i < l; ++i) {
                if (!callArgProp && typeof args[i] == "function") {
                    return args[i];
                }

                if (callArgProp && args[i] &&
                    typeof args[i][callArgProp] == "function") {
                    return args[i][callArgProp];
                }
            }

            return null;
        }

        return args[callArgAt];
    }

    var join = Array.prototype.join;

    function getCallbackError(stub, func, args) {
        if (stub.callArgAtsLast < 0) {
            var msg;

            if (stub.callArgPropsLast) {
                msg = sinon.functionName(stub) +
                    " expected to yield to '" + stub.callArgPropsLast +
                    "', but no object with such a property was passed."
            } else {
                msg = sinon.functionName(stub) +
                            " expected to yield, but no callback was passed."
            }

            if (args.length > 0) {
                msg += " Received [" + join.call(args, ", ") + "]";
            }

            return msg;
        }

        return "argument at index " + stub.callArgAtsLast + " is not a function: " + func;
    }

    var nextTick = (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
        } else if (typeof setImmediate === "function") {
            return setImmediate;
        } else {
            return function (callback) {
                setTimeout(callback, 0);
            };
        }
    })();

    function callCallback(stub, args) {
        if (stub.callArgAts.length > 0) {
            var func = getCallback(stub, args);

            if (typeof func != "function") {
                throw new TypeError(getCallbackError(stub, func, args));
            }

            var callbackArguments = getChangingValue(stub, "callbackArguments");
            var callbackContext = getChangingValue(stub, "callbackContexts");

            if (stub.callbackAsync) {
                nextTick(function() {
                    func.apply(callbackContext, callbackArguments);
                });
            } else {
                func.apply(callbackContext, callbackArguments);
            }
        }
    }

    var uuid = 0;

    sinon.extend(stub, (function () {
        var slice = Array.prototype.slice, proto;

        function throwsException(error, message) {
            if (typeof error == "string") {
                this.exception = new Error(message || "");
                this.exception.name = error;
            } else if (!error) {
                this.exception = new Error("Error");
            } else {
                this.exception = error;
            }

            return this;
        }

        proto = {
            create: function create() {
                var functionStub = function () {

                    callCallback(functionStub, arguments);

                    if (functionStub.exception) {
                        throw functionStub.exception;
                    } else if (typeof functionStub.returnArgAt == 'number') {
                        return arguments[functionStub.returnArgAt];
                    } else if (functionStub.returnThis) {
                        return this;
                    }
                    return functionStub.returnValue;
                };

                functionStub.id = "stub#" + uuid++;
                var orig = functionStub;
                functionStub = sinon.spy.create(functionStub);
                functionStub.func = orig;

                functionStub.callArgAts = [];
                functionStub.callbackArguments = [];
                functionStub.callbackContexts = [];
                functionStub.callArgProps = [];

                sinon.extend(functionStub, stub);
                functionStub._create = sinon.stub.create;
                functionStub.displayName = "stub";
                functionStub.toString = sinon.functionToString;

                return functionStub;
            },

            resetBehavior: function () {
                var i;

                this.callArgAts = [];
                this.callbackArguments = [];
                this.callbackContexts = [];
                this.callArgProps = [];

                delete this.returnValue;
                delete this.returnArgAt;
                this.returnThis = false;

                if (this.fakes) {
                    for (i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].resetBehavior();
                    }
                }
            },

            returns: function returns(value) {
                this.returnValue = value;

                return this;
            },

            returnsArg: function returnsArg(pos) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }

                this.returnArgAt = pos;

                return this;
            },

            returnsThis: function returnsThis() {
                this.returnThis = true;

                return this;
            },

            "throws": throwsException,
            throwsException: throwsException,

            callsArg: function callsArg(pos) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }

                this.callArgAts.push(pos);
                this.callbackArguments.push([]);
                this.callbackContexts.push(undefined);
                this.callArgProps.push(undefined);

                return this;
            },

            callsArgOn: function callsArgOn(pos, context) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAts.push(pos);
                this.callbackArguments.push([]);
                this.callbackContexts.push(context);
                this.callArgProps.push(undefined);

                return this;
            },

            callsArgWith: function callsArgWith(pos) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }

                this.callArgAts.push(pos);
                this.callbackArguments.push(slice.call(arguments, 1));
                this.callbackContexts.push(undefined);
                this.callArgProps.push(undefined);

                return this;
            },

            callsArgOnWith: function callsArgWith(pos, context) {
                if (typeof pos != "number") {
                    throw new TypeError("argument index is not number");
                }
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAts.push(pos);
                this.callbackArguments.push(slice.call(arguments, 2));
                this.callbackContexts.push(context);
                this.callArgProps.push(undefined);

                return this;
            },

            yields: function () {
                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 0));
                this.callbackContexts.push(undefined);
                this.callArgProps.push(undefined);

                return this;
            },

            yieldsOn: function (context) {
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 1));
                this.callbackContexts.push(context);
                this.callArgProps.push(undefined);

                return this;
            },

            yieldsTo: function (prop) {
                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 1));
                this.callbackContexts.push(undefined);
                this.callArgProps.push(prop);

                return this;
            },

            yieldsToOn: function (prop, context) {
                if (typeof context != "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAts.push(-1);
                this.callbackArguments.push(slice.call(arguments, 2));
                this.callbackContexts.push(context);
                this.callArgProps.push(prop);

                return this;
            }
        };

        // create asynchronous versions of callsArg* and yields* methods
        for (var method in proto) {
            // need to avoid creating anotherasync versions of the newly added async methods
            if (proto.hasOwnProperty(method) &&
                method.match(/^(callsArg|yields|thenYields$)/) &&
                !method.match(/Async/)) {
                proto[method + 'Async'] = (function (syncFnName) {
                    return function () {
                        this.callbackAsync = true;
                        return this[syncFnName].apply(this, arguments);
                    };
                })(method);
            }
        }

        return proto;

    }()));

    if (commonJSModule) {
        module.exports = stub;
    } else {
        sinon.stub = stub;
    }
}(typeof sinon == "object" && sinon || null));

/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false*/
/*global module, require, sinon*/
/**
 * Mock functions.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var push = [].push;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function mock(object) {
        if (!object) {
            return sinon.expectation.create("Anonymous mock");
        }

        return mock.create(object);
    }

    sinon.mock = mock;

    sinon.extend(mock, (function () {
        function each(collection, callback) {
            if (!collection) {
                return;
            }

            for (var i = 0, l = collection.length; i < l; i += 1) {
                callback(collection[i]);
            }
        }

        return {
            create: function create(object) {
                if (!object) {
                    throw new TypeError("object is null");
                }

                var mockObject = sinon.extend({}, mock);
                mockObject.object = object;
                delete mockObject.create;

                return mockObject;
            },

            expects: function expects(method) {
                if (!method) {
                    throw new TypeError("method is falsy");
                }

                if (!this.expectations) {
                    this.expectations = {};
                    this.proxies = [];
                }

                if (!this.expectations[method]) {
                    this.expectations[method] = [];
                    var mockObject = this;

                    sinon.wrapMethod(this.object, method, function () {
                        return mockObject.invokeMethod(method, this, arguments);
                    });

                    push.call(this.proxies, method);
                }

                var expectation = sinon.expectation.create(method);
                push.call(this.expectations[method], expectation);

                return expectation;
            },

            restore: function restore() {
                var object = this.object;

                each(this.proxies, function (proxy) {
                    if (typeof object[proxy].restore == "function") {
                        object[proxy].restore();
                    }
                });
            },

            verify: function verify() {
                var expectations = this.expectations || {};
                var messages = [], met = [];

                each(this.proxies, function (proxy) {
                    each(expectations[proxy], function (expectation) {
                        if (!expectation.met()) {
                            push.call(messages, expectation.toString());
                        } else {
                            push.call(met, expectation.toString());
                        }
                    });
                });

                this.restore();

                if (messages.length > 0) {
                    sinon.expectation.fail(messages.concat(met).join("\n"));
                } else {
                    sinon.expectation.pass(messages.concat(met).join("\n"));
                }

                return true;
            },

            invokeMethod: function invokeMethod(method, thisValue, args) {
                var expectations = this.expectations && this.expectations[method];
                var length = expectations && expectations.length || 0, i;

                for (i = 0; i < length; i += 1) {
                    if (!expectations[i].met() &&
                        expectations[i].allowsCall(thisValue, args)) {
                        return expectations[i].apply(thisValue, args);
                    }
                }

                var messages = [], available, exhausted = 0;

                for (i = 0; i < length; i += 1) {
                    if (expectations[i].allowsCall(thisValue, args)) {
                        available = available || expectations[i];
                    } else {
                        exhausted += 1;
                    }
                    push.call(messages, "    " + expectations[i].toString());
                }

                if (exhausted === 0) {
                    return available.apply(thisValue, args);
                }

                messages.unshift("Unexpected call: " + sinon.spyCall.toString.call({
                    proxy: method,
                    args: args
                }));

                sinon.expectation.fail(messages.join("\n"));
            }
        };
    }()));

    var times = sinon.timesInWords;

    sinon.expectation = (function () {
        var slice = Array.prototype.slice;
        var _invoke = sinon.spy.invoke;

        function callCountInWords(callCount) {
            if (callCount == 0) {
                return "never called";
            } else {
                return "called " + times(callCount);
            }
        }

        function expectedCallCountInWords(expectation) {
            var min = expectation.minCalls;
            var max = expectation.maxCalls;

            if (typeof min == "number" && typeof max == "number") {
                var str = times(min);

                if (min != max) {
                    str = "at least " + str + " and at most " + times(max);
                }

                return str;
            }

            if (typeof min == "number") {
                return "at least " + times(min);
            }

            return "at most " + times(max);
        }

        function receivedMinCalls(expectation) {
            var hasMinLimit = typeof expectation.minCalls == "number";
            return !hasMinLimit || expectation.callCount >= expectation.minCalls;
        }

        function receivedMaxCalls(expectation) {
            if (typeof expectation.maxCalls != "number") {
                return false;
            }

            return expectation.callCount == expectation.maxCalls;
        }

        return {
            minCalls: 1,
            maxCalls: 1,

            create: function create(methodName) {
                var expectation = sinon.extend(sinon.stub.create(), sinon.expectation);
                delete expectation.create;
                expectation.method = methodName;

                return expectation;
            },

            invoke: function invoke(func, thisValue, args) {
                this.verifyCallAllowed(thisValue, args);

                return _invoke.apply(this, arguments);
            },

            atLeast: function atLeast(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.maxCalls = null;
                    this.limitsSet = true;
                }

                this.minCalls = num;

                return this;
            },

            atMost: function atMost(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.minCalls = null;
                    this.limitsSet = true;
                }

                this.maxCalls = num;

                return this;
            },

            never: function never() {
                return this.exactly(0);
            },

            once: function once() {
                return this.exactly(1);
            },

            twice: function twice() {
                return this.exactly(2);
            },

            thrice: function thrice() {
                return this.exactly(3);
            },

            exactly: function exactly(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not a number");
                }

                this.atLeast(num);
                return this.atMost(num);
            },

            met: function met() {
                return !this.failed && receivedMinCalls(this);
            },

            verifyCallAllowed: function verifyCallAllowed(thisValue, args) {
                if (receivedMaxCalls(this)) {
                    this.failed = true;
                    sinon.expectation.fail(this.method + " already called " + times(this.maxCalls));
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    sinon.expectation.fail(this.method + " called with " + thisValue + " as thisValue, expected " +
                        this.expectedThis);
                }

                if (!("expectedArguments" in this)) {
                    return;
                }

                if (!args) {
                    sinon.expectation.fail(this.method + " received no arguments, expected " +
                        sinon.format(this.expectedArguments));
                }

                if (args.length < this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too few arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too many arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", expected " + sinon.format(this.expectedArguments));
                    }
                }
            },

            allowsCall: function allowsCall(thisValue, args) {
                if (this.met() && receivedMaxCalls(this)) {
                    return false;
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    return false;
                }

                if (!("expectedArguments" in this)) {
                    return true;
                }

                args = args || [];

                if (args.length < this.expectedArguments.length) {
                    return false;
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    return false;
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        return false;
                    }
                }

                return true;
            },

            withArgs: function withArgs() {
                this.expectedArguments = slice.call(arguments);
                return this;
            },

            withExactArgs: function withExactArgs() {
                this.withArgs.apply(this, arguments);
                this.expectsExactArgCount = true;
                return this;
            },

            on: function on(thisValue) {
                this.expectedThis = thisValue;
                return this;
            },

            toString: function () {
                var args = (this.expectedArguments || []).slice();

                if (!this.expectsExactArgCount) {
                    push.call(args, "[...]");
                }

                var callStr = sinon.spyCall.toString.call({
                    proxy: this.method || "anonymous mock expectation",
                    args: args
                });

                var message = callStr.replace(", [...", "[, ...") + " " +
                    expectedCallCountInWords(this);

                if (this.met()) {
                    return "Expectation met: " + message;
                }

                return "Expected " + message + " (" +
                    callCountInWords(this.callCount) + ")";
            },

            verify: function verify() {
                if (!this.met()) {
                    sinon.expectation.fail(this.toString());
                } else {
                    sinon.expectation.pass(this.toString());
                }

                return true;
            },

            pass: function(message) {
              sinon.assert.pass(message);
            },
            fail: function (message) {
                var exception = new Error(message);
                exception.name = "ExpectationError";

                throw exception;
            }
        };
    }());

    if (commonJSModule) {
        module.exports = mock;
    } else {
        sinon.mock = mock;
    }
}(typeof sinon == "object" && sinon || null));

/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true*/
/*global module, require, sinon*/
/**
 * Collections of stubs, spies and mocks.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var push = [].push;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function getFakes(fakeCollection) {
        if (!fakeCollection.fakes) {
            fakeCollection.fakes = [];
        }

        return fakeCollection.fakes;
    }

    function each(fakeCollection, method) {
        var fakes = getFakes(fakeCollection);

        for (var i = 0, l = fakes.length; i < l; i += 1) {
            if (typeof fakes[i][method] == "function") {
                fakes[i][method]();
            }
        }
    }

    function compact(fakeCollection) {
        var fakes = getFakes(fakeCollection);
        var i = 0;
        while (i < fakes.length) {
          fakes.splice(i, 1);
        }
    }

    var collection = {
        verify: function resolve() {
            each(this, "verify");
        },

        restore: function restore() {
            each(this, "restore");
            compact(this);
        },

        verifyAndRestore: function verifyAndRestore() {
            var exception;

            try {
                this.verify();
            } catch (e) {
                exception = e;
            }

            this.restore();

            if (exception) {
                throw exception;
            }
        },

        add: function add(fake) {
            push.call(getFakes(this), fake);
            return fake;
        },

        spy: function spy() {
            return this.add(sinon.spy.apply(sinon, arguments));
        },

        stub: function stub(object, property, value) {
            if (property) {
                var original = object[property];

                if (typeof original != "function") {
                    if (!hasOwnProperty.call(object, property)) {
                        throw new TypeError("Cannot stub non-existent own property " + property);
                    }

                    object[property] = value;

                    return this.add({
                        restore: function () {
                            object[property] = original;
                        }
                    });
                }
            }
            if (!property && !!object && typeof object == "object") {
                var stubbedObj = sinon.stub.apply(sinon, arguments);

                for (var prop in stubbedObj) {
                    if (typeof stubbedObj[prop] === "function") {
                        this.add(stubbedObj[prop]);
                    }
                }

                return stubbedObj;
            }

            return this.add(sinon.stub.apply(sinon, arguments));
        },

        mock: function mock() {
            return this.add(sinon.mock.apply(sinon, arguments));
        },

        inject: function inject(obj) {
            var col = this;

            obj.spy = function () {
                return col.spy.apply(col, arguments);
            };

            obj.stub = function () {
                return col.stub.apply(col, arguments);
            };

            obj.mock = function () {
                return col.mock.apply(col, arguments);
            };

            return obj;
        }
    };

    if (commonJSModule) {
        module.exports = collection;
    } else {
        sinon.collection = collection;
    }
}(typeof sinon == "object" && sinon || null));

/*jslint eqeqeq: false, plusplus: false, evil: true, onevar: false, browser: true, forin: false*/
/*global module, require, window*/
/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

if (typeof sinon == "undefined") {
    var sinon = {};
}

(function (global) {
    var id = 1;

    function addTimer(args, recurring) {
        if (args.length === 0) {
            throw new Error("Function requires at least 1 parameter");
        }

        var toId = id++;
        var delay = args[1] || 0;

        if (!this.timeouts) {
            this.timeouts = {};
        }

        this.timeouts[toId] = {
            id: toId,
            func: args[0],
            callAt: this.now + delay,
            invokeArgs: Array.prototype.slice.call(args, 2)
        };

        if (recurring === true) {
            this.timeouts[toId].interval = delay;
        }

        return toId;
    }

    function parseTime(str) {
        if (!str) {
            return 0;
        }

        var strings = str.split(":");
        var l = strings.length, i = l;
        var ms = 0, parsed;

        if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
            throw new Error("tick only understands numbers and 'h:m:s'");
        }

        while (i--) {
            parsed = parseInt(strings[i], 10);

            if (parsed >= 60) {
                throw new Error("Invalid time " + str);
            }

            ms += parsed * Math.pow(60, (l - i - 1));
        }

        return ms * 1000;
    }

    function createObject(object) {
        var newObject;

        if (Object.create) {
            newObject = Object.create(object);
        } else {
            var F = function () {};
            F.prototype = object;
            newObject = new F();
        }

        newObject.Date.clock = newObject;
        return newObject;
    }

    sinon.clock = {
        now: 0,

        create: function create(now) {
            var clock = createObject(this);

            if (typeof now == "number") {
                clock.now = now;
            }

            if (!!now && typeof now == "object") {
                throw new TypeError("now should be milliseconds since UNIX epoch");
            }

            return clock;
        },

        setTimeout: function setTimeout(callback, timeout) {
            return addTimer.call(this, arguments, false);
        },

        clearTimeout: function clearTimeout(timerId) {
            if (!this.timeouts) {
                this.timeouts = [];
            }

            if (timerId in this.timeouts) {
                delete this.timeouts[timerId];
            }
        },

        setInterval: function setInterval(callback, timeout) {
            return addTimer.call(this, arguments, true);
        },

        clearInterval: function clearInterval(timerId) {
            this.clearTimeout(timerId);
        },

        tick: function tick(ms) {
            ms = typeof ms == "number" ? ms : parseTime(ms);
            var tickFrom = this.now, tickTo = this.now + ms, previous = this.now;
            var timer = this.firstTimerInRange(tickFrom, tickTo);

            var firstException;
            while (timer && tickFrom <= tickTo) {
                if (this.timeouts[timer.id]) {
                    tickFrom = this.now = timer.callAt;
                    try {
                      this.callTimer(timer);
                    } catch (e) {
                      firstException = firstException || e;
                    }
                }

                timer = this.firstTimerInRange(previous, tickTo);
                previous = tickFrom;
            }

            this.now = tickTo;

            if (firstException) {
              throw firstException;
            }

            return this.now;
        },

        firstTimerInRange: function (from, to) {
            var timer, smallest, originalTimer;

            for (var id in this.timeouts) {
                if (this.timeouts.hasOwnProperty(id)) {
                    if (this.timeouts[id].callAt < from || this.timeouts[id].callAt > to) {
                        continue;
                    }

                    if (!smallest || this.timeouts[id].callAt < smallest) {
                        originalTimer = this.timeouts[id];
                        smallest = this.timeouts[id].callAt;

                        timer = {
                            func: this.timeouts[id].func,
                            callAt: this.timeouts[id].callAt,
                            interval: this.timeouts[id].interval,
                            id: this.timeouts[id].id,
                            invokeArgs: this.timeouts[id].invokeArgs
                        };
                    }
                }
            }

            return timer || null;
        },

        callTimer: function (timer) {
            if (typeof timer.interval == "number") {
                this.timeouts[timer.id].callAt += timer.interval;
            } else {
                delete this.timeouts[timer.id];
            }

            try {
                if (typeof timer.func == "function") {
                    timer.func.apply(null, timer.invokeArgs);
                } else {
                    eval(timer.func);
                }
            } catch (e) {
              var exception = e;
            }

            if (!this.timeouts[timer.id]) {
                if (exception) {
                  throw exception;
                }
                return;
            }

            if (exception) {
              throw exception;
            }
        },

        reset: function reset() {
            this.timeouts = {};
        },

        Date: (function () {
            var NativeDate = Date;

            function ClockDate(year, month, date, hour, minute, second, ms) {
                // Defensive and verbose to avoid potential harm in passing
                // explicit undefined when user does not pass argument
                switch (arguments.length) {
                case 0:
                    return new NativeDate(ClockDate.clock.now);
                case 1:
                    return new NativeDate(year);
                case 2:
                    return new NativeDate(year, month);
                case 3:
                    return new NativeDate(year, month, date);
                case 4:
                    return new NativeDate(year, month, date, hour);
                case 5:
                    return new NativeDate(year, month, date, hour, minute);
                case 6:
                    return new NativeDate(year, month, date, hour, minute, second);
                default:
                    return new NativeDate(year, month, date, hour, minute, second, ms);
                }
            }

            return mirrorDateProperties(ClockDate, NativeDate);
        }())
    };

    function mirrorDateProperties(target, source) {
        if (source.now) {
            target.now = function now() {
                return target.clock.now;
            };
        } else {
            delete target.now;
        }

        if (source.toSource) {
            target.toSource = function toSource() {
                return source.toSource();
            };
        } else {
            delete target.toSource;
        }

        target.toString = function toString() {
            return source.toString();
        };

        target.prototype = source.prototype;
        target.parse = source.parse;
        target.UTC = source.UTC;
        target.prototype.toUTCString = source.prototype.toUTCString;
        return target;
    }

    var methods = ["Date", "setTimeout", "setInterval",
                   "clearTimeout", "clearInterval"];

    function restore() {
        var method;

        for (var i = 0, l = this.methods.length; i < l; i++) {
            method = this.methods[i];
            if (global[method].hadOwnProperty) {
                global[method] = this["_" + method];
            } else {
                delete global[method];
            }
        }

        // Prevent multiple executions which will completely remove these props
        this.methods = [];
    }

    function stubGlobal(method, clock) {
        clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(global, method);
        clock["_" + method] = global[method];

        if (method == "Date") {
            var date = mirrorDateProperties(clock[method], global[method]);
            global[method] = date;
        } else {
            global[method] = function () {
                return clock[method].apply(clock, arguments);
            };

            for (var prop in clock[method]) {
                if (clock[method].hasOwnProperty(prop)) {
                    global[method][prop] = clock[method][prop];
                }
            }
        }

        global[method].clock = clock;
    }

    sinon.useFakeTimers = function useFakeTimers(now) {
        var clock = sinon.clock.create(now);
        clock.restore = restore;
        clock.methods = Array.prototype.slice.call(arguments,
                                                   typeof now == "number" ? 1 : 0);

        if (clock.methods.length === 0) {
            clock.methods = methods;
        }

        for (var i = 0, l = clock.methods.length; i < l; i++) {
            stubGlobal(clock.methods[i], clock);
        }

        return clock;
    };
}(typeof global != "undefined" && typeof global !== "function" ? global : this));

sinon.timers = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date
};

if (typeof module == "object" && typeof require == "function") {
    module.exports = sinon;
}

/*jslint eqeqeq: false, onevar: false*/
/*global sinon, module, require, ActiveXObject, XMLHttpRequest, DOMParser*/
/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */

if (typeof sinon == "undefined") {
    this.sinon = {};
}

(function () {
    var push = [].push;

    sinon.Event = function Event(type, bubbles, cancelable) {
        this.initEvent(type, bubbles, cancelable);
    };

    sinon.Event.prototype = {
        initEvent: function(type, bubbles, cancelable) {
            this.type = type;
            this.bubbles = bubbles;
            this.cancelable = cancelable;
        },

        stopPropagation: function () {},

        preventDefault: function () {
            this.defaultPrevented = true;
        }
    };

    sinon.EventTarget = {
        addEventListener: function addEventListener(event, listener, useCapture) {
            this.eventListeners = this.eventListeners || {};
            this.eventListeners[event] = this.eventListeners[event] || [];
            push.call(this.eventListeners[event], listener);
        },

        removeEventListener: function removeEventListener(event, listener, useCapture) {
            var listeners = this.eventListeners && this.eventListeners[event] || [];

            for (var i = 0, l = listeners.length; i < l; ++i) {
                if (listeners[i] == listener) {
                    return listeners.splice(i, 1);
                }
            }
        },

        dispatchEvent: function dispatchEvent(event) {
            var type = event.type;
            var listeners = this.eventListeners && this.eventListeners[type] || [];

            for (var i = 0; i < listeners.length; i++) {
                if (typeof listeners[i] == "function") {
                    listeners[i].call(this, event);
                } else {
                    listeners[i].handleEvent(event);
                }
            }

            return !!event.defaultPrevented;
        }
    };
}());

/**
 * @depend ../../sinon.js
 * @depend event.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global sinon, module, require, ActiveXObject, XMLHttpRequest, DOMParser*/
/**
 * Fake XMLHttpRequest object
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

if (typeof sinon == "undefined") {
    this.sinon = {};
}
sinon.xhr = { XMLHttpRequest: this.XMLHttpRequest };

// wrapper for global
(function(global) {
    var xhr = sinon.xhr;
    xhr.GlobalXMLHttpRequest = global.XMLHttpRequest;
    xhr.GlobalActiveXObject = global.ActiveXObject;
    xhr.supportsActiveX = typeof xhr.GlobalActiveXObject != "undefined";
    xhr.supportsXHR = typeof xhr.GlobalXMLHttpRequest != "undefined";
    xhr.workingXHR = xhr.supportsXHR ? xhr.GlobalXMLHttpRequest : xhr.supportsActiveX
                                     ? function() { return new xhr.GlobalActiveXObject("MSXML2.XMLHTTP.3.0") } : false;

    /*jsl:ignore*/
    var unsafeHeaders = {
        "Accept-Charset": true,
        "Accept-Encoding": true,
        "Connection": true,
        "Content-Length": true,
        "Cookie": true,
        "Cookie2": true,
        "Content-Transfer-Encoding": true,
        "Date": true,
        "Expect": true,
        "Host": true,
        "Keep-Alive": true,
        "Referer": true,
        "TE": true,
        "Trailer": true,
        "Transfer-Encoding": true,
        "Upgrade": true,
        "User-Agent": true,
        "Via": true
    };
    /*jsl:end*/

    function FakeXMLHttpRequest() {
        this.readyState = FakeXMLHttpRequest.UNSENT;
        this.requestHeaders = {};
        this.requestBody = null;
        this.status = 0;
        this.statusText = "";

        if (typeof FakeXMLHttpRequest.onCreate == "function") {
            FakeXMLHttpRequest.onCreate(this);
        }
    }

    function verifyState(xhr) {
        if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
            throw new Error("INVALID_STATE_ERR");
        }

        if (xhr.sendFlag) {
            throw new Error("INVALID_STATE_ERR");
        }
    }

    // filtering to enable a white-list version of Sinon FakeXhr,
    // where whitelisted requests are passed through to real XHR
    function each(collection, callback) {
        if (!collection) return;
        for (var i = 0, l = collection.length; i < l; i += 1) {
            callback(collection[i]);
        }
    }
    function some(collection, callback) {
        for (var index = 0; index < collection.length; index++) {
            if(callback(collection[index]) === true) return true;
        };
        return false;
    }
    // largest arity in XHR is 5 - XHR#open
    var apply = function(obj,method,args) {
        switch(args.length) {
        case 0: return obj[method]();
        case 1: return obj[method](args[0]);
        case 2: return obj[method](args[0],args[1]);
        case 3: return obj[method](args[0],args[1],args[2]);
        case 4: return obj[method](args[0],args[1],args[2],args[3]);
        case 5: return obj[method](args[0],args[1],args[2],args[3],args[4]);
        };
    };

    FakeXMLHttpRequest.filters = [];
    FakeXMLHttpRequest.addFilter = function(fn) {
        this.filters.push(fn)
    };
    var IE6Re = /MSIE 6/;
    FakeXMLHttpRequest.defake = function(fakeXhr,xhrArgs) {
        var xhr = new sinon.xhr.workingXHR();
        each(["open","setRequestHeader","send","abort","getResponseHeader",
              "getAllResponseHeaders","addEventListener","overrideMimeType","removeEventListener"],
             function(method) {
                 fakeXhr[method] = function() {
                   return apply(xhr,method,arguments);
                 };
             });

        var copyAttrs = function(args) {
            each(args, function(attr) {
              try {
                fakeXhr[attr] = xhr[attr]
              } catch(e) {
                if(!IE6Re.test(navigator.userAgent)) throw e;
              }
            });
        };

        var stateChange = function() {
            fakeXhr.readyState = xhr.readyState;
            if(xhr.readyState >= FakeXMLHttpRequest.HEADERS_RECEIVED) {
                copyAttrs(["status","statusText"]);
            }
            if(xhr.readyState >= FakeXMLHttpRequest.LOADING) {
                copyAttrs(["responseText"]);
            }
            if(xhr.readyState === FakeXMLHttpRequest.DONE) {
                copyAttrs(["responseXML"]);
            }
            if(fakeXhr.onreadystatechange) fakeXhr.onreadystatechange.call(fakeXhr);
        };
        if(xhr.addEventListener) {
          for(var event in fakeXhr.eventListeners) {
              if(fakeXhr.eventListeners.hasOwnProperty(event)) {
                  each(fakeXhr.eventListeners[event],function(handler) {
                      xhr.addEventListener(event, handler);
                  });
              }
          }
          xhr.addEventListener("readystatechange",stateChange);
        } else {
          xhr.onreadystatechange = stateChange;
        }
        apply(xhr,"open",xhrArgs);
    };
    FakeXMLHttpRequest.useFilters = false;

    function verifyRequestSent(xhr) {
        if (xhr.readyState == FakeXMLHttpRequest.DONE) {
            throw new Error("Request done");
        }
    }

    function verifyHeadersReceived(xhr) {
        if (xhr.async && xhr.readyState != FakeXMLHttpRequest.HEADERS_RECEIVED) {
            throw new Error("No headers received");
        }
    }

    function verifyResponseBodyType(body) {
        if (typeof body != "string") {
            var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                                 body + ", which is not a string.");
            error.name = "InvalidBodyException";
            throw error;
        }
    }

    sinon.extend(FakeXMLHttpRequest.prototype, sinon.EventTarget, {
        async: true,

        open: function open(method, url, async, username, password) {
            this.method = method;
            this.url = url;
            this.async = typeof async == "boolean" ? async : true;
            this.username = username;
            this.password = password;
            this.responseText = null;
            this.responseXML = null;
            this.requestHeaders = {};
            this.sendFlag = false;
            if(sinon.FakeXMLHttpRequest.useFilters === true) {
                var xhrArgs = arguments;
                var defake = some(FakeXMLHttpRequest.filters,function(filter) {
                    return filter.apply(this,xhrArgs)
                });
                if (defake) {
                  return sinon.FakeXMLHttpRequest.defake(this,arguments);
                }
            }
            this.readyStateChange(FakeXMLHttpRequest.OPENED);
        },

        readyStateChange: function readyStateChange(state) {
            this.readyState = state;

            if (typeof this.onreadystatechange == "function") {
                try {
                    this.onreadystatechange();
                } catch (e) {
                    sinon.logError("Fake XHR onreadystatechange handler", e);
                }
            }

            this.dispatchEvent(new sinon.Event("readystatechange"));
        },

        setRequestHeader: function setRequestHeader(header, value) {
            verifyState(this);

            if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
                throw new Error("Refused to set unsafe header \"" + header + "\"");
            }

            if (this.requestHeaders[header]) {
                this.requestHeaders[header] += "," + value;
            } else {
                this.requestHeaders[header] = value;
            }
        },

        // Helps testing
        setResponseHeaders: function setResponseHeaders(headers) {
            this.responseHeaders = {};

            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    this.responseHeaders[header] = headers[header];
                }
            }

            if (this.async) {
                this.readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
            } else {
                this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
            }
        },

        // Currently treats ALL data as a DOMString (i.e. no Document)
        send: function send(data) {
            verifyState(this);

            if (!/^(get|head)$/i.test(this.method)) {
                if (this.requestHeaders["Content-Type"]) {
                    var value = this.requestHeaders["Content-Type"].split(";");
                    this.requestHeaders["Content-Type"] = value[0] + ";charset=utf-8";
                } else {
                    this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
                }

                this.requestBody = data;
            }

            this.errorFlag = false;
            this.sendFlag = this.async;
            this.readyStateChange(FakeXMLHttpRequest.OPENED);

            if (typeof this.onSend == "function") {
                this.onSend(this);
            }
        },

        abort: function abort() {
            this.aborted = true;
            this.responseText = null;
            this.errorFlag = true;
            this.requestHeaders = {};

            if (this.readyState > sinon.FakeXMLHttpRequest.UNSENT && this.sendFlag) {
                this.readyStateChange(sinon.FakeXMLHttpRequest.DONE);
                this.sendFlag = false;
            }

            this.readyState = sinon.FakeXMLHttpRequest.UNSENT;
        },

        getResponseHeader: function getResponseHeader(header) {
            if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
                return null;
            }

            if (/^Set-Cookie2?$/i.test(header)) {
                return null;
            }

            header = header.toLowerCase();

            for (var h in this.responseHeaders) {
                if (h.toLowerCase() == header) {
                    return this.responseHeaders[h];
                }
            }

            return null;
        },

        getAllResponseHeaders: function getAllResponseHeaders() {
            if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
                return "";
            }

            var headers = "";

            for (var header in this.responseHeaders) {
                if (this.responseHeaders.hasOwnProperty(header) &&
                    !/^Set-Cookie2?$/i.test(header)) {
                    headers += header + ": " + this.responseHeaders[header] + "\r\n";
                }
            }

            return headers;
        },

        setResponseBody: function setResponseBody(body) {
            verifyRequestSent(this);
            verifyHeadersReceived(this);
            verifyResponseBodyType(body);

            var chunkSize = this.chunkSize || 10;
            var index = 0;
            this.responseText = "";

            do {
                if (this.async) {
                    this.readyStateChange(FakeXMLHttpRequest.LOADING);
                }

                this.responseText += body.substring(index, index + chunkSize);
                index += chunkSize;
            } while (index < body.length);

            var type = this.getResponseHeader("Content-Type");

            if (this.responseText &&
                (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
                try {
                    this.responseXML = FakeXMLHttpRequest.parseXML(this.responseText);
                } catch (e) {
                    // Unable to parse XML - no biggie
                }
            }

            if (this.async) {
                this.readyStateChange(FakeXMLHttpRequest.DONE);
            } else {
                this.readyState = FakeXMLHttpRequest.DONE;
            }
        },

        respond: function respond(status, headers, body) {
            this.setResponseHeaders(headers || {});
            this.status = typeof status == "number" ? status : 200;
            this.statusText = FakeXMLHttpRequest.statusCodes[this.status];
            this.setResponseBody(body || "");
        }
    });

    sinon.extend(FakeXMLHttpRequest, {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    });

    // Borrowed from JSpec
    FakeXMLHttpRequest.parseXML = function parseXML(text) {
        var xmlDoc;

        if (typeof DOMParser != "undefined") {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(text, "text/xml");
        } else {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(text);
        }

        return xmlDoc;
    };

    FakeXMLHttpRequest.statusCodes = {
        100: "Continue",
        101: "Switching Protocols",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        300: "Multiple Choice",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-URI Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported"
    };

    sinon.useFakeXMLHttpRequest = function () {
        sinon.FakeXMLHttpRequest.restore = function restore(keepOnCreate) {
            if (xhr.supportsXHR) {
                global.XMLHttpRequest = xhr.GlobalXMLHttpRequest;
            }

            if (xhr.supportsActiveX) {
                global.ActiveXObject = xhr.GlobalActiveXObject;
            }

            delete sinon.FakeXMLHttpRequest.restore;

            if (keepOnCreate !== true) {
                delete sinon.FakeXMLHttpRequest.onCreate;
            }
        };
        if (xhr.supportsXHR) {
            global.XMLHttpRequest = sinon.FakeXMLHttpRequest;
        }

        if (xhr.supportsActiveX) {
            global.ActiveXObject = function ActiveXObject(objId) {
                if (objId == "Microsoft.XMLHTTP" || /^Msxml2\.XMLHTTP/i.test(objId)) {

                    return new sinon.FakeXMLHttpRequest();
                }

                return new xhr.GlobalActiveXObject(objId);
            };
        }

        return sinon.FakeXMLHttpRequest;
    };

    sinon.FakeXMLHttpRequest = FakeXMLHttpRequest;
})(this);

if (typeof module == "object" && typeof require == "function") {
    module.exports = sinon;
}

/**
 * @depend fake_xml_http_request.js
 */
/*jslint eqeqeq: false, onevar: false, regexp: false, plusplus: false*/
/*global module, require, window*/
/**
 * The Sinon "server" mimics a web server that receives requests from
 * sinon.FakeXMLHttpRequest and provides an API to respond to those requests,
 * both synchronously and asynchronously. To respond synchronuously, canned
 * answers have to be provided upfront.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

if (typeof sinon == "undefined") {
    var sinon = {};
}

sinon.fakeServer = (function () {
    var push = [].push;
    function F() {}

    function create(proto) {
        F.prototype = proto;
        return new F();
    }

    function responseArray(handler) {
        var response = handler;

        if (Object.prototype.toString.call(handler) != "[object Array]") {
            response = [200, {}, handler];
        }

        if (typeof response[2] != "string") {
            throw new TypeError("Fake server response body should be string, but was " +
                                typeof response[2]);
        }

        return response;
    }

    var wloc = typeof window !== "undefined" ? window.location : {};
    var rCurrLoc = new RegExp("^" + wloc.protocol + "//" + wloc.host);

    function matchOne(response, reqMethod, reqUrl) {
        var rmeth = response.method;
        var matchMethod = !rmeth || rmeth.toLowerCase() == reqMethod.toLowerCase();
        var url = response.url;
        var matchUrl = !url || url == reqUrl || (typeof url.test == "function" && url.test(reqUrl));

        return matchMethod && matchUrl;
    }

    function match(response, request) {
        var requestMethod = this.getHTTPMethod(request);
        var requestUrl = request.url;

        if (!/^https?:\/\//.test(requestUrl) || rCurrLoc.test(requestUrl)) {
            requestUrl = requestUrl.replace(rCurrLoc, "");
        }

        if (matchOne(response, this.getHTTPMethod(request), requestUrl)) {
            if (typeof response.response == "function") {
                var ru = response.url;
                var args = [request].concat(!ru ? [] : requestUrl.match(ru).slice(1));
                return response.response.apply(response, args);
            }

            return true;
        }

        return false;
    }

    function log(response, request) {
        var str;

        str =  "Request:\n"  + sinon.format(request)  + "\n\n";
        str += "Response:\n" + sinon.format(response) + "\n\n";

        sinon.log(str);
    }

    return {
        create: function () {
            var server = create(this);
            this.xhr = sinon.useFakeXMLHttpRequest();
            server.requests = [];

            this.xhr.onCreate = function (xhrObj) {
                server.addRequest(xhrObj);
            };

            return server;
        },

        addRequest: function addRequest(xhrObj) {
            var server = this;
            push.call(this.requests, xhrObj);

            xhrObj.onSend = function () {
                server.handleRequest(this);
            };

            if (this.autoRespond && !this.responding) {
                setTimeout(function () {
                    server.responding = false;
                    server.respond();
                }, this.autoRespondAfter || 10);

                this.responding = true;
            }
        },

        getHTTPMethod: function getHTTPMethod(request) {
            if (this.fakeHTTPMethods && /post/i.test(request.method)) {
                var matches = (request.requestBody || "").match(/_method=([^\b;]+)/);
                return !!matches ? matches[1] : request.method;
            }

            return request.method;
        },

        handleRequest: function handleRequest(xhr) {
            if (xhr.async) {
                if (!this.queue) {
                    this.queue = [];
                }

                push.call(this.queue, xhr);
            } else {
                this.processRequest(xhr);
            }
        },

        respondWith: function respondWith(method, url, body) {
            if (arguments.length == 1 && typeof method != "function") {
                this.response = responseArray(method);
                return;
            }

            if (!this.responses) { this.responses = []; }

            if (arguments.length == 1) {
                body = method;
                url = method = null;
            }

            if (arguments.length == 2) {
                body = url;
                url = method;
                method = null;
            }

            push.call(this.responses, {
                method: method,
                url: url,
                response: typeof body == "function" ? body : responseArray(body)
            });
        },

        respond: function respond() {
            if (arguments.length > 0) this.respondWith.apply(this, arguments);
            var queue = this.queue || [];
            var request;

            while(request = queue.shift()) {
                this.processRequest(request);
            }
        },

        processRequest: function processRequest(request) {
            try {
                if (request.aborted) {
                    return;
                }

                var response = this.response || [404, {}, ""];

                if (this.responses) {
                    for (var i = 0, l = this.responses.length; i < l; i++) {
                        if (match.call(this, this.responses[i], request)) {
                            response = this.responses[i].response;
                            break;
                        }
                    }
                }

                if (request.readyState != 4) {
                    log(response, request);

                    request.respond(response[0], response[1], response[2]);
                }
            } catch (e) {
                sinon.logError("Fake server request processing", e);
            }
        },

        restore: function restore() {
            return this.xhr.restore && this.xhr.restore.apply(this.xhr, arguments);
        }
    };
}());

if (typeof module == "object" && typeof require == "function") {
    module.exports = sinon;
}

/**
 * @depend fake_server.js
 * @depend fake_timers.js
 */
/*jslint browser: true, eqeqeq: false, onevar: false*/
/*global sinon*/
/**
 * Add-on for sinon.fakeServer that automatically handles a fake timer along with
 * the FakeXMLHttpRequest. The direct inspiration for this add-on is jQuery
 * 1.3.x, which does not use xhr object's onreadystatehandler at all - instead,
 * it polls the object for completion with setInterval. Dispite the direct
 * motivation, there is nothing jQuery-specific in this file, so it can be used
 * in any environment where the ajax implementation depends on setInterval or
 * setTimeout.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function () {
    function Server() {}
    Server.prototype = sinon.fakeServer;

    sinon.fakeServerWithClock = new Server();

    sinon.fakeServerWithClock.addRequest = function addRequest(xhr) {
        if (xhr.async) {
            if (typeof setTimeout.clock == "object") {
                this.clock = setTimeout.clock;
            } else {
                this.clock = sinon.useFakeTimers();
                this.resetClock = true;
            }

            if (!this.longestTimeout) {
                var clockSetTimeout = this.clock.setTimeout;
                var clockSetInterval = this.clock.setInterval;
                var server = this;

                this.clock.setTimeout = function (fn, timeout) {
                    server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

                    return clockSetTimeout.apply(this, arguments);
                };

                this.clock.setInterval = function (fn, timeout) {
                    server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

                    return clockSetInterval.apply(this, arguments);
                };
            }
        }

        return sinon.fakeServer.addRequest.call(this, xhr);
    };

    sinon.fakeServerWithClock.respond = function respond() {
        var returnVal = sinon.fakeServer.respond.apply(this, arguments);

        if (this.clock) {
            this.clock.tick(this.longestTimeout || 0);
            this.longestTimeout = 0;

            if (this.resetClock) {
                this.clock.restore();
                this.resetClock = false;
            }
        }

        return returnVal;
    };

    sinon.fakeServerWithClock.restore = function restore() {
        if (this.clock) {
            this.clock.restore();
        }

        return sinon.fakeServer.restore.apply(this, arguments);
    };
}());

/**
 * @depend ../sinon.js
 * @depend collection.js
 * @depend util/fake_timers.js
 * @depend util/fake_server_with_clock.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global require, module*/
/**
 * Manages fake collections as well as fake utilities such as Sinon's
 * timers and fake XHR implementation in one convenient object.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

if (typeof module == "object" && typeof require == "function") {
    var sinon = require("../sinon");
    sinon.extend(sinon, require("./util/fake_timers"));
}

(function () {
    var push = [].push;

    function exposeValue(sandbox, config, key, value) {
        if (!value) {
            return;
        }

        if (config.injectInto) {
            config.injectInto[key] = value;
        } else {
            push.call(sandbox.args, value);
        }
    }

    function prepareSandboxFromConfig(config) {
        var sandbox = sinon.create(sinon.sandbox);

        if (config.useFakeServer) {
            if (typeof config.useFakeServer == "object") {
                sandbox.serverPrototype = config.useFakeServer;
            }

            sandbox.useFakeServer();
        }

        if (config.useFakeTimers) {
            if (typeof config.useFakeTimers == "object") {
                sandbox.useFakeTimers.apply(sandbox, config.useFakeTimers);
            } else {
                sandbox.useFakeTimers();
            }
        }

        return sandbox;
    }

    sinon.sandbox = sinon.extend(sinon.create(sinon.collection), {
        useFakeTimers: function useFakeTimers() {
            this.clock = sinon.useFakeTimers.apply(sinon, arguments);

            return this.add(this.clock);
        },

        serverPrototype: sinon.fakeServer,

        useFakeServer: function useFakeServer() {
            var proto = this.serverPrototype || sinon.fakeServer;

            if (!proto || !proto.create) {
                return null;
            }

            this.server = proto.create();
            return this.add(this.server);
        },

        inject: function (obj) {
            sinon.collection.inject.call(this, obj);

            if (this.clock) {
                obj.clock = this.clock;
            }

            if (this.server) {
                obj.server = this.server;
                obj.requests = this.server.requests;
            }

            return obj;
        },

        create: function (config) {
            if (!config) {
                return sinon.create(sinon.sandbox);
            }

            var sandbox = prepareSandboxFromConfig(config);
            sandbox.args = sandbox.args || [];
            var prop, value, exposed = sandbox.inject({});

            if (config.properties) {
                for (var i = 0, l = config.properties.length; i < l; i++) {
                    prop = config.properties[i];
                    value = exposed[prop] || prop == "sandbox" && sandbox;
                    exposeValue(sandbox, config, prop, value);
                }
            } else {
                exposeValue(sandbox, config, "sandbox", value);
            }

            return sandbox;
        }
    });

    sinon.sandbox.useFakeXMLHttpRequest = sinon.sandbox.useFakeServer;

    if (typeof module == "object" && typeof require == "function") {
        module.exports = sinon.sandbox;
    }
}());

/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 * @depend sandbox.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true, plusplus: false*/
/*global module, require, sinon*/
/**
 * Test function, sandboxes fakes
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function test(callback) {
        var type = typeof callback;

        if (type != "function") {
            throw new TypeError("sinon.test needs to wrap a test function, got " + type);
        }

        return function () {
            var config = sinon.getConfig(sinon.config);
            config.injectInto = config.injectIntoThis && this || config.injectInto;
            var sandbox = sinon.sandbox.create(config);
            var exception, result;
            var args = Array.prototype.slice.call(arguments).concat(sandbox.args);

            try {
                result = callback.apply(this, args);
            } catch (e) {
                exception = e;
            }

            if (typeof exception !== "undefined") {
                sandbox.restore();
                throw exception;
            }
            else {
                sandbox.verifyAndRestore();
            }

            return result;
        };
    }

    test.config = {
        injectIntoThis: true,
        injectInto: null,
        properties: ["spy", "stub", "mock", "clock", "server", "requests"],
        useFakeTimers: true,
        useFakeServer: true
    };

    if (commonJSModule) {
        module.exports = test;
    } else {
        sinon.test = test;
    }
}(typeof sinon == "object" && sinon || null));

/**
 * @depend ../sinon.js
 * @depend test.js
 */
/*jslint eqeqeq: false, onevar: false, eqeqeq: false*/
/*global module, require, sinon*/
/**
 * Test case, sandboxes all test functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function (sinon) {
    var commonJSModule = typeof module == "object" && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon || !Object.prototype.hasOwnProperty) {
        return;
    }

    function createTest(property, setUp, tearDown) {
        return function () {
            if (setUp) {
                setUp.apply(this, arguments);
            }

            var exception, result;

            try {
                result = property.apply(this, arguments);
            } catch (e) {
                exception = e;
            }

            if (tearDown) {
                tearDown.apply(this, arguments);
            }

            if (exception) {
                throw exception;
            }

            return result;
        };
    }

    function testCase(tests, prefix) {
        /*jsl:ignore*/
        if (!tests || typeof tests != "object") {
            throw new TypeError("sinon.testCase needs an object with test functions");
        }
        /*jsl:end*/

        prefix = prefix || "test";
        var rPrefix = new RegExp("^" + prefix);
        var methods = {}, testName, property, method;
        var setUp = tests.setUp;
        var tearDown = tests.tearDown;

        for (testName in tests) {
            if (tests.hasOwnProperty(testName)) {
                property = tests[testName];

                if (/^(setUp|tearDown)$/.test(testName)) {
                    continue;
                }

                if (typeof property == "function" && rPrefix.test(testName)) {
                    method = property;

                    if (setUp || tearDown) {
                        method = createTest(property, setUp, tearDown);
                    }

                    methods[testName] = sinon.test(method);
                } else {
                    methods[testName] = tests[testName];
                }
            }
        }

        return methods;
    }

    if (commonJSModule) {
        module.exports = testCase;
    } else {
        sinon.testCase = testCase;
    }
}(typeof sinon == "object" && sinon || null));

/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Assertions matching the test spy retrieval interface.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */

(function (sinon, global) {
    var commonJSModule = typeof module == "object" && typeof require == "function";
    var slice = Array.prototype.slice;
    var assert;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function verifyIsStub() {
        var method;

        for (var i = 0, l = arguments.length; i < l; ++i) {
            method = arguments[i];

            if (!method) {
                assert.fail("fake is not a spy");
            }

            if (typeof method != "function") {
                assert.fail(method + " is not a function");
            }

            if (typeof method.getCall != "function") {
                assert.fail(method + " is not stubbed");
            }
        }
    }

    function failAssertion(object, msg) {
        object = object || global;
        var failMethod = object.fail || assert.fail;
        failMethod.call(object, msg);
    }

    function mirrorPropAsAssertion(name, method, message) {
        if (arguments.length == 2) {
            message = method;
            method = name;
        }

        assert[name] = function (fake) {
            verifyIsStub(fake);

            var args = slice.call(arguments, 1);
            var failed = false;

            if (typeof method == "function") {
                failed = !method(fake);
            } else {
                failed = typeof fake[method] == "function" ?
                    !fake[method].apply(fake, args) : !fake[method];
            }

            if (failed) {
                failAssertion(this, fake.printf.apply(fake, [message].concat(args)));
            } else {
                assert.pass(name);
            }
        };
    }

    function exposedName(prefix, prop) {
        return !prefix || /^fail/.test(prop) ? prop :
            prefix + prop.slice(0, 1).toUpperCase() + prop.slice(1);
    };

    assert = {
        failException: "AssertError",

        fail: function fail(message) {
            var error = new Error(message);
            error.name = this.failException || assert.failException;

            throw error;
        },

        pass: function pass(assertion) {},

        callOrder: function assertCallOrder() {
            verifyIsStub.apply(null, arguments);
            var expected = "", actual = "";

            if (!sinon.calledInOrder(arguments)) {
                try {
                    expected = [].join.call(arguments, ", ");
                    actual = sinon.orderByFirstCall(slice.call(arguments)).join(", ");
                } catch (e) {
                    // If this fails, we'll just fall back to the blank string
                }

                failAssertion(this, "expected " + expected + " to be " +
                              "called in order but were called as " + actual);
            } else {
                assert.pass("callOrder");
            }
        },

        callCount: function assertCallCount(method, count) {
            verifyIsStub(method);

            if (method.callCount != count) {
                var msg = "expected %n to be called " + sinon.timesInWords(count) +
                    " but was called %c%C";
                failAssertion(this, method.printf(msg));
            } else {
                assert.pass("callCount");
            }
        },

        expose: function expose(target, options) {
            if (!target) {
                throw new TypeError("target is null or undefined");
            }

            var o = options || {};
            var prefix = typeof o.prefix == "undefined" && "assert" || o.prefix;
            var includeFail = typeof o.includeFail == "undefined" || !!o.includeFail;

            for (var method in this) {
                if (method != "export" && (includeFail || !/^(fail)/.test(method))) {
                    target[exposedName(prefix, method)] = this[method];
                }
            }

            return target;
        }
    };

    mirrorPropAsAssertion("called", "expected %n to have been called at least once but was never called");
    mirrorPropAsAssertion("notCalled", function (spy) { return !spy.called; },
                          "expected %n to not have been called but was called %c%C");
    mirrorPropAsAssertion("calledOnce", "expected %n to be called once but was called %c%C");
    mirrorPropAsAssertion("calledTwice", "expected %n to be called twice but was called %c%C");
    mirrorPropAsAssertion("calledThrice", "expected %n to be called thrice but was called %c%C");
    mirrorPropAsAssertion("calledOn", "expected %n to be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("alwaysCalledOn", "expected %n to always be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("calledWithNew", "expected %n to be called with new");
    mirrorPropAsAssertion("alwaysCalledWithNew", "expected %n to always be called with new");
    mirrorPropAsAssertion("calledWith", "expected %n to be called with arguments %*%C");
    mirrorPropAsAssertion("calledWithMatch", "expected %n to be called with match %*%C");
    mirrorPropAsAssertion("alwaysCalledWith", "expected %n to always be called with arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithMatch", "expected %n to always be called with match %*%C");
    mirrorPropAsAssertion("calledWithExactly", "expected %n to be called with exact arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithExactly", "expected %n to always be called with exact arguments %*%C");
    mirrorPropAsAssertion("neverCalledWith", "expected %n to never be called with arguments %*%C");
    mirrorPropAsAssertion("neverCalledWithMatch", "expected %n to never be called with match %*%C");
    mirrorPropAsAssertion("threw", "%n did not throw exception%C");
    mirrorPropAsAssertion("alwaysThrew", "%n did not always throw exception%C");

    if (commonJSModule) {
        module.exports = assert;
    } else {
        sinon.assert = assert;
    }
}(typeof sinon == "object" && sinon || null, typeof window != "undefined" ? window : global));

return sinon;}.call(typeof window != 'undefined' && window || {}));
define("/assets/vendor/Zonda/vendor/mustache/0.7.2/mustache",[],function(a,b,c){(function(a,d){"object"==typeof b&&b?c.exports=d:"function"==typeof define&&define.amd?define("/assets/vendor/Zonda/vendor/mustache/0.7.2/mustache",[],d):a.Mustache=d})(this,function(){function j(a,b){return h.call(a,b)}function k(a){return!j(d,a)}function m(a){return a.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function o(a){return String(a).replace(/[&<>"'\/]/g,function(a){return n[a]})}function p(a){this.string=a,this.tail=a,this.pos=0}function q(a,b){this.view=a,this.parent=b,this._cache={}}function r(){this.clearCache()}function s(b,c,d,e){for(var g,h,i,f="",j=0,k=b.length;k>j;++j)switch(g=b[j],h=g[1],g[0]){case"#":if(i=d.lookup(h),"object"==typeof i)if(l(i))for(var m=0,n=i.length;n>m;++m)f+=s(g[4],c,d.push(i[m]),e);else i&&(f+=s(g[4],c,d.push(i),e));else if("function"==typeof i){var o=null==e?null:e.slice(g[3],g[5]);i=i.call(d.view,o,function(a){return c.render(a,d)}),null!=i&&(f+=i)}else i&&(f+=s(g[4],c,d,e));break;case"^":i=d.lookup(h),(!i||l(i)&&0===i.length)&&(f+=s(g[4],c,d,e));break;case">":i=c.getPartial(h),"function"==typeof i&&(f+=i(d));break;case"&":i=d.lookup(h),null!=i&&(f+=i);break;case"name":i=d.lookup(h),null!=i&&(f+=a.escape(i));break;case"text":f+=h}return f}function t(a){for(var e,b=[],c=b,d=[],f=0,g=a.length;g>f;++f)switch(e=a[f],e[0]){case"#":case"^":d.push(e),c.push(e),c=e[4]=[];break;case"/":var h=d.pop();h[5]=e[2],c=d.length>0?d[d.length-1][4]:b;break;default:c.push(e)}return b}function u(a){for(var c,d,b=[],e=0,f=a.length;f>e;++e)c=a[e],c&&("text"===c[0]&&d&&"text"===d[0]?(d[1]+=c[1],d[3]=c[3]):(d=c,b.push(c)));return b}function v(a){return[new RegExp(m(a[0])+"\\s*"),new RegExp("\\s*"+m(a[1]))]}var a={};a.name="mustache.js",a.version="0.7.2",a.tags=["{{","}}"],a.Scanner=p,a.Context=q,a.Writer=r;var b=/\s*/,c=/\s+/,d=/\S/,e=/\s*=/,f=/\s*\}/,g=/#|\^|\/|>|\{|&|=|!/,h=RegExp.prototype.test,i=Object.prototype.toString,l=Array.isArray||function(a){return"[object Array]"===i.call(a)},n={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"};a.escape=o,p.prototype.eos=function(){return""===this.tail},p.prototype.scan=function(a){var b=this.tail.match(a);return b&&0===b.index?(this.tail=this.tail.substring(b[0].length),this.pos+=b[0].length,b[0]):""},p.prototype.scanUntil=function(a){var b,c=this.tail.search(a);switch(c){case-1:b=this.tail,this.pos+=this.tail.length,this.tail="";break;case 0:b="";break;default:b=this.tail.substring(0,c),this.tail=this.tail.substring(c),this.pos+=c}return b},q.make=function(a){return a instanceof q?a:new q(a)},q.prototype.push=function(a){return new q(a,this)},q.prototype.lookup=function(a){var b=this._cache[a];if(!b){if("."==a)b=this.view;else for(var c=this;c;){if(a.indexOf(".")>0){b=c.view;for(var d=a.split("."),e=0;b&&d.length>e;)b=b[d[e++]]}else b=c.view[a];if(null!=b)break;c=c.parent}this._cache[a]=b}return"function"==typeof b&&(b=b.call(this.view)),b},r.prototype.clearCache=function(){this._cache={},this._partialCache={}},r.prototype.compile=function(b,c){var d=this._cache[b];if(!d){var e=a.parse(b,c);d=this._cache[b]=this.compileTokens(e,b)}return d},r.prototype.compilePartial=function(a,b,c){var d=this.compile(b,c);return this._partialCache[a]=d,d},r.prototype.getPartial=function(a){return a in this._partialCache||!this._loadPartial||this.compilePartial(a,this._loadPartial(a)),this._partialCache[a]},r.prototype.compileTokens=function(a,b){var c=this;return function(d,e){if(e)if("function"==typeof e)c._loadPartial=e;else for(var f in e)c.compilePartial(f,e[f]);return s(a,c,q.make(d),b)}},r.prototype.render=function(a,b,c){return this.compile(a)(b,c)},a.parse=function(d,h){function s(){if(q&&!r)for(;o.length;)delete n[o.pop()];else o=[];q=!1,r=!1}if(d=d||"",h=h||a.tags,"string"==typeof h&&(h=h.split(c)),2!==h.length)throw new Error("Invalid tags: "+h.join(", "));for(var w,x,y,z,A,i=v(h),j=new p(d),l=[],n=[],o=[],q=!1,r=!1;!j.eos();){if(w=j.pos,y=j.scanUntil(i[0]))for(var B=0,C=y.length;C>B;++B)z=y.charAt(B),k(z)?o.push(n.length):r=!0,n.push(["text",z,w,w+1]),w+=1,"\n"==z&&s();if(!j.scan(i[0]))break;if(q=!0,x=j.scan(g)||"name",j.scan(b),"="===x?(y=j.scanUntil(e),j.scan(e),j.scanUntil(i[1])):"{"===x?(y=j.scanUntil(new RegExp("\\s*"+m("}"+h[1]))),j.scan(f),j.scanUntil(i[1]),x="&"):y=j.scanUntil(i[1]),!j.scan(i[1]))throw new Error("Unclosed tag at "+j.pos);if(A=[x,y,w,j.pos],n.push(A),"#"===x||"^"===x)l.push(A);else if("/"===x){if(0===l.length)throw new Error('Unopened section "'+y+'" at '+w);var D=l.pop();if(D[1]!==y)throw new Error('Unclosed section "'+D[1]+'" at '+w)}else if("name"===x||"{"===x||"&"===x)r=!0;else if("="===x){if(h=y.split(c),2!==h.length)throw new Error("Invalid tags at "+w+": "+h.join(", "));i=v(h)}}var D=l.pop();if(D)throw new Error('Unclosed section "'+D[1]+'" at '+j.pos);return n=u(n),t(n)};var w=new r;return a.clearCache=function(){return w.clearCache()},a.compile=function(a,b){return w.compile(a,b)},a.compilePartial=function(a,b,c){return w.compilePartial(a,b,c)},a.compileTokens=function(a,b){return w.compileTokens(a,b)},a.render=function(a,b,c){return w.render(a,b,c)},a.to_html=function(b,c,d,e){var f=a.render(b,c,d);return"function"!=typeof e?f:(e(f),void 0)},a}())});define("/assets/vendor/Zonda/vendor/underscore/1.4.4/underscore",[],function(a,b,c){(function(){var a=this,d=a._,e={},f=Array.prototype,g=Object.prototype,h=Function.prototype,i=f.push,j=f.slice,k=f.concat,l=g.toString,m=g.hasOwnProperty,n=f.forEach,o=f.map,p=f.reduce,q=f.reduceRight,r=f.filter,s=f.every,t=f.some,u=f.indexOf,v=f.lastIndexOf,w=Array.isArray,x=Object.keys,y=h.bind,z=function(a){return a instanceof z?a:this instanceof z?(this._wrapped=a,void 0):new z(a)};"undefined"!=typeof b?("undefined"!=typeof c&&c.exports&&(b=c.exports=z),b._=z):a._=z,z.VERSION="1.4.4";var A=z.each=z.forEach=function(a,b,c){if(null!=a)if(n&&a.forEach===n)a.forEach(b,c);else if(a.length===+a.length){for(var d=0,f=a.length;f>d;d++)if(b.call(c,a[d],d,a)===e)return}else for(var g in a)if(z.has(a,g)&&b.call(c,a[g],g,a)===e)return};z.map=z.collect=function(a,b,c){var d=[];return null==a?d:o&&a.map===o?a.map(b,c):(A(a,function(a,e,f){d[d.length]=b.call(c,a,e,f)}),d)};var B="Reduce of empty array with no initial value";z.reduce=z.foldl=z.inject=function(a,b,c,d){var e=arguments.length>2;if(null==a&&(a=[]),p&&a.reduce===p)return d&&(b=z.bind(b,d)),e?a.reduce(b,c):a.reduce(b);if(A(a,function(a,f,g){e?c=b.call(d,c,a,f,g):(c=a,e=!0)}),!e)throw new TypeError(B);return c},z.reduceRight=z.foldr=function(a,b,c,d){var e=arguments.length>2;if(null==a&&(a=[]),q&&a.reduceRight===q)return d&&(b=z.bind(b,d)),e?a.reduceRight(b,c):a.reduceRight(b);var f=a.length;if(f!==+f){var g=z.keys(a);f=g.length}if(A(a,function(h,i,j){i=g?g[--f]:--f,e?c=b.call(d,c,a[i],i,j):(c=a[i],e=!0)}),!e)throw new TypeError(B);return c},z.find=z.detect=function(a,b,c){var d;return C(a,function(a,e,f){return b.call(c,a,e,f)?(d=a,!0):void 0}),d},z.filter=z.select=function(a,b,c){var d=[];return null==a?d:r&&a.filter===r?a.filter(b,c):(A(a,function(a,e,f){b.call(c,a,e,f)&&(d[d.length]=a)}),d)},z.reject=function(a,b,c){return z.filter(a,function(a,d,e){return!b.call(c,a,d,e)},c)},z.every=z.all=function(a,b,c){b||(b=z.identity);var d=!0;return null==a?d:s&&a.every===s?a.every(b,c):(A(a,function(a,f,g){return(d=d&&b.call(c,a,f,g))?void 0:e}),!!d)};var C=z.some=z.any=function(a,b,c){b||(b=z.identity);var d=!1;return null==a?d:t&&a.some===t?a.some(b,c):(A(a,function(a,f,g){return d||(d=b.call(c,a,f,g))?e:void 0}),!!d)};z.contains=z.include=function(a,b){return null==a?!1:u&&a.indexOf===u?-1!=a.indexOf(b):C(a,function(a){return a===b})},z.invoke=function(a,b){var c=j.call(arguments,2),d=z.isFunction(b);return z.map(a,function(a){return(d?b:a[b]).apply(a,c)})},z.pluck=function(a,b){return z.map(a,function(a){return a[b]})},z.where=function(a,b,c){return z.isEmpty(b)?c?null:[]:z[c?"find":"filter"](a,function(a){for(var c in b)if(b[c]!==a[c])return!1;return!0})},z.findWhere=function(a,b){return z.where(a,b,!0)},z.max=function(a,b,c){if(!b&&z.isArray(a)&&a[0]===+a[0]&&65535>a.length)return Math.max.apply(Math,a);if(!b&&z.isEmpty(a))return-1/0;var d={computed:-1/0,value:-1/0};return A(a,function(a,e,f){var g=b?b.call(c,a,e,f):a;g>=d.computed&&(d={value:a,computed:g})}),d.value},z.min=function(a,b,c){if(!b&&z.isArray(a)&&a[0]===+a[0]&&65535>a.length)return Math.min.apply(Math,a);if(!b&&z.isEmpty(a))return 1/0;var d={computed:1/0,value:1/0};return A(a,function(a,e,f){var g=b?b.call(c,a,e,f):a;d.computed>g&&(d={value:a,computed:g})}),d.value},z.shuffle=function(a){var b,c=0,d=[];return A(a,function(a){b=z.random(c++),d[c-1]=d[b],d[b]=a}),d};var D=function(a){return z.isFunction(a)?a:function(b){return b[a]}};z.sortBy=function(a,b,c){var d=D(b);return z.pluck(z.map(a,function(a,b,e){return{value:a,index:b,criteria:d.call(c,a,b,e)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;if(c!==d){if(c>d||void 0===c)return 1;if(d>c||void 0===d)return-1}return a.index<b.index?-1:1}),"value")};var E=function(a,b,c,d){var e={},f=D(b||z.identity);return A(a,function(b,g){var h=f.call(c,b,g,a);d(e,h,b)}),e};z.groupBy=function(a,b,c){return E(a,b,c,function(a,b,c){(z.has(a,b)?a[b]:a[b]=[]).push(c)})},z.countBy=function(a,b,c){return E(a,b,c,function(a,b){z.has(a,b)||(a[b]=0),a[b]++})},z.sortedIndex=function(a,b,c,d){c=null==c?z.identity:D(c);for(var e=c.call(d,b),f=0,g=a.length;g>f;){var h=f+g>>>1;e>c.call(d,a[h])?f=h+1:g=h}return f},z.toArray=function(a){return a?z.isArray(a)?j.call(a):a.length===+a.length?z.map(a,z.identity):z.values(a):[]},z.size=function(a){return null==a?0:a.length===+a.length?a.length:z.keys(a).length},z.first=z.head=z.take=function(a,b,c){return null==a?void 0:null==b||c?a[0]:j.call(a,0,b)},z.initial=function(a,b,c){return j.call(a,0,a.length-(null==b||c?1:b))},z.last=function(a,b,c){return null==a?void 0:null==b||c?a[a.length-1]:j.call(a,Math.max(a.length-b,0))},z.rest=z.tail=z.drop=function(a,b,c){return j.call(a,null==b||c?1:b)},z.compact=function(a){return z.filter(a,z.identity)};var F=function(a,b,c){return A(a,function(a){z.isArray(a)?b?i.apply(c,a):F(a,b,c):c.push(a)}),c};z.flatten=function(a,b){return F(a,b,[])},z.without=function(a){return z.difference(a,j.call(arguments,1))},z.uniq=z.unique=function(a,b,c,d){z.isFunction(b)&&(d=c,c=b,b=!1);var e=c?z.map(a,c,d):a,f=[],g=[];return A(e,function(c,d){(b?d&&g[g.length-1]===c:z.contains(g,c))||(g.push(c),f.push(a[d]))}),f},z.union=function(){return z.uniq(k.apply(f,arguments))},z.intersection=function(a){var b=j.call(arguments,1);return z.filter(z.uniq(a),function(a){return z.every(b,function(b){return z.indexOf(b,a)>=0})})},z.difference=function(a){var b=k.apply(f,j.call(arguments,1));return z.filter(a,function(a){return!z.contains(b,a)})},z.zip=function(){for(var a=j.call(arguments),b=z.max(z.pluck(a,"length")),c=new Array(b),d=0;b>d;d++)c[d]=z.pluck(a,""+d);return c},z.object=function(a,b){if(null==a)return{};for(var c={},d=0,e=a.length;e>d;d++)b?c[a[d]]=b[d]:c[a[d][0]]=a[d][1];return c},z.indexOf=function(a,b,c){if(null==a)return-1;var d=0,e=a.length;if(c){if("number"!=typeof c)return d=z.sortedIndex(a,b),a[d]===b?d:-1;d=0>c?Math.max(0,e+c):c}if(u&&a.indexOf===u)return a.indexOf(b,c);for(;e>d;d++)if(a[d]===b)return d;return-1},z.lastIndexOf=function(a,b,c){if(null==a)return-1;var d=null!=c;if(v&&a.lastIndexOf===v)return d?a.lastIndexOf(b,c):a.lastIndexOf(b);for(var e=d?c:a.length;e--;)if(a[e]===b)return e;return-1},z.range=function(a,b,c){1>=arguments.length&&(b=a||0,a=0),c=arguments[2]||1;for(var d=Math.max(Math.ceil((b-a)/c),0),e=0,f=new Array(d);d>e;)f[e++]=a,a+=c;return f},z.bind=function(a,b){if(a.bind===y&&y)return y.apply(a,j.call(arguments,1));var c=j.call(arguments,2);return function(){return a.apply(b,c.concat(j.call(arguments)))}},z.partial=function(a){var b=j.call(arguments,1);return function(){return a.apply(this,b.concat(j.call(arguments)))}},z.bindAll=function(a){var b=j.call(arguments,1);return 0===b.length&&(b=z.functions(a)),A(b,function(b){a[b]=z.bind(a[b],a)}),a},z.memoize=function(a,b){var c={};return b||(b=z.identity),function(){var d=b.apply(this,arguments);return z.has(c,d)?c[d]:c[d]=a.apply(this,arguments)}},z.delay=function(a,b){var c=j.call(arguments,2);return setTimeout(function(){return a.apply(null,c)},b)},z.defer=function(a){return z.delay.apply(z,[a,1].concat(j.call(arguments,1)))},z.throttle=function(a,b){var c,d,e,f,g=0,h=function(){g=new Date,e=null,f=a.apply(c,d)};return function(){var i=new Date,j=b-(i-g);return c=this,d=arguments,0>=j?(clearTimeout(e),e=null,g=i,f=a.apply(c,d)):e||(e=setTimeout(h,j)),f}},z.debounce=function(a,b,c){var d,e;return function(){var f=this,g=arguments,h=function(){d=null,c||(e=a.apply(f,g))},i=c&&!d;return clearTimeout(d),d=setTimeout(h,b),i&&(e=a.apply(f,g)),e}},z.once=function(a){var c,b=!1;return function(){return b?c:(b=!0,c=a.apply(this,arguments),a=null,c)}},z.wrap=function(a,b){return function(){var c=[a];return i.apply(c,arguments),b.apply(this,c)}},z.compose=function(){var a=arguments;return function(){for(var b=arguments,c=a.length-1;c>=0;c--)b=[a[c].apply(this,b)];return b[0]}},z.after=function(a,b){return 0>=a?b():function(){return 1>--a?b.apply(this,arguments):void 0}},z.keys=x||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var b=[];for(var c in a)z.has(a,c)&&(b[b.length]=c);return b},z.values=function(a){var b=[];for(var c in a)z.has(a,c)&&b.push(a[c]);return b},z.pairs=function(a){var b=[];for(var c in a)z.has(a,c)&&b.push([c,a[c]]);return b},z.invert=function(a){var b={};for(var c in a)z.has(a,c)&&(b[a[c]]=c);return b},z.functions=z.methods=function(a){var b=[];for(var c in a)z.isFunction(a[c])&&b.push(c);return b.sort()},z.extend=function(a){return A(j.call(arguments,1),function(b){if(b)for(var c in b)a[c]=b[c]}),a},z.pick=function(a){var b={},c=k.apply(f,j.call(arguments,1));return A(c,function(c){c in a&&(b[c]=a[c])}),b},z.omit=function(a){var b={},c=k.apply(f,j.call(arguments,1));for(var d in a)z.contains(c,d)||(b[d]=a[d]);return b},z.defaults=function(a){return A(j.call(arguments,1),function(b){if(b)for(var c in b)null==a[c]&&(a[c]=b[c])}),a},z.clone=function(a){return z.isObject(a)?z.isArray(a)?a.slice():z.extend({},a):a},z.tap=function(a,b){return b(a),a};var G=function(a,b,c,d){if(a===b)return 0!==a||1/a==1/b;if(null==a||null==b)return a===b;a instanceof z&&(a=a._wrapped),b instanceof z&&(b=b._wrapped);var e=l.call(a);if(e!=l.call(b))return!1;switch(e){case"[object String]":return a==String(b);case"[object Number]":return a!=+a?b!=+b:0==a?1/a==1/b:a==+b;case"[object Date]":case"[object Boolean]":return+a==+b;case"[object RegExp]":return a.source==b.source&&a.global==b.global&&a.multiline==b.multiline&&a.ignoreCase==b.ignoreCase}if("object"!=typeof a||"object"!=typeof b)return!1;for(var f=c.length;f--;)if(c[f]==a)return d[f]==b;c.push(a),d.push(b);var g=0,h=!0;if("[object Array]"==e){if(g=a.length,h=g==b.length)for(;g--&&(h=G(a[g],b[g],c,d)););}else{var i=a.constructor,j=b.constructor;if(i!==j&&!(z.isFunction(i)&&i instanceof i&&z.isFunction(j)&&j instanceof j))return!1;for(var k in a)if(z.has(a,k)&&(g++,!(h=z.has(b,k)&&G(a[k],b[k],c,d))))break;if(h){for(k in b)if(z.has(b,k)&&!g--)break;h=!g}}return c.pop(),d.pop(),h};z.isEqual=function(a,b){return G(a,b,[],[])},z.isEmpty=function(a){if(null==a)return!0;if(z.isArray(a)||z.isString(a))return 0===a.length;for(var b in a)if(z.has(a,b))return!1;return!0},z.isElement=function(a){return!(!a||1!==a.nodeType)},z.isArray=w||function(a){return"[object Array]"==l.call(a)},z.isObject=function(a){return a===Object(a)},A(["Arguments","Function","String","Number","Date","RegExp"],function(a){z["is"+a]=function(b){return l.call(b)=="[object "+a+"]"}}),z.isArguments(arguments)||(z.isArguments=function(a){return!(!a||!z.has(a,"callee"))}),z.isFunction=function(a){return"function"==typeof a},z.isFinite=function(a){return isFinite(a)&&!isNaN(parseFloat(a))},z.isNaN=function(a){return z.isNumber(a)&&a!=+a},z.isBoolean=function(a){return a===!0||a===!1||"[object Boolean]"==l.call(a)},z.isNull=function(a){return null===a},z.isUndefined=function(a){return void 0===a},z.has=function(a,b){return m.call(a,b)},z.noConflict=function(){return a._=d,this},z.identity=function(a){return a},z.times=function(a,b,c){for(var d=Array(a),e=0;a>e;e++)d[e]=b.call(c,e);return d},z.random=function(a,b){return null==b&&(b=a,a=0),a+Math.floor(Math.random()*(b-a+1))};var H={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};H.unescape=z.invert(H.escape);var I={escape:new RegExp("["+z.keys(H.escape).join("")+"]","g"),unescape:new RegExp("("+z.keys(H.unescape).join("|")+")","g")};z.each(["escape","unescape"],function(a){z[a]=function(b){return null==b?"":(""+b).replace(I[a],function(b){return H[a][b]})}}),z.result=function(a,b){if(null==a)return null;var c=a[b];return z.isFunction(c)?c.call(a):c},z.mixin=function(a){A(z.functions(a),function(b){var c=z[b]=a[b];z.prototype[b]=function(){var a=[this._wrapped];return i.apply(a,arguments),N.call(this,c.apply(z,a))}})};var J=0;z.uniqueId=function(a){var b=++J+"";return a?a+b:b},z.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var K=/(.)^/,L={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},M=/\\|'|\r|\n|\t|\u2028|\u2029/g;z.template=function(a,b,c){var d;c=z.defaults({},c,z.templateSettings);var e=new RegExp([(c.escape||K).source,(c.interpolate||K).source,(c.evaluate||K).source].join("|")+"|$","g"),f=0,g="__p+='";a.replace(e,function(b,c,d,e,h){return g+=a.slice(f,h).replace(M,function(a){return"\\"+L[a]}),c&&(g+="'+\n((__t=("+c+"))==null?'':_.escape(__t))+\n'"),d&&(g+="'+\n((__t=("+d+"))==null?'':__t)+\n'"),e&&(g+="';\n"+e+"\n__p+='"),f=h+b.length,b}),g+="';\n",c.variable||(g="with(obj||{}){\n"+g+"}\n"),g="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+g+"return __p;\n";try{d=new Function(c.variable||"obj","_",g)}catch(h){throw h.source=g,h}if(b)return d(b,z);var i=function(a){return d.call(this,a,z)};return i.source="function("+(c.variable||"obj")+"){\n"+g+"}",i},z.chain=function(a){return z(a).chain()};var N=function(a){return this._chain?z(a).chain():a};z.mixin(z),A(["pop","push","reverse","shift","sort","splice","unshift"],function(a){var b=f[a];z.prototype[a]=function(){var c=this._wrapped;return b.apply(c,arguments),"shift"!=a&&"splice"!=a||0!==c.length||delete c[0],N.call(this,c)}}),A(["concat","join","slice"],function(a){var b=f[a];z.prototype[a]=function(){return N.call(this,b.apply(this._wrapped,arguments))}}),z.extend(z.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this)});define("/assets/vendor/Zonda/vendor/bootstrap/2.3.1/bootstrap",["jquery"],function(a){var d=a("jquery");return!function(a){"use strict";a(function(){a.support.transition=function(){var a=function(){var c,a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(c in b)if(void 0!==a.style[c])return b[c]}();return a&&{end:a}}()})}(d),!function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype.close=function(b){function f(){e.trigger("closed").remove()}var e,c=a(this),d=c.attr("data-target");d||(d=c.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),e=a(d),b&&b.preventDefault(),e.length||(e=c.hasClass("alert")?c:c.parent()),e.trigger(b=a.Event("close")),b.isDefaultPrevented()||(e.removeClass("in"),a.support.transition&&e.hasClass("fade")?e.on(a.support.transition.end,f):f())};var d=a.fn.alert;a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("alert");e||d.data("alert",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.alert.Constructor=c,a.fn.alert.noConflict=function(){return a.fn.alert=d,this},a(document).on("click.alert.data-api",b,c.prototype.close)}(d),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.button.defaults,c)};b.prototype.setState=function(a){var b="disabled",c=this.$element,d=c.data(),e=c.is("input")?"val":"html";a+="Text",d.resetText||c.data("resetText",c[e]()),c[e](d[a]||this.options[a]),setTimeout(function(){"loadingText"==a?c.addClass(b).attr(b,b):c.removeClass(b).removeAttr(b)},0)},b.prototype.toggle=function(){var a=this.$element.closest('[data-toggle="buttons-radio"]');a&&a.find(".active").removeClass("active"),this.$element.toggleClass("active")};var c=a.fn.button;a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("button"),f="object"==typeof c&&c;e||d.data("button",e=new b(this,f)),"toggle"==c?e.toggle():c&&e.setState(c)})},a.fn.button.defaults={loadingText:"loading..."},a.fn.button.Constructor=b,a.fn.button.noConflict=function(){return a.fn.button=c,this},a(document).on("click.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle")})}(d),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,"hover"==this.options.pause&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.prototype={cycle:function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},getActiveIndex:function(){return this.$active=this.$element.find(".item.active"),this.$items=this.$active.parent().children(),this.$items.index(this.$active)},to:function(b){var c=this.getActiveIndex(),d=this;if(!(b>this.$items.length-1||0>b))return this.sliding?this.$element.one("slid",function(){d.to(b)}):c==b?this.pause().cycle():this.slide(b>c?"next":"prev",a(this.$items[b]))},pause:function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition.end&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),clearInterval(this.interval),this.interval=null,this},next:function(){return this.sliding?void 0:this.slide("next")},prev:function(){return this.sliding?void 0:this.slide("prev")},slide:function(b,c){var j,d=this.$element.find(".item.active"),e=c||d[b](),f=this.interval,g="next"==b?"left":"right",h="next"==b?"first":"last",i=this;if(this.sliding=!0,f&&this.pause(),e=e.length?e:this.$element.find(".item")[h](),j=a.Event("slide",{relatedTarget:e[0],direction:g}),!e.hasClass("active")){if(this.$indicators.length&&(this.$indicators.find(".active").removeClass("active"),this.$element.one("slid",function(){var b=a(i.$indicators.children()[i.getActiveIndex()]);b&&b.addClass("active")})),a.support.transition&&this.$element.hasClass("slide")){if(this.$element.trigger(j),j.isDefaultPrevented())return;e.addClass(b),e[0].offsetWidth,d.addClass(g),e.addClass(g),this.$element.one(a.support.transition.end,function(){e.removeClass([b,g].join(" ")).addClass("active"),d.removeClass(["active",g].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger("slid")},0)})}else{if(this.$element.trigger(j),j.isDefaultPrevented())return;d.removeClass("active"),e.addClass("active"),this.sliding=!1,this.$element.trigger("slid")}return f&&this.cycle(),this}}};var c=a.fn.carousel;a.fn.carousel=function(c){return this.each(function(){var d=a(this),e=d.data("carousel"),f=a.extend({},a.fn.carousel.defaults,"object"==typeof c&&c),g="string"==typeof c?c:f.slide;e||d.data("carousel",e=new b(this,f)),"number"==typeof c?e.to(c):g?e[g]():f.interval&&e.pause().cycle()})},a.fn.carousel.defaults={interval:5e3,pause:"hover"},a.fn.carousel.Constructor=b,a.fn.carousel.noConflict=function(){return a.fn.carousel=c,this},a(document).on("click.carousel.data-api","[data-slide], [data-slide-to]",function(b){var d,g,c=a(this),e=a(c.attr("data-target")||(d=c.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,"")),f=a.extend({},e.data(),c.data());e.carousel(f),(g=c.attr("data-slide-to"))&&e.data("carousel").pause().to(g).cycle(),b.preventDefault()})}(d),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.collapse.defaults,c),this.options.parent&&(this.$parent=a(this.options.parent)),this.options.toggle&&this.toggle()};b.prototype={constructor:b,dimension:function(){var a=this.$element.hasClass("width");return a?"width":"height"},show:function(){var b,c,d,e;if(!this.transitioning&&!this.$element.hasClass("in")){if(b=this.dimension(),c=a.camelCase(["scroll",b].join("-")),d=this.$parent&&this.$parent.find("> .accordion-group > .in"),d&&d.length){if(e=d.data("collapse"),e&&e.transitioning)return;d.collapse("hide"),e||d.data("collapse",null)}this.$element[b](0),this.transition("addClass",a.Event("show"),"shown"),a.support.transition&&this.$element[b](this.$element[0][c])}},hide:function(){var b;!this.transitioning&&this.$element.hasClass("in")&&(b=this.dimension(),this.reset(this.$element[b]()),this.transition("removeClass",a.Event("hide"),"hidden"),this.$element[b](0))},reset:function(a){var b=this.dimension();return this.$element.removeClass("collapse")[b](a||"auto")[0].offsetWidth,this.$element[null!==a?"addClass":"removeClass"]("collapse"),this},transition:function(b,c,d){var e=this,f=function(){"show"==c.type&&e.reset(),e.transitioning=0,e.$element.trigger(d)};this.$element.trigger(c),c.isDefaultPrevented()||(this.transitioning=1,this.$element[b]("in"),a.support.transition&&this.$element.hasClass("collapse")?this.$element.one(a.support.transition.end,f):f())},toggle:function(){this[this.$element.hasClass("in")?"hide":"show"]()}};var c=a.fn.collapse;a.fn.collapse=function(c){return this.each(function(){var d=a(this),e=d.data("collapse"),f=a.extend({},a.fn.collapse.defaults,d.data(),"object"==typeof c&&c);e||d.data("collapse",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.collapse.defaults={toggle:!0},a.fn.collapse.Constructor=b,a.fn.collapse.noConflict=function(){return a.fn.collapse=c,this},a(document).on("click.collapse.data-api","[data-toggle=collapse]",function(b){var d,c=a(this),e=c.attr("data-target")||b.preventDefault()||(d=c.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,""),f=a(e).data("collapse")?"toggle":c.data();c[a(e).hasClass("in")?"addClass":"removeClass"]("collapsed"),a(e).collapse(f)})}(d),!function(a){"use strict";function d(){a(b).each(function(){e(a(this)).removeClass("open")})}function e(b){var d,c=b.attr("data-target");return c||(c=b.attr("href"),c=c&&/#/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,"")),d=c&&a(c),d&&d.length||(d=b.parent()),d}var b="[data-toggle=dropdown]",c=function(b){var c=a(b).on("click.dropdown.data-api",this.toggle);a("html").on("click.dropdown.data-api",function(){c.parent().removeClass("open")})};c.prototype={constructor:c,toggle:function(){var f,g,c=a(this);if(!c.is(".disabled, :disabled"))return f=e(c),g=f.hasClass("open"),d(),g||f.toggleClass("open"),c.focus(),!1},keydown:function(c){var d,f,h,i,j;if(/(38|40|27)/.test(c.keyCode)&&(d=a(this),c.preventDefault(),c.stopPropagation(),!d.is(".disabled, :disabled"))){if(h=e(d),i=h.hasClass("open"),!i||i&&27==c.keyCode)return 27==c.which&&h.find(b).focus(),d.click();f=a("[role=menu] li:not(.divider):visible a",h),f.length&&(j=f.index(f.filter(":focus")),38==c.keyCode&&j>0&&j--,40==c.keyCode&&f.length-1>j&&j++,~j||(j=0),f.eq(j).focus())}}};var f=a.fn.dropdown;a.fn.dropdown=function(b){return this.each(function(){var d=a(this),e=d.data("dropdown");e||d.data("dropdown",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.dropdown.Constructor=c,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=f,this},a(document).on("click.dropdown.data-api",d).on("click.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.dropdown-menu",function(a){a.stopPropagation()}).on("click.dropdown.data-api",b,c.prototype.toggle).on("keydown.dropdown.data-api",b+", [role=menu]",c.prototype.keydown)}(d),!function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b).delegate('[data-dismiss="modal"]',"click.dismiss.modal",a.proxy(this.hide,this)),this.options.remote&&this.$element.find(".modal-body").load(this.options.remote)};b.prototype={constructor:b,toggle:function(){return this[this.isShown?"hide":"show"]()},show:function(){var b=this,c=a.Event("show");this.$element.trigger(c),this.isShown||c.isDefaultPrevented()||(this.isShown=!0,this.escape(),this.backdrop(function(){var c=a.support.transition&&b.$element.hasClass("fade");b.$element.parent().length||b.$element.appendTo(document.body),b.$element.show(),c&&b.$element[0].offsetWidth,b.$element.addClass("in").attr("aria-hidden",!1),b.enforceFocus(),c?b.$element.one(a.support.transition.end,function(){b.$element.focus().trigger("shown")}):b.$element.focus().trigger("shown")}))},hide:function(b){b&&b.preventDefault(),b=a.Event("hide"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),a(document).off("focusin.modal"),this.$element.removeClass("in").attr("aria-hidden",!0),a.support.transition&&this.$element.hasClass("fade")?this.hideWithTransition():this.hideModal())},enforceFocus:function(){var b=this;a(document).on("focusin.modal",function(a){b.$element[0]===a.target||b.$element.has(a.target).length||b.$element.focus()})},escape:function(){var a=this;this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.modal",function(b){27==b.which&&a.hide()}):this.isShown||this.$element.off("keyup.dismiss.modal")},hideWithTransition:function(){var b=this,c=setTimeout(function(){b.$element.off(a.support.transition.end),b.hideModal()},500);this.$element.one(a.support.transition.end,function(){clearTimeout(c),b.hideModal()})},hideModal:function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden")})},removeBackdrop:function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},backdrop:function(b){var d=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var e=a.support.transition&&d;if(this.$backdrop=a('<div class="modal-backdrop '+d+'" />').appendTo(document.body),this.$backdrop.click("static"==this.options.backdrop?a.proxy(this.$element[0].focus,this.$element[0]):a.proxy(this.hide,this)),e&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;e?this.$backdrop.one(a.support.transition.end,b):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b):b()):b&&b()}};var c=a.fn.modal;a.fn.modal=function(c){return this.each(function(){var d=a(this),e=d.data("modal"),f=a.extend({},a.fn.modal.defaults,d.data(),"object"==typeof c&&c);e||d.data("modal",e=new b(this,f)),"string"==typeof c?e[c]():f.show&&e.show()})},a.fn.modal.defaults={backdrop:!0,keyboard:!0,show:!0},a.fn.modal.Constructor=b,a.fn.modal.noConflict=function(){return a.fn.modal=c,this},a(document).on("click.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("modal")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());b.preventDefault(),e.modal(f).one("hide",function(){c.focus()})})}(d),!function(a){"use strict";var b=function(a,b){this.init("tooltip",a,b)};b.prototype={constructor:b,init:function(b,c,d){var e,f,g,h,i;for(this.type=b,this.$element=a(c),this.options=this.getOptions(d),this.enabled=!0,g=this.options.trigger.split(" "),i=g.length;i--;)h=g[i],"click"==h?this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this)):"manual"!=h&&(e="hover"==h?"mouseenter":"focus",f="hover"==h?"mouseleave":"blur",this.$element.on(e+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(f+"."+this.type,this.options.selector,a.proxy(this.leave,this)));this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},getOptions:function(b){return b=a.extend({},a.fn[this.type].defaults,this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},enter:function(b){var e,c=a.fn[this.type].defaults,d={};return this._options&&a.each(this._options,function(a,b){c[a]!=b&&(d[a]=b)},this),e=a(b.currentTarget)[this.type](d).data(this.type),e.options.delay&&e.options.delay.show?(clearTimeout(this.timeout),e.hoverState="in",this.timeout=setTimeout(function(){"in"==e.hoverState&&e.show()},e.options.delay.show),void 0):e.show()},leave:function(b){var c=a(b.currentTarget)[this.type](this._options).data(this.type);return this.timeout&&clearTimeout(this.timeout),c.options.delay&&c.options.delay.hide?(c.hoverState="out",this.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide),void 0):c.hide()},show:function(){var b,c,d,e,f,g,h=a.Event("show");if(this.hasContent()&&this.enabled){if(this.$element.trigger(h),h.isDefaultPrevented())return;switch(b=this.tip(),this.setContent(),this.options.animation&&b.addClass("fade"),f="function"==typeof this.options.placement?this.options.placement.call(this,b[0],this.$element[0]):this.options.placement,b.detach().css({top:0,left:0,display:"block"}),this.options.container?b.appendTo(this.options.container):b.insertAfter(this.$element),c=this.getPosition(),d=b[0].offsetWidth,e=b[0].offsetHeight,f){case"bottom":g={top:c.top+c.height,left:c.left+c.width/2-d/2};break;case"top":g={top:c.top-e,left:c.left+c.width/2-d/2};break;case"left":g={top:c.top+c.height/2-e/2,left:c.left-d};break;case"right":g={top:c.top+c.height/2-e/2,left:c.left+c.width}}this.applyPlacement(g,f),this.$element.trigger("shown")}},applyPlacement:function(a,b){var f,g,h,i,c=this.tip(),d=c[0].offsetWidth,e=c[0].offsetHeight;c.offset(a).addClass(b).addClass("in"),f=c[0].offsetWidth,g=c[0].offsetHeight,"top"==b&&g!=e&&(a.top=a.top+e-g,i=!0),"bottom"==b||"top"==b?(h=0,0>a.left&&(h=-2*a.left,a.left=0,c.offset(a),f=c[0].offsetWidth,g=c[0].offsetHeight),this.replaceArrow(h-d+f,f,"left")):this.replaceArrow(g-e,g,"top"),i&&c.offset(a)},replaceArrow:function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},setContent:function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},hide:function(){function e(){var b=setTimeout(function(){c.off(a.support.transition.end).detach()},500);c.one(a.support.transition.end,function(){clearTimeout(b),c.detach()})}var c=this.tip(),d=a.Event("hide");return this.$element.trigger(d),d.isDefaultPrevented()?void 0:(c.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?e():c.detach(),this.$element.trigger("hidden"),this)},fixTitle:function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},hasContent:function(){return this.getTitle()},getPosition:function(){var b=this.$element[0];return a.extend({},"function"==typeof b.getBoundingClientRect?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},getTitle:function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},tip:function(){return this.$tip=this.$tip||a(this.options.template)},arrow:function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},validate:function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},enable:function(){this.enabled=!0},disable:function(){this.enabled=!1},toggleEnabled:function(){this.enabled=!this.enabled},toggle:function(b){var c=b?a(b.currentTarget)[this.type](this._options).data(this.type):this;c.tip().hasClass("in")?c.hide():c.show()},destroy:function(){this.hide().$element.off("."+this.type).removeData(this.type)}};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("tooltip"),f="object"==typeof c&&c;e||d.data("tooltip",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.tooltip.Constructor=b,a.fn.tooltip.defaults={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1},a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}(d),!function(a){"use strict";var b=function(a,b){this.init("popover",a,b)};b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype,{constructor:b,setContent:function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content")[this.options.html?"html":"text"](c),a.removeClass("fade top bottom left right in")},hasContent:function(){return this.getTitle()||this.getContent()},getContent:function(){var a,b=this.$element,c=this.options;return a=("function"==typeof c.content?c.content.call(b[0]):c.content)||b.attr("data-content")},tip:function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip},destroy:function(){this.hide().$element.off("."+this.type).removeData(this.type)}});var c=a.fn.popover;a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("popover"),f="object"==typeof c&&c;e||d.data("popover",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.popover.Constructor=b,a.fn.popover.defaults=a.extend({},a.fn.tooltip.defaults,{placement:"right",trigger:"click",content:"",template:'<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),a.fn.popover.noConflict=function(){return a.fn.popover=c,this}}(d),!function(a){"use strict";function b(b,c){var f,d=a.proxy(this.process,this),e=a(b).is("body")?a(window):a(b);this.options=a.extend({},a.fn.scrollspy.defaults,c),this.$scrollElement=e.on("scroll.scroll-spy.data-api",d),this.selector=(this.options.target||(f=a(b).attr("href"))&&f.replace(/.*(?=#[^\s]+$)/,"")||"")+" .nav li > a",this.$body=a("body"),this.refresh(),this.process()}b.prototype={constructor:b,refresh:function(){var c,b=this;this.offsets=a([]),this.targets=a([]),c=this.$body.find(this.selector).map(function(){var c=a(this),d=c.data("target")||c.attr("href"),e=/^#\w/.test(d)&&a(d);return e&&e.length&&[[e.position().top+(!a.isWindow(b.$scrollElement.get(0))&&b.$scrollElement.scrollTop()),d]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){b.offsets.push(this[0]),b.targets.push(this[1])})},process:function(){var g,a=this.$scrollElement.scrollTop()+this.options.offset,b=this.$scrollElement[0].scrollHeight||this.$body[0].scrollHeight,c=b-this.$scrollElement.height(),d=this.offsets,e=this.targets,f=this.activeTarget;if(a>=c)return f!=(g=e.last()[0])&&this.activate(g);for(g=d.length;g--;)f!=e[g]&&a>=d[g]&&(!d[g+1]||d[g+1]>=a)&&this.activate(e[g])},activate:function(b){var c,d;this.activeTarget=b,a(this.selector).parent(".active").removeClass("active"),d=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',c=a(d).parent("li").addClass("active"),c.parent(".dropdown-menu").length&&(c=c.closest("li.dropdown").addClass("active")),c.trigger("activate")}};var c=a.fn.scrollspy;a.fn.scrollspy=function(c){return this.each(function(){var d=a(this),e=d.data("scrollspy"),f="object"==typeof c&&c;e||d.data("scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.scrollspy.Constructor=b,a.fn.scrollspy.defaults={offset:10},a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=c,this},a(window).on("load",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);b.scrollspy(b.data())})})}(d),!function(a){"use strict";var b=function(b){this.element=a(b)};b.prototype={constructor:b,show:function(){var e,f,g,b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.attr("data-target");d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),b.parent("li").hasClass("active")||(e=c.find(".active:last a")[0],g=a.Event("show",{relatedTarget:e}),b.trigger(g),g.isDefaultPrevented()||(f=a(d),this.activate(b.parent("li"),c),this.activate(f,f.parent(),function(){b.trigger({type:"shown",relatedTarget:e})})))},activate:function(b,c,d){function g(){e.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"),b.addClass("active"),f?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active"),d&&d()}var e=c.find("> .active"),f=d&&a.support.transition&&e.hasClass("fade");f?e.one(a.support.transition.end,g):g(),e.removeClass("in")}};var c=a.fn.tab;a.fn.tab=function(c){return this.each(function(){var d=a(this),e=d.data("tab");e||d.data("tab",e=new b(this)),"string"==typeof c&&e[c]()})},a.fn.tab.Constructor=b,a.fn.tab.noConflict=function(){return a.fn.tab=c,this},a(document).on("click.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(b){b.preventDefault(),a(this).tab("show")})}(d),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.typeahead.defaults,c),this.matcher=this.options.matcher||this.matcher,this.sorter=this.options.sorter||this.sorter,this.highlighter=this.options.highlighter||this.highlighter,this.updater=this.options.updater||this.updater,this.source=this.options.source,this.$menu=a(this.options.menu),this.shown=!1,this.listen()};b.prototype={constructor:b,select:function(){var a=this.$menu.find(".active").attr("data-value");return this.$element.val(this.updater(a)).change(),this.hide()},updater:function(a){return a},show:function(){var b=a.extend({},this.$element.position(),{height:this.$element[0].offsetHeight});return this.$menu.insertAfter(this.$element).css({top:b.top+b.height,left:b.left}).show(),this.shown=!0,this},hide:function(){return this.$menu.hide(),this.shown=!1,this},lookup:function(){var c;return this.query=this.$element.val(),!this.query||this.query.length<this.options.minLength?this.shown?this.hide():this:(c=a.isFunction(this.source)?this.source(this.query,a.proxy(this.process,this)):this.source,c?this.process(c):this)},process:function(b){var c=this;return b=a.grep(b,function(a){return c.matcher(a)}),b=this.sorter(b),b.length?this.render(b.slice(0,this.options.items)).show():this.shown?this.hide():this},matcher:function(a){return~a.toLowerCase().indexOf(this.query.toLowerCase())},sorter:function(a){for(var e,b=[],c=[],d=[];e=a.shift();)e.toLowerCase().indexOf(this.query.toLowerCase())?~e.indexOf(this.query)?c.push(e):d.push(e):b.push(e);return b.concat(c,d)},highlighter:function(a){var b=this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&");return a.replace(new RegExp("("+b+")","ig"),function(a,b){return"<strong>"+b+"</strong>"})},render:function(b){var c=this;return b=a(b).map(function(b,d){return b=a(c.options.item).attr("data-value",d),b.find("a").html(c.highlighter(d)),b[0]}),b.first().addClass("active"),this.$menu.html(b),this},next:function(){var c=this.$menu.find(".active").removeClass("active"),d=c.next();d.length||(d=a(this.$menu.find("li")[0])),d.addClass("active")},prev:function(){var b=this.$menu.find(".active").removeClass("active"),c=b.prev();c.length||(c=this.$menu.find("li").last()),c.addClass("active")},listen:function(){this.$element.on("focus",a.proxy(this.focus,this)).on("blur",a.proxy(this.blur,this)).on("keypress",a.proxy(this.keypress,this)).on("keyup",a.proxy(this.keyup,this)),this.eventSupported("keydown")&&this.$element.on("keydown",a.proxy(this.keydown,this)),this.$menu.on("click",a.proxy(this.click,this)).on("mouseenter","li",a.proxy(this.mouseenter,this)).on("mouseleave","li",a.proxy(this.mouseleave,this))},eventSupported:function(a){var b=a in this.$element;return b||(this.$element.setAttribute(a,"return;"),b="function"==typeof this.$element[a]),b},move:function(a){if(this.shown){switch(a.keyCode){case 9:case 13:case 27:a.preventDefault();break;case 38:a.preventDefault(),this.prev();break;case 40:a.preventDefault(),this.next()}a.stopPropagation()}},keydown:function(b){this.suppressKeyPressRepeat=~a.inArray(b.keyCode,[40,38,9,13,27]),this.move(b)},keypress:function(a){this.suppressKeyPressRepeat||this.move(a)},keyup:function(a){switch(a.keyCode){case 40:case 38:case 16:case 17:case 18:break;case 9:case 13:if(!this.shown)return;this.select();break;case 27:if(!this.shown)return;this.hide();break;default:this.lookup()}a.stopPropagation(),a.preventDefault()},focus:function(){this.focused=!0},blur:function(){this.focused=!1,!this.mousedover&&this.shown&&this.hide()},click:function(a){a.stopPropagation(),a.preventDefault(),this.select(),this.$element.focus()},mouseenter:function(b){this.mousedover=!0,this.$menu.find(".active").removeClass("active"),a(b.currentTarget).addClass("active")},mouseleave:function(){this.mousedover=!1,!this.focused&&this.shown&&this.hide()}};var c=a.fn.typeahead;a.fn.typeahead=function(c){return this.each(function(){var d=a(this),e=d.data("typeahead"),f="object"==typeof c&&c;e||d.data("typeahead",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.typeahead.defaults={source:[],items:8,menu:'<ul class="typeahead dropdown-menu"></ul>',item:'<li><a href="#"></a></li>',minLength:1},a.fn.typeahead.Constructor=b,a.fn.typeahead.noConflict=function(){return a.fn.typeahead=c,this},a(document).on("focus.typeahead.data-api",'[data-provide="typeahead"]',function(){var c=a(this);c.data("typeahead")||c.typeahead(c.data())})}(d),!function(a){"use strict";var b=function(b,c){this.options=a.extend({},a.fn.affix.defaults,c),this.$window=a(window).on("scroll.affix.data-api",a.proxy(this.checkPosition,this)).on("click.affix.data-api",a.proxy(function(){setTimeout(a.proxy(this.checkPosition,this),1)},this)),this.$element=a(b),this.checkPosition()};b.prototype.checkPosition=function(){if(this.$element.is(":visible")){var i,b=a(document).height(),c=this.$window.scrollTop(),d=this.$element.offset(),e=this.options.offset,f=e.bottom,g=e.top,h="affix affix-top affix-bottom";"object"!=typeof e&&(f=g=e),"function"==typeof g&&(g=e.top()),"function"==typeof f&&(f=e.bottom()),i=null!=this.unpin&&c+this.unpin<=d.top?!1:null!=f&&d.top+this.$element.height()>=b-f?"bottom":null!=g&&g>=c?"top":!1,this.affixed!==i&&(this.affixed=i,this.unpin="bottom"==i?d.top-c:null,this.$element.removeClass(h).addClass("affix"+(i?"-"+i:"")))}};var c=a.fn.affix;a.fn.affix=function(c){return this.each(function(){var d=a(this),e=d.data("affix"),f="object"==typeof c&&c;e||d.data("affix",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.affix.Constructor=b,a.fn.affix.defaults={offset:0},a.fn.affix.noConflict=function(){return a.fn.affix=c,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var b=a(this),c=b.data();c.offset=c.offset||{},c.offsetBottom&&(c.offset.bottom=c.offsetBottom),c.offsetTop&&(c.offset.top=c.offsetTop),b.affix(c)})})}(d),d});define("/assets/vendor/Zonda/vendor/iscroll/4.2.5/iscroll",[],function(a,b){(function(a,c){function E(a){return""===f?a:(a=a.charAt(0).toUpperCase()+a.substr(1),f+a)}var d=Math,e=c.createElement("div").style,f=function(){for(var b,a="t,webkitT,MozT,msT,OT".split(","),c=0,d=a.length;d>c;c++)if(b=a[c]+"ransform",b in e)return a[c].substr(0,a[c].length-1);return!1}(),g=f?"-"+f.toLowerCase()+"-":"",h=E("transform"),i=E("transitionProperty"),j=E("transitionDuration"),k=E("transformOrigin"),l=E("transitionTimingFunction"),m=E("transitionDelay"),n=/android/gi.test(navigator.appVersion),o=/iphone|ipad/gi.test(navigator.appVersion),p=/hp-tablet/gi.test(navigator.appVersion),q=E("perspective")in e,r="ontouchstart"in a&&!p,s=f!==!1,t=E("transition")in e,u="onorientationchange"in a?"orientationchange":"resize",v=r?"touchstart":"mousedown",w=r?"touchmove":"mousemove",x=r?"touchend":"mouseup",y=r?"touchcancel":"mouseup",z=function(){if(f===!1)return!1;var a={"":"transitionend",webkit:"webkitTransitionEnd",Moz:"transitionend",O:"otransitionend",ms:"MSTransitionEnd"};return a[f]}(),A=function(){return a.requestAnimationFrame||a.webkitRequestAnimationFrame||a.mozRequestAnimationFrame||a.oRequestAnimationFrame||a.msRequestAnimationFrame||function(a){return setTimeout(a,1)}}(),B=function(){return a.cancelRequestAnimationFrame||a.webkitCancelAnimationFrame||a.webkitCancelRequestAnimationFrame||a.mozCancelRequestAnimationFrame||a.oCancelRequestAnimationFrame||a.msCancelRequestAnimationFrame||clearTimeout}(),C=q?" translateZ(0)":"",D=function(b,d){var f,e=this;e.wrapper="object"==typeof b?b:c.getElementById(b),e.wrapper.style.overflow="hidden",e.scroller=e.wrapper.children[0],e.options={hScroll:!0,vScroll:!0,x:0,y:0,bounce:!0,bounceLock:!1,momentum:!0,lockDirection:!0,useTransform:!0,useTransition:!1,topOffset:0,checkDOMChanges:!1,handleClick:!0,hScrollbar:!0,vScrollbar:!0,fixedScrollbar:n,hideScrollbar:o,fadeScrollbar:o&&q,scrollbarClass:"",zoom:!1,zoomMin:1,zoomMax:4,doubleTapZoom:2,wheelAction:"scroll",snap:!1,snapThreshold:1,onRefresh:null,onBeforeScrollStart:function(a){a.preventDefault()},onScrollStart:null,onBeforeScrollMove:null,onScrollMove:null,onBeforeScrollEnd:null,onScrollEnd:null,onTouchEnd:null,onDestroy:null,onZoomStart:null,onZoom:null,onZoomEnd:null};for(f in d)e.options[f]=d[f];e.x=e.options.x,e.y=e.options.y,e.options.useTransform=s&&e.options.useTransform,e.options.hScrollbar=e.options.hScroll&&e.options.hScrollbar,e.options.vScrollbar=e.options.vScroll&&e.options.vScrollbar,e.options.zoom=e.options.useTransform&&e.options.zoom,e.options.useTransition=t&&e.options.useTransition,e.options.zoom&&n&&(C=""),e.scroller.style[i]=e.options.useTransform?g+"transform":"top left",e.scroller.style[j]="0",e.scroller.style[k]="0 0",e.options.useTransition&&(e.scroller.style[l]="cubic-bezier(0.33,0.66,0.66,1)"),e.options.useTransform?e.scroller.style[h]="translate("+e.x+"px,"+e.y+"px)"+C:e.scroller.style.cssText+=";position:absolute;top:"+e.y+"px;left:"+e.x+"px",e.options.useTransition&&(e.options.fixedScrollbar=!0),e.refresh(),e._bind(u,a),e._bind(v),r||"none"!=e.options.wheelAction&&(e._bind("DOMMouseScroll"),e._bind("mousewheel")),e.options.checkDOMChanges&&(e.checkDOMTime=setInterval(function(){e._checkDOMChanges()},500))};D.prototype={enabled:!0,x:0,y:0,steps:[],scale:1,currPageX:0,currPageY:0,pagesX:[],pagesY:[],aniTime:null,wheelZoomCount:0,handleEvent:function(a){var b=this;switch(a.type){case v:if(!r&&0!==a.button)return;b._start(a);break;case w:b._move(a);break;case x:case y:b._end(a);break;case u:b._resize();break;case"DOMMouseScroll":case"mousewheel":b._wheel(a);break;case z:b._transitionEnd(a)}},_checkDOMChanges:function(){this.moved||this.zoomed||this.animating||this.scrollerW==this.scroller.offsetWidth*this.scale&&this.scrollerH==this.scroller.offsetHeight*this.scale||this.refresh()},_scrollbar:function(a){var e,b=this;return b[a+"Scrollbar"]?(b[a+"ScrollbarWrapper"]||(e=c.createElement("div"),b.options.scrollbarClass?e.className=b.options.scrollbarClass+a.toUpperCase():e.style.cssText="position:absolute;z-index:100;"+("h"==a?"height:7px;bottom:1px;left:2px;right:"+(b.vScrollbar?"7":"2")+"px":"width:7px;bottom:"+(b.hScrollbar?"7":"2")+"px;top:2px;right:1px"),e.style.cssText+=";pointer-events:none;"+g+"transition-property:opacity;"+g+"transition-duration:"+(b.options.fadeScrollbar?"350ms":"0")+";overflow:hidden;opacity:"+(b.options.hideScrollbar?"0":"1"),b.wrapper.appendChild(e),b[a+"ScrollbarWrapper"]=e,e=c.createElement("div"),b.options.scrollbarClass||(e.style.cssText="position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);"+g+"background-clip:padding-box;"+g+"box-sizing:border-box;"+("h"==a?"height:100%":"width:100%")+";"+g+"border-radius:3px;border-radius:3px"),e.style.cssText+=";pointer-events:none;"+g+"transition-property:"+g+"transform;"+g+"transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);"+g+"transition-duration:0;"+g+"transform: translate(0,0)"+C,b.options.useTransition&&(e.style.cssText+=";"+g+"transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)"),b[a+"ScrollbarWrapper"].appendChild(e),b[a+"ScrollbarIndicator"]=e),"h"==a?(b.hScrollbarSize=b.hScrollbarWrapper.clientWidth,b.hScrollbarIndicatorSize=d.max(d.round(b.hScrollbarSize*b.hScrollbarSize/b.scrollerW),8),b.hScrollbarIndicator.style.width=b.hScrollbarIndicatorSize+"px",b.hScrollbarMaxScroll=b.hScrollbarSize-b.hScrollbarIndicatorSize,b.hScrollbarProp=b.hScrollbarMaxScroll/b.maxScrollX):(b.vScrollbarSize=b.vScrollbarWrapper.clientHeight,b.vScrollbarIndicatorSize=d.max(d.round(b.vScrollbarSize*b.vScrollbarSize/b.scrollerH),8),b.vScrollbarIndicator.style.height=b.vScrollbarIndicatorSize+"px",b.vScrollbarMaxScroll=b.vScrollbarSize-b.vScrollbarIndicatorSize,b.vScrollbarProp=b.vScrollbarMaxScroll/b.maxScrollY),b._scrollbarPos(a,!0),void 0):(b[a+"ScrollbarWrapper"]&&(s&&(b[a+"ScrollbarIndicator"].style[h]=""),b[a+"ScrollbarWrapper"].parentNode.removeChild(b[a+"ScrollbarWrapper"]),b[a+"ScrollbarWrapper"]=null,b[a+"ScrollbarIndicator"]=null),void 0)},_resize:function(){var a=this;setTimeout(function(){a.refresh()},n?200:0)},_pos:function(a,b){this.zoomed||(a=this.hScroll?a:0,b=this.vScroll?b:0,this.options.useTransform?this.scroller.style[h]="translate("+a+"px,"+b+"px) scale("+this.scale+")"+C:(a=d.round(a),b=d.round(b),this.scroller.style.left=a+"px",this.scroller.style.top=b+"px"),this.x=a,this.y=b,this._scrollbarPos("h"),this._scrollbarPos("v"))},_scrollbarPos:function(a,b){var f,c=this,e="h"==a?c.x:c.y;c[a+"Scrollbar"]&&(e=c[a+"ScrollbarProp"]*e,0>e?(c.options.fixedScrollbar||(f=c[a+"ScrollbarIndicatorSize"]+d.round(3*e),8>f&&(f=8),c[a+"ScrollbarIndicator"].style["h"==a?"width":"height"]=f+"px"),e=0):e>c[a+"ScrollbarMaxScroll"]&&(c.options.fixedScrollbar?e=c[a+"ScrollbarMaxScroll"]:(f=c[a+"ScrollbarIndicatorSize"]-d.round(3*(e-c[a+"ScrollbarMaxScroll"])),8>f&&(f=8),c[a+"ScrollbarIndicator"].style["h"==a?"width":"height"]=f+"px",e=c[a+"ScrollbarMaxScroll"]+(c[a+"ScrollbarIndicatorSize"]-f))),c[a+"ScrollbarWrapper"].style[m]="0",c[a+"ScrollbarWrapper"].style.opacity=b&&c.options.hideScrollbar?"0":"1",c[a+"ScrollbarIndicator"].style[h]="translate("+("h"==a?e+"px,0)":"0,"+e+"px)")+C)},_start:function(b){var f,g,i,j,k,c=this,e=r?b.touches[0]:b;c.enabled&&(c.options.onBeforeScrollStart&&c.options.onBeforeScrollStart.call(c,b),(c.options.useTransition||c.options.zoom)&&c._transitionTime(0),c.moved=!1,c.animating=!1,c.zoomed=!1,c.distX=0,c.distY=0,c.absDistX=0,c.absDistY=0,c.dirX=0,c.dirY=0,c.options.zoom&&r&&b.touches.length>1&&(j=d.abs(b.touches[0].pageX-b.touches[1].pageX),k=d.abs(b.touches[0].pageY-b.touches[1].pageY),c.touchesDistStart=d.sqrt(j*j+k*k),c.originX=d.abs(b.touches[0].pageX+b.touches[1].pageX-2*c.wrapperOffsetLeft)/2-c.x,c.originY=d.abs(b.touches[0].pageY+b.touches[1].pageY-2*c.wrapperOffsetTop)/2-c.y,c.options.onZoomStart&&c.options.onZoomStart.call(c,b)),c.options.momentum&&(c.options.useTransform?(f=getComputedStyle(c.scroller,null)[h].replace(/[^0-9\-.,]/g,"").split(","),g=+(f[12]||f[4]),i=+(f[13]||f[5])):(g=+getComputedStyle(c.scroller,null).left.replace(/[^0-9-]/g,""),i=+getComputedStyle(c.scroller,null).top.replace(/[^0-9-]/g,"")),(g!=c.x||i!=c.y)&&(c.options.useTransition?c._unbind(z):B(c.aniTime),c.steps=[],c._pos(g,i),c.options.onScrollEnd&&c.options.onScrollEnd.call(c))),c.absStartX=c.x,c.absStartY=c.y,c.startX=c.x,c.startY=c.y,c.pointX=e.pageX,c.pointY=e.pageY,c.startTime=b.timeStamp||Date.now(),c.options.onScrollStart&&c.options.onScrollStart.call(c,b),c._bind(w,a),c._bind(x,a),c._bind(y,a))},_move:function(a){var j,k,l,b=this,c=r?a.touches[0]:a,e=c.pageX-b.pointX,f=c.pageY-b.pointY,g=b.x+e,i=b.y+f,m=a.timeStamp||Date.now();return b.options.onBeforeScrollMove&&b.options.onBeforeScrollMove.call(b,a),b.options.zoom&&r&&a.touches.length>1?(j=d.abs(a.touches[0].pageX-a.touches[1].pageX),k=d.abs(a.touches[0].pageY-a.touches[1].pageY),b.touchesDist=d.sqrt(j*j+k*k),b.zoomed=!0,l=1/b.touchesDistStart*b.touchesDist*this.scale,b.options.zoomMin>l?l=.5*b.options.zoomMin*Math.pow(2,l/b.options.zoomMin):l>b.options.zoomMax&&(l=2*b.options.zoomMax*Math.pow(.5,b.options.zoomMax/l)),b.lastScale=l/this.scale,g=this.originX-this.originX*b.lastScale+this.x,i=this.originY-this.originY*b.lastScale+this.y,this.scroller.style[h]="translate("+g+"px,"+i+"px) scale("+l+")"+C,b.options.onZoom&&b.options.onZoom.call(b,a),void 0):(b.pointX=c.pageX,b.pointY=c.pageY,(g>0||b.maxScrollX>g)&&(g=b.options.bounce?b.x+e/2:g>=0||b.maxScrollX>=0?0:b.maxScrollX),(i>b.minScrollY||b.maxScrollY>i)&&(i=b.options.bounce?b.y+f/2:i>=b.minScrollY||b.maxScrollY>=0?b.minScrollY:b.maxScrollY),b.distX+=e,b.distY+=f,b.absDistX=d.abs(b.distX),b.absDistY=d.abs(b.distY),6>b.absDistX&&6>b.absDistY||(b.options.lockDirection&&(b.absDistX>b.absDistY+5?(i=b.y,f=0):b.absDistY>b.absDistX+5&&(g=b.x,e=0)),b.moved=!0,b._pos(g,i),b.dirX=e>0?-1:0>e?1:0,b.dirY=f>0?-1:0>f?1:0,m-b.startTime>300&&(b.startTime=m,b.startX=b.x,b.startY=b.y),b.options.onScrollMove&&b.options.onScrollMove.call(b,a)),void 0)},_end:function(b){if(!r||0===b.touches.length){var g,i,p,q,s,t,u,e=this,f=r?b.changedTouches[0]:b,k={dist:0,time:0},l={dist:0,time:0},m=(b.timeStamp||Date.now())-e.startTime,n=e.x,o=e.y;if(e._unbind(w,a),e._unbind(x,a),e._unbind(y,a),e.options.onBeforeScrollEnd&&e.options.onBeforeScrollEnd.call(e,b),e.zoomed)return u=e.scale*e.lastScale,u=Math.max(e.options.zoomMin,u),u=Math.min(e.options.zoomMax,u),e.lastScale=u/e.scale,e.scale=u,e.x=e.originX-e.originX*e.lastScale+e.x,e.y=e.originY-e.originY*e.lastScale+e.y,e.scroller.style[j]="200ms",e.scroller.style[h]="translate("+e.x+"px,"+e.y+"px) scale("+e.scale+")"+C,e.zoomed=!1,e.refresh(),e.options.onZoomEnd&&e.options.onZoomEnd.call(e,b),void 0;if(!e.moved)return r&&(e.doubleTapTimer&&e.options.zoom?(clearTimeout(e.doubleTapTimer),e.doubleTapTimer=null,e.options.onZoomStart&&e.options.onZoomStart.call(e,b),e.zoom(e.pointX,e.pointY,1==e.scale?e.options.doubleTapZoom:1),e.options.onZoomEnd&&setTimeout(function(){e.options.onZoomEnd.call(e,b)},200)):this.options.handleClick&&(e.doubleTapTimer=setTimeout(function(){for(e.doubleTapTimer=null,g=f.target;1!=g.nodeType;)g=g.parentNode;"SELECT"!=g.tagName&&"INPUT"!=g.tagName&&"TEXTAREA"!=g.tagName&&(i=c.createEvent("MouseEvents"),i.initMouseEvent("click",!0,!0,b.view,1,f.screenX,f.screenY,f.clientX,f.clientY,b.ctrlKey,b.altKey,b.shiftKey,b.metaKey,0,null),i._fake=!0,g.dispatchEvent(i))},e.options.zoom?250:0))),e._resetPos(400),e.options.onTouchEnd&&e.options.onTouchEnd.call(e,b),void 0;if(300>m&&e.options.momentum&&(k=n?e._momentum(n-e.startX,m,-e.x,e.scrollerW-e.wrapperW+e.x,e.options.bounce?e.wrapperW:0):k,l=o?e._momentum(o-e.startY,m,-e.y,0>e.maxScrollY?e.scrollerH-e.wrapperH+e.y-e.minScrollY:0,e.options.bounce?e.wrapperH:0):l,n=e.x+k.dist,o=e.y+l.dist,(e.x>0&&n>0||e.x<e.maxScrollX&&e.maxScrollX>n)&&(k={dist:0,time:0}),(e.y>e.minScrollY&&o>e.minScrollY||e.y<e.maxScrollY&&e.maxScrollY>o)&&(l={dist:0,time:0})),k.dist||l.dist)return s=d.max(d.max(k.time,l.time),10),e.options.snap&&(p=n-e.absStartX,q=o-e.absStartY,d.abs(p)<e.options.snapThreshold&&d.abs(q)<e.options.snapThreshold?e.scrollTo(e.absStartX,e.absStartY,200):(t=e._snap(n,o),n=t.x,o=t.y,s=d.max(t.time,s))),e.scrollTo(d.round(n),d.round(o),s),e.options.onTouchEnd&&e.options.onTouchEnd.call(e,b),void 0;if(e.options.snap)return p=n-e.absStartX,q=o-e.absStartY,d.abs(p)<e.options.snapThreshold&&d.abs(q)<e.options.snapThreshold?e.scrollTo(e.absStartX,e.absStartY,200):(t=e._snap(e.x,e.y),(t.x!=e.x||t.y!=e.y)&&e.scrollTo(t.x,t.y,t.time)),e.options.onTouchEnd&&e.options.onTouchEnd.call(e,b),void 0;e._resetPos(200),e.options.onTouchEnd&&e.options.onTouchEnd.call(e,b)}},_resetPos:function(a){var b=this,c=b.x>=0?0:b.x<b.maxScrollX?b.maxScrollX:b.x,d=b.y>=b.minScrollY||b.maxScrollY>0?b.minScrollY:b.y<b.maxScrollY?b.maxScrollY:b.y;return c==b.x&&d==b.y?(b.moved&&(b.moved=!1,b.options.onScrollEnd&&b.options.onScrollEnd.call(b)),b.hScrollbar&&b.options.hideScrollbar&&("webkit"==f&&(b.hScrollbarWrapper.style[m]="300ms"),b.hScrollbarWrapper.style.opacity="0"),b.vScrollbar&&b.options.hideScrollbar&&("webkit"==f&&(b.vScrollbarWrapper.style[m]="300ms"),b.vScrollbarWrapper.style.opacity="0"),void 0):(b.scrollTo(c,d,a||0),void 0)},_wheel:function(a){var c,d,e,f,g,b=this;if("wheelDeltaX"in a)c=a.wheelDeltaX/12,d=a.wheelDeltaY/12;else if("wheelDelta"in a)c=d=a.wheelDelta/12;else{if(!("detail"in a))return;c=d=3*-a.detail}return"zoom"==b.options.wheelAction?(g=b.scale*Math.pow(2,1/3*(d?d/Math.abs(d):0)),b.options.zoomMin>g&&(g=b.options.zoomMin),g>b.options.zoomMax&&(g=b.options.zoomMax),g!=b.scale&&(!b.wheelZoomCount&&b.options.onZoomStart&&b.options.onZoomStart.call(b,a),b.wheelZoomCount++,b.zoom(a.pageX,a.pageY,g,400),setTimeout(function(){b.wheelZoomCount--,!b.wheelZoomCount&&b.options.onZoomEnd&&b.options.onZoomEnd.call(b,a)},400)),void 0):(e=b.x+c,f=b.y+d,e>0?e=0:b.maxScrollX>e&&(e=b.maxScrollX),f>b.minScrollY?f=b.minScrollY:b.maxScrollY>f&&(f=b.maxScrollY),0>b.maxScrollY&&b.scrollTo(e,f,0),void 0)},_transitionEnd:function(a){var b=this;a.target==b.scroller&&(b._unbind(z),b._startAni())},_startAni:function(){var f,g,h,a=this,b=a.x,c=a.y,e=Date.now();if(!a.animating){if(!a.steps.length)return a._resetPos(400),void 0;if(f=a.steps.shift(),f.x==b&&f.y==c&&(f.time=0),a.animating=!0,a.moved=!0,a.options.useTransition)return a._transitionTime(f.time),a._pos(f.x,f.y),a.animating=!1,f.time?a._bind(z):a._resetPos(0),void 0;h=function(){var j,k,i=Date.now();return i>=e+f.time?(a._pos(f.x,f.y),a.animating=!1,a.options.onAnimationEnd&&a.options.onAnimationEnd.call(a),a._startAni(),void 0):(i=(i-e)/f.time-1,g=d.sqrt(1-i*i),j=(f.x-b)*g+b,k=(f.y-c)*g+c,a._pos(j,k),a.animating&&(a.aniTime=A(h)),void 0)},h()}},_transitionTime:function(a){a+="ms",this.scroller.style[j]=a,this.hScrollbar&&(this.hScrollbarIndicator.style[j]=a),this.vScrollbar&&(this.vScrollbarIndicator.style[j]=a)},_momentum:function(a,b,c,e,f){var g=6e-4,h=d.abs(a)/b,i=h*h/(2*g),j=0,k=0;return a>0&&i>c?(k=f/(6/(i/h*g)),c+=k,h=h*c/i,i=c):0>a&&i>e&&(k=f/(6/(i/h*g)),e+=k,h=h*e/i,i=e),i*=0>a?-1:1,j=h/g,{dist:i,time:d.round(j)}},_offset:function(a){for(var b=-a.offsetLeft,c=-a.offsetTop;a=a.offsetParent;)b-=a.offsetLeft,c-=a.offsetTop;return a!=this.wrapper&&(b*=this.scale,c*=this.scale),{left:b,top:c}},_snap:function(a,b){var e,f,g,h,i,j,c=this;for(g=c.pagesX.length-1,e=0,f=c.pagesX.length;f>e;e++)if(a>=c.pagesX[e]){g=e;break}for(g==c.currPageX&&g>0&&0>c.dirX&&g--,a=c.pagesX[g],i=d.abs(a-c.pagesX[c.currPageX]),i=i?500*(d.abs(c.x-a)/i):0,c.currPageX=g,g=c.pagesY.length-1,e=0;g>e;e++)if(b>=c.pagesY[e]){g=e;break}return g==c.currPageY&&g>0&&0>c.dirY&&g--,b=c.pagesY[g],j=d.abs(b-c.pagesY[c.currPageY]),j=j?500*(d.abs(c.y-b)/j):0,c.currPageY=g,h=d.round(d.max(i,j))||200,{x:a,y:b,time:h}},_bind:function(a,b,c){(b||this.scroller).addEventListener(a,this,!!c)},_unbind:function(a,b,c){(b||this.scroller).removeEventListener(a,this,!!c)},destroy:function(){var b=this;b.scroller.style[h]="",b.hScrollbar=!1,b.vScrollbar=!1,b._scrollbar("h"),b._scrollbar("v"),b._unbind(u,a),b._unbind(v),b._unbind(w,a),b._unbind(x,a),b._unbind(y,a),b.options.hasTouch||(b._unbind("DOMMouseScroll"),b._unbind("mousewheel")),b.options.useTransition&&b._unbind(z),b.options.checkDOMChanges&&clearInterval(b.checkDOMTime),b.options.onDestroy&&b.options.onDestroy.call(b)},refresh:function(){var b,c,e,f,a=this,g=0,h=0;if(a.scale<a.options.zoomMin&&(a.scale=a.options.zoomMin),a.wrapperW=a.wrapper.clientWidth||1,a.wrapperH=a.wrapper.clientHeight||1,a.minScrollY=-a.options.topOffset||0,a.scrollerW=d.round(a.scroller.offsetWidth*a.scale),a.scrollerH=d.round((a.scroller.offsetHeight+a.minScrollY)*a.scale),a.maxScrollX=a.wrapperW-a.scrollerW,a.maxScrollY=a.wrapperH-a.scrollerH+a.minScrollY,a.dirX=0,a.dirY=0,a.options.onRefresh&&a.options.onRefresh.call(a),a.hScroll=a.options.hScroll&&0>a.maxScrollX,a.vScroll=a.options.vScroll&&(!a.options.bounceLock&&!a.hScroll||a.scrollerH>a.wrapperH),a.hScrollbar=a.hScroll&&a.options.hScrollbar,a.vScrollbar=a.vScroll&&a.options.vScrollbar&&a.scrollerH>a.wrapperH,b=a._offset(a.wrapper),a.wrapperOffsetLeft=-b.left,a.wrapperOffsetTop=-b.top,"string"==typeof a.options.snap)for(a.pagesX=[],a.pagesY=[],f=a.scroller.querySelectorAll(a.options.snap),c=0,e=f.length;e>c;c++)g=a._offset(f[c]),g.left+=a.wrapperOffsetLeft,g.top+=a.wrapperOffsetTop,a.pagesX[c]=g.left<a.maxScrollX?a.maxScrollX:g.left*a.scale,a.pagesY[c]=g.top<a.maxScrollY?a.maxScrollY:g.top*a.scale;else if(a.options.snap){for(a.pagesX=[];g>=a.maxScrollX;)a.pagesX[h]=g,g-=a.wrapperW,h++;for(a.maxScrollX%a.wrapperW&&(a.pagesX[a.pagesX.length]=a.maxScrollX-a.pagesX[a.pagesX.length-1]+a.pagesX[a.pagesX.length-1]),g=0,h=0,a.pagesY=[];g>=a.maxScrollY;)a.pagesY[h]=g,g-=a.wrapperH,h++;a.maxScrollY%a.wrapperH&&(a.pagesY[a.pagesY.length]=a.maxScrollY-a.pagesY[a.pagesY.length-1]+a.pagesY[a.pagesY.length-1])}a._scrollbar("h"),a._scrollbar("v"),a.zoomed||(a.scroller.style[j]="0",a._resetPos(400))},scrollTo:function(a,b,c,d){var g,h,e=this,f=a;for(e.stop(),f.length||(f=[{x:a,y:b,time:c,relative:d}]),g=0,h=f.length;h>g;g++)f[g].relative&&(f[g].x=e.x-f[g].x,f[g].y=e.y-f[g].y),e.steps.push({x:f[g].x,y:f[g].y,time:f[g].time||0});e._startAni()},scrollToElement:function(a,b){var e,c=this;a=a.nodeType?a:c.scroller.querySelector(a),a&&(e=c._offset(a),e.left+=c.wrapperOffsetLeft,e.top+=c.wrapperOffsetTop,e.left=e.left>0?0:e.left<c.maxScrollX?c.maxScrollX:e.left,e.top=e.top>c.minScrollY?c.minScrollY:e.top<c.maxScrollY?c.maxScrollY:e.top,b=void 0===b?d.max(2*d.abs(e.left),2*d.abs(e.top)):b,c.scrollTo(e.left,e.top,b))},scrollToPage:function(a,b,c){var e,f,d=this;c=void 0===c?400:c,d.options.onScrollStart&&d.options.onScrollStart.call(d),d.options.snap?(a="next"==a?d.currPageX+1:"prev"==a?d.currPageX-1:a,b="next"==b?d.currPageY+1:"prev"==b?d.currPageY-1:b,a=0>a?0:a>d.pagesX.length-1?d.pagesX.length-1:a,b=0>b?0:b>d.pagesY.length-1?d.pagesY.length-1:b,d.currPageX=a,d.currPageY=b,e=d.pagesX[a],f=d.pagesY[b]):(e=-d.wrapperW*a,f=-d.wrapperH*b,d.maxScrollX>e&&(e=d.maxScrollX),d.maxScrollY>f&&(f=d.maxScrollY)),d.scrollTo(e,f,c)},disable:function(){this.stop(),this._resetPos(0),this.enabled=!1,this._unbind(w,a),this._unbind(x,a),this._unbind(y,a)},enable:function(){this.enabled=!0},stop:function(){this.options.useTransition?this._unbind(z):B(this.aniTime),this.steps=[],this.moved=!1,this.animating=!1},zoom:function(a,b,c,d){var e=this,f=c/e.scale;e.options.useTransform&&(e.zoomed=!0,d=void 0===d?200:d,a=a-e.wrapperOffsetLeft-e.x,b=b-e.wrapperOffsetTop-e.y,e.x=a-a*f+e.x,e.y=b-b*f+e.y,e.scale=c,e.refresh(),e.x=e.x>0?0:e.x<e.maxScrollX?e.maxScrollX:e.x,e.y=e.y>e.minScrollY?e.minScrollY:e.y<e.maxScrollY?e.maxScrollY:e.y,e.scroller.style[j]=d+"ms",e.scroller.style[h]="translate("+e.x+"px,"+e.y+"px) scale("+c+")"+C,e.zoomed=!1)},isReady:function(){return!this.moved&&!this.zoomed&&!this.animating}},e=null,"undefined"!=typeof b?b.iScroll=D:a.iScroll=D})(window,document)});define("/assets/vendor/Zonda/vendor/jquery/1.9.1/jquery",[],function(){return function(a,b){function I(a){var b=a.length,c=t.type(a);return t.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||"function"!==c&&(0===b||"number"==typeof b&&b>0&&b-1 in a)}function K(a){var b=J[a]={};return t.each(a.match(v)||[],function(a,c){b[c]=!0}),b}function N(a,c,d,e){if(t.acceptData(a)){var f,g,h=t.expando,i="string"==typeof c,j=a.nodeType,l=j?t.cache:a,m=j?a[h]:a[h]&&h;if(m&&l[m]&&(e||l[m].data)||!i||d!==b)return m||(j?a[h]=m=k.pop()||t.guid++:m=h),l[m]||(l[m]={},j||(l[m].toJSON=t.noop)),("object"==typeof c||"function"==typeof c)&&(e?l[m]=t.extend(l[m],c):l[m].data=t.extend(l[m].data,c)),f=l[m],e||(f.data||(f.data={}),f=f.data),d!==b&&(f[t.camelCase(c)]=d),i?(g=f[c],null==g&&(g=f[t.camelCase(c)])):g=f,g}}function O(a,b,c){if(t.acceptData(a)){var d,e,f,g=a.nodeType,h=g?t.cache:a,i=g?a[t.expando]:t.expando;if(h[i]){if(b&&(f=c?h[i]:h[i].data)){t.isArray(b)?b=b.concat(t.map(b,t.camelCase)):b in f?b=[b]:(b=t.camelCase(b),b=b in f?[b]:b.split(" "));for(d=0,e=b.length;e>d;d++)delete f[b[d]];if(!(c?Q:t.isEmptyObject)(f))return}(c||(delete h[i].data,Q(h[i])))&&(g?t.cleanData([a],!0):t.support.deleteExpando||h!=h.window?delete h[i]:h[i]=null)}}}function P(a,c,d){if(d===b&&1===a.nodeType){var e="data-"+c.replace(M,"-$1").toLowerCase();if(d=a.getAttribute(e),"string"==typeof d){try{d="true"===d?!0:"false"===d?!1:"null"===d?null:+d+""===d?+d:L.test(d)?t.parseJSON(d):d}catch(f){}t.data(a,c,d)}else d=b}return d}function Q(a){var b;for(b in a)if(("data"!==b||!t.isEmptyObject(a[b]))&&"toJSON"!==b)return!1;return!0}function eb(){return!0}function fb(){return!1}function lb(a,b){do a=a[b];while(a&&1!==a.nodeType);return a}function mb(a,b,c){if(b=b||0,t.isFunction(b))return t.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return t.grep(a,function(a){return a===b===c});if("string"==typeof b){var d=t.grep(a,function(a){return 1===a.nodeType});if(ib.test(b))return t.filter(b,d,!c);b=t.filter(b,d)}return t.grep(a,function(a){return t.inArray(a,b)>=0===c})}function nb(a){var b=ob.split("|"),c=a.createDocumentFragment();if(c.createElement)for(;b.length;)c.createElement(b.pop());return c}function Fb(a,b){return a.getElementsByTagName(b)[0]||a.appendChild(a.ownerDocument.createElement(b))}function Gb(a){var b=a.getAttributeNode("type");return a.type=(b&&b.specified)+"/"+a.type,a}function Hb(a){var b=Ab.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Ib(a,b){for(var c,d=0;null!=(c=a[d]);d++)t._data(c,"globalEval",!b||t._data(b[d],"globalEval"))}function Jb(a,b){if(1===b.nodeType&&t.hasData(a)){var c,d,e,f=t._data(a),g=t._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;e>d;d++)t.event.add(b,c,h[c][d])}g.data&&(g.data=t.extend({},g.data))}}function Kb(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!t.support.noCloneEvent&&b[t.expando]){e=t._data(b);for(d in e.events)t.removeEvent(b,d,e.handle);b.removeAttribute(t.expando)}"script"===c&&b.text!==a.text?(Gb(b).text=a.text,Hb(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),t.support.html5Clone&&a.innerHTML&&!t.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&xb.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}}function Lb(a,c){var d,f,g=0,h=typeof a.getElementsByTagName!==e?a.getElementsByTagName(c||"*"):typeof a.querySelectorAll!==e?a.querySelectorAll(c||"*"):b;if(!h)for(h=[],d=a.childNodes||a;null!=(f=d[g]);g++)!c||t.nodeName(f,c)?h.push(f):t.merge(h,Lb(f,c));return c===b||c&&t.nodeName(a,c)?t.merge([a],h):h}function Mb(a){xb.test(a.type)&&(a.defaultChecked=a.checked)}function bc(a,b){if(b in a)return b;for(var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=ac.length;e--;)if(b=ac[e]+c,b in a)return b;return d}function cc(a,b){return a=b||a,"none"===t.css(a,"display")||!t.contains(a.ownerDocument,a)}function dc(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=t._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&cc(d)&&(f[g]=t._data(d,"olddisplay",hc(d.nodeName)))):f[g]||(e=cc(d),(c&&"none"!==c||!e)&&t._data(d,"olddisplay",e?c:t.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function ec(a,b,c){var d=Vb.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function fc(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=t.css(a,c+_b[f],!0,e)),d?("content"===c&&(g-=t.css(a,"padding"+_b[f],!0,e)),"margin"!==c&&(g-=t.css(a,"border"+_b[f]+"Width",!0,e))):(g+=t.css(a,"padding"+_b[f],!0,e),"padding"!==c&&(g+=t.css(a,"border"+_b[f]+"Width",!0,e)));return g}function gc(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Ob(a),g=t.support.boxSizing&&"border-box"===t.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=Pb(a,b,f),(0>e||null==e)&&(e=a.style[b]),Wb.test(e))return e;d=g&&(t.support.boxSizingReliable||e===a.style[b]),e=parseFloat(e)||0}return e+fc(a,b,c||(g?"border":"content"),d,f)+"px"}function hc(a){var b=f,c=Yb[a];return c||(c=ic(a,b),"none"!==c&&c||(Nb=(Nb||t("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(b.documentElement),b=(Nb[0].contentWindow||Nb[0].contentDocument).document,b.write("<!doctype html><html><body>"),b.close(),c=ic(a,b),Nb.detach()),Yb[a]=c),c}function ic(a,b){var c=t(b.createElement(a)).appendTo(b.body),d=t.css(c[0],"display");return c.remove(),d}function oc(a,b,c,d){var e;if(t.isArray(b))t.each(b,function(b,e){c||kc.test(a)?d(a,e):oc(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==t.type(b))d(a,b);else for(e in b)oc(a+"["+e+"]",b[e],c,d)}function Fc(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(v)||[];if(t.isFunction(c))for(;d=f[e++];)"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Gc(a,b,c,d){function g(h){var i;return e[h]=!0,t.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}var e={},f=a===Cc;return g(b.dataTypes[0])||!e["*"]&&g("*")}function Hc(a,c){var d,e,f=t.ajaxSettings.flatOptions||{};for(e in c)c[e]!==b&&((f[e]?a:d||(d={}))[e]=c[e]);return d&&t.extend(!0,a,d),a}function Ic(a,c,d){var e,f,g,h,i=a.contents,j=a.dataTypes,k=a.responseFields;for(h in k)h in d&&(c[k[h]]=d[h]);for(;"*"===j[0];)j.shift(),f===b&&(f=a.mimeType||c.getResponseHeader("Content-Type"));if(f)for(h in i)if(i[h]&&i[h].test(f)){j.unshift(h);break}if(j[0]in d)g=j[0];else{for(h in d){if(!j[0]||a.converters[h+" "+j[0]]){g=h;break}e||(e=h)}g=g||e}return g?(g!==j[0]&&j.unshift(g),d[g]):void 0}function Jc(a,b){var c,d,e,f,g={},h=0,i=a.dataTypes.slice(),j=i[0];if(a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i[1])for(e in a.converters)g[e.toLowerCase()]=a.converters[e];for(;d=i[++h];)if("*"!==d){if("*"!==j&&j!==d){if(e=g[j+" "+d]||g["* "+d],!e)for(c in g)if(f=c.split(" "),f[1]===d&&(e=g[j+" "+f[0]]||g["* "+f[0]])){e===!0?e=g[c]:g[c]!==!0&&(d=f[0],i.splice(h--,0,d));break}if(e!==!0)if(e&&a["throws"])b=e(b);else try{b=e(b)}catch(k){return{state:"parsererror",error:e?k:"No conversion from "+j+" to "+d}}}j=d}return{state:"success",data:b}}function Qc(){try{return new a.XMLHttpRequest}catch(b){}}function Rc(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function Zc(){return setTimeout(function(){Sc=b}),Sc=t.now()}function $c(a,b){t.each(b,function(b,c){for(var d=(Yc[b]||[]).concat(Yc["*"]),e=0,f=d.length;f>e;e++)if(d[e].call(a,b,c))return})}function _c(a,b,c){var d,e,f=0,g=Xc.length,h=t.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Sc||Zc(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:t.extend({},b),opts:t.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:Sc||Zc(),duration:c.duration,tweens:[],createTween:function(b,c){var d=t.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(ad(k,j.opts.specialEasing);g>f;f++)if(d=Xc[f].call(j,a,k,j.opts))return d;return $c(j,k),t.isFunction(j.opts.start)&&j.opts.start.call(a,j),t.fx.timer(t.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}function ad(a,b){var c,d,e,f,g;for(e in a)if(d=t.camelCase(e),f=b[d],c=a[e],t.isArray(c)&&(f=c[1],c=a[e]=c[0]),e!==d&&(a[d]=c,delete a[e]),g=t.cssHooks[d],g&&"expand"in g){c=g.expand(c),delete a[d];for(e in c)e in a||(a[e]=c[e],b[e]=f)}else b[d]=f}function bd(a,b,c){var d,e,f,g,h,i,j,k,l,m=this,n=a.style,o={},p=[],q=a.nodeType&&cc(a);c.queue||(k=t._queueHooks(a,"fx"),null==k.unqueued&&(k.unqueued=0,l=k.empty.fire,k.empty.fire=function(){k.unqueued||l()}),k.unqueued++,m.always(function(){m.always(function(){k.unqueued--,t.queue(a,"fx").length||k.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[n.overflow,n.overflowX,n.overflowY],"inline"===t.css(a,"display")&&"none"===t.css(a,"float")&&(t.support.inlineBlockNeedsLayout&&"inline"!==hc(a.nodeName)?n.zoom=1:n.display="inline-block")),c.overflow&&(n.overflow="hidden",t.support.shrinkWrapBlocks||m.always(function(){n.overflow=c.overflow[0],n.overflowX=c.overflow[1],n.overflowY=c.overflow[2]}));for(e in b)if(g=b[e],Uc.exec(g)){if(delete b[e],i=i||"toggle"===g,g===(q?"hide":"show"))continue;p.push(e)}if(f=p.length){h=t._data(a,"fxshow")||t._data(a,"fxshow",{}),"hidden"in h&&(q=h.hidden),i&&(h.hidden=!q),q?t(a).show():m.done(function(){t(a).hide()}),m.done(function(){var b;t._removeData(a,"fxshow");for(b in o)t.style(a,b,o[b])});for(e=0;f>e;e++)d=p[e],j=m.createTween(d,q?h[d]:0),o[d]=h[d]||t.style(a,d),d in h||(h[d]=j.start,q&&(j.end=j.start,j.start="width"===d||"height"===d?1:0))}}function cd(a,b,c,d,e){return new cd.prototype.init(a,b,c,d,e)}function dd(a,b){var c,d={height:a},e=0;for(b=b?1:0;4>e;e+=2-b)c=_b[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function ed(a){return t.isWindow(a)?a:9===a.nodeType?a.defaultView||a.parentWindow:!1}var c,d,e=typeof b,f=a.document,g=a.location,h=a.jQuery,i=a.$,j={},k=[],l="1.9.1",m=k.concat,n=k.push,o=k.slice,p=k.indexOf,q=j.toString,r=j.hasOwnProperty,s=l.trim,t=function(a,b){return new t.fn.init(a,b,d)},u=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,v=/\S+/g,w=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,x=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,y=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,z=/^[\],:{}\s]*$/,A=/(?:^|:|,)(?:\s*\[)+/g,B=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,C=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,D=/^-ms-/,E=/-([\da-z])/gi,F=function(a,b){return b.toUpperCase()},G=function(a){(f.addEventListener||"load"===a.type||"complete"===f.readyState)&&(H(),t.ready())},H=function(){f.addEventListener?(f.removeEventListener("DOMContentLoaded",G,!1),a.removeEventListener("load",G,!1)):(f.detachEvent("onreadystatechange",G),a.detachEvent("onload",G))};t.fn=t.prototype={jquery:l,constructor:t,init:function(a,c,d){var e,g;if(!a)return this;if("string"==typeof a){if(e="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:x.exec(a),!e||!e[1]&&c)return!c||c.jquery?(c||d).find(a):this.constructor(c).find(a);if(e[1]){if(c=c instanceof t?c[0]:c,t.merge(this,t.parseHTML(e[1],c&&c.nodeType?c.ownerDocument||c:f,!0)),y.test(e[1])&&t.isPlainObject(c))for(e in c)t.isFunction(this[e])?this[e](c[e]):this.attr(e,c[e]);return this}if(g=f.getElementById(e[2]),g&&g.parentNode){if(g.id!==e[2])return d.find(a);this.length=1,this[0]=g}return this.context=f,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):t.isFunction(a)?d.ready(a):(a.selector!==b&&(this.selector=a.selector,this.context=a.context),t.makeArray(a,this))},selector:"",length:0,size:function(){return this.length},toArray:function(){return o.call(this)},get:function(a){return null==a?this.toArray():0>a?this[this.length+a]:this[a]},pushStack:function(a){var b=t.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return t.each(this,a,b)},ready:function(a){return t.ready.promise().done(a),this},slice:function(){return this.pushStack(o.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},map:function(a){return this.pushStack(t.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:n,sort:[].sort,splice:[].splice},t.fn.init.prototype=t.fn,t.extend=t.fn.extend=function(){var a,c,d,e,f,g,h=arguments[0]||{},i=1,j=arguments.length,k=!1;for("boolean"==typeof h&&(k=h,h=arguments[1]||{},i=2),"object"==typeof h||t.isFunction(h)||(h={}),j===i&&(h=this,--i);j>i;i++)if(null!=(f=arguments[i]))for(e in f)a=h[e],d=f[e],h!==d&&(k&&d&&(t.isPlainObject(d)||(c=t.isArray(d)))?(c?(c=!1,g=a&&t.isArray(a)?a:[]):g=a&&t.isPlainObject(a)?a:{},h[e]=t.extend(k,g,d)):d!==b&&(h[e]=d));return h},t.extend({noConflict:function(b){return a.$===t&&(a.$=i),b&&a.jQuery===t&&(a.jQuery=h),t},isReady:!1,readyWait:1,holdReady:function(a){a?t.readyWait++:t.ready(!0)},ready:function(a){if(a===!0?!--t.readyWait:!t.isReady){if(!f.body)return setTimeout(t.ready);t.isReady=!0,a!==!0&&--t.readyWait>0||(c.resolveWith(f,[t]),t.fn.trigger&&t(f).trigger("ready").off("ready"))}},isFunction:function(a){return"function"===t.type(a)},isArray:Array.isArray||function(a){return"array"===t.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return null==a?String(a):"object"==typeof a||"function"==typeof a?j[q.call(a)]||"object":typeof a},isPlainObject:function(a){if(!a||"object"!==t.type(a)||a.nodeType||t.isWindow(a))return!1;try{if(a.constructor&&!r.call(a,"constructor")&&!r.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||r.call(a,d)},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},error:function(a){throw new Error(a)},parseHTML:function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||f;var d=y.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=t.buildFragment([a],b,e),e&&t(e).remove(),t.merge([],d.childNodes))},parseJSON:function(b){return a.JSON&&a.JSON.parse?a.JSON.parse(b):null===b?b:"string"==typeof b&&(b=t.trim(b),b&&z.test(b.replace(B,"@").replace(C,"]").replace(A,"")))?new Function("return "+b)():(t.error("Invalid JSON: "+b),void 0)},parseXML:function(c){var d,e;if(!c||"string"!=typeof c)return null;try{a.DOMParser?(e=new DOMParser,d=e.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(f){d=b}return d&&d.documentElement&&!d.getElementsByTagName("parsererror").length||t.error("Invalid XML: "+c),d},noop:function(){},globalEval:function(b){b&&t.trim(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(D,"ms-").replace(E,F)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=I(a);if(c){if(g)for(;f>e&&(d=b.apply(a[e],c),d!==!1);e++);else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g)for(;f>e&&(d=b.call(a[e],e,a[e]),d!==!1);e++);else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:s&&!s.call(" ")?function(a){return null==a?"":s.call(a)}:function(a){return null==a?"":(a+"").replace(w,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(I(Object(a))?t.merge(c,"string"==typeof a?[a]:a):n.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(p)return p.call(b,a,c);for(d=b.length,c=c?0>c?Math.max(0,d+c):c:0;d>c;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=c.length,e=a.length,f=0;if("number"==typeof d)for(;d>f;f++)a[e++]=c[f];else for(;c[f]!==b;)a[e++]=c[f++];return a.length=e,a},grep:function(a,b,c){var d,e=[],f=0,g=a.length;for(c=!!c;g>f;f++)d=!!b(a[f],f),c!==d&&e.push(a[f]);return e},map:function(a,b,c){var d,e=0,f=a.length,g=I(a),h=[];if(g)for(;f>e;e++)d=b(a[e],e,c),null!=d&&(h[h.length]=d);else for(e in a)d=b(a[e],e,c),null!=d&&(h[h.length]=d);return m.apply([],h)},guid:1,proxy:function(a,c){var d,e,f;return"string"==typeof c&&(f=a[c],c=a,a=f),t.isFunction(a)?(d=o.call(arguments,2),e=function(){return a.apply(c||this,d.concat(o.call(arguments)))},e.guid=a.guid=a.guid||t.guid++,e):b},access:function(a,c,d,e,f,g,h){var i=0,j=a.length,k=null==d;if("object"===t.type(d)){f=!0;for(i in d)t.access(a,c,i,d[i],!0,g,h)}else if(e!==b&&(f=!0,t.isFunction(e)||(h=!0),k&&(h?(c.call(a,e),c=null):(k=c,c=function(a,b,c){return k.call(t(a),c)})),c))for(;j>i;i++)c(a[i],d,h?e:e.call(a[i],i,c(a[i],d)));return f?a:k?c.call(a):j?c(a[0],d):g},now:function(){return(new Date).getTime()}}),t.ready.promise=function(b){if(!c)if(c=t.Deferred(),"complete"===f.readyState)setTimeout(t.ready);else if(f.addEventListener)f.addEventListener("DOMContentLoaded",G,!1),a.addEventListener("load",G,!1);else{f.attachEvent("onreadystatechange",G),a.attachEvent("onload",G);var d=!1;try{d=null==a.frameElement&&f.documentElement}catch(e){}d&&d.doScroll&&function g(){if(!t.isReady){try{d.doScroll("left")}catch(a){return setTimeout(g,50)}H(),t.ready()}}()}return c.promise(b)},t.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){j["[object "+b+"]"]=b.toLowerCase()}),d=t(f);var J={};t.Callbacks=function(a){a="string"==typeof a?J[a]||K(a):t.extend({},a);var c,d,e,f,g,h,i=[],j=!a.once&&[],k=function(b){for(d=a.memory&&b,e=!0,g=h||0,h=0,f=i.length,c=!0;i&&f>g;g++)if(i[g].apply(b[0],b[1])===!1&&a.stopOnFalse){d=!1;break}c=!1,i&&(j?j.length&&k(j.shift()):d?i=[]:l.disable())},l={add:function(){if(i){var b=i.length;(function e(b){t.each(b,function(b,c){var d=t.type(c);"function"===d?a.unique&&l.has(c)||i.push(c):c&&c.length&&"string"!==d&&e(c)})})(arguments),c?f=i.length:d&&(h=b,k(d))}return this},remove:function(){return i&&t.each(arguments,function(a,b){for(var d;(d=t.inArray(b,i,d))>-1;)i.splice(d,1),c&&(f>=d&&f--,g>=d&&g--)}),this},has:function(a){return a?t.inArray(a,i)>-1:!(!i||!i.length)},empty:function(){return i=[],this},disable:function(){return i=j=d=b,this},disabled:function(){return!i},lock:function(){return j=b,d||l.disable(),this},locked:function(){return!j},fireWith:function(a,b){return b=b||[],b=[a,b.slice?b.slice():b],!i||e&&!j||(c?j.push(b):k(b)),this},fire:function(){return l.fireWith(this,arguments),this},fired:function(){return!!e}};return l},t.extend({Deferred:function(a){var b=[["resolve","done",t.Callbacks("once memory"),"resolved"],["reject","fail",t.Callbacks("once memory"),"rejected"],["notify","progress",t.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return t.Deferred(function(c){t.each(b,function(b,f){var g=f[0],h=t.isFunction(a[b])&&a[b];e[f[1]](function(){var a=h&&h.apply(this,arguments);a&&t.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[g+"With"](this===d?c.promise():this,h?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?t.extend(a,d):d}},e={};return d.pipe=d.then,t.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var h,i,j,b=0,c=o.call(arguments),d=c.length,e=1!==d||a&&t.isFunction(a.promise)?d:0,f=1===e?a:t.Deferred(),g=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?o.call(arguments):d,c===h?f.notifyWith(b,c):--e||f.resolveWith(b,c)}};if(d>1)for(h=new Array(d),i=new Array(d),j=new Array(d);d>b;b++)c[b]&&t.isFunction(c[b].promise)?c[b].promise().done(g(b,j,c)).fail(f.reject).progress(g(b,i,h)):--e;return e||f.resolveWith(j,c),f.promise()}}),t.support=function(){var b,c,d,g,h,i,j,k,l,m,n=f.createElement("div");if(n.setAttribute("className","t"),n.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",c=n.getElementsByTagName("*"),d=n.getElementsByTagName("a")[0],!c||!d||!c.length)return{};h=f.createElement("select"),j=h.appendChild(f.createElement("option")),g=n.getElementsByTagName("input")[0],d.style.cssText="top:1px;float:left;opacity:.5",b={getSetAttribute:"t"!==n.className,leadingWhitespace:3===n.firstChild.nodeType,tbody:!n.getElementsByTagName("tbody").length,htmlSerialize:!!n.getElementsByTagName("link").length,style:/top/.test(d.getAttribute("style")),hrefNormalized:"/a"===d.getAttribute("href"),opacity:/^0.5/.test(d.style.opacity),cssFloat:!!d.style.cssFloat,checkOn:!!g.value,optSelected:j.selected,enctype:!!f.createElement("form").enctype,html5Clone:"<:nav></:nav>"!==f.createElement("nav").cloneNode(!0).outerHTML,boxModel:"CSS1Compat"===f.compatMode,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},g.checked=!0,b.noCloneChecked=g.cloneNode(!0).checked,h.disabled=!0,b.optDisabled=!j.disabled;try{delete n.test}catch(o){b.deleteExpando=!1}g=f.createElement("input"),g.setAttribute("value",""),b.input=""===g.getAttribute("value"),g.value="t",g.setAttribute("type","radio"),b.radioValue="t"===g.value,g.setAttribute("checked","t"),g.setAttribute("name","t"),i=f.createDocumentFragment(),i.appendChild(g),b.appendChecked=g.checked,b.checkClone=i.cloneNode(!0).cloneNode(!0).lastChild.checked,n.attachEvent&&(n.attachEvent("onclick",function(){b.noCloneEvent=!1}),n.cloneNode(!0).click());for(m in{submit:!0,change:!0,focusin:!0})n.setAttribute(k="on"+m,"t"),b[m+"Bubbles"]=k in a||n.attributes[k].expando===!1;return n.style.backgroundClip="content-box",n.cloneNode(!0).style.backgroundClip="",b.clearCloneStyle="content-box"===n.style.backgroundClip,t(function(){var c,d,g,h="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",i=f.getElementsByTagName("body")[0];i&&(c=f.createElement("div"),c.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",i.appendChild(c).appendChild(n),n.innerHTML="<table><tr><td></td><td>t</td></tr></table>",g=n.getElementsByTagName("td"),g[0].style.cssText="padding:0;margin:0;border:0;display:none",l=0===g[0].offsetHeight,g[0].style.display="",g[1].style.display="none",b.reliableHiddenOffsets=l&&0===g[0].offsetHeight,n.innerHTML="",n.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",b.boxSizing=4===n.offsetWidth,b.doesNotIncludeMarginInBodyOffset=1!==i.offsetTop,a.getComputedStyle&&(b.pixelPosition="1%"!==(a.getComputedStyle(n,null)||{}).top,b.boxSizingReliable="4px"===(a.getComputedStyle(n,null)||{width:"4px"}).width,d=n.appendChild(f.createElement("div")),d.style.cssText=n.style.cssText=h,d.style.marginRight=d.style.width="0",n.style.width="1px",b.reliableMarginRight=!parseFloat((a.getComputedStyle(d,null)||{}).marginRight)),typeof n.style.zoom!==e&&(n.innerHTML="",n.style.cssText=h+"width:1px;padding:1px;display:inline;zoom:1",b.inlineBlockNeedsLayout=3===n.offsetWidth,n.style.display="block",n.innerHTML="<div></div>",n.firstChild.style.width="5px",b.shrinkWrapBlocks=3!==n.offsetWidth,b.inlineBlockNeedsLayout&&(i.style.zoom=1)),i.removeChild(c),c=n=g=d=null)}),c=h=i=j=d=g=null,b}();var L=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,M=/([A-Z])/g;t.extend({cache:{},expando:"jQuery"+(l+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){return a=a.nodeType?t.cache[a[t.expando]]:a[t.expando],!!a&&!Q(a)},data:function(a,b,c){return N(a,b,c)},removeData:function(a,b){return O(a,b)},_data:function(a,b,c){return N(a,b,c,!0)},_removeData:function(a,b){return O(a,b,!0)},acceptData:function(a){if(a.nodeType&&1!==a.nodeType&&9!==a.nodeType)return!1;var b=a.nodeName&&t.noData[a.nodeName.toLowerCase()];return!b||b!==!0&&a.getAttribute("classid")===b}}),t.fn.extend({data:function(a,c){var d,e,f=this[0],g=0,h=null;if(a===b){if(this.length&&(h=t.data(f),1===f.nodeType&&!t._data(f,"parsedAttrs"))){for(d=f.attributes;d.length>g;g++)e=d[g].name,e.indexOf("data-")||(e=t.camelCase(e.slice(5)),P(f,e,h[e]));t._data(f,"parsedAttrs",!0)}return h}return"object"==typeof a?this.each(function(){t.data(this,a)}):t.access(this,function(c){return c===b?f?P(f,a,t.data(f,a)):null:(this.each(function(){t.data(this,a,c)}),void 0)},null,c,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){t.removeData(this,a)})}}),t.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=t._data(a,b),c&&(!d||t.isArray(c)?d=t._data(a,b,t.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=t.queue(a,b),d=c.length,e=c.shift(),f=t._queueHooks(a,b),g=function(){t.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),f.cur=e,e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return t._data(a,c)||t._data(a,c,{empty:t.Callbacks("once memory").add(function(){t._removeData(a,b+"queue"),t._removeData(a,c)})})}}),t.fn.extend({queue:function(a,c){var d=2;return"string"!=typeof a&&(c=a,a="fx",d--),d>arguments.length?t.queue(this[0],a):c===b?this:this.each(function(){var b=t.queue(this,a,c);t._queueHooks(this,a),"fx"===a&&"inprogress"!==b[0]&&t.dequeue(this,a)})},dequeue:function(a){return this.each(function(){t.dequeue(this,a)})},delay:function(a,b){return a=t.fx?t.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){var d,e=1,f=t.Deferred(),g=this,h=this.length,i=function(){--e||f.resolveWith(g,[g])};for("string"!=typeof a&&(c=a,a=b),a=a||"fx";h--;)d=t._data(g[h],a+"queueHooks"),d&&d.empty&&(e++,d.empty.add(i));return i(),f.promise(c)}});var R,S,T=/[\t\r\n]/g,U=/\r/g,V=/^(?:input|select|textarea|button|object)$/i,W=/^(?:a|area)$/i,X=/^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,Y=/^(?:checked|selected)$/i,Z=t.support.getSetAttribute,$=t.support.input;t.fn.extend({attr:function(a,b){return t.access(this,t.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){t.removeAttr(this,a)})},prop:function(a,b){return t.access(this,t.prop,a,b,arguments.length>1)},removeProp:function(a){return a=t.propFix[a]||a,this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,f,g=0,h=this.length,i="string"==typeof a&&a;if(t.isFunction(a))return this.each(function(b){t(this).addClass(a.call(this,b,this.className))});if(i)for(b=(a||"").match(v)||[];h>g;g++)if(c=this[g],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(T," "):" ")){for(f=0;e=b[f++];)0>d.indexOf(" "+e+" ")&&(d+=e+" ");c.className=t.trim(d)}return this},removeClass:function(a){var b,c,d,e,f,g=0,h=this.length,i=0===arguments.length||"string"==typeof a&&a;if(t.isFunction(a))return this.each(function(b){t(this).removeClass(a.call(this,b,this.className))});if(i)for(b=(a||"").match(v)||[];h>g;g++)if(c=this[g],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(T," "):"")){for(f=0;e=b[f++];)for(;d.indexOf(" "+e+" ")>=0;)d=d.replace(" "+e+" "," ");c.className=a?t.trim(d):""}return this},toggleClass:function(a,b){var c=typeof a,d="boolean"==typeof b;return t.isFunction(a)?this.each(function(c){t(this).toggleClass(a.call(this,c,this.className,b),b)}):this.each(function(){if("string"===c)for(var f,g=0,h=t(this),i=b,j=a.match(v)||[];f=j[g++];)i=d?i:!h.hasClass(f),h[i?"addClass":"removeClass"](f);else(c===e||"boolean"===c)&&(this.className&&t._data(this,"__className__",this.className),this.className=this.className||a===!1?"":t._data(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(T," ").indexOf(b)>=0)return!0;return!1},val:function(a){var c,d,e,f=this[0];{if(arguments.length)return e=t.isFunction(a),this.each(function(c){var f,g=t(this);1===this.nodeType&&(f=e?a.call(this,c,g.val()):a,null==f?f="":"number"==typeof f?f+="":t.isArray(f)&&(f=t.map(f,function(a){return null==a?"":a+""})),d=t.valHooks[this.type]||t.valHooks[this.nodeName.toLowerCase()],d&&"set"in d&&d.set(this,f,"value")!==b||(this.value=f))});if(f)return d=t.valHooks[f.type]||t.valHooks[f.nodeName.toLowerCase()],d&&"get"in d&&(c=d.get(f,"value"))!==b?c:(c=f.value,"string"==typeof c?c.replace(U,""):null==c?"":c)}}}),t.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(t.support.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&t.nodeName(c.parentNode,"optgroup"))){if(b=t(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c=t.makeArray(b);return t(a).find("option").each(function(){this.selected=t.inArray(t(this).val(),c)>=0}),c.length||(a.selectedIndex=-1),c}}},attr:function(a,c,d){var f,g,h,i=a.nodeType;if(a&&3!==i&&8!==i&&2!==i)return typeof a.getAttribute===e?t.prop(a,c,d):(g=1!==i||!t.isXMLDoc(a),g&&(c=c.toLowerCase(),f=t.attrHooks[c]||(X.test(c)?S:R)),d===b?f&&g&&"get"in f&&null!==(h=f.get(a,c))?h:(typeof a.getAttribute!==e&&(h=a.getAttribute(c)),null==h?b:h):null!==d?f&&g&&"set"in f&&(h=f.set(a,d,c))!==b?h:(a.setAttribute(c,d+""),d):(t.removeAttr(a,c),void 0))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(v);if(f&&1===a.nodeType)for(;c=f[e++];)d=t.propFix[c]||c,X.test(c)?!Z&&Y.test(c)?a[t.camelCase("default-"+c)]=a[d]=!1:a[d]=!1:t.attr(a,c,""),a.removeAttribute(Z?c:d)},attrHooks:{type:{set:function(a,b){if(!t.support.radioValue&&"radio"===b&&t.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,f,g,h=a.nodeType;if(a&&3!==h&&8!==h&&2!==h)return g=1!==h||!t.isXMLDoc(a),g&&(c=t.propFix[c]||c,f=t.propHooks[c]),d!==b?f&&"set"in f&&(e=f.set(a,d,c))!==b?e:a[c]=d:f&&"get"in f&&null!==(e=f.get(a,c))?e:a[c]},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):V.test(a.nodeName)||W.test(a.nodeName)&&a.href?0:b}}}}),S={get:function(a,c){var d=t.prop(a,c),e="boolean"==typeof d&&a.getAttribute(c),f="boolean"==typeof d?$&&Z?null!=e:Y.test(c)?a[t.camelCase("default-"+c)]:!!e:a.getAttributeNode(c);return f&&f.value!==!1?c.toLowerCase():b},set:function(a,b,c){return b===!1?t.removeAttr(a,c):$&&Z||!Y.test(c)?a.setAttribute(!Z&&t.propFix[c]||c,c):a[t.camelCase("default-"+c)]=a[c]=!0,c}},$&&Z||(t.attrHooks.value={get:function(a,c){var d=a.getAttributeNode(c);
return t.nodeName(a,"input")?a.defaultValue:d&&d.specified?d.value:b},set:function(a,b,c){return t.nodeName(a,"input")?(a.defaultValue=b,void 0):R&&R.set(a,b,c)}}),Z||(R=t.valHooks.button={get:function(a,c){var d=a.getAttributeNode(c);return d&&("id"===c||"name"===c||"coords"===c?""!==d.value:d.specified)?d.value:b},set:function(a,c,d){var e=a.getAttributeNode(d);return e||a.setAttributeNode(e=a.ownerDocument.createAttribute(d)),e.value=c+="","value"===d||c===a.getAttribute(d)?c:b}},t.attrHooks.contenteditable={get:R.get,set:function(a,b,c){R.set(a,""===b?!1:b,c)}},t.each(["width","height"],function(a,b){t.attrHooks[b]=t.extend(t.attrHooks[b],{set:function(a,c){return""===c?(a.setAttribute(b,"auto"),c):void 0}})})),t.support.hrefNormalized||(t.each(["href","src","width","height"],function(a,c){t.attrHooks[c]=t.extend(t.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return null==d?b:d}})}),t.each(["href","src"],function(a,b){t.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}})),t.support.style||(t.attrHooks.style={get:function(a){return a.style.cssText||b},set:function(a,b){return a.style.cssText=b+""}}),t.support.optSelected||(t.propHooks.selected=t.extend(t.propHooks.selected,{get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}})),t.support.enctype||(t.propFix.enctype="encoding"),t.support.checkOn||t.each(["radio","checkbox"],function(){t.valHooks[this]={get:function(a){return null===a.getAttribute("value")?"on":a.value}}}),t.each(["radio","checkbox"],function(){t.valHooks[this]=t.extend(t.valHooks[this],{set:function(a,b){return t.isArray(b)?a.checked=t.inArray(t(a).val(),b)>=0:void 0}})});var _=/^(?:input|select|textarea)$/i,ab=/^key/,bb=/^(?:mouse|contextmenu)|click/,cb=/^(?:focusinfocus|focusoutblur)$/,db=/^([^.]*)(?:\.(.+)|)$/;t.event={global:{},add:function(a,c,d,f,g){var h,i,j,k,l,m,n,o,p,q,r,s=t._data(a);if(s){for(d.handler&&(k=d,d=k.handler,g=k.selector),d.guid||(d.guid=t.guid++),(i=s.events)||(i=s.events={}),(m=s.handle)||(m=s.handle=function(a){return typeof t===e||a&&t.event.triggered===a.type?b:t.event.dispatch.apply(m.elem,arguments)},m.elem=a),c=(c||"").match(v)||[""],j=c.length;j--;)h=db.exec(c[j])||[],p=r=h[1],q=(h[2]||"").split(".").sort(),l=t.event.special[p]||{},p=(g?l.delegateType:l.bindType)||p,l=t.event.special[p]||{},n=t.extend({type:p,origType:r,data:f,handler:d,guid:d.guid,selector:g,needsContext:g&&t.expr.match.needsContext.test(g),namespace:q.join(".")},k),(o=i[p])||(o=i[p]=[],o.delegateCount=0,l.setup&&l.setup.call(a,f,q,m)!==!1||(a.addEventListener?a.addEventListener(p,m,!1):a.attachEvent&&a.attachEvent("on"+p,m))),l.add&&(l.add.call(a,n),n.handler.guid||(n.handler.guid=d.guid)),g?o.splice(o.delegateCount++,0,n):o.push(n),t.event.global[p]=!0;a=null}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=t.hasData(a)&&t._data(a);if(q&&(k=q.events)){for(b=(b||"").match(v)||[""],j=b.length;j--;)if(h=db.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n){for(l=t.event.special[n]||{},n=(d?l.delegateType:l.bindType)||n,m=k[n]||[],h=h[2]&&new RegExp("(^|\\.)"+o.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=m.length;f--;)g=m[f],!e&&p!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(m.splice(f,1),g.selector&&m.delegateCount--,l.remove&&l.remove.call(a,g));i&&!m.length&&(l.teardown&&l.teardown.call(a,o,q.handle)!==!1||t.removeEvent(a,n,q.handle),delete k[n])}else for(n in k)t.event.remove(a,n+b[j],c,d,!0);t.isEmptyObject(k)&&(delete q.handle,t._removeData(a,"events"))}},trigger:function(c,d,e,g){var h,i,j,k,l,m,n,o=[e||f],p=r.call(c,"type")?c.type:c,q=r.call(c,"namespace")?c.namespace.split("."):[];if(j=m=e=e||f,3!==e.nodeType&&8!==e.nodeType&&!cb.test(p+t.event.triggered)&&(p.indexOf(".")>=0&&(q=p.split("."),p=q.shift(),q.sort()),i=0>p.indexOf(":")&&"on"+p,c=c[t.expando]?c:new t.Event(p,"object"==typeof c&&c),c.isTrigger=!0,c.namespace=q.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,c.result=b,c.target||(c.target=e),d=null==d?[c]:t.makeArray(d,[c]),l=t.event.special[p]||{},g||!l.trigger||l.trigger.apply(e,d)!==!1)){if(!g&&!l.noBubble&&!t.isWindow(e)){for(k=l.delegateType||p,cb.test(k+p)||(j=j.parentNode);j;j=j.parentNode)o.push(j),m=j;m===(e.ownerDocument||f)&&o.push(m.defaultView||m.parentWindow||a)}for(n=0;(j=o[n++])&&!c.isPropagationStopped();)c.type=n>1?k:l.bindType||p,h=(t._data(j,"events")||{})[c.type]&&t._data(j,"handle"),h&&h.apply(j,d),h=i&&j[i],h&&t.acceptData(j)&&h.apply&&h.apply(j,d)===!1&&c.preventDefault();if(c.type=p,!(g||c.isDefaultPrevented()||l._default&&l._default.apply(e.ownerDocument,d)!==!1||"click"===p&&t.nodeName(e,"a")||!t.acceptData(e)||!i||!e[p]||t.isWindow(e))){m=e[i],m&&(e[i]=null),t.event.triggered=p;try{e[p]()}catch(s){}t.event.triggered=b,m&&(e[i]=m)}return c.result}},dispatch:function(a){a=t.event.fix(a);var c,d,e,f,g,h=[],i=o.call(arguments),j=(t._data(this,"events")||{})[a.type]||[],k=t.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){for(h=t.event.handlers.call(this,a,j),c=0;(f=h[c++])&&!a.isPropagationStopped();)for(a.currentTarget=f.elem,g=0;(e=f.handlers[g++])&&!a.isImmediatePropagationStopped();)(!a.namespace_re||a.namespace_re.test(e.namespace))&&(a.handleObj=e,a.data=e.data,d=((t.event.special[e.origType]||{}).handle||e.handler).apply(f.elem,i),d!==b&&(a.result=d)===!1&&(a.preventDefault(),a.stopPropagation()));return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,c){var d,e,f,g,h=[],i=c.delegateCount,j=a.target;if(i&&j.nodeType&&(!a.button||"click"!==a.type))for(;j!=this;j=j.parentNode||this)if(1===j.nodeType&&(j.disabled!==!0||"click"!==a.type)){for(f=[],g=0;i>g;g++)e=c[g],d=e.selector+" ",f[d]===b&&(f[d]=e.needsContext?t(d,this).index(j)>=0:t.find(d,this,null,[j]).length),f[d]&&f.push(e);f.length&&h.push({elem:j,handlers:f})}return c.length>i&&h.push({elem:this,handlers:c.slice(i)}),h},fix:function(a){if(a[t.expando])return a;var b,c,d,e=a.type,g=a,h=this.fixHooks[e];for(h||(this.fixHooks[e]=h=bb.test(e)?this.mouseHooks:ab.test(e)?this.keyHooks:{}),d=h.props?this.props.concat(h.props):this.props,a=new t.Event(g),b=d.length;b--;)c=d[b],a[c]=g[c];return a.target||(a.target=g.srcElement||f),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,h.filter?h.filter(a,g):a},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,c){var d,e,g,h=c.button,i=c.fromElement;return null==a.pageX&&null!=c.clientX&&(e=a.target.ownerDocument||f,g=e.documentElement,d=e.body,a.pageX=c.clientX+(g&&g.scrollLeft||d&&d.scrollLeft||0)-(g&&g.clientLeft||d&&d.clientLeft||0),a.pageY=c.clientY+(g&&g.scrollTop||d&&d.scrollTop||0)-(g&&g.clientTop||d&&d.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?c.toElement:i),a.which||h===b||(a.which=1&h?1:2&h?3:4&h?2:0),a}},special:{load:{noBubble:!0},click:{trigger:function(){return t.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):void 0}},focus:{trigger:function(){if(this!==f.activeElement&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){return this===f.activeElement&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},beforeunload:{postDispatch:function(a){a.result!==b&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=t.extend(new t.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?t.event.trigger(e,null,b):t.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},t.removeEvent=f.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]===e&&(a[d]=null),a.detachEvent(d,c))},t.Event=function(a,b){return this instanceof t.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?eb:fb):this.type=a,b&&t.extend(this,b),this.timeStamp=a&&a.timeStamp||t.now(),this[t.expando]=!0,void 0):new t.Event(a,b)},t.Event.prototype={isDefaultPrevented:fb,isPropagationStopped:fb,isImmediatePropagationStopped:fb,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=eb,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=eb,a&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=eb,this.stopPropagation()}},t.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){t.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!t.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),t.support.submitBubbles||(t.event.special.submit={setup:function(){return t.nodeName(this,"form")?!1:(t.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=t.nodeName(c,"input")||t.nodeName(c,"button")?c.form:b;d&&!t._data(d,"submitBubbles")&&(t.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),t._data(d,"submitBubbles",!0))}),void 0)},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&t.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){return t.nodeName(this,"form")?!1:(t.event.remove(this,"._submit"),void 0)}}),t.support.changeBubbles||(t.event.special.change={setup:function(){return _.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(t.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._just_changed=!0)}),t.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),t.event.simulate("change",this,a,!0)})),!1):(t.event.add(this,"beforeactivate._change",function(a){var b=a.target;_.test(b.nodeName)&&!t._data(b,"changeBubbles")&&(t.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||t.event.simulate("change",this.parentNode,a,!0)}),t._data(b,"changeBubbles",!0))}),void 0)},handle:function(a){var b=a.target;return this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type?a.handleObj.handler.apply(this,arguments):void 0},teardown:function(){return t.event.remove(this,"._change"),!_.test(this.nodeName)}}),t.support.focusinBubbles||t.each({focus:"focusin",blur:"focusout"},function(a,b){var c=0,d=function(a){t.event.simulate(b,a.target,t.event.fix(a),!0)};t.event.special[b]={setup:function(){0===c++&&f.addEventListener(a,d,!0)},teardown:function(){0===--c&&f.removeEventListener(a,d,!0)}}}),t.fn.extend({on:function(a,c,d,e,f){var g,h;if("object"==typeof a){"string"!=typeof c&&(d=d||c,c=b);for(g in a)this.on(g,c,d,a[g],f);return this}if(null==d&&null==e?(e=c,d=c=b):null==e&&("string"==typeof c?(e=d,d=b):(e=d,d=c,c=b)),e===!1)e=fb;else if(!e)return this;return 1===f&&(h=e,e=function(a){return t().off(a),h.apply(this,arguments)},e.guid=h.guid||(h.guid=t.guid++)),this.each(function(){t.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){var e,f;if(a&&a.preventDefault&&a.handleObj)return e=a.handleObj,t(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler),this;if("object"==typeof a){for(f in a)this.off(f,c,a[f]);return this}return(c===!1||"function"==typeof c)&&(d=c,c=b),d===!1&&(d=fb),this.each(function(){t.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)},trigger:function(a,b){return this.each(function(){t.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?t.event.trigger(a,b,c,!0):void 0}}),function(a,b){function db(a){return W.test(a+"")}function eb(){var a,b=[];return a=function(c,d){return b.push(c+=" ")>e.cacheLength&&delete a[b.shift()],a[c]=d}}function fb(a){return a[u]=!0,a}function gb(a){var b=l.createElement("div");try{return a(b)}catch(c){return!1}finally{b=null}}function hb(a,b,c,d){var e,f,g,h,i,j,m,p,q,s;if((b?b.ownerDocument||b:v)!==l&&k(b),b=b||l,c=c||[],!a||"string"!=typeof a)return c;if(1!==(h=b.nodeType)&&9!==h)return[];if(!n&&!d){if(e=X.exec(a))if(g=e[1]){if(9===h){if(f=b.getElementById(g),!f||!f.parentNode)return c;if(f.id===g)return c.push(f),c}else if(b.ownerDocument&&(f=b.ownerDocument.getElementById(g))&&r(b,f)&&f.id===g)return c.push(f),c}else{if(e[2])return G.apply(c,H.call(b.getElementsByTagName(a),0)),c;if((g=e[3])&&w.getByClassName&&b.getElementsByClassName)return G.apply(c,H.call(b.getElementsByClassName(g),0)),c}if(w.qsa&&!o.test(a)){if(m=!0,p=u,q=b,s=9===h&&a,1===h&&"object"!==b.nodeName.toLowerCase()){for(j=mb(a),(m=b.getAttribute("id"))?p=m.replace($,"\\$&"):b.setAttribute("id",p),p="[id='"+p+"'] ",i=j.length;i--;)j[i]=p+nb(j[i]);q=V.test(a)&&b.parentNode||b,s=j.join(",")}if(s)try{return G.apply(c,H.call(q.querySelectorAll(s),0)),c}catch(t){}finally{m||b.removeAttribute("id")}}}return vb(a.replace(P,"$1"),b,c,d)}function ib(a,b){var c=b&&a,d=c&&(~b.sourceIndex||D)-(~a.sourceIndex||D);if(d)return d;if(c)for(;c=c.nextSibling;)if(c===b)return-1;return a?1:-1}function jb(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function kb(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function lb(a){return fb(function(b){return b=+b,fb(function(c,d){for(var e,f=a([],c.length,b),g=f.length;g--;)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function mb(a,b){var c,d,f,g,h,i,j,k=A[a+" "];if(k)return b?0:k.slice(0);for(h=a,i=[],j=e.preFilter;h;){(!c||(d=Q.exec(h)))&&(d&&(h=h.slice(d[0].length)||h),i.push(f=[])),c=!1,(d=R.exec(h))&&(c=d.shift(),f.push({value:c,type:d[0].replace(P," ")}),h=h.slice(c.length));for(g in e.filter)!(d=U[g].exec(h))||j[g]&&!(d=j[g](d))||(c=d.shift(),f.push({value:c,type:g,matches:d}),h=h.slice(c.length));if(!c)break}return b?h.length:h?hb.error(a):A(a,i).slice(0)}function nb(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function ob(a,b,c){var e=b.dir,f=c&&"parentNode"===e,g=y++;return b.first?function(b,c,d){for(;b=b[e];)if(1===b.nodeType||f)return a(b,c,d)}:function(b,c,h){var i,j,k,l=x+" "+g;if(h){for(;b=b[e];)if((1===b.nodeType||f)&&a(b,c,h))return!0}else for(;b=b[e];)if(1===b.nodeType||f)if(k=b[u]||(b[u]={}),(j=k[e])&&j[0]===l){if((i=j[1])===!0||i===d)return i===!0}else if(j=k[e]=[l],j[1]=a(b,c,h)||d,j[1]===!0)return!0}}function pb(a){return a.length>1?function(b,c,d){for(var e=a.length;e--;)if(!a[e](b,c,d))return!1;return!0}:a[0]}function qb(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function rb(a,b,c,d,e,f){return d&&!d[u]&&(d=rb(d)),e&&!e[u]&&(e=rb(e,f)),fb(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ub(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:qb(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d)for(j=qb(r,n),d(j,[],h,i),k=j.length;k--;)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l));if(f){if(e||a){if(e){for(j=[],k=r.length;k--;)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}for(k=r.length;k--;)(l=r[k])&&(j=e?I.call(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=qb(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):G.apply(g,r)})}function sb(a){for(var b,c,d,f=a.length,g=e.relative[a[0].type],h=g||e.relative[" "],i=g?1:0,k=ob(function(a){return a===b},h,!0),l=ob(function(a){return I.call(b,a)>-1},h,!0),m=[function(a,c,d){return!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d))}];f>i;i++)if(c=e.relative[a[i].type])m=[ob(pb(m),c)];else{if(c=e.filter[a[i].type].apply(null,a[i].matches),c[u]){for(d=++i;f>d&&!e.relative[a[d].type];d++);return rb(i>1&&pb(m),i>1&&nb(a.slice(0,i-1)).replace(P,"$1"),c,d>i&&sb(a.slice(i,d)),f>d&&sb(a=a.slice(d)),f>d&&nb(a))}m.push(c)}return pb(m)}function tb(a,b){var c=0,f=b.length>0,g=a.length>0,h=function(h,i,k,m,n){var o,p,q,r=[],s=0,t="0",u=h&&[],v=null!=n,w=j,y=h||g&&e.find.TAG("*",n&&i.parentNode||i),z=x+=null==w?1:Math.random()||.1;for(v&&(j=i!==l&&i,d=c);null!=(o=y[t]);t++){if(g&&o){for(p=0;q=a[p++];)if(q(o,i,k)){m.push(o);break}v&&(x=z,d=++c)}f&&((o=!q&&o)&&s--,h&&u.push(o))}if(s+=t,f&&t!==s){for(p=0;q=b[p++];)q(u,r,i,k);if(h){if(s>0)for(;t--;)u[t]||r[t]||(r[t]=F.call(m));r=qb(r)}G.apply(m,r),v&&!h&&r.length>0&&s+b.length>1&&hb.uniqueSort(m)}return v&&(x=z,j=w),u};return f?fb(h):h}function ub(a,b,c){for(var d=0,e=b.length;e>d;d++)hb(a,b[d],c);return c}function vb(a,b,c,d){var f,g,i,j,k,l=mb(a);if(!d&&1===l.length){if(g=l[0]=l[0].slice(0),g.length>2&&"ID"===(i=g[0]).type&&9===b.nodeType&&!n&&e.relative[g[1].type]){if(b=e.find.ID(i.matches[0].replace(ab,bb),b)[0],!b)return c;a=a.slice(g.shift().value.length)}for(f=U.needsContext.test(a)?0:g.length;f--&&(i=g[f],!e.relative[j=i.type]);)if((k=e.find[j])&&(d=k(i.matches[0].replace(ab,bb),V.test(g[0].type)&&b.parentNode||b))){if(g.splice(f,1),a=d.length&&nb(g),!a)return G.apply(c,H.call(d,0)),c;break}}return h(a,l)(d,b,n,c,V.test(a)),c}function wb(){}var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,u="sizzle"+-new Date,v=a.document,w={},x=0,y=0,z=eb(),A=eb(),B=eb(),C=typeof b,D=1<<31,E=[],F=E.pop,G=E.push,H=E.slice,I=E.indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]===a)return b;return-1},J="[\\x20\\t\\r\\n\\f]",K="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",L=K.replace("w","w#"),M="([*^$|!~]?=)",N="\\["+J+"*("+K+")"+J+"*(?:"+M+J+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+L+")|)|)"+J+"*\\]",O=":("+K+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+N.replace(3,8)+")*)|.*)\\)|)",P=new RegExp("^"+J+"+|((?:^|[^\\\\])(?:\\\\.)*)"+J+"+$","g"),Q=new RegExp("^"+J+"*,"+J+"*"),R=new RegExp("^"+J+"*([\\x20\\t\\r\\n\\f>+~])"+J+"*"),S=new RegExp(O),T=new RegExp("^"+L+"$"),U={ID:new RegExp("^#("+K+")"),CLASS:new RegExp("^\\.("+K+")"),NAME:new RegExp("^\\[name=['\"]?("+K+")['\"]?\\]"),TAG:new RegExp("^("+K.replace("w","w*")+")"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+J+"*(even|odd|(([+-]|)(\\d*)n|)"+J+"*(?:([+-]|)"+J+"*(\\d+)|))"+J+"*\\)|)","i"),needsContext:new RegExp("^"+J+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+J+"*((?:-\\d)?\\d*)"+J+"*\\)|)(?=[^-]|$)","i")},V=/[\x20\t\r\n\f]*[+~]/,W=/^[^{]+\{\s*\[native code/,X=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/'|\\/g,_=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,ab=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,bb=function(a,b){var c="0x"+b-65536;return c!==c?b:0>c?String.fromCharCode(c+65536):String.fromCharCode(55296|c>>10,56320|1023&c)};try{H.call(v.documentElement.childNodes,0)[0].nodeType}catch(cb){H=function(a){for(var b,c=[];b=this[a++];)c.push(b);return c}}g=hb.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},k=hb.setDocument=function(a){var c=a?a.ownerDocument||a:v;return c!==l&&9===c.nodeType&&c.documentElement?(l=c,m=c.documentElement,n=g(c),w.tagNameNoComments=gb(function(a){return a.appendChild(c.createComment("")),!a.getElementsByTagName("*").length}),w.attributes=gb(function(a){a.innerHTML="<select></select>";var b=typeof a.lastChild.getAttribute("multiple");return"boolean"!==b&&"string"!==b}),w.getByClassName=gb(function(a){return a.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",a.getElementsByClassName&&a.getElementsByClassName("e").length?(a.lastChild.className="e",2===a.getElementsByClassName("e").length):!1}),w.getByName=gb(function(a){a.id=u+0,a.innerHTML="<a name='"+u+"'></a><div name='"+u+"'></div>",m.insertBefore(a,m.firstChild);var b=c.getElementsByName&&c.getElementsByName(u).length===2+c.getElementsByName(u+0).length;return w.getIdNotName=!c.getElementById(u),m.removeChild(a),b}),e.attrHandle=gb(function(a){return a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!==C&&"#"===a.firstChild.getAttribute("href")})?{}:{href:function(a){return a.getAttribute("href",2)},type:function(a){return a.getAttribute("type")}},w.getIdNotName?(e.find.ID=function(a,b){if(typeof b.getElementById!==C&&!n){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},e.filter.ID=function(a){var b=a.replace(ab,bb);return function(a){return a.getAttribute("id")===b}}):(e.find.ID=function(a,c){if(typeof c.getElementById!==C&&!n){var d=c.getElementById(a);return d?d.id===a||typeof d.getAttributeNode!==C&&d.getAttributeNode("id").value===a?[d]:b:[]}},e.filter.ID=function(a){var b=a.replace(ab,bb);return function(a){var c=typeof a.getAttributeNode!==C&&a.getAttributeNode("id");return c&&c.value===b}}),e.find.TAG=w.tagNameNoComments?function(a,b){return typeof b.getElementsByTagName!==C?b.getElementsByTagName(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){for(;c=f[e++];)1===c.nodeType&&d.push(c);return d}return f},e.find.NAME=w.getByName&&function(a,b){return typeof b.getElementsByName!==C?b.getElementsByName(name):void 0},e.find.CLASS=w.getByClassName&&function(a,b){return typeof b.getElementsByClassName===C||n?void 0:b.getElementsByClassName(a)},p=[],o=[":focus"],(w.qsa=db(c.querySelectorAll))&&(gb(function(a){a.innerHTML="<select><option selected=''></option></select>",a.querySelectorAll("[selected]").length||o.push("\\["+J+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),a.querySelectorAll(":checked").length||o.push(":checked")}),gb(function(a){a.innerHTML="<input type='hidden' i=''/>",a.querySelectorAll("[i^='']").length&&o.push("[*^$]="+J+"*(?:\"\"|'')"),a.querySelectorAll(":enabled").length||o.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),o.push(",.*:")})),(w.matchesSelector=db(q=m.matchesSelector||m.mozMatchesSelector||m.webkitMatchesSelector||m.oMatchesSelector||m.msMatchesSelector))&&gb(function(a){w.disconnectedMatch=q.call(a,"div"),q.call(a,"[s!='']:x"),p.push("!=",O)}),o=new RegExp(o.join("|")),p=new RegExp(p.join("|")),r=db(m.contains)||m.compareDocumentPosition?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)for(;b=b.parentNode;)if(b===a)return!0;return!1},s=m.compareDocumentPosition?function(a,b){var d;return a===b?(i=!0,0):(d=b.compareDocumentPosition&&a.compareDocumentPosition&&a.compareDocumentPosition(b))?1&d||a.parentNode&&11===a.parentNode.nodeType?a===c||r(v,a)?-1:b===c||r(v,b)?1:0:4&d?-1:1:a.compareDocumentPosition?-1:1}:function(a,b){var d,e=0,f=a.parentNode,g=b.parentNode,h=[a],j=[b];if(a===b)return i=!0,0;if(!f||!g)return a===c?-1:b===c?1:f?-1:g?1:0;if(f===g)return ib(a,b);for(d=a;d=d.parentNode;)h.unshift(d);for(d=b;d=d.parentNode;)j.unshift(d);for(;h[e]===j[e];)e++;return e?ib(h[e],j[e]):h[e]===v?-1:j[e]===v?1:0},i=!1,[0,0].sort(s),w.detectDuplicates=i,l):l},hb.matches=function(a,b){return hb(a,null,null,b)},hb.matchesSelector=function(a,b){if((a.ownerDocument||a)!==l&&k(a),b=b.replace(_,"='$1']"),!(!w.matchesSelector||n||p&&p.test(b)||o.test(b)))try{var c=q.call(a,b);if(c||w.disconnectedMatch||a.document&&11!==a.document.nodeType)return c}catch(d){}return hb(b,l,null,[a]).length>0},hb.contains=function(a,b){return(a.ownerDocument||a)!==l&&k(a),r(a,b)},hb.attr=function(a,b){var c;return(a.ownerDocument||a)!==l&&k(a),n||(b=b.toLowerCase()),(c=e.attrHandle[b])?c(a):n||w.attributes?a.getAttribute(b):((c=a.getAttributeNode(b))||a.getAttribute(b))&&a[b]===!0?b:c&&c.specified?c.value:null},hb.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},hb.uniqueSort=function(a){var b,c=[],d=1,e=0;if(i=!w.detectDuplicates,a.sort(s),i){for(;b=a[d];d++)b===a[d-1]&&(e=c.push(d));for(;e--;)a.splice(c[e],1)}return a},f=hb.getText=function(a){var b,c="",d=0,e=a.nodeType;if(e){if(1===e||9===e||11===e){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=f(a)}else if(3===e||4===e)return a.nodeValue}else for(;b=a[d];d++)c+=f(b);return c},e=hb.selectors={cacheLength:50,createPseudo:fb,match:U,find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ab,bb),a[3]=(a[4]||a[5]||"").replace(ab,bb),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||hb.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&hb.error(a[0]),a},PSEUDO:function(a){var b,c=!a[5]&&a[2];return U.CHILD.test(a[0])?null:(a[4]?a[2]=a[4]:c&&S.test(c)&&(b=mb(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){return"*"===a?function(){return!0}:(a=a.replace(ab,bb).toLowerCase(),function(b){return b.nodeName&&b.nodeName.toLowerCase()===a})},CLASS:function(a){var b=z[a+" "];return b||(b=new RegExp("(^|"+J+")"+a+"("+J+"|$)"))&&z(a,function(a){return b.test(a.className||typeof a.getAttribute!==C&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=hb.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){for(;p;){for(l=b;l=l[p];)if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){for(k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===x&&j[1],m=j[0]===x&&j[2],l=n&&q.childNodes[n];l=++n&&l&&l[p]||(m=n=0)||o.pop();)if(1===l.nodeType&&++m&&l===b){k[a]=[x,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===x)m=j[1];else for(;(l=++n&&l&&l[p]||(m=n=0)||o.pop())&&((h?l.nodeName.toLowerCase()!==r:1!==l.nodeType)||!++m||(s&&((l[u]||(l[u]={}))[a]=[x,m]),l!==b)););return m-=e,m===d||0===m%d&&m/d>=0}}},PSEUDO:function(a,b){var c,d=e.pseudos[a]||e.setFilters[a.toLowerCase()]||hb.error("unsupported pseudo: "+a);return d[u]?d(b):d.length>1?(c=[a,a,"",b],e.setFilters.hasOwnProperty(a.toLowerCase())?fb(function(a,c){for(var e,f=d(a,b),g=f.length;g--;)e=I.call(a,f[g]),a[e]=!(c[e]=f[g])}):function(a){return d(a,0,c)}):d}},pseudos:{not:fb(function(a){var b=[],c=[],d=h(a.replace(P,"$1"));return d[u]?fb(function(a,b,c,e){for(var f,g=d(a,null,e,[]),h=a.length;h--;)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:fb(function(a){return function(b){return hb(a,b).length>0}}),contains:fb(function(a){return function(b){return(b.textContent||b.innerText||f(b)).indexOf(a)>-1}}),lang:fb(function(a){return T.test(a||"")||hb.error("unsupported lang: "+a),a=a.replace(ab,bb).toLowerCase(),function(b){var c;do if(c=n?b.getAttribute("xml:lang")||b.getAttribute("lang"):b.lang)return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===m},focus:function(a){return a===l.activeElement&&(!l.hasFocus||l.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeName>"@"||3===a.nodeType||4===a.nodeType)return!1;return!0},parent:function(a){return!e.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||b.toLowerCase()===a.type)},first:lb(function(){return[0]}),last:lb(function(a,b){return[b-1]}),eq:lb(function(a,b,c){return[0>c?c+b:c]}),even:lb(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:lb(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:lb(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:lb(function(a,b,c){for(var d=0>c?c+b:c;b>++d;)a.push(d);return a})}};for(c in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})e.pseudos[c]=jb(c);for(c in{submit:!0,reset:!0})e.pseudos[c]=kb(c);h=hb.compile=function(a,b){var c,d=[],e=[],f=B[a+" "];if(!f){for(b||(b=mb(a)),c=b.length;c--;)f=sb(b[c]),f[u]?d.push(f):e.push(f);f=B(a,tb(e,d))}return f},e.pseudos.nth=e.pseudos.eq,e.filters=wb.prototype=e.pseudos,e.setFilters=new wb,k(),hb.attr=t.attr,t.find=hb,t.expr=hb.selectors,t.expr[":"]=t.expr.pseudos,t.unique=hb.uniqueSort,t.text=hb.getText,t.isXMLDoc=hb.isXML,t.contains=hb.contains}(a);var gb=/Until$/,hb=/^(?:parents|prev(?:Until|All))/,ib=/^.[^:#\[\.,]*$/,jb=t.expr.match.needsContext,kb={children:!0,contents:!0,next:!0,prev:!0};t.fn.extend({find:function(a){var b,c,d,e=this.length;if("string"!=typeof a)return d=this,this.pushStack(t(a).filter(function(){for(b=0;e>b;b++)if(t.contains(d[b],this))return!0}));for(c=[],b=0;e>b;b++)t.find(a,this[b],c);return c=this.pushStack(e>1?t.unique(c):c),c.selector=(this.selector?this.selector+" ":"")+a,c},has:function(a){var b,c=t(a,this),d=c.length;return this.filter(function(){for(b=0;d>b;b++)if(t.contains(this,c[b]))return!0})},not:function(a){return this.pushStack(mb(this,a,!1))},filter:function(a){return this.pushStack(mb(this,a,!0))},is:function(a){return!!a&&("string"==typeof a?jb.test(a)?t(a,this.context).index(this[0])>=0:t.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=jb.test(a)||"string"!=typeof a?t(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c.ownerDocument&&c!==b&&11!==c.nodeType;){if(g?g.index(c)>-1:t.find.matchesSelector(c,a)){f.push(c);break}c=c.parentNode}return this.pushStack(f.length>1?t.unique(f):f)},index:function(a){return a?"string"==typeof a?t.inArray(this[0],t(a)):t.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){var c="string"==typeof a?t(a,b):t.makeArray(a&&a.nodeType?[a]:a),d=t.merge(this.get(),c);return this.pushStack(t.unique(d))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}}),t.fn.andSelf=t.fn.addBack,t.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return t.dir(a,"parentNode")},parentsUntil:function(a,b,c){return t.dir(a,"parentNode",c)},next:function(a){return lb(a,"nextSibling")},prev:function(a){return lb(a,"previousSibling")},nextAll:function(a){return t.dir(a,"nextSibling")},prevAll:function(a){return t.dir(a,"previousSibling")},nextUntil:function(a,b,c){return t.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return t.dir(a,"previousSibling",c)},siblings:function(a){return t.sibling((a.parentNode||{}).firstChild,a)
},children:function(a){return t.sibling(a.firstChild)},contents:function(a){return t.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:t.merge([],a.childNodes)}},function(a,b){t.fn[a]=function(c,d){var e=t.map(this,b,c);return gb.test(a)||(d=c),d&&"string"==typeof d&&(e=t.filter(d,e)),e=this.length>1&&!kb[a]?t.unique(e):e,this.length>1&&hb.test(a)&&(e=e.reverse()),this.pushStack(e)}}),t.extend({filter:function(a,b,c){return c&&(a=":not("+a+")"),1===b.length?t.find.matchesSelector(b[0],a)?[b[0]]:[]:t.find.matches(a,b)},dir:function(a,c,d){for(var e=[],f=a[c];f&&9!==f.nodeType&&(d===b||1!==f.nodeType||!t(f).is(d));)1===f.nodeType&&e.push(f),f=f[c];return e},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}});var ob="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",pb=/ jQuery\d+="(?:null|\d+)"/g,qb=new RegExp("<(?:"+ob+")[\\s/>]","i"),rb=/^\s+/,sb=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,tb=/<([\w:]+)/,ub=/<tbody/i,vb=/<|&#?\w+;/,wb=/<(?:script|style|link)/i,xb=/^(?:checkbox|radio)$/i,yb=/checked\s*(?:[^=]|=\s*.checked.)/i,zb=/^$|\/(?:java|ecma)script/i,Ab=/^true\/(.*)/,Bb=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,Cb={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:t.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},Db=nb(f),Eb=Db.appendChild(f.createElement("div"));Cb.optgroup=Cb.option,Cb.tbody=Cb.tfoot=Cb.colgroup=Cb.caption=Cb.thead,Cb.th=Cb.td,t.fn.extend({text:function(a){return t.access(this,function(a){return a===b?t.text(this):this.empty().append((this[0]&&this[0].ownerDocument||f).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(t.isFunction(a))return this.each(function(b){t(this).wrapAll(a.call(this,b))});if(this[0]){var b=t(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){for(var a=this;a.firstChild&&1===a.firstChild.nodeType;)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return t.isFunction(a)?this.each(function(b){t(this).wrapInner(a.call(this,b))}):this.each(function(){var b=t(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=t.isFunction(a);return this.each(function(c){t(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){t.nodeName(this,"body")||t(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.insertBefore(a,this.firstChild)})},before:function(){return this.domManip(arguments,!1,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,!1,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=0;null!=(c=this[d]);d++)(!a||t.filter(a,[c]).length>0)&&(b||1!==c.nodeType||t.cleanData(Lb(c)),c.parentNode&&(b&&t.contains(c.ownerDocument,c)&&Ib(Lb(c,"script")),c.parentNode.removeChild(c)));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){for(1===a.nodeType&&t.cleanData(Lb(a,!1));a.firstChild;)a.removeChild(a.firstChild);a.options&&t.nodeName(a,"select")&&(a.options.length=0)}return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return t.clone(this,a,b)})},html:function(a){return t.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return 1===c.nodeType?c.innerHTML.replace(pb,""):b;if(!("string"!=typeof a||wb.test(a)||!t.support.htmlSerialize&&qb.test(a)||!t.support.leadingWhitespace&&rb.test(a)||Cb[(tb.exec(a)||["",""])[1].toLowerCase()])){a=a.replace(sb,"<$1></$2>");try{for(;e>d;d++)c=this[d]||{},1===c.nodeType&&(t.cleanData(Lb(c,!1)),c.innerHTML=a);c=0}catch(f){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){var b=t.isFunction(a);return b||"string"==typeof a||(a=t(a).not(this).detach()),this.domManip([a],!0,function(a){var b=this.nextSibling,c=this.parentNode;c&&(t(this).remove(),c.insertBefore(a,b))})},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){a=m.apply([],a);var e,f,g,h,i,j,k=0,l=this.length,n=this,o=l-1,p=a[0],q=t.isFunction(p);if(q||!(1>=l||"string"!=typeof p||t.support.checkClone)&&yb.test(p))return this.each(function(e){var f=n.eq(e);q&&(a[0]=p.call(this,e,c?f.html():b)),f.domManip(a,c,d)});if(l&&(j=t.buildFragment(a,this[0].ownerDocument,!1,this),e=j.firstChild,1===j.childNodes.length&&(j=e),e)){for(c=c&&t.nodeName(e,"tr"),h=t.map(Lb(j,"script"),Gb),g=h.length;l>k;k++)f=j,k!==o&&(f=t.clone(f,!0,!0),g&&t.merge(h,Lb(f,"script"))),d.call(c&&t.nodeName(this[k],"table")?Fb(this[k],"tbody"):this[k],f,k);if(g)for(i=h[h.length-1].ownerDocument,t.map(h,Hb),k=0;g>k;k++)f=h[k],zb.test(f.type||"")&&!t._data(f,"globalEval")&&t.contains(i,f)&&(f.src?t.ajax({url:f.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):t.globalEval((f.text||f.textContent||f.innerHTML||"").replace(Bb,"")));j=e=null}return this}}),t.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){t.fn[a]=function(a){for(var c,d=0,e=[],f=t(a),g=f.length-1;g>=d;d++)c=d===g?this:this.clone(!0),t(f[d])[b](c),n.apply(e,c.get());return this.pushStack(e)}}),t.extend({clone:function(a,b,c){var d,e,f,g,h,i=t.contains(a.ownerDocument,a);if(t.support.html5Clone||t.isXMLDoc(a)||!qb.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(Eb.innerHTML=a.outerHTML,Eb.removeChild(f=Eb.firstChild)),!(t.support.noCloneEvent&&t.support.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||t.isXMLDoc(a)))for(d=Lb(f),h=Lb(a),g=0;null!=(e=h[g]);++g)d[g]&&Kb(e,d[g]);if(b)if(c)for(h=h||Lb(a),d=d||Lb(f),g=0;null!=(e=h[g]);g++)Jb(e,d[g]);else Jb(a,f);return d=Lb(f,"script"),d.length>0&&Ib(d,!i&&Lb(a,"script")),d=h=e=null,f},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k,l=a.length,m=nb(b),n=[],o=0;l>o;o++)if(f=a[o],f||0===f)if("object"===t.type(f))t.merge(n,f.nodeType?[f]:f);else if(vb.test(f)){for(h=h||m.appendChild(b.createElement("div")),i=(tb.exec(f)||["",""])[1].toLowerCase(),k=Cb[i]||Cb._default,h.innerHTML=k[1]+f.replace(sb,"<$1></$2>")+k[2],e=k[0];e--;)h=h.lastChild;if(!t.support.leadingWhitespace&&rb.test(f)&&n.push(b.createTextNode(rb.exec(f)[0])),!t.support.tbody)for(f="table"!==i||ub.test(f)?"<table>"!==k[1]||ub.test(f)?0:h:h.firstChild,e=f&&f.childNodes.length;e--;)t.nodeName(j=f.childNodes[e],"tbody")&&!j.childNodes.length&&f.removeChild(j);for(t.merge(n,h.childNodes),h.textContent="";h.firstChild;)h.removeChild(h.firstChild);h=m.lastChild}else n.push(b.createTextNode(f));for(h&&m.removeChild(h),t.support.appendChecked||t.grep(Lb(n,"input"),Mb),o=0;f=n[o++];)if((!d||-1===t.inArray(f,d))&&(g=t.contains(f.ownerDocument,f),h=Lb(m.appendChild(f),"script"),g&&Ib(h),c))for(e=0;f=h[e++];)zb.test(f.type||"")&&c.push(f);return h=null,m},cleanData:function(a,b){for(var c,d,f,g,h=0,i=t.expando,j=t.cache,l=t.support.deleteExpando,m=t.event.special;null!=(c=a[h]);h++)if((b||t.acceptData(c))&&(f=c[i],g=f&&j[f])){if(g.events)for(d in g.events)m[d]?t.event.remove(c,d):t.removeEvent(c,d,g.handle);j[f]&&(delete j[f],l?delete c[i]:typeof c.removeAttribute!==e?c.removeAttribute(i):c[i]=null,k.push(f))}}});var Nb,Ob,Pb,Qb=/alpha\([^)]*\)/i,Rb=/opacity\s*=\s*([^)]*)/,Sb=/^(top|right|bottom|left)$/,Tb=/^(none|table(?!-c[ea]).+)/,Ub=/^margin/,Vb=new RegExp("^("+u+")(.*)$","i"),Wb=new RegExp("^("+u+")(?!px)[a-z%]+$","i"),Xb=new RegExp("^([+-])=("+u+")","i"),Yb={BODY:"block"},Zb={position:"absolute",visibility:"hidden",display:"block"},$b={letterSpacing:0,fontWeight:400},_b=["Top","Right","Bottom","Left"],ac=["Webkit","O","Moz","ms"];t.fn.extend({css:function(a,c){return t.access(this,function(a,c,d){var e,f,g={},h=0;if(t.isArray(c)){for(f=Ob(a),e=c.length;e>h;h++)g[c[h]]=t.css(a,c[h],!1,f);return g}return d!==b?t.style(a,c,d):t.css(a,c)},a,c,arguments.length>1)},show:function(){return dc(this,!0)},hide:function(){return dc(this)},toggle:function(a){var b="boolean"==typeof a;return this.each(function(){(b?a:cc(this))?t(this).show():t(this).hide()})}}),t.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Pb(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":t.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var f,g,h,i=t.camelCase(c),j=a.style;if(c=t.cssProps[i]||(t.cssProps[i]=bc(j,i)),h=t.cssHooks[c]||t.cssHooks[i],d===b)return h&&"get"in h&&(f=h.get(a,!1,e))!==b?f:j[c];if(g=typeof d,"string"===g&&(f=Xb.exec(d))&&(d=(f[1]+1)*f[2]+parseFloat(t.css(a,c)),g="number"),!(null==d||"number"===g&&isNaN(d)||("number"!==g||t.cssNumber[i]||(d+="px"),t.support.clearCloneStyle||""!==d||0!==c.indexOf("background")||(j[c]="inherit"),h&&"set"in h&&(d=h.set(a,d,e))===b)))try{j[c]=d}catch(k){}}},css:function(a,c,d,e){var f,g,h,i=t.camelCase(c);return c=t.cssProps[i]||(t.cssProps[i]=bc(a.style,i)),h=t.cssHooks[c]||t.cssHooks[i],h&&"get"in h&&(g=h.get(a,!0,d)),g===b&&(g=Pb(a,c,e)),"normal"===g&&c in $b&&(g=$b[c]),""===d||d?(f=parseFloat(g),d===!0||t.isNumeric(f)?f||0:g):g},swap:function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e}}),a.getComputedStyle?(Ob=function(b){return a.getComputedStyle(b,null)},Pb=function(a,c,d){var e,f,g,h=d||Ob(a),i=h?h.getPropertyValue(c)||h[c]:b,j=a.style;return h&&(""!==i||t.contains(a.ownerDocument,a)||(i=t.style(a,c)),Wb.test(i)&&Ub.test(c)&&(e=j.width,f=j.minWidth,g=j.maxWidth,j.minWidth=j.maxWidth=j.width=i,i=h.width,j.width=e,j.minWidth=f,j.maxWidth=g)),i}):f.documentElement.currentStyle&&(Ob=function(a){return a.currentStyle},Pb=function(a,c,d){var e,f,g,h=d||Ob(a),i=h?h[c]:b,j=a.style;return null==i&&j&&j[c]&&(i=j[c]),Wb.test(i)&&!Sb.test(c)&&(e=j.left,f=a.runtimeStyle,g=f&&f.left,g&&(f.left=a.currentStyle.left),j.left="fontSize"===c?"1em":i,i=j.pixelLeft+"px",j.left=e,g&&(f.left=g)),""===i?"auto":i}),t.each(["height","width"],function(a,b){t.cssHooks[b]={get:function(a,c,d){return c?0===a.offsetWidth&&Tb.test(t.css(a,"display"))?t.swap(a,Zb,function(){return gc(a,b,d)}):gc(a,b,d):void 0},set:function(a,c,d){var e=d&&Ob(a);return ec(a,c,d?fc(a,b,d,t.support.boxSizing&&"border-box"===t.css(a,"boxSizing",!1,e),e):0)}}}),t.support.opacity||(t.cssHooks.opacity={get:function(a,b){return Rb.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=t.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===t.trim(f.replace(Qb,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Qb.test(f)?f.replace(Qb,e):f+" "+e)}}),t(function(){t.support.reliableMarginRight||(t.cssHooks.marginRight={get:function(a,b){return b?t.swap(a,{display:"inline-block"},Pb,[a,"marginRight"]):void 0}}),!t.support.pixelPosition&&t.fn.position&&t.each(["top","left"],function(a,b){t.cssHooks[b]={get:function(a,c){return c?(c=Pb(a,b),Wb.test(c)?t(a).position()[b]+"px":c):void 0}}})}),t.expr&&t.expr.filters&&(t.expr.filters.hidden=function(a){return 0>=a.offsetWidth&&0>=a.offsetHeight||!t.support.reliableHiddenOffsets&&"none"===(a.style&&a.style.display||t.css(a,"display"))},t.expr.filters.visible=function(a){return!t.expr.filters.hidden(a)}),t.each({margin:"",padding:"",border:"Width"},function(a,b){t.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+_b[d]+b]=f[d]||f[d-2]||f[0];return e}},Ub.test(a)||(t.cssHooks[a+b].set=ec)});var jc=/%20/g,kc=/\[\]$/,lc=/\r?\n/g,mc=/^(?:submit|button|image|reset|file)$/i,nc=/^(?:input|select|textarea|keygen)/i;t.fn.extend({serialize:function(){return t.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=t.prop(this,"elements");return a?t.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!t(this).is(":disabled")&&nc.test(this.nodeName)&&!mc.test(a)&&(this.checked||!xb.test(a))}).map(function(a,b){var c=t(this).val();return null==c?null:t.isArray(c)?t.map(c,function(a){return{name:b.name,value:a.replace(lc,"\r\n")}}):{name:b.name,value:c.replace(lc,"\r\n")}}).get()}}),t.param=function(a,c){var d,e=[],f=function(a,b){b=t.isFunction(b)?b():null==b?"":b,e[e.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(c===b&&(c=t.ajaxSettings&&t.ajaxSettings.traditional),t.isArray(a)||a.jquery&&!t.isPlainObject(a))t.each(a,function(){f(this.name,this.value)});else for(d in a)oc(d,a[d],c,f);return e.join("&").replace(jc,"+")},t.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){t.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),t.fn.hover=function(a,b){return this.mouseenter(a).mouseleave(b||a)};var pc,qc,rc=t.now(),sc=/\?/,tc=/#.*$/,uc=/([?&])_=[^&]*/,vc=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,wc=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,xc=/^(?:GET|HEAD)$/,yc=/^\/\//,zc=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Ac=t.fn.load,Bc={},Cc={},Dc="*/".concat("*");try{qc=g.href}catch(Ec){qc=f.createElement("a"),qc.href="",qc=qc.href}pc=zc.exec(qc.toLowerCase())||[],t.fn.load=function(a,c,d){if("string"!=typeof a&&Ac)return Ac.apply(this,arguments);var e,f,g,h=this,i=a.indexOf(" ");return i>=0&&(e=a.slice(i,a.length),a=a.slice(0,i)),t.isFunction(c)?(d=c,c=b):c&&"object"==typeof c&&(g="POST"),h.length>0&&t.ajax({url:a,type:g,dataType:"html",data:c}).done(function(a){f=arguments,h.html(e?t("<div>").append(t.parseHTML(a)).find(e):a)}).complete(d&&function(a,b){h.each(d,f||[a.responseText,b,a])}),this},t.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){t.fn[b]=function(a){return this.on(b,a)}}),t.each(["get","post"],function(a,c){t[c]=function(a,d,e,f){return t.isFunction(d)&&(f=f||e,e=d,d=b),t.ajax({url:a,type:c,dataType:f,data:d,success:e})}}),t.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:qc,type:"GET",isLocal:wc.test(pc[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dc,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":t.parseJSON,"text xml":t.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Hc(Hc(a,t.ajaxSettings),b):Hc(t.ajaxSettings,a)},ajaxPrefilter:Fc(Bc),ajaxTransport:Fc(Cc),ajax:function(a,c){function z(a,c,d,e){var k,r,s,v,w,y=c;2!==u&&(u=2,h&&clearTimeout(h),j=b,g=e||"",x.readyState=a>0?4:0,d&&(v=Ic(l,x,d)),a>=200&&300>a||304===a?(l.ifModified&&(w=x.getResponseHeader("Last-Modified"),w&&(t.lastModified[f]=w),w=x.getResponseHeader("etag"),w&&(t.etag[f]=w)),204===a?(k=!0,y="nocontent"):304===a?(k=!0,y="notmodified"):(k=Jc(l,v),y=k.state,r=k.data,s=k.error,k=!s)):(s=y,(a||!y)&&(y="error",0>a&&(a=0))),x.status=a,x.statusText=(c||y)+"",k?o.resolveWith(m,[r,y,x]):o.rejectWith(m,[x,y,s]),x.statusCode(q),q=b,i&&n.trigger(k?"ajaxSuccess":"ajaxError",[x,l,k?r:s]),p.fireWith(m,[x,y]),i&&(n.trigger("ajaxComplete",[x,l]),--t.active||t.event.trigger("ajaxStop")))}"object"==typeof a&&(c=a,a=b),c=c||{};var d,e,f,g,h,i,j,k,l=t.ajaxSetup({},c),m=l.context||l,n=l.context&&(m.nodeType||m.jquery)?t(m):t.event,o=t.Deferred(),p=t.Callbacks("once memory"),q=l.statusCode||{},r={},s={},u=0,w="canceled",x={readyState:0,getResponseHeader:function(a){var b;if(2===u){if(!k)for(k={};b=vc.exec(g);)k[b[1].toLowerCase()]=b[2];b=k[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===u?g:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return u||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return u||(l.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>u)for(b in a)q[b]=[q[b],a[b]];else x.always(a[x.status]);return this},abort:function(a){var b=a||w;return j&&j.abort(b),z(0,b),this}};if(o.promise(x).complete=p.add,x.success=x.done,x.error=x.fail,l.url=((a||l.url||qc)+"").replace(tc,"").replace(yc,pc[1]+"//"),l.type=c.method||c.type||l.method||l.type,l.dataTypes=t.trim(l.dataType||"*").toLowerCase().match(v)||[""],null==l.crossDomain&&(d=zc.exec(l.url.toLowerCase()),l.crossDomain=!(!d||d[1]===pc[1]&&d[2]===pc[2]&&(d[3]||("http:"===d[1]?80:443))==(pc[3]||("http:"===pc[1]?80:443)))),l.data&&l.processData&&"string"!=typeof l.data&&(l.data=t.param(l.data,l.traditional)),Gc(Bc,l,c,x),2===u)return x;i=l.global,i&&0===t.active++&&t.event.trigger("ajaxStart"),l.type=l.type.toUpperCase(),l.hasContent=!xc.test(l.type),f=l.url,l.hasContent||(l.data&&(f=l.url+=(sc.test(f)?"&":"?")+l.data,delete l.data),l.cache===!1&&(l.url=uc.test(f)?f.replace(uc,"$1_="+rc++):f+(sc.test(f)?"&":"?")+"_="+rc++)),l.ifModified&&(t.lastModified[f]&&x.setRequestHeader("If-Modified-Since",t.lastModified[f]),t.etag[f]&&x.setRequestHeader("If-None-Match",t.etag[f])),(l.data&&l.hasContent&&l.contentType!==!1||c.contentType)&&x.setRequestHeader("Content-Type",l.contentType),x.setRequestHeader("Accept",l.dataTypes[0]&&l.accepts[l.dataTypes[0]]?l.accepts[l.dataTypes[0]]+("*"!==l.dataTypes[0]?", "+Dc+"; q=0.01":""):l.accepts["*"]);for(e in l.headers)x.setRequestHeader(e,l.headers[e]);if(l.beforeSend&&(l.beforeSend.call(m,x,l)===!1||2===u))return x.abort();w="abort";for(e in{success:1,error:1,complete:1})x[e](l[e]);if(j=Gc(Cc,l,c,x)){x.readyState=1,i&&n.trigger("ajaxSend",[x,l]),l.async&&l.timeout>0&&(h=setTimeout(function(){x.abort("timeout")},l.timeout));try{u=1,j.send(r,z)}catch(y){if(!(2>u))throw y;z(-1,y)}}else z(-1,"No Transport");return x},getScript:function(a,c){return t.get(a,b,c,"script")},getJSON:function(a,b,c){return t.get(a,b,c,"json")}}),t.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return t.globalEval(a),a}}}),t.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),t.ajaxTransport("script",function(a){if(a.crossDomain){var c,d=f.head||t("head")[0]||f.documentElement;return{send:function(b,e){c=f.createElement("script"),c.async=!0,a.scriptCharset&&(c.charset=a.scriptCharset),c.src=a.url,c.onload=c.onreadystatechange=function(a,b){(b||!c.readyState||/loaded|complete/.test(c.readyState))&&(c.onload=c.onreadystatechange=null,c.parentNode&&c.parentNode.removeChild(c),c=null,b||e(200,"success"))},d.insertBefore(c,d.firstChild)},abort:function(){c&&c.onload(b,!0)}}}});var Kc=[],Lc=/(=)\?(?=&|$)|\?\?/;t.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Kc.pop()||t.expando+"_"+rc++;return this[a]=!0,a}}),t.ajaxPrefilter("json jsonp",function(c,d,e){var f,g,h,i=c.jsonp!==!1&&(Lc.test(c.url)?"url":"string"==typeof c.data&&!(c.contentType||"").indexOf("application/x-www-form-urlencoded")&&Lc.test(c.data)&&"data");return i||"jsonp"===c.dataTypes[0]?(f=c.jsonpCallback=t.isFunction(c.jsonpCallback)?c.jsonpCallback():c.jsonpCallback,i?c[i]=c[i].replace(Lc,"$1"+f):c.jsonp!==!1&&(c.url+=(sc.test(c.url)?"&":"?")+c.jsonp+"="+f),c.converters["script json"]=function(){return h||t.error(f+" was not called"),h[0]},c.dataTypes[0]="json",g=a[f],a[f]=function(){h=arguments},e.always(function(){a[f]=g,c[f]&&(c.jsonpCallback=d.jsonpCallback,Kc.push(f)),h&&t.isFunction(g)&&g(h[0]),h=g=b}),"script"):void 0});var Mc,Nc,Oc=0,Pc=a.ActiveXObject&&function(){var a;for(a in Mc)Mc[a](b,!0)};t.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&Qc()||Rc()}:Qc,Nc=t.ajaxSettings.xhr(),t.support.cors=!!Nc&&"withCredentials"in Nc,Nc=t.support.ajax=!!Nc,Nc&&t.ajaxTransport(function(c){if(!c.crossDomain||t.support.cors){var d;return{send:function(e,f){var g,h,i=c.xhr();if(c.username?i.open(c.type,c.url,c.async,c.username,c.password):i.open(c.type,c.url,c.async),c.xhrFields)for(h in c.xhrFields)i[h]=c.xhrFields[h];c.mimeType&&i.overrideMimeType&&i.overrideMimeType(c.mimeType),c.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest");try{for(h in e)i.setRequestHeader(h,e[h])}catch(j){}i.send(c.hasContent&&c.data||null),d=function(a,e){var h,j,k,l;try{if(d&&(e||4===i.readyState))if(d=b,g&&(i.onreadystatechange=t.noop,Pc&&delete Mc[g]),e)4!==i.readyState&&i.abort();else{l={},h=i.status,j=i.getAllResponseHeaders(),"string"==typeof i.responseText&&(l.text=i.responseText);try{k=i.statusText}catch(m){k=""}h||!c.isLocal||c.crossDomain?1223===h&&(h=204):h=l.text?200:404}}catch(n){e||f(-1,n)}l&&f(h,k,l,j)},c.async?4===i.readyState?setTimeout(d):(g=++Oc,Pc&&(Mc||(Mc={},t(a).unload(Pc)),Mc[g]=d),i.onreadystatechange=d):d()},abort:function(){d&&d(b,!0)}}}});var Sc,Tc,Uc=/^(?:toggle|show|hide)$/,Vc=new RegExp("^(?:([+-])=|)("+u+")([a-z%]*)$","i"),Wc=/queueHooks$/,Xc=[bd],Yc={"*":[function(a,b){var c,d,e=this.createTween(a,b),f=Vc.exec(b),g=e.cur(),h=+g||0,i=1,j=20;if(f){if(c=+f[2],d=f[3]||(t.cssNumber[a]?"":"px"),"px"!==d&&h){h=t.css(e.elem,a,!0)||c||1;do i=i||".5",h/=i,t.style(e.elem,a,h+d);while(i!==(i=e.cur()/g)&&1!==i&&--j)}e.unit=d,e.start=h,e.end=f[1]?h+(f[1]+1)*c:c}return e}]};t.Animation=t.extend(_c,{tweener:function(a,b){t.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],Yc[c]=Yc[c]||[],Yc[c].unshift(b)},prefilter:function(a,b){b?Xc.unshift(a):Xc.push(a)}}),t.Tween=cd,cd.prototype={constructor:cd,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(t.cssNumber[c]?"":"px")},cur:function(){var a=cd.propHooks[this.prop];return a&&a.get?a.get(this):cd.propHooks._default.get(this)},run:function(a){var b,c=cd.propHooks[this.prop];return this.pos=b=this.options.duration?t.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):cd.propHooks._default.set(this),this}},cd.prototype.init.prototype=cd.prototype,cd.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=t.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){t.fx.step[a.prop]?t.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[t.cssProps[a.prop]]||t.cssHooks[a.prop])?t.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},cd.propHooks.scrollTop=cd.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},t.each(["toggle","show","hide"],function(a,b){var c=t.fn[b];t.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(dd(b,!0),a,d,e)}}),t.fn.extend({fadeTo:function(a,b,c,d){return this.filter(cc).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=t.isEmptyObject(a),f=t.speed(b,c,d),g=function(){var b=_c(this,t.extend({},a),f);g.finish=function(){b.stop(!0)},(e||t._data(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,c,d){var e=function(a){var b=a.stop;delete a.stop,b(d)};return"string"!=typeof a&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,c=null!=a&&a+"queueHooks",f=t.timers,g=t._data(this);if(c)g[c]&&g[c].stop&&e(g[c]);else for(c in g)g[c]&&g[c].stop&&Wc.test(c)&&e(g[c]);for(c=f.length;c--;)f[c].elem!==this||null!=a&&f[c].queue!==a||(f[c].anim.stop(d),b=!1,f.splice(c,1));(b||!d)&&t.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=t._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=t.timers,g=d?d.length:0;for(c.finish=!0,t.queue(this,a,[]),e&&e.cur&&e.cur.finish&&e.cur.finish.call(this),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),t.each({slideDown:dd("show"),slideUp:dd("hide"),slideToggle:dd("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){t.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),t.speed=function(a,b,c){var d=a&&"object"==typeof a?t.extend({},a):{complete:c||!c&&b||t.isFunction(a)&&a,duration:a,easing:c&&b||b&&!t.isFunction(b)&&b};return d.duration=t.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in t.fx.speeds?t.fx.speeds[d.duration]:t.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){t.isFunction(d.old)&&d.old.call(this),d.queue&&t.dequeue(this,d.queue)},d},t.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},t.timers=[],t.fx=cd.prototype.init,t.fx.tick=function(){var a,c=t.timers,d=0;for(Sc=t.now();c.length>d;d++)a=c[d],a()||c[d]!==a||c.splice(d--,1);c.length||t.fx.stop(),Sc=b},t.fx.timer=function(a){a()&&t.timers.push(a)&&t.fx.start()},t.fx.interval=13,t.fx.start=function(){Tc||(Tc=setInterval(t.fx.tick,t.fx.interval))},t.fx.stop=function(){clearInterval(Tc),Tc=null},t.fx.speeds={slow:600,fast:200,_default:400},t.fx.step={},t.expr&&t.expr.filters&&(t.expr.filters.animated=function(a){return t.grep(t.timers,function(b){return a===b.elem}).length}),t.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){t.offset.setOffset(this,a,b)});var c,d,f={top:0,left:0},g=this[0],h=g&&g.ownerDocument;if(h)return c=h.documentElement,t.contains(c,g)?(typeof g.getBoundingClientRect!==e&&(f=g.getBoundingClientRect()),d=ed(h),{top:f.top+(d.pageYOffset||c.scrollTop)-(c.clientTop||0),left:f.left+(d.pageXOffset||c.scrollLeft)-(c.clientLeft||0)}):f},t.offset={setOffset:function(a,b,c){var d=t.css(a,"position");"static"===d&&(a.style.position="relative");var l,m,e=t(a),f=e.offset(),g=t.css(a,"top"),h=t.css(a,"left"),i=("absolute"===d||"fixed"===d)&&t.inArray("auto",[g,h])>-1,j={},k={};i?(k=e.position(),l=k.top,m=k.left):(l=parseFloat(g)||0,m=parseFloat(h)||0),t.isFunction(b)&&(b=b.call(a,c,f)),null!=b.top&&(j.top=b.top-f.top+l),null!=b.left&&(j.left=b.left-f.left+m),"using"in b?b.using.call(a,j):e.css(j)}},t.fn.extend({position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return"fixed"===t.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),t.nodeName(a[0],"html")||(c=a.offset()),c.top+=t.css(a[0],"borderTopWidth",!0),c.left+=t.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-t.css(d,"marginTop",!0),left:b.left-c.left-t.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||f.documentElement;a&&!t.nodeName(a,"html")&&"static"===t.css(a,"position");)a=a.offsetParent;return a||f.documentElement})}}),t.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);t.fn[a]=function(e){return t.access(this,function(a,e,f){var g=ed(a);return f===b?g?c in g?g[c]:g.document.documentElement[e]:a[e]:(g?g.scrollTo(d?t(g).scrollLeft():f,d?f:t(g).scrollTop()):a[e]=f,void 0)},a,e,arguments.length,null)}}),t.each({Height:"height",Width:"width"},function(a,c){t.each({padding:"inner"+a,content:c,"":"outer"+a},function(d,e){t.fn[e]=function(e,f){var g=arguments.length&&(d||"boolean"!=typeof e),h=d||(e===!0||f===!0?"margin":"border");return t.access(this,function(c,d,e){var f;return t.isWindow(c)?c.document.documentElement["client"+a]:9===c.nodeType?(f=c.documentElement,Math.max(c.body["scroll"+a],f["scroll"+a],c.body["offset"+a],f["offset"+a],f["client"+a])):e===b?t.css(c,d,h):t.style(c,d,e,h)},c,g?e:b,g,null)}})}),a.jQuery=a.$=t,"function"==typeof define&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return t})}(window),$.noConflict(!0)});define("/assets/vendor/Zonda/vendor/backbone/1.0.0/backbone",["underscore","jquery"],function(a,b){a("underscore");var e=a("jquery");this.$=e,this.jQuery=e,function(){var i,c=this,d=c.Backbone,e=[],f=e.push,g=e.slice,h=e.splice;i="undefined"!=typeof b?b:c.Backbone={},i.VERSION="1.0.0";var j=c._;j||"undefined"==typeof a||(j=a("underscore")),i.$=c.jQuery||c.Zepto||c.ender||c.$,i.noConflict=function(){return c.Backbone=d,this},i.emulateHTTP=!1,i.emulateJSON=!1;var k=i.Events={on:function(a,b,c){if(!m(this,"on",a,[b,c])||!b)return this;this._events||(this._events={});var d=this._events[a]||(this._events[a]=[]);return d.push({callback:b,context:c,ctx:c||this}),this},once:function(a,b,c){if(!m(this,"once",a,[b,c])||!b)return this;var d=this,e=j.once(function(){d.off(a,e),b.apply(this,arguments)});return e._callback=b,this.on(a,e,c)},off:function(a,b,c){var d,e,f,g,h,i,k,l;if(!this._events||!m(this,"off",a,[b,c]))return this;if(!a&&!b&&!c)return this._events={},this;for(g=a?[a]:j.keys(this._events),h=0,i=g.length;i>h;h++)if(a=g[h],f=this._events[a]){if(this._events[a]=d=[],b||c)for(k=0,l=f.length;l>k;k++)e=f[k],(b&&b!==e.callback&&b!==e.callback._callback||c&&c!==e.context)&&d.push(e);d.length||delete this._events[a]}return this},trigger:function(a){if(!this._events)return this;var b=g.call(arguments,1);if(!m(this,"trigger",a,b))return this;var c=this._events[a],d=this._events.all;return c&&n(c,b),d&&n(d,arguments),this},stopListening:function(a,b,c){var d=this._listeners;if(!d)return this;var e=!b&&!c;"object"==typeof b&&(c=this),a&&((d={})[a._listenerId]=a);for(var f in d)d[f].off(b,c,this),e&&delete this._listeners[f];return this}},l=/\s+/,m=function(a,b,c,d){if(!c)return!0;if("object"==typeof c){for(var e in c)a[b].apply(a,[e,c[e]].concat(d));return!1}if(l.test(c)){for(var f=c.split(l),g=0,h=f.length;h>g;g++)a[b].apply(a,[f[g]].concat(d));return!1}return!0},n=function(a,b){var c,d=-1,e=a.length,f=b[0],g=b[1],h=b[2];switch(b.length){case 0:for(;e>++d;)(c=a[d]).callback.call(c.ctx);return;case 1:for(;e>++d;)(c=a[d]).callback.call(c.ctx,f);return;case 2:for(;e>++d;)(c=a[d]).callback.call(c.ctx,f,g);return;case 3:for(;e>++d;)(c=a[d]).callback.call(c.ctx,f,g,h);return;default:for(;e>++d;)(c=a[d]).callback.apply(c.ctx,b)}},o={listenTo:"on",listenToOnce:"once"};j.each(o,function(a,b){k[b]=function(b,c,d){var e=this._listeners||(this._listeners={}),f=b._listenerId||(b._listenerId=j.uniqueId("l"));return e[f]=b,"object"==typeof c&&(d=this),b[a](c,d,this),this}}),k.bind=k.on,k.unbind=k.off,j.extend(i,k);var p=i.Model=function(a,b){var c,d=a||{};b||(b={}),this.cid=j.uniqueId("c"),this.attributes={},j.extend(this,j.pick(b,q)),b.parse&&(d=this.parse(d,b)||{}),(c=j.result(this,"defaults"))&&(d=j.defaults({},d,c)),this.set(d,b),this.changed={},this.initialize.apply(this,arguments)},q=["url","urlRoot","collection"];j.extend(p.prototype,k,{changed:null,validationError:null,idAttribute:"id",initialize:function(){},toJSON:function(){return j.clone(this.attributes)},sync:function(){return i.sync.apply(this,arguments)},get:function(a){return this.attributes[a]},escape:function(a){return j.escape(this.get(a))},has:function(a){return null!=this.get(a)},set:function(a,b,c){var d,e,f,g,h,i,k,l;if(null==a)return this;if("object"==typeof a?(e=a,c=b):(e={})[a]=b,c||(c={}),!this._validate(e,c))return!1;f=c.unset,h=c.silent,g=[],i=this._changing,this._changing=!0,i||(this._previousAttributes=j.clone(this.attributes),this.changed={}),l=this.attributes,k=this._previousAttributes,this.idAttribute in e&&(this.id=e[this.idAttribute]);for(d in e)b=e[d],j.isEqual(l[d],b)||g.push(d),j.isEqual(k[d],b)?delete this.changed[d]:this.changed[d]=b,f?delete l[d]:l[d]=b;if(!h){g.length&&(this._pending=!0);for(var m=0,n=g.length;n>m;m++)this.trigger("change:"+g[m],this,l[g[m]],c)}if(i)return this;if(!h)for(;this._pending;)this._pending=!1,this.trigger("change",this,c);return this._pending=!1,this._changing=!1,this},unset:function(a,b){return this.set(a,void 0,j.extend({},b,{unset:!0}))},clear:function(a){var b={};for(var c in this.attributes)b[c]=void 0;return this.set(b,j.extend({},a,{unset:!0}))},hasChanged:function(a){return null==a?!j.isEmpty(this.changed):j.has(this.changed,a)},changedAttributes:function(a){if(!a)return this.hasChanged()?j.clone(this.changed):!1;var b,c=!1,d=this._changing?this._previousAttributes:this.attributes;for(var e in a)j.isEqual(d[e],b=a[e])||((c||(c={}))[e]=b);return c},previous:function(a){return null!=a&&this._previousAttributes?this._previousAttributes[a]:null},previousAttributes:function(){return j.clone(this._previousAttributes)},fetch:function(a){a=a?j.clone(a):{},void 0===a.parse&&(a.parse=!0);var b=this,c=a.success;return a.success=function(d){return b.set(b.parse(d,a),a)?(c&&c(b,d,a),b.trigger("sync",b,d,a),void 0):!1},N(this,a),this.sync("read",this,a)},save:function(a,b,c){var d,e,f,g=this.attributes;if(null==a||"object"==typeof a?(d=a,c=b):(d={})[a]=b,!(!d||c&&c.wait||this.set(d,c)))return!1;if(c=j.extend({validate:!0},c),!this._validate(d,c))return!1;d&&c.wait&&(this.attributes=j.extend({},g,d)),void 0===c.parse&&(c.parse=!0);var h=this,i=c.success;return c.success=function(a){h.attributes=g;var b=h.parse(a,c);return c.wait&&(b=j.extend(d||{},b)),j.isObject(b)&&!h.set(b,c)?!1:(i&&i(h,a,c),h.trigger("sync",h,a,c),void 0)},N(this,c),e=this.isNew()?"create":c.patch?"patch":"update","patch"===e&&(c.attrs=d),f=this.sync(e,this,c),d&&c.wait&&(this.attributes=g),f},destroy:function(a){a=a?j.clone(a):{};var b=this,c=a.success,d=function(){b.trigger("destroy",b,b.collection,a)};if(a.success=function(e){(a.wait||b.isNew())&&d(),c&&c(b,e,a),b.isNew()||b.trigger("sync",b,e,a)},this.isNew())return a.success(),!1;N(this,a);var e=this.sync("delete",this,a);return a.wait||d(),e},url:function(){var a=j.result(this,"urlRoot")||j.result(this.collection,"url")||M();return this.isNew()?a:a+("/"===a.charAt(a.length-1)?"":"/")+encodeURIComponent(this.id)},parse:function(a){return a},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return null==this.id},isValid:function(a){return this._validate({},j.extend(a||{},{validate:!0}))},_validate:function(a,b){if(!b.validate||!this.validate)return!0;a=j.extend({},this.attributes,a);var c=this.validationError=this.validate(a,b)||null;return c?(this.trigger("invalid",this,c,j.extend(b||{},{validationError:c})),!1):!0}});var r=["keys","values","pairs","invert","pick","omit"];j.each(r,function(a){p.prototype[a]=function(){var b=g.call(arguments);return b.unshift(this.attributes),j[a].apply(j,b)}});var s=i.Collection=function(a,b){b||(b={}),b.url&&(this.url=b.url),b.model&&(this.model=b.model),void 0!==b.comparator&&(this.comparator=b.comparator),this._reset(),this.initialize.apply(this,arguments),a&&this.reset(a,j.extend({silent:!0},b))},t={add:!0,remove:!0,merge:!0},u={add:!0,merge:!1,remove:!1};j.extend(s.prototype,k,{model:p,initialize:function(){},toJSON:function(a){return this.map(function(b){return b.toJSON(a)})},sync:function(){return i.sync.apply(this,arguments)},add:function(a,b){return this.set(a,j.defaults(b||{},u))},remove:function(a,b){a=j.isArray(a)?a.slice():[a],b||(b={});var c,d,e,f;for(c=0,d=a.length;d>c;c++)f=this.get(a[c]),f&&(delete this._byId[f.id],delete this._byId[f.cid],e=this.indexOf(f),this.models.splice(e,1),this.length--,b.silent||(b.index=e,f.trigger("remove",f,this,b)),this._removeReference(f));return this},set:function(a,b){b=j.defaults(b||{},t),b.parse&&(a=this.parse(a,b)),j.isArray(a)||(a=a?[a]:[]);var c,d,e,i,k,l=b.at,m=this.comparator&&null==l&&b.sort!==!1,n=j.isString(this.comparator)?this.comparator:null,o=[],p=[],q={};for(c=0,d=a.length;d>c;c++)(e=this._prepareModel(a[c],b))&&((i=this.get(e))?(b.remove&&(q[i.cid]=!0),b.merge&&(i.set(e.attributes,b),m&&!k&&i.hasChanged(n)&&(k=!0))):b.add&&(o.push(e),e.on("all",this._onModelEvent,this),this._byId[e.cid]=e,null!=e.id&&(this._byId[e.id]=e)));if(b.remove){for(c=0,d=this.length;d>c;++c)q[(e=this.models[c]).cid]||p.push(e);p.length&&this.remove(p,b)}if(o.length&&(m&&(k=!0),this.length+=o.length,null!=l?h.apply(this.models,[l,0].concat(o)):f.apply(this.models,o)),k&&this.sort({silent:!0}),b.silent)return this;for(c=0,d=o.length;d>c;c++)(e=o[c]).trigger("add",e,this,b);return k&&this.trigger("sort",this,b),this},reset:function(a,b){b||(b={});for(var c=0,d=this.models.length;d>c;c++)this._removeReference(this.models[c]);return b.previousModels=this.models,this._reset(),this.add(a,j.extend({silent:!0},b)),b.silent||this.trigger("reset",this,b),this},push:function(a,b){return a=this._prepareModel(a,b),this.add(a,j.extend({at:this.length},b)),a},pop:function(a){var b=this.at(this.length-1);return this.remove(b,a),b},unshift:function(a,b){return a=this._prepareModel(a,b),this.add(a,j.extend({at:0},b)),a},shift:function(a){var b=this.at(0);return this.remove(b,a),b},slice:function(a,b){return this.models.slice(a,b)},get:function(a){return null==a?void 0:this._byId[null!=a.id?a.id:a.cid||a]},at:function(a){return this.models[a]},where:function(a,b){return j.isEmpty(a)?b?void 0:[]:this[b?"find":"filter"](function(b){for(var c in a)if(a[c]!==b.get(c))return!1;return!0})},findWhere:function(a){return this.where(a,!0)},sort:function(a){if(!this.comparator)throw new Error("Cannot sort a set without a comparator");return a||(a={}),j.isString(this.comparator)||1===this.comparator.length?this.models=this.sortBy(this.comparator,this):this.models.sort(j.bind(this.comparator,this)),a.silent||this.trigger("sort",this,a),this},sortedIndex:function(a,b,c){b||(b=this.comparator);var d=j.isFunction(b)?b:function(a){return a.get(b)};return j.sortedIndex(this.models,a,d,c)},pluck:function(a){return j.invoke(this.models,"get",a)},fetch:function(a){a=a?j.clone(a):{},void 0===a.parse&&(a.parse=!0);var b=a.success,c=this;return a.success=function(d){var e=a.reset?"reset":"set";c[e](d,a),b&&b(c,d,a),c.trigger("sync",c,d,a)},N(this,a),this.sync("read",this,a)},create:function(a,b){if(b=b?j.clone(b):{},!(a=this._prepareModel(a,b)))return!1;b.wait||this.add(a,b);var c=this,d=b.success;return b.success=function(e){b.wait&&c.add(a,b),d&&d(a,e,b)},a.save(null,b),a},parse:function(a){return a},clone:function(){return new this.constructor(this.models)},_reset:function(){this.length=0,this.models=[],this._byId={}},_prepareModel:function(a,b){if(a instanceof p)return a.collection||(a.collection=this),a;b||(b={}),b.collection=this;var c=new this.model(a,b);return c._validate(a,b)?c:(this.trigger("invalid",this,a,b),!1)},_removeReference:function(a){this===a.collection&&delete a.collection,a.off("all",this._onModelEvent,this)},_onModelEvent:function(a,b,c,d){("add"!==a&&"remove"!==a||c===this)&&("destroy"===a&&this.remove(b,d),b&&a==="change:"+b.idAttribute&&(delete this._byId[b.previous(b.idAttribute)],null!=b.id&&(this._byId[b.id]=b)),this.trigger.apply(this,arguments))}});var v=["forEach","each","map","collect","reduce","foldl","inject","reduceRight","foldr","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","max","min","toArray","size","first","head","take","initial","rest","tail","drop","last","without","indexOf","shuffle","lastIndexOf","isEmpty","chain"];j.each(v,function(a){s.prototype[a]=function(){var b=g.call(arguments);return b.unshift(this.models),j[a].apply(j,b)}});var w=["groupBy","countBy","sortBy"];j.each(w,function(a){s.prototype[a]=function(b,c){var d=j.isFunction(b)?b:function(a){return a.get(b)};return j[a](this.models,d,c)}});var x=i.View=function(a){this.cid=j.uniqueId("view"),this._configure(a||{}),this._ensureElement(),this.initialize.apply(this,arguments),this.delegateEvents()},y=/^(\S+)\s*(.*)$/,z=["model","collection","el","id","attributes","className","tagName","events"];j.extend(x.prototype,k,{tagName:"div",$:function(a){return this.$el.find(a)},initialize:function(){},render:function(){return this},remove:function(){return this.$el.remove(),this.stopListening(),this},setElement:function(a,b){return this.$el&&this.undelegateEvents(),this.$el=a instanceof i.$?a:i.$(a),this.el=this.$el[0],b!==!1&&this.delegateEvents(),this},delegateEvents:function(a){if(!a&&!(a=j.result(this,"events")))return this;this.undelegateEvents();for(var b in a){var c=a[b];if(j.isFunction(c)||(c=this[a[b]]),c){var d=b.match(y),e=d[1],f=d[2];c=j.bind(c,this),e+=".delegateEvents"+this.cid,""===f?this.$el.on(e,c):this.$el.on(e,f,c)}}return this},undelegateEvents:function(){return this.$el.off(".delegateEvents"+this.cid),this},_configure:function(a){this.options&&(a=j.extend({},j.result(this,"options"),a)),j.extend(this,j.pick(a,z)),this.options=a},_ensureElement:function(){if(this.el)this.setElement(j.result(this,"el"),!1);else{var a=j.extend({},j.result(this,"attributes"));this.id&&(a.id=j.result(this,"id")),this.className&&(a["class"]=j.result(this,"className"));var b=i.$("<"+j.result(this,"tagName")+">").attr(a);this.setElement(b,!1)}}}),i.sync=function(a,b,c){var d=A[a];j.defaults(c||(c={}),{emulateHTTP:i.emulateHTTP,emulateJSON:i.emulateJSON});var e={type:d,dataType:"json"};if(c.url||(e.url=j.result(b,"url")||M()),null!=c.data||!b||"create"!==a&&"update"!==a&&"patch"!==a||(e.contentType="application/json",e.data=JSON.stringify(c.attrs||b.toJSON(c))),c.emulateJSON&&(e.contentType="application/x-www-form-urlencoded",e.data=e.data?{model:e.data}:{}),c.emulateHTTP&&("PUT"===d||"DELETE"===d||"PATCH"===d)){e.type="POST",c.emulateJSON&&(e.data._method=d);var f=c.beforeSend;c.beforeSend=function(a){return a.setRequestHeader("X-HTTP-Method-Override",d),f?f.apply(this,arguments):void 0}}"GET"===e.type||c.emulateJSON||(e.processData=!1),"PATCH"!==e.type||!window.ActiveXObject||window.external&&window.external.msActiveXFilteringEnabled||(e.xhr=function(){return new ActiveXObject("Microsoft.XMLHTTP")});var g=c.xhr=i.ajax(j.extend(e,c));return b.trigger("request",b,g,c),g};var A={create:"POST",update:"PUT",patch:"PATCH","delete":"DELETE",read:"GET"};i.ajax=function(){return i.$.ajax.apply(i.$,arguments)};var B=i.Router=function(a){a||(a={}),a.routes&&(this.routes=a.routes),this._bindRoutes(),this.initialize.apply(this,arguments)},C=/\((.*?)\)/g,D=/(\(\?)?:\w+/g,E=/\*\w+/g,F=/[\-{}\[\]+?.,\\\^$|#\s]/g;j.extend(B.prototype,k,{initialize:function(){},route:function(a,b,c){j.isRegExp(a)||(a=this._routeToRegExp(a)),j.isFunction(b)&&(c=b,b=""),c||(c=this[b]);var d=this;return i.history.route(a,function(e){var f=d._extractParameters(a,e);c&&c.apply(d,f),d.trigger.apply(d,["route:"+b].concat(f)),d.trigger("route",b,f),i.history.trigger("route",d,b,f)}),this},navigate:function(a,b){return i.history.navigate(a,b),this},_bindRoutes:function(){if(this.routes){this.routes=j.result(this,"routes");for(var a,b=j.keys(this.routes);null!=(a=b.pop());)this.route(a,this.routes[a])}},_routeToRegExp:function(a){return a=a.replace(F,"\\$&").replace(C,"(?:$1)?").replace(D,function(a,b){return b?a:"([^/]+)"}).replace(E,"(.*?)"),new RegExp("^"+a+"$")},_extractParameters:function(a,b){var c=a.exec(b).slice(1);return j.map(c,function(a){return a?decodeURIComponent(a):null})}});var G=i.History=function(){this.handlers=[],j.bindAll(this,"checkUrl"),"undefined"!=typeof window&&(this.location=window.location,this.history=window.history)},H=/^[#\/]|\s+$/g,I=/^\/+|\/+$/g,J=/msie [\w.]+/,K=/\/$/;G.started=!1,j.extend(G.prototype,k,{interval:50,getHash:function(a){var b=(a||this).location.href.match(/#(.*)$/);return b?b[1]:""},getFragment:function(a,b){if(null==a)if(this._hasPushState||!this._wantsHashChange||b){a=this.location.pathname;var c=this.root.replace(K,"");a.indexOf(c)||(a=a.substr(c.length))}else a=this.getHash();return a.replace(H,"")},start:function(a){if(G.started)throw new Error("Backbone.history has already been started");G.started=!0,this.options=j.extend({},{root:"/"},this.options,a),this.root=this.options.root,this._wantsHashChange=this.options.hashChange!==!1,this._wantsPushState=!!this.options.pushState,this._hasPushState=!!(this.options.pushState&&this.history&&this.history.pushState);var b=this.getFragment(),c=document.documentMode,d=J.exec(navigator.userAgent.toLowerCase())&&(!c||7>=c);this.root=("/"+this.root+"/").replace(I,"/"),d&&this._wantsHashChange&&(this.iframe=i.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(b)),this._hasPushState?i.$(window).on("popstate",this.checkUrl):this._wantsHashChange&&"onhashchange"in window&&!d?i.$(window).on("hashchange",this.checkUrl):this._wantsHashChange&&(this._checkUrlInterval=setInterval(this.checkUrl,this.interval)),this.fragment=b;var e=this.location,f=e.pathname.replace(/[^\/]$/,"$&/")===this.root;return this._wantsHashChange&&this._wantsPushState&&!this._hasPushState&&!f?(this.fragment=this.getFragment(null,!0),this.location.replace(this.root+this.location.search+"#"+this.fragment),!0):(this._wantsPushState&&this._hasPushState&&f&&e.hash&&(this.fragment=this.getHash().replace(H,""),this.history.replaceState({},document.title,this.root+this.fragment+e.search)),this.options.silent?void 0:this.loadUrl())},stop:function(){i.$(window).off("popstate",this.checkUrl).off("hashchange",this.checkUrl),clearInterval(this._checkUrlInterval),G.started=!1},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(){var b=this.getFragment();return b===this.fragment&&this.iframe&&(b=this.getFragment(this.getHash(this.iframe))),b===this.fragment?!1:(this.iframe&&this.navigate(b),this.loadUrl()||this.loadUrl(this.getHash()),void 0)},loadUrl:function(a){var b=this.fragment=this.getFragment(a),c=j.any(this.handlers,function(a){return a.route.test(b)?(a.callback(b),!0):void 0});return c},navigate:function(a,b){if(!G.started)return!1;if(b&&b!==!0||(b={trigger:b}),a=this.getFragment(a||""),this.fragment!==a){this.fragment=a;var c=this.root+a;if(this._hasPushState)this.history[b.replace?"replaceState":"pushState"]({},document.title,c);else{if(!this._wantsHashChange)return this.location.assign(c);this._updateHash(this.location,a,b.replace),this.iframe&&a!==this.getFragment(this.getHash(this.iframe))&&(b.replace||this.iframe.document.open().close(),this._updateHash(this.iframe.location,a,b.replace))}b.trigger&&this.loadUrl(a)}},_updateHash:function(a,b,c){if(c){var d=a.href.replace(/(javascript:|#).*$/,"");a.replace(d+"#"+b)}else a.hash="#"+b}}),i.history=new G;var L=function(a,b){var d,c=this;d=a&&j.has(a,"constructor")?a.constructor:function(){return c.apply(this,arguments)},j.extend(d,c,b);var e=function(){this.constructor=d};return e.prototype=c.prototype,d.prototype=new e,a&&j.extend(d.prototype,a),d.__super__=c.prototype,d};p.extend=s.extend=B.extend=x.extend=G.extend=L;var M=function(){throw new Error('A "url" property or function must be specified')},N=function(a,b){var c=b.error;b.error=function(d){c&&c(a,d,b),a.trigger("error",a,d,b)}}}.call(this)});/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-flexbox-flexboxlegacy-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-applicationcache-canvas-canvastext-draganddrop-hashchange-history-audio-video-indexeddb-input-inputtypes-localstorage-postmessage-sessionstorage-websockets-websqldatabase-webworkers-geolocation-inlinesvg-smil-svg-svgclippaths-touch-webgl-shiv-cssclasses-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-load
 */
;window.Modernizr=function(a,b,c){function C(a){j.cssText=a}function D(a,b){return C(n.join(a+";")+(b||""))}function E(a,b){return typeof a===b}function F(a,b){return!!~(""+a).indexOf(b)}function G(a,b){for(var d in a){var e=a[d];if(!F(e,"-")&&j[e]!==c)return b=="pfx"?e:!0}return!1}function H(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:E(f,"function")?f.bind(d||b):f}return!1}function I(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+p.join(d+" ")+d).split(" ");return E(b,"string")||E(b,"undefined")?G(e,b):(e=(a+" "+q.join(d+" ")+d).split(" "),H(e,b,c))}function J(){e.input=function(c){for(var d=0,e=c.length;d<e;d++)u[c[d]]=c[d]in k;return u.list&&(u.list=!!b.createElement("datalist")&&!!a.HTMLDataListElement),u}("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")),e.inputtypes=function(a){for(var d=0,e,f,h,i=a.length;d<i;d++)k.setAttribute("type",f=a[d]),e=k.type!=="text",e&&(k.value=l,k.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(f)&&k.style.WebkitAppearance!==c?(g.appendChild(k),h=b.defaultView,e=h.getComputedStyle&&h.getComputedStyle(k,null).WebkitAppearance!=="textfield"&&k.offsetHeight!==0,g.removeChild(k)):/^(search|tel)$/.test(f)||(/^(url|email)$/.test(f)?e=k.checkValidity&&k.checkValidity()===!1:e=k.value!=l)),t[a[d]]=!!e;return t}("search tel url email datetime date month week time datetime-local number range color".split(" "))}var d="2.6.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k=b.createElement("input"),l=":)",m={}.toString,n=" -webkit- -moz- -o- -ms- ".split(" "),o="Webkit Moz O ms",p=o.split(" "),q=o.toLowerCase().split(" "),r={svg:"http://www.w3.org/2000/svg"},s={},t={},u={},v=[],w=v.slice,x,y=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},z=function(){function d(d,e){e=e||b.createElement(a[d]||"div"),d="on"+d;var f=d in e;return f||(e.setAttribute||(e=b.createElement("div")),e.setAttribute&&e.removeAttribute&&(e.setAttribute(d,""),f=E(e[d],"function"),E(e[d],"undefined")||(e[d]=c),e.removeAttribute(d))),e=null,f}var a={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return d}(),A={}.hasOwnProperty,B;!E(A,"undefined")&&!E(A.call,"undefined")?B=function(a,b){return A.call(a,b)}:B=function(a,b){return b in a&&E(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=w.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(w.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(w.call(arguments)))};return e}),s.flexbox=function(){return I("flexWrap")},s.flexboxlegacy=function(){return I("boxDirection")},s.canvas=function(){var a=b.createElement("canvas");return!!a.getContext&&!!a.getContext("2d")},s.canvastext=function(){return!!e.canvas&&!!E(b.createElement("canvas").getContext("2d").fillText,"function")},s.webgl=function(){return!!a.WebGLRenderingContext},s.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:y(["@media (",n.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},s.geolocation=function(){return"geolocation"in navigator},s.postmessage=function(){return!!a.postMessage},s.websqldatabase=function(){return!!a.openDatabase},s.indexedDB=function(){return!!I("indexedDB",a)},s.hashchange=function(){return z("hashchange",a)&&(b.documentMode===c||b.documentMode>7)},s.history=function(){return!!a.history&&!!history.pushState},s.draganddrop=function(){var a=b.createElement("div");return"draggable"in a||"ondragstart"in a&&"ondrop"in a},s.websockets=function(){return"WebSocket"in a||"MozWebSocket"in a},s.rgba=function(){return C("background-color:rgba(150,255,150,.5)"),F(j.backgroundColor,"rgba")},s.hsla=function(){return C("background-color:hsla(120,40%,100%,.5)"),F(j.backgroundColor,"rgba")||F(j.backgroundColor,"hsla")},s.multiplebgs=function(){return C("background:url(https://),url(https://),red url(https://)"),/(url\s*\(.*?){3}/.test(j.background)},s.backgroundsize=function(){return I("backgroundSize")},s.borderimage=function(){return I("borderImage")},s.borderradius=function(){return I("borderRadius")},s.boxshadow=function(){return I("boxShadow")},s.textshadow=function(){return b.createElement("div").style.textShadow===""},s.opacity=function(){return D("opacity:.55"),/^0.55$/.test(j.opacity)},s.cssanimations=function(){return I("animationName")},s.csscolumns=function(){return I("columnCount")},s.cssgradients=function(){var a="background-image:",b="gradient(linear,left top,right bottom,from(#9f9),to(white));",c="linear-gradient(left top,#9f9, white);";return C((a+"-webkit- ".split(" ").join(b+a)+n.join(c+a)).slice(0,-a.length)),F(j.backgroundImage,"gradient")},s.cssreflections=function(){return I("boxReflect")},s.csstransforms=function(){return!!I("transform")},s.csstransforms3d=function(){var a=!!I("perspective");return a&&"webkitPerspective"in g.style&&y("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",function(b,c){a=b.offsetLeft===9&&b.offsetHeight===3}),a},s.csstransitions=function(){return I("transition")},s.fontface=function(){var a;return y('@font-face {font-family:"font";src:url("https://")}',function(c,d){var e=b.getElementById("smodernizr"),f=e.sheet||e.styleSheet,g=f?f.cssRules&&f.cssRules[0]?f.cssRules[0].cssText:f.cssText||"":"";a=/src/i.test(g)&&g.indexOf(d.split(" ")[0])===0}),a},s.generatedcontent=function(){var a;return y(["#",h,"{font:0/0 a}#",h,':after{content:"',l,'";visibility:hidden;font:3px/1 a}'].join(""),function(b){a=b.offsetHeight>=3}),a},s.video=function(){var a=b.createElement("video"),c=!1;try{if(c=!!a.canPlayType)c=new Boolean(c),c.ogg=a.canPlayType('video/ogg; codecs="theora"').replace(/^no$/,""),c.h264=a.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/,""),c.webm=a.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,"")}catch(d){}return c},s.audio=function(){var a=b.createElement("audio"),c=!1;try{if(c=!!a.canPlayType)c=new Boolean(c),c.ogg=a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),c.mp3=a.canPlayType("audio/mpeg;").replace(/^no$/,""),c.wav=a.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),c.m4a=(a.canPlayType("audio/x-m4a;")||a.canPlayType("audio/aac;")).replace(/^no$/,"")}catch(d){}return c},s.localstorage=function(){try{return localStorage.setItem(h,h),localStorage.removeItem(h),!0}catch(a){return!1}},s.sessionstorage=function(){try{return sessionStorage.setItem(h,h),sessionStorage.removeItem(h),!0}catch(a){return!1}},s.webworkers=function(){return!!a.Worker},s.applicationcache=function(){return!!a.applicationCache},s.svg=function(){return!!b.createElementNS&&!!b.createElementNS(r.svg,"svg").createSVGRect},s.inlinesvg=function(){var a=b.createElement("div");return a.innerHTML="<svg/>",(a.firstChild&&a.firstChild.namespaceURI)==r.svg},s.smil=function(){return!!b.createElementNS&&/SVGAnimate/.test(m.call(b.createElementNS(r.svg,"animate")))},s.svgclippaths=function(){return!!b.createElementNS&&/SVGClipPath/.test(m.call(b.createElementNS(r.svg,"clipPath")))};for(var K in s)B(s,K)&&(x=K.toLowerCase(),e[x]=s[K](),v.push((e[x]?"":"no-")+x));return e.input||J(),e.addTest=function(a,b){if(typeof a=="object")for(var d in a)B(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},C(""),i=k=null,function(a,b){function k(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function l(){var a=r.elements;return typeof a=="string"?a.split(" "):a}function m(a){var b=i[a[g]];return b||(b={},h++,a[g]=h,i[h]=b),b}function n(a,c,f){c||(c=b);if(j)return c.createElement(a);f||(f=m(c));var g;return f.cache[a]?g=f.cache[a].cloneNode():e.test(a)?g=(f.cache[a]=f.createElem(a)).cloneNode():g=f.createElem(a),g.canHaveChildren&&!d.test(a)?f.frag.appendChild(g):g}function o(a,c){a||(a=b);if(j)return a.createDocumentFragment();c=c||m(a);var d=c.frag.cloneNode(),e=0,f=l(),g=f.length;for(;e<g;e++)d.createElement(f[e]);return d}function p(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return r.shivMethods?n(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+l().join().replace(/\w+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(r,b.frag)}function q(a){a||(a=b);var c=m(a);return r.shivCSS&&!f&&!c.hasCSS&&(c.hasCSS=!!k(a,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")),j||p(a,c),a}var c=a.html5||{},d=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,e=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,f,g="_html5shiv",h=0,i={},j;(function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",f="hidden"in a,j=a.childNodes.length==1||function(){b.createElement("a");var a=b.createDocumentFragment();return typeof a.cloneNode=="undefined"||typeof a.createDocumentFragment=="undefined"||typeof a.createElement=="undefined"}()}catch(c){f=!0,j=!0}})();var r={elements:c.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:c.shivCSS!==!1,supportsUnknownElements:j,shivMethods:c.shivMethods!==!1,type:"default",shivDocument:q,createElement:n,createDocumentFragment:o};a.html5=r,q(b)}(this,b),e._version=d,e._prefixes=n,e._domPrefixes=q,e._cssomPrefixes=p,e.hasEvent=z,e.testProp=function(a){return G([a])},e.testAllProps=I,e.testStyles=y,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+v.join(" "):""),e}(this,this.document),function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))};
define("/assets/vendor/Zonda/util/base64/base64",["underscore"],function(a,b,c){var d,e,f,g,h,i,j,k;return e=a("underscore"),g="=",f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",d=function(a){var b;return b=JSON.stringify(a),b.replace(/[\u007f-\uffff]/g,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})},k=function(a,b){var c;if(c=f.indexOf(a.charAt(b)),-1===c)throw"Cannot decode base64";return c},h=function(a){var b,c,d,e,f,h;if(e=0,d=a.length,f=[],a=String(a),0===d)return a;if(0!==d%4)throw"Cannot decode base64";for(a.charAt(d-1)===g&&(e=1,a.charAt(d-2)===g&&(e=2),d-=4),c=h=0;d>h;c=h+=4)b=k(a,c)<<18|k(a,c+1)<<12|k(a,c+2)<<6|k(a,c+3),f.push(String.fromCharCode(b>>16,255&b>>8,255&b));switch(e){case 1:b=k(a,c)<<18|k(a,c+1)<<12|k(a,c+2)<<6,f.push(String.fromCharCode(b>>16,255&b>>8));break;case 2:b=k(a,c)<<18|k(a,c+1)<<12,f.push(String.fromCharCode(b>>16))}return f.join("")},j=function(a,b){var c;if(c=a.charCodeAt(b),c>255)throw"INVALID_CHARACTER_ERR: DOM Exception 5";return c},i=function(a){var b,c,d,e,h;if(1!==arguments.length)throw"SyntaxError: exactly one argument required";if(a=String(a),e=[],d=a.length-a.length%3,0===a.length)return a;for(c=h=0;d>h;c=h+=3)b=j(a,c)<<16|j(a,c+1)<<8|j(a,c+2),e.push(f.charAt(b>>18)),e.push(f.charAt(63&b>>12)),e.push(f.charAt(63&b>>6)),e.push(f.charAt(63&b));switch(a.length-d){case 1:b=j(a,c)<<16,e.push(f.charAt(b>>18)+f.charAt(63&b>>12)+g+g);break;case 2:b=j(a,c)<<16|j(a,c+1)<<8,e.push(f.charAt(b>>18)+f.charAt(63&b>>12)+f.charAt(63&b>>6)+g)}return e.join("")},c.exports={decode:function(a){return a=h(a),JSON.parse(a)},encode:function(a){return a=d(a),i(a)}}}),define("/assets/vendor/Zonda/util/dialog/dialog",["bootstrap","underscore","mustache"],function(a,b,c){var d,e,f,g,h,i;return d=a("bootstrap"),i=a("underscore"),e=a("mustache"),h='<div id="zonda-util-dialog" class="modal fade hide" tabindex="-1" role="dialog" aria-hidden="true">\n<div class="modal-header">\n<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>\n<h3>{{title}}</h3>\n</div>\n<div class="modal-body">\n{{content}}\n</div>\n<div class="modal-footer">\n<button class="btn" data-dismiss="modal" aria-hidden="true">取消</button>\n</div>\n</div>',g="zonda-util",f=function(a){var b;return f.config=a,d("#"+g+"-dialog:visible")[0]?!1:(b=e.render(h,{title:a.title,content:a.content}),d(document.body).append(b),a.css&&d("#"+g+"-dialog").css(a.css),i.each(a.button,function(a,b){var c;return c=i.uniqueId(""+g+"-dialog-button-"),d("#"+g+"-dialog .modal-footer").append('<button id="'+c+'" class="btn btn-success">\n  '+b+"\n</button>"),d("#"+c).click(a)}),f.dom=d("#"+g+"-dialog"),d("#"+g+"-dialog").on("hide",function(){return delete d("#"+g+"-dialog").modal,d("#"+g+"-dialog").remove()}),f)},f.open=function(){var a;return d("#"+g+"-dialog .modal-body").css({"max-height":window.innerHeight-141}),a=d("#"+g+"-dialog").outerHeight(),d("#"+g+"-dialog").css({"margin-top":-a/2}),d("#"+g+"-dialog").modal({show:!0,backdrop:f.config.backdrop}),f},f.close=function(a){return a?setTimeout(function(){return d("#"+g+"-dialog").modal("hide")},a):d("#"+g+"-dialog").modal("hide"),f},c.exports=f}),define("/assets/vendor/Zonda/util/StateMachine/StateMachine",["underscore","backbone"],function(a,b,c){var d,e,f;return f=a("underscore"),d=a("backbone"),e=function(){},f.extend(e.prototype,d.Events),e.prototype.add=function(a){var b=this;return this.on("change",function(b){return b===a?a.activate():a.deactivate()},this),a.active=function(){return b.trigger("change",a)}},c.exports=e}),define("/assets/vendor/Zonda/util/util",["./base64/base64","./dialog/dialog","./StateMachine/StateMachine","underscore","bootstrap","mustache","backbone"],function(a,b,c){return c.exports={base64:a("./base64/base64"),dialog:a("./dialog/dialog"),StateMachine:a("./StateMachine/StateMachine")}});