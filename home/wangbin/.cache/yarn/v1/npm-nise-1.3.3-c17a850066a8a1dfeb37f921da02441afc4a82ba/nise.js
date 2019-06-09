(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.nise = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";

// cache a reference to setTimeout, so that our reference won't be stubbed out
// when using fake timers and errors will still get logged
// https://github.com/cjohansen/Sinon.JS/issues/381
var realSetTimeout = setTimeout;

function configureLogger(config) {
    config = config || {};
    // Function which prints errors.
    if (!config.hasOwnProperty("logger")) {
        config.logger = function () { };
    }
    // When set to true, any errors logged will be thrown immediately;
    // If set to false, the errors will be thrown in separate execution frame.
    if (!config.hasOwnProperty("useImmediateExceptions")) {
        config.useImmediateExceptions = true;
    }
    // wrap realSetTimeout with something we can stub in tests
    if (!config.hasOwnProperty("setTimeout")) {
        config.setTimeout = realSetTimeout;
    }

    return function logError(label, e) {
        var msg = label + " threw exception: ";
        var err = { name: e.name || label, message: e.message || e.toString(), stack: e.stack };

        function throwLoggedError() {
            err.message = msg + err.message;
            throw err;
        }

        config.logger(msg + "[" + err.name + "] " + err.message);

        if (err.stack) {
            config.logger(err.stack);
        }

        if (config.useImmediateExceptions) {
            throwLoggedError();
        } else {
            config.setTimeout(throwLoggedError, 0);
        }
    };
}

module.exports = configureLogger;

},{}],2:[function(require,module,exports){
"use strict";

var Event = require("./event");

function CustomEvent(type, customData, target) {
    this.initEvent(type, false, false, target);
    this.detail = customData.detail || null;
}

CustomEvent.prototype = new Event();

CustomEvent.prototype.constructor = CustomEvent;

module.exports = CustomEvent;

},{"./event":4}],3:[function(require,module,exports){
"use strict";

function flattenOptions(options) {
    if (options !== Object(options)) {
        return {
            capture: Boolean(options),
            once: false,
            passive: false
        };
    }
    return {
        capture: Boolean(options.capture),
        once: Boolean(options.once),
        passive: Boolean(options.passive)
    };
}
function not(fn) {
    return function () {
        return !fn.apply(this, arguments);
    };
}
function hasListenerFilter(listener, capture) {
    return function (listenerSpec) {
        return listenerSpec.capture === capture
            && listenerSpec.listener === listener;
    };
}

var EventTarget = {
    // https://dom.spec.whatwg.org/#dom-eventtarget-addeventlistener
    addEventListener: function addEventListener(event, listener, providedOptions) {
        // 3. Let capture, passive, and once be the result of flattening more options.
        // Flatten property before executing step 2,
        // feture detection is usually based on registering handler with options object,
        // that has getter defined
        // addEventListener("load", () => {}, {
        //    get once() { supportsOnce = true; }
        // });
        var options = flattenOptions(providedOptions);

        // 2. If callback is null, then return.
        if (listener == null) {
            return;
        }

        this.eventListeners = this.eventListeners || {};
        this.eventListeners[event] = this.eventListeners[event] || [];

        // 4. If context object’s associated list of event listener
        //    does not contain an event listener whose type is type,
        //    callback is callback, and capture is capture, then append
        //    a new event listener to it, whose type is type, callback is
        //    callback, capture is capture, passive is passive, and once is once.
        if (!this.eventListeners[event].some(hasListenerFilter(listener, options.capture))) {
            this.eventListeners[event].push({
                listener: listener,
                capture: options.capture,
                once: options.once
            });
        }
    },

    // https://dom.spec.whatwg.org/#dom-eventtarget-removeeventlistener
    removeEventListener: function removeEventListener(event, listener, providedOptions) {
        if (!this.eventListeners || !this.eventListeners[event]) {
            return;
        }

        // 2. Let capture be the result of flattening options.
        var options = flattenOptions(providedOptions);

        // 3. If there is an event listener in the associated list of
        //    event listeners whose type is type, callback is callback,
        //    and capture is capture, then set that event listener’s
        //    removed to true and remove it from the associated list of event listeners.
        this.eventListeners[event] = this.eventListeners[event]
            .filter(not(hasListenerFilter(listener, options.capture)));
    },

    dispatchEvent: function dispatchEvent(event) {
        if (!this.eventListeners || !this.eventListeners[event.type]) {
            return Boolean(event.defaultPrevented);
        }

        var self = this;
        var type = event.type;
        var listeners = self.eventListeners[type];

        // Remove listeners, that should be dispatched once
        // before running dispatch loop to avoid nested dispatch issues
        self.eventListeners[type] = listeners.filter(function (listenerSpec) {
            return !listenerSpec.once;
        });
        listeners.forEach(function (listenerSpec) {
            var listener = listenerSpec.listener;
            if (typeof listener === "function") {
                listener.call(self, event);
            } else {
                listener.handleEvent(event);
            }
        });

        return Boolean(event.defaultPrevented);
    }
};

module.exports = EventTarget;

},{}],4:[function(require,module,exports){
"use strict";

function Event(type, bubbles, cancelable, target) {
    this.initEvent(type, bubbles, cancelable, target);
}

Event.prototype = {
    initEvent: function (type, bubbles, cancelable, target) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
        this.target = target;
        this.currentTarget = target;
    },

    stopPropagation: function () {},

    preventDefault: function () {
        this.defaultPrevented = true;
    }
};

module.exports = Event;

},{}],5:[function(require,module,exports){
"use strict";

module.exports = {
    Event: require("./event"),
    ProgressEvent: require("./progress-event"),
    CustomEvent: require("./custom-event"),
    EventTarget: require("./event-target")
};

},{"./custom-event":2,"./event":4,"./event-target":3,"./progress-event":6}],6:[function(require,module,exports){
"use strict";

var Event = require("./event");

function ProgressEvent(type, progressEventRaw, target) {
    this.initEvent(type, false, false, target);
    this.loaded = typeof progressEventRaw.loaded === "number" ? progressEventRaw.loaded : null;
    this.total = typeof progressEventRaw.total === "number" ? progressEventRaw.total : null;
    this.lengthComputable = !!progressEventRaw.total;
}

ProgressEvent.prototype = new Event();

ProgressEvent.prototype.constructor = ProgressEvent;

module.exports = ProgressEvent;

},{"./event":4}],7:[function(require,module,exports){
"use strict";

var lolex = require("lolex");
var fakeServer = require("./index");

function Server() {}
Server.prototype = fakeServer;

var fakeServerWithClock = new Server();

fakeServerWithClock.addRequest = function addRequest(xhr) {
    if (xhr.async) {
        if (typeof setTimeout.clock === "object") {
            this.clock = setTimeout.clock;
        } else {
            this.clock = lolex.install();
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

    return fakeServer.addRequest.call(this, xhr);
};

fakeServerWithClock.respond = function respond() {
    var returnVal = fakeServer.respond.apply(this, arguments);

    if (this.clock) {
        this.clock.tick(this.longestTimeout || 0);
        this.longestTimeout = 0;

        if (this.resetClock) {
            this.clock.uninstall();
            this.resetClock = false;
        }
    }

    return returnVal;
};

fakeServerWithClock.restore = function restore() {
    if (this.clock) {
        this.clock.uninstall();
    }

    return fakeServer.restore.apply(this, arguments);
};

module.exports = fakeServerWithClock;

},{"./index":9,"lolex":16}],8:[function(require,module,exports){
"use strict";

var formatio = require("@sinonjs/formatio");

var formatter = formatio.configure({
    quoteStrings: false,
    limitChildrenCount: 250
});

module.exports = function format() {
    return formatter.ascii.apply(formatter, arguments);
};

},{"@sinonjs/formatio":13}],9:[function(require,module,exports){
"use strict";

var fakeXhr = require("../fake-xhr");
var push = [].push;
var format = require("./format");
var configureLogError = require("../configure-logger");
var pathToRegexp = require("path-to-regexp");

var supportsArrayBuffer = typeof ArrayBuffer !== "undefined";

function responseArray(handler) {
    var response = handler;

    if (Object.prototype.toString.call(handler) !== "[object Array]") {
        response = [200, {}, handler];
    }

    if (typeof response[2] !== "string") {
        if (!supportsArrayBuffer) {
            throw new TypeError("Fake server response body should be a string, but was " +
                                typeof response[2]);
        }
        else if (!(response[2] instanceof ArrayBuffer)) {
            throw new TypeError("Fake server response body should be a string or ArrayBuffer, but was " +
                                typeof response[2]);
        }
    }

    return response;
}

function getDefaultWindowLocation() {
    return { "host": "localhost", "protocol": "http" };
}

function getWindowLocation() {
    if (typeof window === "undefined") {
        // Fallback
        return getDefaultWindowLocation();
    }

    if (typeof window.location !== "undefined") {
        // Browsers place location on window
        return window.location;
    }

    if ((typeof window.window !== "undefined") && (typeof window.window.location !== "undefined")) {
        // React Native on Android places location on window.window
        return window.window.location;
    }

    return getDefaultWindowLocation();
}

function matchOne(response, reqMethod, reqUrl) {
    var rmeth = response.method;
    var matchMethod = !rmeth || rmeth.toLowerCase() === reqMethod.toLowerCase();
    var url = response.url;
    var matchUrl = !url || url === reqUrl || (typeof url.test === "function" && url.test(reqUrl));

    return matchMethod && matchUrl;
}

function match(response, request) {
    var wloc = getWindowLocation();

    var rCurrLoc = new RegExp("^" + wloc.protocol + "//" + wloc.host);

    var requestUrl = request.url;

    if (!/^https?:\/\//.test(requestUrl) || rCurrLoc.test(requestUrl)) {
        requestUrl = requestUrl.replace(rCurrLoc, "");
    }

    if (matchOne(response, this.getHTTPMethod(request), requestUrl)) {
        if (typeof response.response === "function") {
            var ru = response.url;
            var args = [request].concat(ru && typeof ru.exec === "function" ? ru.exec(requestUrl).slice(1) : []);
            return response.response.apply(response, args);
        }

        return true;
    }

    return false;
}

function incrementRequestCount() {
    var count = ++this.requestCount;

    this.requested = true;

    this.requestedOnce = count === 1;
    this.requestedTwice = count === 2;
    this.requestedThrice = count === 3;

    this.firstRequest = this.getRequest(0);
    this.secondRequest = this.getRequest(1);
    this.thirdRequest = this.getRequest(2);

    this.lastRequest = this.getRequest(count - 1);
}

var fakeServer = {
    create: function (config) {
        var server = Object.create(this);
        server.configure(config);
        this.xhr = fakeXhr.useFakeXMLHttpRequest();
        server.requests = [];
        server.requestCount = 0;
        server.queue = [];
        server.responses = [];


        this.xhr.onCreate = function (xhrObj) {
            xhrObj.unsafeHeadersEnabled = function () {
                return !(server.unsafeHeadersEnabled === false);
            };
            server.addRequest(xhrObj);
        };

        return server;
    },

    configure: function (config) {
        var self = this;
        var whitelist = {
            "autoRespond": true,
            "autoRespondAfter": true,
            "respondImmediately": true,
            "fakeHTTPMethods": true,
            "logger": true,
            "unsafeHeadersEnabled": true
        };

        config = config || {};

        Object.keys(config).forEach(function (setting) {
            if (setting in whitelist) {
                self[setting] = config[setting];
            }
        });

        self.logError = configureLogError(config);
    },

    addRequest: function addRequest(xhrObj) {
        var server = this;
        push.call(this.requests, xhrObj);

        incrementRequestCount.call(this);

        xhrObj.onSend = function () {
            server.handleRequest(this);

            if (server.respondImmediately) {
                server.respond();
            } else if (server.autoRespond && !server.responding) {
                setTimeout(function () {
                    server.responding = false;
                    server.respond();
                }, server.autoRespondAfter || 10);

                server.responding = true;
            }
        };
    },

    getHTTPMethod: function getHTTPMethod(request) {
        if (this.fakeHTTPMethods && /post/i.test(request.method)) {
            var matches = (request.requestBody || "").match(/_method=([^\b;]+)/);
            return matches ? matches[1] : request.method;
        }

        return request.method;
    },

    handleRequest: function handleRequest(xhr) {
        if (xhr.async) {
            push.call(this.queue, xhr);
        } else {
            this.processRequest(xhr);
        }
    },

    logger: function () {
        // no-op; override via configure()
    },

    logError: configureLogError({}),

    log: function log(response, request) {
        var str;

        str = "Request:\n" + format(request) + "\n\n";
        str += "Response:\n" + format(response) + "\n\n";

        if (typeof this.logger === "function") {
            this.logger(str);
        }
    },

    respondWith: function respondWith(method, url, body) {
        if (arguments.length === 1 && typeof method !== "function") {
            this.response = responseArray(method);
            return;
        }

        if (arguments.length === 1) {
            body = method;
            url = method = null;
        }

        if (arguments.length === 2) {
            body = url;
            url = method;
            method = null;
        }

        push.call(this.responses, {
            method: method,
            url: typeof url === "string" && url !== "" ? pathToRegexp(url) : url,
            response: typeof body === "function" ? body : responseArray(body)
        });
    },

    respond: function respond() {
        if (arguments.length > 0) {
            this.respondWith.apply(this, arguments);
        }

        var queue = this.queue || [];
        var requests = queue.splice(0, queue.length);
        var self = this;

        requests.forEach(function (request) {
            self.processRequest(request);
        });
    },

    processRequest: function processRequest(request) {
        try {
            if (request.aborted) {
                return;
            }

            var response = this.response || [404, {}, ""];

            if (this.responses) {
                for (var l = this.responses.length, i = l - 1; i >= 0; i--) {
                    if (match.call(this, this.responses[i], request)) {
                        response = this.responses[i].response;
                        break;
                    }
                }
            }

            if (request.readyState !== 4) {
                this.log(response, request);

                request.respond(response[0], response[1], response[2]);
            }
        } catch (e) {
            this.logError("Fake server request processing", e);
        }
    },

    restore: function restore() {
        return this.xhr.restore && this.xhr.restore.apply(this.xhr, arguments);
    },

    getRequest: function getRequest(index) {
        return this.requests[index] || null;
    },

    reset: function reset() {
        this.resetBehavior();
        this.resetHistory();
    },

    resetBehavior: function resetBehavior() {
        this.responses.length = this.queue.length = 0;
    },

    resetHistory: function resetHistory() {
        this.requests.length = this.requestCount = 0;

        this.requestedOnce = this.requestedTwice = this.requestedThrice = this.requested = false;

        this.firstRequest = this.secondRequest = this.thirdRequest = this.lastRequest = null;
    }
};

module.exports = fakeServer;

},{"../configure-logger":1,"../fake-xhr":11,"./format":8,"path-to-regexp":17}],10:[function(require,module,exports){
/*global Blob */
"use strict";

exports.isSupported = (function () {
    try {
        return !!new Blob();
    } catch (e) {
        return false;
    }
}());

},{}],11:[function(require,module,exports){
(function (global){
"use strict";

var TextEncoder = require("text-encoding").TextEncoder;

var configureLogError = require("../configure-logger");
var sinonEvent = require("../event");
var extend = require("just-extend");

function getWorkingXHR(globalScope) {
    var supportsXHR = typeof globalScope.XMLHttpRequest !== "undefined";
    if (supportsXHR) {
        return globalScope.XMLHttpRequest;
    }

    var supportsActiveX = typeof globalScope.ActiveXObject !== "undefined";
    if (supportsActiveX) {
        return function () {
            return new globalScope.ActiveXObject("MSXML2.XMLHTTP.3.0");
        };
    }

    return false;
}

var supportsProgress = typeof ProgressEvent !== "undefined";
var supportsCustomEvent = typeof CustomEvent !== "undefined";
var supportsFormData = typeof FormData !== "undefined";
var supportsArrayBuffer = typeof ArrayBuffer !== "undefined";
var supportsBlob = require("./blob").isSupported;
var isReactNative = global.navigator && global.navigator.product === "ReactNative";
var sinonXhr = { XMLHttpRequest: global.XMLHttpRequest };
sinonXhr.GlobalXMLHttpRequest = global.XMLHttpRequest;
sinonXhr.GlobalActiveXObject = global.ActiveXObject;
sinonXhr.supportsActiveX = typeof sinonXhr.GlobalActiveXObject !== "undefined";
sinonXhr.supportsXHR = typeof sinonXhr.GlobalXMLHttpRequest !== "undefined";
sinonXhr.workingXHR = getWorkingXHR(global);
sinonXhr.supportsTimeout =
    (sinonXhr.supportsXHR && "timeout" in (new sinonXhr.GlobalXMLHttpRequest()));
sinonXhr.supportsCORS = isReactNative ||
    (sinonXhr.supportsXHR && "withCredentials" in (new sinonXhr.GlobalXMLHttpRequest()));

// Ref: https://fetch.spec.whatwg.org/#forbidden-header-name
var unsafeHeaders = {
    "Accept-Charset": true,
    "Access-Control-Request-Headers": true,
    "Access-Control-Request-Method": true,
    "Accept-Encoding": true,
    "Connection": true,
    "Content-Length": true,
    "Cookie": true,
    "Cookie2": true,
    "Content-Transfer-Encoding": true,
    "Date": true,
    "DNT": true,
    "Expect": true,
    "Host": true,
    "Keep-Alive": true,
    "Origin": true,
    "Referer": true,
    "TE": true,
    "Trailer": true,
    "Transfer-Encoding": true,
    "Upgrade": true,
    "User-Agent": true,
    "Via": true
};


function EventTargetHandler() {
    var self = this;
    var events = ["loadstart", "progress", "abort", "error", "load", "timeout", "loadend"];

    function addEventListener(eventName) {
        self.addEventListener(eventName, function (event) {
            var listener = self["on" + eventName];

            if (listener && typeof listener === "function") {
                listener.call(this, event);
            }
        });
    }

    events.forEach(addEventListener);
}

EventTargetHandler.prototype = sinonEvent.EventTarget;

// Note that for FakeXMLHttpRequest to work pre ES5
// we lose some of the alignment with the spec.
// To ensure as close a match as possible,
// set responseType before calling open, send or respond;
function FakeXMLHttpRequest(config) {
    EventTargetHandler.call(this);
    this.readyState = FakeXMLHttpRequest.UNSENT;
    this.requestHeaders = {};
    this.requestBody = null;
    this.status = 0;
    this.statusText = "";
    this.upload = new EventTargetHandler();
    this.responseType = "";
    this.response = "";
    this.logError = configureLogError(config);

    if (sinonXhr.supportsTimeout) {
        this.timeout = 0;
    }

    if (sinonXhr.supportsCORS) {
        this.withCredentials = false;
    }

    if (typeof FakeXMLHttpRequest.onCreate === "function") {
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

function normalizeHeaderValue(value) {
    // Ref: https://fetch.spec.whatwg.org/#http-whitespace-bytes
    /*eslint no-control-regex: "off"*/
    return value.replace(/^[\x09\x0A\x0D\x20]+|[\x09\x0A\x0D\x20]+$/g, "");
}

function getHeader(headers, header) {
    var foundHeader = Object.keys(headers).filter(function (h) {
        return h.toLowerCase() === header.toLowerCase();
    });

    return foundHeader[0] || null;
}

function excludeSetCookie2Header(header) {
    return !/^Set-Cookie2?$/i.test(header);
}

// largest arity in XHR is 5 - XHR#open
var apply = function (obj, method, args) {
    switch (args.length) {
        case 0: return obj[method]();
        case 1: return obj[method](args[0]);
        case 2: return obj[method](args[0], args[1]);
        case 3: return obj[method](args[0], args[1], args[2]);
        case 4: return obj[method](args[0], args[1], args[2], args[3]);
        case 5: return obj[method](args[0], args[1], args[2], args[3], args[4]);
        default: throw new Error("Unhandled case");
    }
};

FakeXMLHttpRequest.filters = [];
FakeXMLHttpRequest.addFilter = function addFilter(fn) {
    this.filters.push(fn);
};
FakeXMLHttpRequest.defake = function defake(fakeXhr, xhrArgs) {
    var xhr = new sinonXhr.workingXHR(); // eslint-disable-line new-cap

    [
        "open",
        "setRequestHeader",
        "send",
        "abort",
        "getResponseHeader",
        "getAllResponseHeaders",
        "addEventListener",
        "overrideMimeType",
        "removeEventListener"
    ].forEach(function (method) {
        fakeXhr[method] = function () {
            return apply(xhr, method, arguments);
        };
    });

    var copyAttrs = function (args) {
        args.forEach(function (attr) {
            fakeXhr[attr] = xhr[attr];
        });
    };

    var stateChange = function stateChange() {
        fakeXhr.readyState = xhr.readyState;
        if (xhr.readyState >= FakeXMLHttpRequest.HEADERS_RECEIVED) {
            copyAttrs(["status", "statusText"]);
        }
        if (xhr.readyState >= FakeXMLHttpRequest.LOADING) {
            copyAttrs(["responseText", "response"]);
        }
        if (xhr.readyState === FakeXMLHttpRequest.DONE) {
            copyAttrs(["responseXML"]);
        }
        if (fakeXhr.onreadystatechange) {
            fakeXhr.onreadystatechange.call(fakeXhr, { target: fakeXhr, currentTarget: fakeXhr });
        }
    };

    if (xhr.addEventListener) {
        Object.keys(fakeXhr.eventListeners).forEach(function (event) {
            /*eslint-disable no-loop-func*/
            fakeXhr.eventListeners[event].forEach(function (handler) {
                xhr.addEventListener(event, handler.listener, {
                    capture: handler.capture,
                    once: handler.once
                });
            });
            /*eslint-enable no-loop-func*/
        });

        xhr.addEventListener("readystatechange", stateChange);
    } else {
        xhr.onreadystatechange = stateChange;
    }
    apply(xhr, "open", xhrArgs);
};
FakeXMLHttpRequest.useFilters = false;

function verifyRequestOpened(xhr) {
    if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
        throw new Error("INVALID_STATE_ERR - " + xhr.readyState);
    }
}

function verifyRequestSent(xhr) {
    if (xhr.readyState === FakeXMLHttpRequest.DONE) {
        throw new Error("Request done");
    }
}

function verifyHeadersReceived(xhr) {
    if (xhr.async && xhr.readyState !== FakeXMLHttpRequest.HEADERS_RECEIVED) {
        throw new Error("No headers received");
    }
}

function verifyResponseBodyType(body, responseType) {
    var error = null;
    var isString = typeof body === "string";

    if (responseType === "arraybuffer") {

        if (!isString && !(body instanceof ArrayBuffer)) {
            error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                               body + ", which is not a string or ArrayBuffer.");
            error.name = "InvalidBodyException";
        }
    }
    else if (!isString) {
        error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                           body + ", which is not a string.");
        error.name = "InvalidBodyException";
    }

    if (error) {
        throw error;
    }
}

function convertToArrayBuffer(body, encoding) {
    if (body instanceof ArrayBuffer) {
        return body;
    }

    return new TextEncoder(encoding || "utf-8").encode(body).buffer;
}

function isXmlContentType(contentType) {
    return !contentType || /(text\/xml)|(application\/xml)|(\+xml)/.test(contentType);
}

function convertResponseBody(responseType, contentType, body) {
    if (responseType === "" || responseType === "text") {
        return body;
    } else if (supportsArrayBuffer && responseType === "arraybuffer") {
        return convertToArrayBuffer(body);
    } else if (responseType === "json") {
        try {
            return JSON.parse(body);
        } catch (e) {
            // Return parsing failure as null
            return null;
        }
    } else if (supportsBlob && responseType === "blob") {
        var blobOptions = {};
        if (contentType) {
            blobOptions.type = contentType;
        }
        return new Blob([convertToArrayBuffer(body)], blobOptions);
    } else if (responseType === "document") {
        if (isXmlContentType(contentType)) {
            return FakeXMLHttpRequest.parseXML(body);
        }
        return null;
    }
    throw new Error("Invalid responseType " + responseType);
}

function clearResponse(xhr) {
    if (xhr.responseType === "" || xhr.responseType === "text") {
        xhr.response = xhr.responseText = "";
    } else {
        xhr.response = xhr.responseText = null;
    }
    xhr.responseXML = null;
}

/**
 * Steps to follow when there is an error, according to:
 * https://xhr.spec.whatwg.org/#request-error-steps
 */
function requestErrorSteps(xhr) {
    clearResponse(xhr);
    xhr.errorFlag = true;
    xhr.requestHeaders = {};
    xhr.responseHeaders = {};

    if (xhr.readyState !== FakeXMLHttpRequest.UNSENT && xhr.sendFlag
        && xhr.readyState !== FakeXMLHttpRequest.DONE) {
        xhr.readyStateChange(FakeXMLHttpRequest.DONE);
        xhr.sendFlag = false;
    }
}

FakeXMLHttpRequest.parseXML = function parseXML(text) {
    // Treat empty string as parsing failure
    if (text !== "") {
        try {
            if (typeof DOMParser !== "undefined") {
                var parser = new DOMParser();
                return parser.parseFromString(text, "text/xml");
            }
            var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(text);
            return xmlDoc;
        } catch (e) {
            // Unable to parse XML - no biggie
        }
    }

    return null;
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
    207: "Multi-Status",
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

extend(FakeXMLHttpRequest.prototype, sinonEvent.EventTarget, {
    async: true,

    open: function open(method, url, async, username, password) {
        this.method = method;
        this.url = url;
        this.async = typeof async === "boolean" ? async : true;
        this.username = username;
        this.password = password;
        clearResponse(this);
        this.requestHeaders = {};
        this.sendFlag = false;

        if (FakeXMLHttpRequest.useFilters === true) {
            var xhrArgs = arguments;
            var defake = FakeXMLHttpRequest.filters.some(function (filter) {
                return filter.apply(this, xhrArgs);
            });
            if (defake) {
                FakeXMLHttpRequest.defake(this, arguments);
                return;
            }
        }
        this.readyStateChange(FakeXMLHttpRequest.OPENED);
    },

    readyStateChange: function readyStateChange(state) {
        this.readyState = state;

        var readyStateChangeEvent = new sinonEvent.Event("readystatechange", false, false, this);
        var event, progress;

        if (typeof this.onreadystatechange === "function") {
            try {
                this.onreadystatechange(readyStateChangeEvent);
            } catch (e) {
                this.logError("Fake XHR onreadystatechange handler", e);
            }
        }

        if (this.readyState === FakeXMLHttpRequest.DONE) {
            if (this.timedOut || this.aborted || this.status === 0) {
                progress = {loaded: 0, total: 0};
                event = (this.timedOut && "timeout") || (this.aborted && "abort") || "error";
            } else {
                progress = {loaded: 100, total: 100};
                event = "load";
            }

            if (supportsProgress) {
                this.upload.dispatchEvent(new sinonEvent.ProgressEvent("progress", progress, this));
                this.upload.dispatchEvent(new sinonEvent.ProgressEvent(event, progress, this));
                this.upload.dispatchEvent(new sinonEvent.ProgressEvent("loadend", progress, this));
            }

            this.dispatchEvent(new sinonEvent.ProgressEvent("progress", progress, this));
            this.dispatchEvent(new sinonEvent.ProgressEvent(event, progress, this));
            this.dispatchEvent(new sinonEvent.ProgressEvent("loadend", progress, this));
        }

        this.dispatchEvent(readyStateChangeEvent);
    },

    // Ref https://xhr.spec.whatwg.org/#the-setrequestheader()-method
    setRequestHeader: function setRequestHeader(header, value) {
        verifyState(this);

        var checkUnsafeHeaders = true;
        if (typeof this.unsafeHeadersEnabled === "function") {
            checkUnsafeHeaders = this.unsafeHeadersEnabled();
        }

        if (checkUnsafeHeaders && (getHeader(unsafeHeaders, header) !== null || /^(Sec-|Proxy-)/i.test(header))) {
            throw new Error("Refused to set unsafe header \"" + header + "\"");
        }

        value = normalizeHeaderValue(value);

        var existingHeader = getHeader(this.requestHeaders, header);
        if (existingHeader) {
            this.requestHeaders[existingHeader] += ", " + value;
        } else {
            this.requestHeaders[header] = value;
        }
    },

    setStatus: function setStatus(status) {
        var sanitizedStatus = typeof status === "number" ? status : 200;

        verifyRequestOpened(this);
        this.status = sanitizedStatus;
        this.statusText = FakeXMLHttpRequest.statusCodes[sanitizedStatus];
    },

    // Helps testing
    setResponseHeaders: function setResponseHeaders(headers) {
        verifyRequestOpened(this);

        var responseHeaders = this.responseHeaders = {};

        Object.keys(headers).forEach(function (header) {
            responseHeaders[header] = headers[header];
        });

        if (this.async) {
            this.readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
        } else {
            this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
        }
    },

    // Currently treats ALL data as a DOMString (i.e. no Document)
    send: function send(data) {
        verifyState(this);

        if (!/^(head)$/i.test(this.method)) {
            var contentType = getHeader(this.requestHeaders, "Content-Type");
            if (this.requestHeaders[contentType]) {
                var value = this.requestHeaders[contentType].split(";");
                this.requestHeaders[contentType] = value[0] + ";charset=utf-8";
            } else if (supportsFormData && !(data instanceof FormData)) {
                this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
            }

            this.requestBody = data;
        }

        this.errorFlag = false;
        this.sendFlag = this.async;
        clearResponse(this);
        this.readyStateChange(FakeXMLHttpRequest.OPENED);

        if (typeof this.onSend === "function") {
            this.onSend(this);
        }

        // Only listen if setInterval and Date are a stubbed.
        if (sinonXhr.supportsTimeout && typeof setInterval.clock === "object" && typeof Date.clock === "object") {
            var initiatedTime = Date.now();
            var self = this;

            // Listen to any possible tick by fake timers and check to see if timeout has
            // been exceeded. It's important to note that timeout can be changed while a request
            // is in flight, so we must check anytime the end user forces a clock tick to make
            // sure timeout hasn't changed.
            // https://xhr.spec.whatwg.org/#dfnReturnLink-2
            var clearIntervalId = setInterval(function () {
                // Check if the readyState has been reset or is done. If this is the case, there
                // should be no timeout. This will also prevent aborted requests and
                // fakeServerWithClock from triggering unnecessary responses.
                if (self.readyState === FakeXMLHttpRequest.UNSENT
                  || self.readyState === FakeXMLHttpRequest.DONE) {
                    clearInterval(clearIntervalId);
                } else if (typeof self.timeout === "number" && self.timeout > 0) {
                    if (Date.now() >= (initiatedTime + self.timeout)) {
                        self.triggerTimeout();
                        clearInterval(clearIntervalId);
                    }
                }
            }, 1);
        }

        this.dispatchEvent(new sinonEvent.Event("loadstart", false, false, this));
    },

    abort: function abort() {
        this.aborted = true;
        requestErrorSteps(this);
        this.readyState = FakeXMLHttpRequest.UNSENT;
    },

    error: function () {
        clearResponse(this);
        this.errorFlag = true;
        this.requestHeaders = {};
        this.responseHeaders = {};

        this.readyStateChange(FakeXMLHttpRequest.DONE);
    },

    triggerTimeout: function triggerTimeout() {
        if (sinonXhr.supportsTimeout) {
            this.timedOut = true;
            requestErrorSteps(this);
        }
    },

    getResponseHeader: function getResponseHeader(header) {
        if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
            return null;
        }

        if (/^Set-Cookie2?$/i.test(header)) {
            return null;
        }

        header = getHeader(this.responseHeaders, header);

        return this.responseHeaders[header] || null;
    },

    getAllResponseHeaders: function getAllResponseHeaders() {
        if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
            return "";
        }

        var responseHeaders = this.responseHeaders;
        var headers = Object.keys(responseHeaders)
            .filter(excludeSetCookie2Header)
            .reduce(function (prev, header) {
                var value = responseHeaders[header];

                return prev + (header + ": " + value + "\r\n");
            }, "");

        return headers;
    },

    setResponseBody: function setResponseBody(body) {
        verifyRequestSent(this);
        verifyHeadersReceived(this);
        verifyResponseBodyType(body, this.responseType);
        var contentType = this.overriddenMimeType || this.getResponseHeader("Content-Type");

        var isTextResponse = this.responseType === "" || this.responseType === "text";
        clearResponse(this);
        if (this.async) {
            var chunkSize = this.chunkSize || 10;
            var index = 0;

            do {
                this.readyStateChange(FakeXMLHttpRequest.LOADING);

                if (isTextResponse) {
                    this.responseText = this.response += body.substring(index, index + chunkSize);
                }
                index += chunkSize;
            } while (index < body.length);
        }

        this.response = convertResponseBody(this.responseType, contentType, body);
        if (isTextResponse) {
            this.responseText = this.response;
        }

        if (this.responseType === "document") {
            this.responseXML = this.response;
        } else if (this.responseType === "" && isXmlContentType(contentType)) {
            this.responseXML = FakeXMLHttpRequest.parseXML(this.responseText);
        }
        this.readyStateChange(FakeXMLHttpRequest.DONE);
    },

    respond: function respond(status, headers, body) {
        this.setStatus(status);
        this.setResponseHeaders(headers || {});
        this.setResponseBody(body || "");
    },

    uploadProgress: function uploadProgress(progressEventRaw) {
        if (supportsProgress) {
            this.upload.dispatchEvent(new sinonEvent.ProgressEvent("progress", progressEventRaw, this.upload));
        }
    },

    downloadProgress: function downloadProgress(progressEventRaw) {
        if (supportsProgress) {
            this.dispatchEvent(new sinonEvent.ProgressEvent("progress", progressEventRaw, this));
        }
    },

    uploadError: function uploadError(error) {
        if (supportsCustomEvent) {
            this.upload.dispatchEvent(new sinonEvent.CustomEvent("error", {detail: error}));
        }
    },

    overrideMimeType: function overrideMimeType(type) {
        if (this.readyState >= FakeXMLHttpRequest.LOADING) {
            throw new Error("INVALID_STATE_ERR");
        }
        this.overriddenMimeType = type;
    }
});

var states = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
};

extend(FakeXMLHttpRequest, states);
extend(FakeXMLHttpRequest.prototype, states);

function useFakeXMLHttpRequest() {
    FakeXMLHttpRequest.restore = function restore(keepOnCreate) {
        if (sinonXhr.supportsXHR) {
            global.XMLHttpRequest = sinonXhr.GlobalXMLHttpRequest;
        }

        if (sinonXhr.supportsActiveX) {
            global.ActiveXObject = sinonXhr.GlobalActiveXObject;
        }

        delete FakeXMLHttpRequest.restore;

        if (keepOnCreate !== true) {
            delete FakeXMLHttpRequest.onCreate;
        }
    };
    if (sinonXhr.supportsXHR) {
        global.XMLHttpRequest = FakeXMLHttpRequest;
    }

    if (sinonXhr.supportsActiveX) {
        global.ActiveXObject = function ActiveXObject(objId) {
            if (objId === "Microsoft.XMLHTTP" || /^Msxml2\.XMLHTTP/i.test(objId)) {

                return new FakeXMLHttpRequest();
            }

            return new sinonXhr.GlobalActiveXObject(objId);
        };
    }

    return FakeXMLHttpRequest;
}

module.exports = {
    xhr: sinonXhr,
    FakeXMLHttpRequest: FakeXMLHttpRequest,
    useFakeXMLHttpRequest: useFakeXMLHttpRequest
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../configure-logger":1,"../event":5,"./blob":10,"just-extend":15,"text-encoding":19}],12:[function(require,module,exports){
"use strict";

module.exports = {
    fakeServer: require("./fake-server"),
    fakeServerWithClock: require("./fake-server/fake-server-with-clock"),
    fakeXhr: require("./fake-xhr")
};

},{"./fake-server":9,"./fake-server/fake-server-with-clock":7,"./fake-xhr":11}],13:[function(require,module,exports){
(function (global){
(function (root, factory) {
    "use strict";

    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["samsam"], factory);
    } else if (typeof module === "object" && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("samsam"));
    } else {
        // Browser globals (root is window)
        root.formatio = factory(root.samsam);
    }
}(typeof self !== "undefined" ? self : this, function (samsam) {
    "use strict";

    var formatio = {
        excludeConstructors: ["Object", /^.$/],
        quoteStrings: true,
        limitChildrenCount: 0
    };

    var specialObjects = [];
    if (typeof global !== "undefined") {
        specialObjects.push({ object: global, value: "[object global]" });
    }
    if (typeof document !== "undefined") {
        specialObjects.push({
            object: document,
            value: "[object HTMLDocument]"
        });
    }
    if (typeof window !== "undefined") {
        specialObjects.push({ object: window, value: "[object Window]" });
    }

    function functionName(func) {
        if (!func) { return ""; }
        if (func.displayName) { return func.displayName; }
        if (func.name) { return func.name; }
        var matches = func.toString().match(/function\s+([^\(]+)/m);
        return (matches && matches[1]) || "";
    }

    function constructorName(f, object) {
        var name = functionName(object && object.constructor);
        var excludes = f.excludeConstructors ||
                formatio.excludeConstructors || [];

        var i, l;
        for (i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] === "string" && excludes[i] === name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    }

    function isCircular(object, objects) {
        if (typeof object !== "object") { return false; }
        var i, l;
        for (i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) { return true; }
        }
        return false;
    }

    function ascii(f, object, processed, indent) {
        if (typeof object === "string") {
            if (object.length === 0) { return "(empty string)"; }
            var qs = f.quoteStrings;
            var quote = typeof qs !== "boolean" || qs;
            return processed || quote ? "\"" + object + "\"" : object;
        }

        if (typeof object === "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) { return "[Circular]"; }

        if (Object.prototype.toString.call(object) === "[object Array]") {
            return ascii.array.call(f, object, processed);
        }

        if (!object) { return String((1 / object) === -Infinity ? "-0" : object); }
        if (samsam.isElement(object)) { return ascii.element(object); }

        if (typeof object.toString === "function" &&
                object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        var i, l;
        for (i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].object) {
                return specialObjects[i].value;
            }
        }

        if (typeof Set !== "undefined" && object instanceof Set) {
            return ascii.set.call(f, object, processed);
        }

        return ascii.object.call(f, object, processed, indent);
    }

    ascii.func = function (func) {
        return "function " + functionName(func) + "() {}";
    };

    function delimit(str, delimiters) {
        delimiters = delimiters || ["[", "]"];
        return delimiters[0] + str + delimiters[1];
    }

    ascii.array = function (array, processed, delimiters) {
        processed = processed || [];
        processed.push(array);
        var pieces = [];
        var i, l;
        l = (this.limitChildrenCount > 0) ?
            Math.min(this.limitChildrenCount, array.length) : array.length;

        for (i = 0; i < l; ++i) {
            pieces.push(ascii(this, array[i], processed));
        }

        if (l < array.length) {
            pieces.push("[... " + (array.length - l) + " more elements]");
        }

        return delimit(pieces.join(", "), delimiters);
    };

    ascii.set = function (set, processed) {
        return ascii.array.call(this, Array.from(set), processed, ["Set {", "}"]);
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [];
        var properties = samsam.keys(object).sort();
        var length = 3;
        var prop, str, obj, i, k, l;
        l = (this.limitChildrenCount > 0) ?
            Math.min(this.limitChildrenCount, properties.length) : properties.length;

        for (i = 0; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? "\"" + prop + "\"" : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = constructorName(this, object);
        var prefix = cons ? "[" + cons + "] " : "";
        var is = "";
        for (i = 0, k = indent; i < k; ++i) { is += " "; }

        if (l < properties.length)
        {pieces.push("[... " + (properties.length - l) + " more elements]");}

        if (length + indent > 80) {
            return prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" +
                is + "}";
        }
        return prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes;
        var pairs = [];
        var attr, attrName, i, l, val;

        for (i = 0, l = attrs.length; i < l; ++i) {
            attr = attrs.item(i);
            attrName = attr.nodeName.toLowerCase().replace("html:", "");
            val = attr.nodeValue;
            if (attrName !== "contenteditable" || val !== "inherit") {
                if (val) { pairs.push(attrName + "=\"" + val + "\""); }
            }
        }

        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        // SVG elements have undefined innerHTML
        var content = element.innerHTML || "";

        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }

        var res = formatted + pairs.join(" ") + ">" + content +
                "</" + tagName + ">";

        return res.replace(/ contentEditable="inherit"/, "");
    };

    function Formatio(options) {
        // eslint-disable-next-line guard-for-in
        for (var opt in options) {
            this[opt] = options[opt];
        }
    }

    Formatio.prototype = {
        functionName: functionName,

        configure: function (options) {
            return new Formatio(options);
        },

        constructorName: function (object) {
            return constructorName(this, object);
        },

        ascii: function (object, processed, indent) {
            return ascii(this, object, processed, indent);
        }
    };

    return Formatio.prototype;
}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"samsam":18}],14:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],15:[function(require,module,exports){
module.exports = extend;

/*
  var obj = {a: 3, b: 5};
  extend(obj, {a: 4, c: 8}); // {a: 4, b: 5, c: 8}
  obj; // {a: 4, b: 5, c: 8}

  var obj = {a: 3, b: 5};
  extend({}, obj, {a: 4, c: 8}); // {a: 4, b: 5, c: 8}
  obj; // {a: 3, b: 5}

  var arr = [1, 2, 3];
  var obj = {a: 3, b: 5};
  extend(obj, {c: arr}); // {a: 3, b: 5, c: [1, 2, 3]}
  arr.push(4);
  obj; // {a: 3, b: 5, c: [1, 2, 3, 4]}

  var arr = [1, 2, 3];
  var obj = {a: 3, b: 5};
  extend(true, obj, {c: arr}); // {a: 3, b: 5, c: [1, 2, 3]}
  arr.push(4);
  obj; // {a: 3, b: 5, c: [1, 2, 3]}

  extend({a: 4, b: 5}); // {a: 4, b: 5}
  extend({a: 4, b: 5}, 3); {a: 4, b: 5}
  extend({a: 4, b: 5}, true); {a: 4, b: 5}
  extend('hello', {a: 4, b: 5}); // throws
  extend(3, {a: 4, b: 5}); // throws
*/

function extend(/* [deep], obj1, obj2, [objn] */) {
  var args = [].slice.call(arguments);
  var deep = false;
  if (typeof args[0] == 'boolean') {
    deep = args.shift();
  }
  var result = args[0];
  if (!result || (typeof result != 'object' && typeof result != 'function')) {
    throw new Error('extendee must be an object');
  }
  var extenders = args.slice(1);
  var len = extenders.length;
  for (var i = 0; i < len; i++) {
    var extender = extenders[i];
    for (var key in extender) {
      // include prototype properties
      var value = extender[key];
      if (deep && value && (typeof value == 'object' || typeof value == 'function')) {
        var base = Array.isArray(value) ? [] : {};
        result[key] = extend(true, result[key] || base, value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

},{}],16:[function(require,module,exports){
(function (global){
"use strict";

var userAgent = global.navigator && global.navigator.userAgent;
var isRunningInIE = userAgent && userAgent.indexOf("MSIE ") > -1;
var maxTimeout = Math.pow(2, 31) - 1; //see https://heycam.github.io/webidl/#abstract-opdef-converttoint

// Make properties writable in IE, as per
// http://www.adequatelygood.com/Replacing-setTimeout-Globally.html
if (isRunningInIE) {
    global.setTimeout = global.setTimeout;
    global.clearTimeout = global.clearTimeout;
    global.setInterval = global.setInterval;
    global.clearInterval = global.clearInterval;
    global.Date = global.Date;
}

// setImmediate is not a standard function
// avoid adding the prop to the window object if not present
if (global.setImmediate !== undefined) {
    global.setImmediate = global.setImmediate;
    global.clearImmediate = global.clearImmediate;
}

// node expects setTimeout/setInterval to return a fn object w/ .ref()/.unref()
// browsers, a number.
// see https://github.com/cjohansen/Sinon.JS/pull/436

var NOOP = function () { return undefined; };
var timeoutResult = setTimeout(NOOP, 0);
var addTimerReturnsObject = typeof timeoutResult === "object";
var hrtimePresent = (global.process && typeof global.process.hrtime === "function");
var nextTickPresent = (global.process && typeof global.process.nextTick === "function");
var performancePresent = (global.performance && typeof global.performance.now === "function");
var requestAnimationFramePresent = (global.requestAnimationFrame && typeof global.requestAnimationFrame === "function");
var cancelAnimationFramePresent = (global.cancelAnimationFrame && typeof global.cancelAnimationFrame === "function");

clearTimeout(timeoutResult);

var NativeDate = Date;
var uniqueTimerId = 1;

/**
 * Parse strings like "01:10:00" (meaning 1 hour, 10 minutes, 0 seconds) into
 * number of milliseconds. This is used to support human-readable strings passed
 * to clock.tick()
 */
function parseTime(str) {
    if (!str) {
        return 0;
    }

    var strings = str.split(":");
    var l = strings.length;
    var i = l;
    var ms = 0;
    var parsed;

    if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
        throw new Error("tick only understands numbers, 'm:s' and 'h:m:s'. Each part must be two digits");
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

/**
 * Floor function that also works for negative numbers
 */
function fixedFloor(n) {
    return (n >= 0 ? Math.floor(n) : Math.ceil(n));
}

/**
 * % operator that also works for negative numbers
 */
function fixedModulo(n, m) {
    return ((n % m) + m) % m;
}

/**
 * Used to grok the `now` parameter to createClock.
 * @param epoch {Date|number} the system time
 */
function getEpoch(epoch) {
    if (!epoch) { return 0; }
    if (typeof epoch.getTime === "function") { return epoch.getTime(); }
    if (typeof epoch === "number") { return epoch; }
    throw new TypeError("now should be milliseconds since UNIX epoch");
}

function inRange(from, to, timer) {
    return timer && timer.callAt >= from && timer.callAt <= to;
}

function mirrorDateProperties(target, source) {
    var prop;
    for (prop in source) {
        if (source.hasOwnProperty(prop)) {
            target[prop] = source[prop];
        }
    }

    // set special now implementation
    if (source.now) {
        target.now = function now() {
            return target.clock.now;
        };
    } else {
        delete target.now;
    }

    // set special toSource implementation
    if (source.toSource) {
        target.toSource = function toSource() {
            return source.toSource();
        };
    } else {
        delete target.toSource;
    }

    // set special toString implementation
    target.toString = function toString() {
        return source.toString();
    };

    target.prototype = source.prototype;
    target.parse = source.parse;
    target.UTC = source.UTC;
    target.prototype.toUTCString = source.prototype.toUTCString;

    return target;
}

function createDate() {
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
}


function enqueueJob(clock, job) {
    // enqueues a microtick-deferred task - ecma262/#sec-enqueuejob
    if (!clock.jobs) {
        clock.jobs = [];
    }
    clock.jobs.push(job);
}

function runJobs(clock) {
    // runs all microtick-deferred tasks - ecma262/#sec-runjobs
    if (!clock.jobs) {
        return;
    }
    for (var i = 0; i < clock.jobs.length; i++) {
        var job = clock.jobs[i];
        job.func.apply(null, job.args);
    }
    clock.jobs = [];
}

function addTimer(clock, timer) {
    if (timer.func === undefined) {
        throw new Error("Callback must be provided to timer calls");
    }

    timer.type = timer.immediate ? "Immediate" : "Timeout";

    if (timer.hasOwnProperty("delay")) {
        timer.delay = timer.delay > maxTimeout ? 1 : timer.delay;
        timer.delay = Math.max(0, timer.delay);
    }

    if (timer.hasOwnProperty("interval")) {
        timer.type = "Interval";
        timer.interval = timer.interval > maxTimeout ? 1 : timer.interval;
    }

    if (timer.hasOwnProperty("animation")) {
        timer.type = "AnimationFrame";
        timer.animation = true;
    }

    if (!clock.timers) {
        clock.timers = {};
    }

    timer.id = uniqueTimerId++;
    timer.createdAt = clock.now;
    timer.callAt = clock.now + (parseInt(timer.delay) || (clock.duringTick ? 1 : 0));

    clock.timers[timer.id] = timer;

    if (addTimerReturnsObject) {
        return {
            id: timer.id,
            ref: NOOP,
            unref: NOOP
        };
    }

    return timer.id;
}


/* eslint consistent-return: "off" */
function compareTimers(a, b) {
    // Sort first by absolute timing
    if (a.callAt < b.callAt) {
        return -1;
    }
    if (a.callAt > b.callAt) {
        return 1;
    }

    // Sort next by immediate, immediate timers take precedence
    if (a.immediate && !b.immediate) {
        return -1;
    }
    if (!a.immediate && b.immediate) {
        return 1;
    }

    // Sort next by creation time, earlier-created timers take precedence
    if (a.createdAt < b.createdAt) {
        return -1;
    }
    if (a.createdAt > b.createdAt) {
        return 1;
    }

    // Sort next by id, lower-id timers take precedence
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }

    // As timer ids are unique, no fallback `0` is necessary
}

function firstTimerInRange(clock, from, to) {
    var timers = clock.timers;
    var timer = null;
    var id, isInRange;

    for (id in timers) {
        if (timers.hasOwnProperty(id)) {
            isInRange = inRange(from, to, timers[id]);

            if (isInRange && (!timer || compareTimers(timer, timers[id]) === 1)) {
                timer = timers[id];
            }
        }
    }

    return timer;
}

function firstTimer(clock) {
    var timers = clock.timers;
    var timer = null;
    var id;

    for (id in timers) {
        if (timers.hasOwnProperty(id)) {
            if (!timer || compareTimers(timer, timers[id]) === 1) {
                timer = timers[id];
            }
        }
    }

    return timer;
}

function lastTimer(clock) {
    var timers = clock.timers;
    var timer = null;
    var id;

    for (id in timers) {
        if (timers.hasOwnProperty(id)) {
            if (!timer || compareTimers(timer, timers[id]) === -1) {
                timer = timers[id];
            }
        }
    }

    return timer;
}

function callTimer(clock, timer) {
    if (typeof timer.interval === "number") {
        clock.timers[timer.id].callAt += timer.interval;
    } else {
        delete clock.timers[timer.id];
    }

    if (typeof timer.func === "function") {
        timer.func.apply(null, timer.args);
    } else {
        /* eslint no-eval: "off" */
        eval(timer.func);
    }
}

function clearTimer(clock, timerId, ttype) {
    if (!timerId) {
        // null appears to be allowed in most browsers, and appears to be
        // relied upon by some libraries, like Bootstrap carousel
        return;
    }

    if (!clock.timers) {
        clock.timers = [];
    }

    // in Node, timerId is an object with .ref()/.unref(), and
    // its .id field is the actual timer id.
    if (typeof timerId === "object") {
        timerId = timerId.id;
    }

    if (clock.timers.hasOwnProperty(timerId)) {
        // check that the ID matches a timer of the correct type
        var timer = clock.timers[timerId];
        if (timer.type === ttype) {
            delete clock.timers[timerId];
        } else {
            var clear = ttype === "AnimationFrame" ? "cancelAnimationFrame" : "clear" + ttype;
            var schedule = timer.type === "AnimationFrame" ? "requestAnimationFrame" : "set" + timer.type;
            throw new Error("Cannot clear timer: timer created with " + schedule
                            + "() but cleared with " + clear + "()");
        }
    }
}

function uninstall(clock, target, config) {
    var method,
        i,
        l;
    var installedHrTime = "_hrtime";
    var installedNextTick = "_nextTick";

    for (i = 0, l = clock.methods.length; i < l; i++) {
        method = clock.methods[i];
        if (method === "hrtime" && target.process) {
            target.process.hrtime = clock[installedHrTime];
        } else if (method === "nextTick" && target.process) {
            target.process.nextTick = clock[installedNextTick];
        } else {
            if (target[method] && target[method].hadOwnProperty) {
                target[method] = clock["_" + method];
                if (method === "clearInterval" && config.shouldAdvanceTime === true) {
                    target[method](clock.attachedInterval);
                }
            } else {
                try {
                    delete target[method];
                } catch (ignore) { /* eslint empty-block: "off" */ }
            }
        }
    }

    // Prevent multiple executions which will completely remove these props
    clock.methods = [];

    // return pending timers, to enable checking what timers remained on uninstall
    if (!clock.timers) {
        return [];
    }
    return Object.keys(clock.timers).map(function mapper(key) {
        return clock.timers[key];
    });
}

function hijackMethod(target, method, clock) {
    var prop;
    clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(target, method);
    clock["_" + method] = target[method];

    if (method === "Date") {
        var date = mirrorDateProperties(clock[method], target[method]);
        target[method] = date;
    } else {
        target[method] = function () {
            return clock[method].apply(clock, arguments);
        };

        for (prop in clock[method]) {
            if (clock[method].hasOwnProperty(prop)) {
                target[method][prop] = clock[method][prop];
            }
        }
    }

    target[method].clock = clock;
}

function doIntervalTick(clock, advanceTimeDelta) {
    clock.tick(advanceTimeDelta);
}

var timers = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setImmediate: global.setImmediate,
    clearImmediate: global.clearImmediate,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date
};

if (hrtimePresent) {
    timers.hrtime = global.process.hrtime;
}

if (nextTickPresent) {
    timers.nextTick = global.process.nextTick;
}

if (performancePresent) {
    timers.performance = global.performance;
}

if (requestAnimationFramePresent) {
    timers.requestAnimationFrame = global.requestAnimationFrame;
}

if (cancelAnimationFramePresent) {
    timers.cancelAnimationFrame = global.cancelAnimationFrame;
}

var keys = Object.keys || function (obj) {
    var ks = [];
    var key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            ks.push(key);
        }
    }

    return ks;
};

exports.timers = timers;

/**
 * @param start {Date|number} the system time
 * @param loopLimit {number}  maximum number of timers that will be run when calling runAll()
 */
function createClock(start, loopLimit) {
    start = start || 0;
    loopLimit = loopLimit || 1000;

    var clock = {
        now: getEpoch(start),
        hrNow: 0,
        timeouts: {},
        Date: createDate(),
        loopLimit: loopLimit
    };

    clock.Date.clock = clock;

    function getTimeToNextFrame() {
        return 16 - ((clock.now - start) % 16);
    }

    clock.setTimeout = function setTimeout(func, timeout) {
        return addTimer(clock, {
            func: func,
            args: Array.prototype.slice.call(arguments, 2),
            delay: timeout
        });
    };

    clock.clearTimeout = function clearTimeout(timerId) {
        return clearTimer(clock, timerId, "Timeout");
    };
    clock.nextTick = function nextTick(func) {
        return enqueueJob(clock, {
            func: func,
            args: Array.prototype.slice.call(arguments, 1)
        });
    };
    clock.setInterval = function setInterval(func, timeout) {
        return addTimer(clock, {
            func: func,
            args: Array.prototype.slice.call(arguments, 2),
            delay: timeout,
            interval: timeout
        });
    };

    clock.clearInterval = function clearInterval(timerId) {
        return clearTimer(clock, timerId, "Interval");
    };

    clock.setImmediate = function setImmediate(func) {
        return addTimer(clock, {
            func: func,
            args: Array.prototype.slice.call(arguments, 1),
            immediate: true
        });
    };

    clock.clearImmediate = function clearImmediate(timerId) {
        return clearTimer(clock, timerId, "Immediate");
    };

    clock.requestAnimationFrame = function requestAnimationFrame(func) {
        var result = addTimer(clock, {
            func: func,
            delay: getTimeToNextFrame(),
            args: [clock.now + getTimeToNextFrame()],
            animation: true
        });

        return result.id || result;
    };

    clock.cancelAnimationFrame = function cancelAnimationFrame(timerId) {
        return clearTimer(clock, timerId, "AnimationFrame");
    };

    function updateHrTime(newNow) {
        clock.hrNow += (newNow - clock.now);
    }

    clock.tick = function tick(ms) {
        ms = typeof ms === "number" ? ms : parseTime(ms);
        var tickFrom = clock.now;
        var tickTo = clock.now + ms;
        var previous = clock.now;
        var timer, firstException, oldNow;

        clock.duringTick = true;

        // perform process.nextTick()s
        oldNow = clock.now;
        runJobs(clock);
        if (oldNow !== clock.now) {
            // compensate for any setSystemTime() call during process.nextTick() callback
            tickFrom += clock.now - oldNow;
            tickTo += clock.now - oldNow;
        }

        // perform each timer in the requested range
        timer = firstTimerInRange(clock, tickFrom, tickTo);
        while (timer && tickFrom <= tickTo) {
            if (clock.timers[timer.id]) {
                updateHrTime(timer.callAt);
                tickFrom = timer.callAt;
                clock.now = timer.callAt;
                oldNow = clock.now;
                try {
                    runJobs(clock);
                    callTimer(clock, timer);
                } catch (e) {
                    firstException = firstException || e;
                }

                // compensate for any setSystemTime() call during timer callback
                if (oldNow !== clock.now) {
                    tickFrom += clock.now - oldNow;
                    tickTo += clock.now - oldNow;
                    previous += clock.now - oldNow;
                }
            }

            timer = firstTimerInRange(clock, previous, tickTo);
            previous = tickFrom;
        }

        // perform process.nextTick()s again
        oldNow = clock.now;
        runJobs(clock);
        if (oldNow !== clock.now) {
            // compensate for any setSystemTime() call during process.nextTick() callback
            tickFrom += clock.now - oldNow;
            tickTo += clock.now - oldNow;
        }
        clock.duringTick = false;

        // corner case: during runJobs, new timers were scheduled which could be in the range [clock.now, tickTo]
        timer = firstTimerInRange(clock, tickFrom, tickTo);
        if (timer) {
            try {
                clock.tick(tickTo - clock.now); // do it all again - for the remainder of the requested range
            } catch (e) {
                firstException = firstException || e;
            }
        } else {
            // no timers remaining in the requested range: move the clock all the way to the end
            updateHrTime(tickTo);
            clock.now = tickTo;
        }
        if (firstException) {
            throw firstException;
        }
        return clock.now;
    };

    clock.next = function next() {
        runJobs(clock);
        var timer = firstTimer(clock);
        if (!timer) {
            return clock.now;
        }

        clock.duringTick = true;
        try {
            updateHrTime(timer.callAt);
            clock.now = timer.callAt;
            callTimer(clock, timer);
            runJobs(clock);
            return clock.now;
        } finally {
            clock.duringTick = false;
        }
    };

    clock.runAll = function runAll() {
        var numTimers, i;
        runJobs(clock);
        for (i = 0; i < clock.loopLimit; i++) {
            if (!clock.timers) {
                return clock.now;
            }

            numTimers = keys(clock.timers).length;
            if (numTimers === 0) {
                return clock.now;
            }

            clock.next();
        }

        throw new Error("Aborting after running " + clock.loopLimit + " timers, assuming an infinite loop!");
    };

    clock.runToFrame = function runToFrame() {
        return clock.tick(getTimeToNextFrame());
    };

    clock.runToLast = function runToLast() {
        var timer = lastTimer(clock);
        if (!timer) {
            runJobs(clock);
            return clock.now;
        }

        return clock.tick(timer.callAt);
    };

    clock.reset = function reset() {
        clock.timers = {};
    };

    clock.setSystemTime = function setSystemTime(systemTime) {
        // determine time difference
        var newNow = getEpoch(systemTime);
        var difference = newNow - clock.now;
        var id, timer;

        // update 'system clock'
        clock.now = newNow;

        // update timers and intervals to keep them stable
        for (id in clock.timers) {
            if (clock.timers.hasOwnProperty(id)) {
                timer = clock.timers[id];
                timer.createdAt += difference;
                timer.callAt += difference;
            }
        }
    };

    if (performancePresent) {
        clock.performance = Object.create(global.performance);
        clock.performance.now = function lolexNow() {
            return clock.hrNow;
        };
    }
    if (hrtimePresent) {
        clock.hrtime = function (prev) {
            if (Array.isArray(prev)) {
                var oldSecs = (prev[0] + prev[1] / 1e9);
                var newSecs = (clock.hrNow / 1000);
                var difference = (newSecs - oldSecs);
                var secs = fixedFloor(difference);
                var nanosecs = fixedModulo(difference * 1e9, 1e9);
                return [
                    secs,
                    nanosecs
                ];
            }
            return [
                fixedFloor(clock.hrNow / 1000),
                fixedModulo(clock.hrNow * 1e6, 1e9)
            ];
        };
    }

    return clock;
}
exports.createClock = createClock;

/**
 * @param config {Object} optional config
 * @param config.target {Object} the target to install timers in (default `window`)
 * @param config.now {number|Date}  a number (in milliseconds) or a Date object (default epoch)
 * @param config.toFake {string[]} names of the methods that should be faked.
 * @param config.loopLimit {number} the maximum number of timers that will be run when calling runAll()
 * @param config.shouldAdvanceTime {Boolean} tells lolex to increment mocked time automatically (default false)
 * @param config.advanceTimeDelta {Number} increment mocked time every <<advanceTimeDelta>> ms (default: 20ms)
 */
exports.install = function install(config) {
    if ( arguments.length > 1 || config instanceof Date || Array.isArray(config) || typeof config === "number") {
        throw new TypeError("lolex.install called with " + String(config) +
            " lolex 2.0+ requires an object parameter - see https://github.com/sinonjs/lolex");
    }
    config = typeof config !== "undefined" ? config : {};
    config.shouldAdvanceTime = config.shouldAdvanceTime || false;
    config.advanceTimeDelta = config.advanceTimeDelta || 20;

    var i, l;
    var target = config.target || global;
    var clock = createClock(config.now, config.loopLimit);

    clock.uninstall = function () {
        return uninstall(clock, target, config);
    };

    clock.methods = config.toFake || [];

    if (clock.methods.length === 0) {
        // do not fake nextTick by default - GitHub#126
        clock.methods = keys(timers).filter(function (key) {return key !== "nextTick";});
    }

    for (i = 0, l = clock.methods.length; i < l; i++) {
        if (clock.methods[i] === "hrtime") {
            if (target.process && typeof target.process.hrtime === "function") {
                hijackMethod(target.process, clock.methods[i], clock);
            }
        } else if (clock.methods[i] === "nextTick") {
            if (target.process && typeof target.process.nextTick === "function") {
                hijackMethod(target.process, clock.methods[i], clock);
            }
        } else {
            if (clock.methods[i] === "setInterval" && config.shouldAdvanceTime === true) {
                var intervalTick = doIntervalTick.bind(null, clock, config.advanceTimeDelta);
                var intervalId = target[clock.methods[i]](
                    intervalTick,
                    config.advanceTimeDelta);
                clock.attachedInterval = intervalId;
            }
            hijackMethod(target, clock.methods[i], clock);
        }
    }

    return clock;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
var isarray = require('isarray')

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var defaultDelimiter = options && options.delimiter || '/'
  var res

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      continue
    }

    var next = str[index]
    var prefix = res[2]
    var name = res[3]
    var capture = res[4]
    var group = res[5]
    var modifier = res[6]
    var asterisk = res[7]

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
    }

    var partial = prefix != null && next != null && next !== prefix
    var repeat = modifier === '+' || modifier === '*'
    var optional = modifier === '?' || modifier === '*'
    var delimiter = res[2] || defaultDelimiter
    var pattern = capture || group

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
    })
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index)
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path)
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty (str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk (str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
    }
  }

  return function (obj, opts) {
    var path = ''
    var data = obj || {}
    var options = opts || {}
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token

        continue
      }

      var value = data[token.name]
      var segment

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix
          }

          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j])

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value)

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {!RegExp} re
 * @param  {Array}   keys
 * @return {!RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {!Array}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        asterisk: false,
        pattern: null
      })
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array}   keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {!Array}  keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}          tokens
 * @param  {(Array|Object)=} keys
 * @param  {Object=}         options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys || options)
    keys = []
  }

  options = options || {}

  var strict = options.strict
  var end = options.end !== false
  var route = ''

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
    } else {
      var prefix = escapeString(token.prefix)
      var capture = '(?:' + token.pattern + ')'

      keys.push(token)

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*'
      }

      if (token.optional) {
        if (!token.partial) {
          capture = '(?:' + prefix + '(' + capture + '))?'
        } else {
          capture = prefix + '(' + capture + ')?'
        }
      } else {
        capture = prefix + '(' + capture + ')'
      }

      route += capture
    }
  }

  var delimiter = escapeString(options.delimiter || '/')
  var endsWithDelimiter = route.slice(-delimiter.length) === delimiter

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?'
  }

  if (end) {
    route += '$'
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)'
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys)
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {(Array|Object)=}       keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys || options)
    keys = []
  }

  options = options || {}

  if (path instanceof RegExp) {
    return regexpToRegexp(path, /** @type {!Array} */ (keys))
  }

  if (isarray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
  }

  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
}

},{"isarray":14}],18:[function(require,module,exports){
((typeof define === "function" && define.amd && function (m) { define("samsam", m); }) ||
 (typeof module === "object" &&
      function (m) { module.exports = m(); }) || // Node
 function (m) { this.samsam = m(); } // Browser globals
)(function () {
    var o = Object.prototype;
    var div = typeof document !== "undefined" && document.createElement("div");

    function isNaN(value) {
        // Unlike global isNaN, this avoids type coercion
        // typeof check avoids IE host object issues, hat tip to
        // lodash
        var val = value; // JsLint thinks value !== value is "weird"
        return typeof value === "number" && value !== val;
    }

    function getClass(value) {
        // Returns the internal [[Class]] by calling Object.prototype.toString
        // with the provided value as this. Return value is a string, naming the
        // internal class, e.g. "Array"
        return o.toString.call(value).split(/[ \]]/)[1];
    }

    /**
     * @name samsam.isArguments
     * @param Object object
     *
     * Returns ``true`` if ``object`` is an ``arguments`` object,
     * ``false`` otherwise.
     */
    function isArguments(object) {
        if (getClass(object) === 'Arguments') { return true; }
        if (typeof object !== "object" || typeof object.length !== "number" ||
                getClass(object) === "Array") {
            return false;
        }
        if (typeof object.callee == "function") { return true; }
        try {
            object[object.length] = 6;
            delete object[object.length];
        } catch (e) {
            return true;
        }
        return false;
    }

    /**
     * @name samsam.isElement
     * @param Object object
     *
     * Returns ``true`` if ``object`` is a DOM element node. Unlike
     * Underscore.js/lodash, this function will return ``false`` if ``object``
     * is an *element-like* object, i.e. a regular object with a ``nodeType``
     * property that holds the value ``1``.
     */
    function isElement(object) {
        if (!object || object.nodeType !== 1 || !div) { return false; }
        try {
            object.appendChild(div);
            object.removeChild(div);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @name samsam.keys
     * @param Object object
     *
     * Return an array of own property names.
     */
    function keys(object) {
        var ks = [], prop;
        for (prop in object) {
            if (o.hasOwnProperty.call(object, prop)) { ks.push(prop); }
        }
        return ks;
    }

    /**
     * @name samsam.isDate
     * @param Object value
     *
     * Returns true if the object is a ``Date``, or *date-like*. Duck typing
     * of date objects work by checking that the object has a ``getTime``
     * function whose return value equals the return value from the object's
     * ``valueOf``.
     */
    function isDate(value) {
        return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
    }

    /**
     * @name samsam.isNegZero
     * @param Object value
     *
     * Returns ``true`` if ``value`` is ``-0``.
     */
    function isNegZero(value) {
        return value === 0 && 1 / value === -Infinity;
    }

    /**
     * @name samsam.equal
     * @param Object obj1
     * @param Object obj2
     *
     * Returns ``true`` if two objects are strictly equal. Compared to
     * ``===`` there are two exceptions:
     *
     *   - NaN is considered equal to NaN
     *   - -0 and +0 are not considered equal
     */
    function identical(obj1, obj2) {
        if (obj1 === obj2 || (isNaN(obj1) && isNaN(obj2))) {
            return obj1 !== 0 || isNegZero(obj1) === isNegZero(obj2);
        }
    }

    function isSet(val) {
        if (typeof Set !== 'undefined' && val instanceof Set) {
            return true;
        }
    }

    function isSubset(s1, s2, compare) {
        var values1 = Array.from(s1);
        var values2 = Array.from(s2);

        for (var i = 0; i < values1.length; i++) {
            var includes = false;

            for (var j = 0; j < values2.length; j++) {
                if (compare(values2[j], values1[i])) {
                    includes = true;
                    break;
                }
            }

            if (!includes) {
                return false;
            }
        }

        return true;
    }

    /**
     * @name samsam.deepEqual
     * @param Object obj1
     * @param Object obj2
     *
     * Deep equal comparison. Two values are "deep equal" if:
     *
     *   - They are equal, according to samsam.identical
     *   - They are both date objects representing the same time
     *   - They are both arrays containing elements that are all deepEqual
     *   - They are objects with the same set of properties, and each property
     *     in ``obj1`` is deepEqual to the corresponding property in ``obj2``
     *
     * Supports cyclic objects.
     */
    function deepEqualCyclic(obj1, obj2) {

        // used for cyclic comparison
        // contain already visited objects
        var objects1 = [],
            objects2 = [],
        // contain pathes (position in the object structure)
        // of the already visited objects
        // indexes same as in objects arrays
            paths1 = [],
            paths2 = [],
        // contains combinations of already compared objects
        // in the manner: { "$1['ref']$2['ref']": true }
            compared = {};

        /**
         * used to check, if the value of a property is an object
         * (cyclic logic is only needed for objects)
         * only needed for cyclic logic
         */
        function isObject(value) {

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

                return true;
            }

            return false;
        }

        /**
         * returns the index of the given object in the
         * given objects array, -1 if not contained
         * only needed for cyclic logic
         */
        function getIndex(objects, obj) {

            var i;
            for (i = 0; i < objects.length; i++) {
                if (objects[i] === obj) {
                    return i;
                }
            }

            return -1;
        }

        // does the recursion for the deep equal check
        return (function deepEqual(obj1, obj2, path1, path2) {
            var type1 = typeof obj1;
            var type2 = typeof obj2;

            // == null also matches undefined
            if (obj1 === obj2 ||
                    isNaN(obj1) || isNaN(obj2) ||
                    obj1 == null || obj2 == null ||
                    type1 !== "object" || type2 !== "object") {

                return identical(obj1, obj2);
            }

            // Elements are only equal if identical(expected, actual)
            if (isElement(obj1) || isElement(obj2)) { return false; }

            var isDate1 = isDate(obj1), isDate2 = isDate(obj2);
            if (isDate1 || isDate2) {
                if (!isDate1 || !isDate2 || obj1.getTime() !== obj2.getTime()) {
                    return false;
                }
            }

            if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
                if (obj1.toString() !== obj2.toString()) { return false; }
            }

            var class1 = getClass(obj1);
            var class2 = getClass(obj2);
            var keys1 = keys(obj1);
            var keys2 = keys(obj2);

            if (isArguments(obj1) || isArguments(obj2)) {
                if (obj1.length !== obj2.length) { return false; }
            } else {
                if (type1 !== type2 || class1 !== class2 ||
                        keys1.length !== keys2.length) {
                    return false;
                }
            }

            if (isSet(obj1) || isSet(obj2)) {
                if (!isSet(obj1) || !isSet(obj2) || obj1.size !== obj2.size) {
                    return false;
                }

                return isSubset(obj1, obj2, deepEqual);
            }

            var key, i, l,
                // following vars are used for the cyclic logic
                value1, value2,
                isObject1, isObject2,
                index1, index2,
                newPath1, newPath2;

            for (i = 0, l = keys1.length; i < l; i++) {
                key = keys1[i];
                if (!o.hasOwnProperty.call(obj2, key)) {
                    return false;
                }

                // Start of the cyclic logic

                value1 = obj1[key];
                value2 = obj2[key];

                isObject1 = isObject(value1);
                isObject2 = isObject(value2);

                // determine, if the objects were already visited
                // (it's faster to check for isObject first, than to
                // get -1 from getIndex for non objects)
                index1 = isObject1 ? getIndex(objects1, value1) : -1;
                index2 = isObject2 ? getIndex(objects2, value2) : -1;

                // determine the new pathes of the objects
                // - for non cyclic objects the current path will be extended
                //   by current property name
                // - for cyclic objects the stored path is taken
                newPath1 = index1 !== -1
                    ? paths1[index1]
                    : path1 + '[' + JSON.stringify(key) + ']';
                newPath2 = index2 !== -1
                    ? paths2[index2]
                    : path2 + '[' + JSON.stringify(key) + ']';

                // stop recursion if current objects are already compared
                if (compared[newPath1 + newPath2]) {
                    return true;
                }

                // remember the current objects and their pathes
                if (index1 === -1 && isObject1) {
                    objects1.push(value1);
                    paths1.push(newPath1);
                }
                if (index2 === -1 && isObject2) {
                    objects2.push(value2);
                    paths2.push(newPath2);
                }

                // remember that the current objects are already compared
                if (isObject1 && isObject2) {
                    compared[newPath1 + newPath2] = true;
                }

                // End of cyclic logic

                // neither value1 nor value2 is a cycle
                // continue with next level
                if (!deepEqual(value1, value2, newPath1, newPath2)) {
                    return false;
                }
            }

            return true;

        }(obj1, obj2, '$1', '$2'));
    }

    function arrayContains(array, subset, compare) {
        if (subset.length === 0) { return true; }
        var i, l, j, k;
        for (i = 0, l = array.length; i < l; ++i) {
            if (compare(array[i], subset[0])) {
                for (j = 0, k = subset.length; j < k; ++j) {
                    if ((i + j) >= l) { return false; }
                    if (!compare(array[i + j], subset[j])) { return false; }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * @name samsam.match
     * @param Object object
     * @param Object matcher
     *
     * Compare arbitrary value ``object`` with matcher.
     */
    function match(object, matcher) {
        if (matcher && typeof matcher.test === "function") {
            return matcher.test(object);
        }

        if (typeof matcher === "function") {
            return matcher(object) === true;
        }

        if (typeof matcher === "string") {
            matcher = matcher.toLowerCase();
            var notNull = typeof object === "string" || !!object;
            return notNull &&
                (String(object)).toLowerCase().indexOf(matcher) >= 0;
        }

        if (typeof matcher === "number") {
            return matcher === object;
        }

        if (typeof matcher === "boolean") {
            return matcher === object;
        }

        if (typeof(matcher) === "undefined") {
            return typeof(object) === "undefined";
        }

        if (matcher === null) {
            return object === null;
        }

        if (isSet(object)) {
            return isSubset(matcher, object, match);
        }

        if (getClass(object) === "Array" && getClass(matcher) === "Array") {
            return arrayContains(object, matcher, match);
        }

        if (isDate(matcher)) {
            return isDate(object) && object.getTime() === matcher.getTime();
        }

        if (matcher && typeof matcher === "object") {
            if (matcher === object) {
                return true;
            }
            var prop;
            for (prop in matcher) {
                var value = object[prop];
                if (typeof value === "undefined" &&
                        typeof object.getAttribute === "function") {
                    value = object.getAttribute(prop);
                }
                if (matcher[prop] === null || typeof matcher[prop] === 'undefined') {
                    if (value !== matcher[prop]) {
                        return false;
                    }
                } else if (typeof  value === "undefined" || !match(value, matcher[prop])) {
                    return false;
                }
            }
            return true;
        }

        throw new Error("Matcher was not a string, a number, a " +
                        "function, a boolean or an object");
    }

    return {
        isArguments: isArguments,
        isElement: isElement,
        isDate: isDate,
        isNegZero: isNegZero,
        identical: identical,
        deepEqual: deepEqualCyclic,
        match: match,
        keys: keys
    };
});

},{}],19:[function(require,module,exports){
// This is free and unencumbered software released into the public domain.
// See LICENSE.md for more information.

var encoding = require("./lib/encoding.js");

module.exports = {
  TextEncoder: encoding.TextEncoder,
  TextDecoder: encoding.TextDecoder,
};

},{"./lib/encoding.js":21}],20:[function(require,module,exports){
(function(global) {
  'use strict';

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global;
  }

  global["encoding-indexes"] =
{
  "big5":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,17392,19506,17923,17830,17784,160359,19831,17843,162993,19682,163013,15253,18230,18244,19527,19520,148159,144919,160594,159371,159954,19543,172881,18255,17882,19589,162924,19719,19108,18081,158499,29221,154196,137827,146950,147297,26189,22267,null,32149,22813,166841,15860,38708,162799,23515,138590,23204,13861,171696,23249,23479,23804,26478,34195,170309,29793,29853,14453,138579,145054,155681,16108,153822,15093,31484,40855,147809,166157,143850,133770,143966,17162,33924,40854,37935,18736,34323,22678,38730,37400,31184,31282,26208,27177,34973,29772,31685,26498,31276,21071,36934,13542,29636,155065,29894,40903,22451,18735,21580,16689,145038,22552,31346,162661,35727,18094,159368,16769,155033,31662,140476,40904,140481,140489,140492,40905,34052,144827,16564,40906,17633,175615,25281,28782,40907,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,12736,12737,12738,12739,12740,131340,12741,131281,131277,12742,12743,131275,139240,12744,131274,12745,12746,12747,12748,131342,12749,12750,256,193,461,192,274,201,282,200,332,211,465,210,null,7870,null,7872,202,257,225,462,224,593,275,233,283,232,299,237,464,236,333,243,466,242,363,250,468,249,470,472,474,476,252,null,7871,null,7873,234,609,9178,9179,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,172969,135493,null,25866,null,null,20029,28381,40270,37343,null,null,161589,25745,20250,20264,20392,20822,20852,20892,20964,21153,21160,21307,21326,21457,21464,22242,22768,22788,22791,22834,22836,23398,23454,23455,23706,24198,24635,25993,26622,26628,26725,27982,28860,30005,32420,32428,32442,32455,32463,32479,32518,32567,33402,33487,33647,35270,35774,35810,36710,36711,36718,29713,31996,32205,26950,31433,21031,null,null,null,null,37260,30904,37214,32956,null,36107,33014,133607,null,null,32927,40647,19661,40393,40460,19518,171510,159758,40458,172339,13761,null,28314,33342,29977,null,18705,39532,39567,40857,31111,164972,138698,132560,142054,20004,20097,20096,20103,20159,20203,20279,13388,20413,15944,20483,20616,13437,13459,13477,20870,22789,20955,20988,20997,20105,21113,21136,21287,13767,21417,13649,21424,13651,21442,21539,13677,13682,13953,21651,21667,21684,21689,21712,21743,21784,21795,21800,13720,21823,13733,13759,21975,13765,163204,21797,null,134210,134421,151851,21904,142534,14828,131905,36422,150968,169189,16467,164030,30586,142392,14900,18389,164189,158194,151018,25821,134524,135092,134357,135412,25741,36478,134806,134155,135012,142505,164438,148691,null,134470,170573,164073,18420,151207,142530,39602,14951,169460,16365,13574,152263,169940,161992,142660,40302,38933,null,17369,155813,25780,21731,142668,142282,135287,14843,135279,157402,157462,162208,25834,151634,134211,36456,139681,166732,132913,null,18443,131497,16378,22643,142733,null,148936,132348,155799,134988,134550,21881,16571,17338,null,19124,141926,135325,33194,39157,134556,25465,14846,141173,36288,22177,25724,15939,null,173569,134665,142031,142537,null,135368,145858,14738,14854,164507,13688,155209,139463,22098,134961,142514,169760,13500,27709,151099,null,null,161140,142987,139784,173659,167117,134778,134196,157724,32659,135375,141315,141625,13819,152035,134796,135053,134826,16275,134960,134471,135503,134732,null,134827,134057,134472,135360,135485,16377,140950,25650,135085,144372,161337,142286,134526,134527,142417,142421,14872,134808,135367,134958,173618,158544,167122,167321,167114,38314,21708,33476,21945,null,171715,39974,39606,161630,142830,28992,33133,33004,23580,157042,33076,14231,21343,164029,37302,134906,134671,134775,134907,13789,151019,13833,134358,22191,141237,135369,134672,134776,135288,135496,164359,136277,134777,151120,142756,23124,135197,135198,135413,135414,22428,134673,161428,164557,135093,134779,151934,14083,135094,135552,152280,172733,149978,137274,147831,164476,22681,21096,13850,153405,31666,23400,18432,19244,40743,18919,39967,39821,154484,143677,22011,13810,22153,20008,22786,138177,194680,38737,131206,20059,20155,13630,23587,24401,24516,14586,25164,25909,27514,27701,27706,28780,29227,20012,29357,149737,32594,31035,31993,32595,156266,13505,null,156491,32770,32896,157202,158033,21341,34916,35265,161970,35744,36125,38021,38264,38271,38376,167439,38886,39029,39118,39134,39267,170000,40060,40479,40644,27503,63751,20023,131207,38429,25143,38050,null,20539,28158,171123,40870,15817,34959,147790,28791,23797,19232,152013,13657,154928,24866,166450,36775,37366,29073,26393,29626,144001,172295,15499,137600,19216,30948,29698,20910,165647,16393,27235,172730,16931,34319,133743,31274,170311,166634,38741,28749,21284,139390,37876,30425,166371,40871,30685,20131,20464,20668,20015,20247,40872,21556,32139,22674,22736,138678,24210,24217,24514,141074,25995,144377,26905,27203,146531,27903,null,29184,148741,29580,16091,150035,23317,29881,35715,154788,153237,31379,31724,31939,32364,33528,34199,40873,34960,40874,36537,40875,36815,34143,39392,37409,40876,167353,136255,16497,17058,23066,null,null,null,39016,26475,17014,22333,null,34262,149883,33471,160013,19585,159092,23931,158485,159678,40877,40878,23446,40879,26343,32347,28247,31178,15752,17603,143958,141206,17306,17718,null,23765,146202,35577,23672,15634,144721,23928,40882,29015,17752,147692,138787,19575,14712,13386,131492,158785,35532,20404,131641,22975,33132,38998,170234,24379,134047,null,139713,166253,16642,18107,168057,16135,40883,172469,16632,14294,18167,158790,16764,165554,160767,17773,14548,152730,17761,17691,19849,19579,19830,17898,16328,150287,13921,17630,17597,16877,23870,23880,23894,15868,14351,23972,23993,14368,14392,24130,24253,24357,24451,14600,14612,14655,14669,24791,24893,23781,14729,25015,25017,25039,14776,25132,25232,25317,25368,14840,22193,14851,25570,25595,25607,25690,14923,25792,23829,22049,40863,14999,25990,15037,26111,26195,15090,26258,15138,26390,15170,26532,26624,15192,26698,26756,15218,15217,15227,26889,26947,29276,26980,27039,27013,15292,27094,15325,27237,27252,27249,27266,15340,27289,15346,27307,27317,27348,27382,27521,27585,27626,27765,27818,15563,27906,27910,27942,28033,15599,28068,28081,28181,28184,28201,28294,166336,28347,28386,28378,40831,28392,28393,28452,28468,15686,147265,28545,28606,15722,15733,29111,23705,15754,28716,15761,28752,28756,28783,28799,28809,131877,17345,13809,134872,147159,22462,159443,28990,153568,13902,27042,166889,23412,31305,153825,169177,31333,31357,154028,31419,31408,31426,31427,29137,156813,16842,31450,31453,31466,16879,21682,154625,31499,31573,31529,152334,154878,31650,31599,33692,154548,158847,31696,33825,31634,31672,154912,15789,154725,33938,31738,31750,31797,154817,31812,31875,149634,31910,26237,148856,31945,31943,31974,31860,31987,31989,31950,32359,17693,159300,32093,159446,29837,32137,32171,28981,32179,32210,147543,155689,32228,15635,32245,137209,32229,164717,32285,155937,155994,32366,32402,17195,37996,32295,32576,32577,32583,31030,156368,39393,32663,156497,32675,136801,131176,17756,145254,17667,164666,32762,156809,32773,32776,32797,32808,32815,172167,158915,32827,32828,32865,141076,18825,157222,146915,157416,26405,32935,166472,33031,33050,22704,141046,27775,156824,151480,25831,136330,33304,137310,27219,150117,150165,17530,33321,133901,158290,146814,20473,136445,34018,33634,158474,149927,144688,137075,146936,33450,26907,194964,16859,34123,33488,33562,134678,137140,14017,143741,144730,33403,33506,33560,147083,159139,158469,158615,144846,15807,33565,21996,33669,17675,159141,33708,33729,33747,13438,159444,27223,34138,13462,159298,143087,33880,154596,33905,15827,17636,27303,33866,146613,31064,33960,158614,159351,159299,34014,33807,33681,17568,33939,34020,154769,16960,154816,17731,34100,23282,159385,17703,34163,17686,26559,34326,165413,165435,34241,159880,34306,136578,159949,194994,17770,34344,13896,137378,21495,160666,34430,34673,172280,34798,142375,34737,34778,34831,22113,34412,26710,17935,34885,34886,161248,146873,161252,34910,34972,18011,34996,34997,25537,35013,30583,161551,35207,35210,35238,35241,35239,35260,166437,35303,162084,162493,35484,30611,37374,35472,162393,31465,162618,147343,18195,162616,29052,35596,35615,152624,152933,35647,35660,35661,35497,150138,35728,35739,35503,136927,17941,34895,35995,163156,163215,195028,14117,163155,36054,163224,163261,36114,36099,137488,36059,28764,36113,150729,16080,36215,36265,163842,135188,149898,15228,164284,160012,31463,36525,36534,36547,37588,36633,36653,164709,164882,36773,37635,172703,133712,36787,18730,166366,165181,146875,24312,143970,36857,172052,165564,165121,140069,14720,159447,36919,165180,162494,36961,165228,165387,37032,165651,37060,165606,37038,37117,37223,15088,37289,37316,31916,166195,138889,37390,27807,37441,37474,153017,37561,166598,146587,166668,153051,134449,37676,37739,166625,166891,28815,23235,166626,166629,18789,37444,166892,166969,166911,37747,37979,36540,38277,38310,37926,38304,28662,17081,140922,165592,135804,146990,18911,27676,38523,38550,16748,38563,159445,25050,38582,30965,166624,38589,21452,18849,158904,131700,156688,168111,168165,150225,137493,144138,38705,34370,38710,18959,17725,17797,150249,28789,23361,38683,38748,168405,38743,23370,168427,38751,37925,20688,143543,143548,38793,38815,38833,38846,38848,38866,38880,152684,38894,29724,169011,38911,38901,168989,162170,19153,38964,38963,38987,39014,15118,160117,15697,132656,147804,153350,39114,39095,39112,39111,19199,159015,136915,21936,39137,39142,39148,37752,39225,150057,19314,170071,170245,39413,39436,39483,39440,39512,153381,14020,168113,170965,39648,39650,170757,39668,19470,39700,39725,165376,20532,39732,158120,14531,143485,39760,39744,171326,23109,137315,39822,148043,39938,39935,39948,171624,40404,171959,172434,172459,172257,172323,172511,40318,40323,172340,40462,26760,40388,139611,172435,172576,137531,172595,40249,172217,172724,40592,40597,40606,40610,19764,40618,40623,148324,40641,15200,14821,15645,20274,14270,166955,40706,40712,19350,37924,159138,40727,40726,40761,22175,22154,40773,39352,168075,38898,33919,40802,40809,31452,40846,29206,19390,149877,149947,29047,150008,148296,150097,29598,166874,137466,31135,166270,167478,37737,37875,166468,37612,37761,37835,166252,148665,29207,16107,30578,31299,28880,148595,148472,29054,137199,28835,137406,144793,16071,137349,152623,137208,14114,136955,137273,14049,137076,137425,155467,14115,136896,22363,150053,136190,135848,136134,136374,34051,145062,34051,33877,149908,160101,146993,152924,147195,159826,17652,145134,170397,159526,26617,14131,15381,15847,22636,137506,26640,16471,145215,147681,147595,147727,158753,21707,22174,157361,22162,135135,134056,134669,37830,166675,37788,20216,20779,14361,148534,20156,132197,131967,20299,20362,153169,23144,131499,132043,14745,131850,132116,13365,20265,131776,167603,131701,35546,131596,20120,20685,20749,20386,20227,150030,147082,20290,20526,20588,20609,20428,20453,20568,20732,20825,20827,20829,20830,28278,144789,147001,147135,28018,137348,147081,20904,20931,132576,17629,132259,132242,132241,36218,166556,132878,21081,21156,133235,21217,37742,18042,29068,148364,134176,149932,135396,27089,134685,29817,16094,29849,29716,29782,29592,19342,150204,147597,21456,13700,29199,147657,21940,131909,21709,134086,22301,37469,38644,37734,22493,22413,22399,13886,22731,23193,166470,136954,137071,136976,23084,22968,37519,23166,23247,23058,153926,137715,137313,148117,14069,27909,29763,23073,155267,23169,166871,132115,37856,29836,135939,28933,18802,37896,166395,37821,14240,23582,23710,24158,24136,137622,137596,146158,24269,23375,137475,137476,14081,137376,14045,136958,14035,33066,166471,138682,144498,166312,24332,24334,137511,137131,23147,137019,23364,34324,161277,34912,24702,141408,140843,24539,16056,140719,140734,168072,159603,25024,131134,131142,140827,24985,24984,24693,142491,142599,149204,168269,25713,149093,142186,14889,142114,144464,170218,142968,25399,173147,25782,25393,25553,149987,142695,25252,142497,25659,25963,26994,15348,143502,144045,149897,144043,21773,144096,137433,169023,26318,144009,143795,15072,16784,152964,166690,152975,136956,152923,152613,30958,143619,137258,143924,13412,143887,143746,148169,26254,159012,26219,19347,26160,161904,138731,26211,144082,144097,26142,153714,14545,145466,145340,15257,145314,144382,29904,15254,26511,149034,26806,26654,15300,27326,14435,145365,148615,27187,27218,27337,27397,137490,25873,26776,27212,15319,27258,27479,147392,146586,37792,37618,166890,166603,37513,163870,166364,37991,28069,28427,149996,28007,147327,15759,28164,147516,23101,28170,22599,27940,30786,28987,148250,148086,28913,29264,29319,29332,149391,149285,20857,150180,132587,29818,147192,144991,150090,149783,155617,16134,16049,150239,166947,147253,24743,16115,29900,29756,37767,29751,17567,159210,17745,30083,16227,150745,150790,16216,30037,30323,173510,15129,29800,166604,149931,149902,15099,15821,150094,16127,149957,149747,37370,22322,37698,166627,137316,20703,152097,152039,30584,143922,30478,30479,30587,149143,145281,14942,149744,29752,29851,16063,150202,150215,16584,150166,156078,37639,152961,30750,30861,30856,30930,29648,31065,161601,153315,16654,31131,33942,31141,27181,147194,31290,31220,16750,136934,16690,37429,31217,134476,149900,131737,146874,137070,13719,21867,13680,13994,131540,134157,31458,23129,141045,154287,154268,23053,131675,30960,23082,154566,31486,16889,31837,31853,16913,154547,155324,155302,31949,150009,137136,31886,31868,31918,27314,32220,32263,32211,32590,156257,155996,162632,32151,155266,17002,158581,133398,26582,131150,144847,22468,156690,156664,149858,32733,31527,133164,154345,154947,31500,155150,39398,34373,39523,27164,144447,14818,150007,157101,39455,157088,33920,160039,158929,17642,33079,17410,32966,33033,33090,157620,39107,158274,33378,33381,158289,33875,159143,34320,160283,23174,16767,137280,23339,137377,23268,137432,34464,195004,146831,34861,160802,23042,34926,20293,34951,35007,35046,35173,35149,153219,35156,161669,161668,166901,166873,166812,166393,16045,33955,18165,18127,14322,35389,35356,169032,24397,37419,148100,26068,28969,28868,137285,40301,35999,36073,163292,22938,30659,23024,17262,14036,36394,36519,150537,36656,36682,17140,27736,28603,140065,18587,28537,28299,137178,39913,14005,149807,37051,37015,21873,18694,37307,37892,166475,16482,166652,37927,166941,166971,34021,35371,38297,38311,38295,38294,167220,29765,16066,149759,150082,148458,16103,143909,38543,167655,167526,167525,16076,149997,150136,147438,29714,29803,16124,38721,168112,26695,18973,168083,153567,38749,37736,166281,166950,166703,156606,37562,23313,35689,18748,29689,147995,38811,38769,39224,134950,24001,166853,150194,38943,169178,37622,169431,37349,17600,166736,150119,166756,39132,166469,16128,37418,18725,33812,39227,39245,162566,15869,39323,19311,39338,39516,166757,153800,27279,39457,23294,39471,170225,19344,170312,39356,19389,19351,37757,22642,135938,22562,149944,136424,30788,141087,146872,26821,15741,37976,14631,24912,141185,141675,24839,40015,40019,40059,39989,39952,39807,39887,171565,39839,172533,172286,40225,19630,147716,40472,19632,40204,172468,172269,172275,170287,40357,33981,159250,159711,158594,34300,17715,159140,159364,159216,33824,34286,159232,145367,155748,31202,144796,144960,18733,149982,15714,37851,37566,37704,131775,30905,37495,37965,20452,13376,36964,152925,30781,30804,30902,30795,137047,143817,149825,13978,20338,28634,28633,28702,28702,21524,147893,22459,22771,22410,40214,22487,28980,13487,147884,29163,158784,151447,23336,137141,166473,24844,23246,23051,17084,148616,14124,19323,166396,37819,37816,137430,134941,33906,158912,136211,148218,142374,148417,22932,146871,157505,32168,155995,155812,149945,149899,166394,37605,29666,16105,29876,166755,137375,16097,150195,27352,29683,29691,16086,150078,150164,137177,150118,132007,136228,149989,29768,149782,28837,149878,37508,29670,37727,132350,37681,166606,166422,37766,166887,153045,18741,166530,29035,149827,134399,22180,132634,134123,134328,21762,31172,137210,32254,136898,150096,137298,17710,37889,14090,166592,149933,22960,137407,137347,160900,23201,14050,146779,14000,37471,23161,166529,137314,37748,15565,133812,19094,14730,20724,15721,15692,136092,29045,17147,164376,28175,168164,17643,27991,163407,28775,27823,15574,147437,146989,28162,28428,15727,132085,30033,14012,13512,18048,16090,18545,22980,37486,18750,36673,166940,158656,22546,22472,14038,136274,28926,148322,150129,143331,135856,140221,26809,26983,136088,144613,162804,145119,166531,145366,144378,150687,27162,145069,158903,33854,17631,17614,159014,159057,158850,159710,28439,160009,33597,137018,33773,158848,159827,137179,22921,23170,137139,23137,23153,137477,147964,14125,23023,137020,14023,29070,37776,26266,148133,23150,23083,148115,27179,147193,161590,148571,148170,28957,148057,166369,20400,159016,23746,148686,163405,148413,27148,148054,135940,28838,28979,148457,15781,27871,194597,150095,32357,23019,23855,15859,24412,150109,137183,32164,33830,21637,146170,144128,131604,22398,133333,132633,16357,139166,172726,28675,168283,23920,29583,31955,166489,168992,20424,32743,29389,29456,162548,29496,29497,153334,29505,29512,16041,162584,36972,29173,149746,29665,33270,16074,30476,16081,27810,22269,29721,29726,29727,16098,16112,16116,16122,29907,16142,16211,30018,30061,30066,30093,16252,30152,30172,16320,30285,16343,30324,16348,30330,151388,29064,22051,35200,22633,16413,30531,16441,26465,16453,13787,30616,16490,16495,23646,30654,30667,22770,30744,28857,30748,16552,30777,30791,30801,30822,33864,152885,31027,26627,31026,16643,16649,31121,31129,36795,31238,36796,16743,31377,16818,31420,33401,16836,31439,31451,16847,20001,31586,31596,31611,31762,31771,16992,17018,31867,31900,17036,31928,17044,31981,36755,28864,134351,32207,32212,32208,32253,32686,32692,29343,17303,32800,32805,31545,32814,32817,32852,15820,22452,28832,32951,33001,17389,33036,29482,33038,33042,30048,33044,17409,15161,33110,33113,33114,17427,22586,33148,33156,17445,33171,17453,33189,22511,33217,33252,33364,17551,33446,33398,33482,33496,33535,17584,33623,38505,27018,33797,28917,33892,24803,33928,17668,33982,34017,34040,34064,34104,34130,17723,34159,34160,34272,17783,34418,34450,34482,34543,38469,34699,17926,17943,34990,35071,35108,35143,35217,162151,35369,35384,35476,35508,35921,36052,36082,36124,18328,22623,36291,18413,20206,36410,21976,22356,36465,22005,36528,18487,36558,36578,36580,36589,36594,36791,36801,36810,36812,36915,39364,18605,39136,37395,18718,37416,37464,37483,37553,37550,37567,37603,37611,37619,37620,37629,37699,37764,37805,18757,18769,40639,37911,21249,37917,37933,37950,18794,37972,38009,38189,38306,18855,38388,38451,18917,26528,18980,38720,18997,38834,38850,22100,19172,24808,39097,19225,39153,22596,39182,39193,20916,39196,39223,39234,39261,39266,19312,39365,19357,39484,39695,31363,39785,39809,39901,39921,39924,19565,39968,14191,138178,40265,39994,40702,22096,40339,40381,40384,40444,38134,36790,40571,40620,40625,40637,40646,38108,40674,40689,40696,31432,40772,131220,131767,132000,26906,38083,22956,132311,22592,38081,14265,132565,132629,132726,136890,22359,29043,133826,133837,134079,21610,194619,134091,21662,134139,134203,134227,134245,134268,24807,134285,22138,134325,134365,134381,134511,134578,134600,26965,39983,34725,134660,134670,134871,135056,134957,134771,23584,135100,24075,135260,135247,135286,26398,135291,135304,135318,13895,135359,135379,135471,135483,21348,33965,135907,136053,135990,35713,136567,136729,137155,137159,20088,28859,137261,137578,137773,137797,138282,138352,138412,138952,25283,138965,139029,29080,26709,139333,27113,14024,139900,140247,140282,141098,141425,141647,33533,141671,141715,142037,35237,142056,36768,142094,38840,142143,38983,39613,142412,null,142472,142519,154600,142600,142610,142775,142741,142914,143220,143308,143411,143462,144159,144350,24497,26184,26303,162425,144743,144883,29185,149946,30679,144922,145174,32391,131910,22709,26382,26904,146087,161367,155618,146961,147129,161278,139418,18640,19128,147737,166554,148206,148237,147515,148276,148374,150085,132554,20946,132625,22943,138920,15294,146687,148484,148694,22408,149108,14747,149295,165352,170441,14178,139715,35678,166734,39382,149522,149755,150037,29193,150208,134264,22885,151205,151430,132985,36570,151596,21135,22335,29041,152217,152601,147274,150183,21948,152646,152686,158546,37332,13427,152895,161330,152926,18200,152930,152934,153543,149823,153693,20582,13563,144332,24798,153859,18300,166216,154286,154505,154630,138640,22433,29009,28598,155906,162834,36950,156082,151450,35682,156674,156746,23899,158711,36662,156804,137500,35562,150006,156808,147439,156946,19392,157119,157365,141083,37989,153569,24981,23079,194765,20411,22201,148769,157436,20074,149812,38486,28047,158909,13848,35191,157593,157806,156689,157790,29151,157895,31554,168128,133649,157990,37124,158009,31301,40432,158202,39462,158253,13919,156777,131105,31107,158260,158555,23852,144665,33743,158621,18128,158884,30011,34917,159150,22710,14108,140685,159819,160205,15444,160384,160389,37505,139642,160395,37680,160486,149968,27705,38047,160848,134904,34855,35061,141606,164979,137137,28344,150058,137248,14756,14009,23568,31203,17727,26294,171181,170148,35139,161740,161880,22230,16607,136714,14753,145199,164072,136133,29101,33638,162269,168360,23143,19639,159919,166315,162301,162314,162571,163174,147834,31555,31102,163849,28597,172767,27139,164632,21410,159239,37823,26678,38749,164207,163875,158133,136173,143919,163912,23941,166960,163971,22293,38947,166217,23979,149896,26046,27093,21458,150181,147329,15377,26422,163984,164084,164142,139169,164175,164233,164271,164378,164614,164655,164746,13770,164968,165546,18682,25574,166230,30728,37461,166328,17394,166375,17375,166376,166726,166868,23032,166921,36619,167877,168172,31569,168208,168252,15863,168286,150218,36816,29327,22155,169191,169449,169392,169400,169778,170193,170313,170346,170435,170536,170766,171354,171419,32415,171768,171811,19620,38215,172691,29090,172799,19857,36882,173515,19868,134300,36798,21953,36794,140464,36793,150163,17673,32383,28502,27313,20202,13540,166700,161949,14138,36480,137205,163876,166764,166809,162366,157359,15851,161365,146615,153141,153942,20122,155265,156248,22207,134765,36366,23405,147080,150686,25566,25296,137206,137339,25904,22061,154698,21530,152337,15814,171416,19581,22050,22046,32585,155352,22901,146752,34672,19996,135146,134473,145082,33047,40286,36120,30267,40005,30286,30649,37701,21554,33096,33527,22053,33074,33816,32957,21994,31074,22083,21526,134813,13774,22021,22001,26353,164578,13869,30004,22000,21946,21655,21874,134209,134294,24272,151880,134774,142434,134818,40619,32090,21982,135285,25245,38765,21652,36045,29174,37238,25596,25529,25598,21865,142147,40050,143027,20890,13535,134567,20903,21581,21790,21779,30310,36397,157834,30129,32950,34820,34694,35015,33206,33820,135361,17644,29444,149254,23440,33547,157843,22139,141044,163119,147875,163187,159440,160438,37232,135641,37384,146684,173737,134828,134905,29286,138402,18254,151490,163833,135147,16634,40029,25887,142752,18675,149472,171388,135148,134666,24674,161187,135149,null,155720,135559,29091,32398,40272,19994,19972,13687,23309,27826,21351,13996,14812,21373,13989,149016,22682,150382,33325,21579,22442,154261,133497,null,14930,140389,29556,171692,19721,39917,146686,171824,19547,151465,169374,171998,33884,146870,160434,157619,145184,25390,32037,147191,146988,14890,36872,21196,15988,13946,17897,132238,30272,23280,134838,30842,163630,22695,16575,22140,39819,23924,30292,173108,40581,19681,30201,14331,24857,143578,148466,null,22109,135849,22439,149859,171526,21044,159918,13741,27722,40316,31830,39737,22494,137068,23635,25811,169168,156469,160100,34477,134440,159010,150242,134513,null,20990,139023,23950,38659,138705,40577,36940,31519,39682,23761,31651,25192,25397,39679,31695,39722,31870,39726,31810,31878,39957,31740,39689,40727,39963,149822,40794,21875,23491,20477,40600,20466,21088,15878,21201,22375,20566,22967,24082,38856,40363,36700,21609,38836,39232,38842,21292,24880,26924,21466,39946,40194,19515,38465,27008,20646,30022,137069,39386,21107,null,37209,38529,37212,null,37201,167575,25471,159011,27338,22033,37262,30074,25221,132092,29519,31856,154657,146685,null,149785,30422,39837,20010,134356,33726,34882,null,23626,27072,20717,22394,21023,24053,20174,27697,131570,20281,21660,21722,21146,36226,13822,24332,13811,null,27474,37244,40869,39831,38958,39092,39610,40616,40580,29050,31508,null,27642,34840,32632,null,22048,173642,36471,40787,null,36308,36431,40476,36353,25218,164733,36392,36469,31443,150135,31294,30936,27882,35431,30215,166490,40742,27854,34774,30147,172722,30803,194624,36108,29410,29553,35629,29442,29937,36075,150203,34351,24506,34976,17591,null,137275,159237,null,35454,140571,null,24829,30311,39639,40260,37742,39823,34805,null,34831,36087,29484,38689,39856,13782,29362,19463,31825,39242,155993,24921,19460,40598,24957,null,22367,24943,25254,25145,25294,14940,25058,21418,144373,25444,26626,13778,23895,166850,36826,167481,null,20697,138566,30982,21298,38456,134971,16485,null,30718,null,31938,155418,31962,31277,32870,32867,32077,29957,29938,35220,33306,26380,32866,160902,32859,29936,33027,30500,35209,157644,30035,159441,34729,34766,33224,34700,35401,36013,35651,30507,29944,34010,13877,27058,36262,null,35241,29800,28089,34753,147473,29927,15835,29046,24740,24988,15569,29026,24695,null,32625,166701,29264,24809,19326,21024,15384,146631,155351,161366,152881,137540,135934,170243,159196,159917,23745,156077,166415,145015,131310,157766,151310,17762,23327,156492,40784,40614,156267,12288,65292,12289,12290,65294,8231,65307,65306,65311,65281,65072,8230,8229,65104,65105,65106,183,65108,65109,65110,65111,65372,8211,65073,8212,65075,9588,65076,65103,65288,65289,65077,65078,65371,65373,65079,65080,12308,12309,65081,65082,12304,12305,65083,65084,12298,12299,65085,65086,12296,12297,65087,65088,12300,12301,65089,65090,12302,12303,65091,65092,65113,65114,65115,65116,65117,65118,8216,8217,8220,8221,12317,12318,8245,8242,65283,65286,65290,8251,167,12291,9675,9679,9651,9650,9678,9734,9733,9671,9670,9633,9632,9661,9660,12963,8453,175,65507,65343,717,65097,65098,65101,65102,65099,65100,65119,65120,65121,65291,65293,215,247,177,8730,65308,65310,65309,8806,8807,8800,8734,8786,8801,65122,65123,65124,65125,65126,65374,8745,8746,8869,8736,8735,8895,13266,13265,8747,8750,8757,8756,9792,9794,8853,8857,8593,8595,8592,8594,8598,8599,8601,8600,8741,8739,65295,65340,8725,65128,65284,65509,12306,65504,65505,65285,65312,8451,8457,65129,65130,65131,13269,13212,13213,13214,13262,13217,13198,13199,13252,176,20825,20827,20830,20829,20833,20835,21991,29929,31950,9601,9602,9603,9604,9605,9606,9607,9608,9615,9614,9613,9612,9611,9610,9609,9532,9524,9516,9508,9500,9620,9472,9474,9621,9484,9488,9492,9496,9581,9582,9584,9583,9552,9566,9578,9569,9698,9699,9701,9700,9585,9586,9587,65296,65297,65298,65299,65300,65301,65302,65303,65304,65305,8544,8545,8546,8547,8548,8549,8550,8551,8552,8553,12321,12322,12323,12324,12325,12326,12327,12328,12329,21313,21316,21317,65313,65314,65315,65316,65317,65318,65319,65320,65321,65322,65323,65324,65325,65326,65327,65328,65329,65330,65331,65332,65333,65334,65335,65336,65337,65338,65345,65346,65347,65348,65349,65350,65351,65352,65353,65354,65355,65356,65357,65358,65359,65360,65361,65362,65363,65364,65365,65366,65367,65368,65369,65370,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,931,932,933,934,935,936,937,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,963,964,965,966,967,968,969,12549,12550,12551,12552,12553,12554,12555,12556,12557,12558,12559,12560,12561,12562,12563,12564,12565,12566,12567,12568,12569,12570,12571,12572,12573,12574,12575,12576,12577,12578,12579,12580,12581,12582,12583,12584,12585,729,713,714,711,715,9216,9217,9218,9219,9220,9221,9222,9223,9224,9225,9226,9227,9228,9229,9230,9231,9232,9233,9234,9235,9236,9237,9238,9239,9240,9241,9242,9243,9244,9245,9246,9247,9249,8364,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,19968,20057,19969,19971,20035,20061,20102,20108,20154,20799,20837,20843,20960,20992,20993,21147,21269,21313,21340,21448,19977,19979,19976,19978,20011,20024,20961,20037,20040,20063,20062,20110,20129,20800,20995,21242,21315,21449,21475,22303,22763,22805,22823,22899,23376,23377,23379,23544,23567,23586,23608,23665,24029,24037,24049,24050,24051,24062,24178,24318,24331,24339,25165,19985,19984,19981,20013,20016,20025,20043,23609,20104,20113,20117,20114,20116,20130,20161,20160,20163,20166,20167,20173,20170,20171,20164,20803,20801,20839,20845,20846,20844,20887,20982,20998,20999,21000,21243,21246,21247,21270,21305,21320,21319,21317,21342,21380,21451,21450,21453,22764,22825,22827,22826,22829,23380,23569,23588,23610,23663,24052,24187,24319,24340,24341,24515,25096,25142,25163,25166,25903,25991,26007,26020,26041,26085,26352,26376,26408,27424,27490,27513,27595,27604,27611,27663,27700,28779,29226,29238,29243,29255,29273,29275,29356,29579,19993,19990,19989,19988,19992,20027,20045,20047,20046,20197,20184,20180,20181,20182,20183,20195,20196,20185,20190,20805,20804,20873,20874,20908,20985,20986,20984,21002,21152,21151,21253,21254,21271,21277,20191,21322,21321,21345,21344,21359,21358,21435,21487,21476,21491,21484,21486,21481,21480,21500,21496,21493,21483,21478,21482,21490,21489,21488,21477,21485,21499,22235,22234,22806,22830,22833,22900,22902,23381,23427,23612,24040,24039,24038,24066,24067,24179,24188,24321,24344,24343,24517,25098,25171,25172,25170,25169,26021,26086,26414,26412,26410,26411,26413,27491,27597,27665,27664,27704,27713,27712,27710,29359,29572,29577,29916,29926,29976,29983,29992,29993,30000,30001,30002,30003,30091,30333,30382,30399,30446,30683,30690,30707,31034,31166,31348,31435,19998,19999,20050,20051,20073,20121,20132,20134,20133,20223,20233,20249,20234,20245,20237,20240,20241,20239,20210,20214,20219,20208,20211,20221,20225,20235,20809,20807,20806,20808,20840,20849,20877,20912,21015,21009,21010,21006,21014,21155,21256,21281,21280,21360,21361,21513,21519,21516,21514,21520,21505,21515,21508,21521,21517,21512,21507,21518,21510,21522,22240,22238,22237,22323,22320,22312,22317,22316,22319,22313,22809,22810,22839,22840,22916,22904,22915,22909,22905,22914,22913,23383,23384,23431,23432,23429,23433,23546,23574,23673,24030,24070,24182,24180,24335,24347,24537,24534,25102,25100,25101,25104,25187,25179,25176,25910,26089,26088,26092,26093,26354,26355,26377,26429,26420,26417,26421,27425,27492,27515,27670,27741,27735,27737,27743,27744,27728,27733,27745,27739,27725,27726,28784,29279,29277,30334,31481,31859,31992,32566,32650,32701,32769,32771,32780,32786,32819,32895,32905,32907,32908,33251,33258,33267,33276,33292,33307,33311,33390,33394,33406,34411,34880,34892,34915,35199,38433,20018,20136,20301,20303,20295,20311,20318,20276,20315,20309,20272,20304,20305,20285,20282,20280,20291,20308,20284,20294,20323,20316,20320,20271,20302,20278,20313,20317,20296,20314,20812,20811,20813,20853,20918,20919,21029,21028,21033,21034,21032,21163,21161,21162,21164,21283,21363,21365,21533,21549,21534,21566,21542,21582,21543,21574,21571,21555,21576,21570,21531,21545,21578,21561,21563,21560,21550,21557,21558,21536,21564,21568,21553,21547,21535,21548,22250,22256,22244,22251,22346,22353,22336,22349,22343,22350,22334,22352,22351,22331,22767,22846,22941,22930,22952,22942,22947,22937,22934,22925,22948,22931,22922,22949,23389,23388,23386,23387,23436,23435,23439,23596,23616,23617,23615,23614,23696,23697,23700,23692,24043,24076,24207,24199,24202,24311,24324,24351,24420,24418,24439,24441,24536,24524,24535,24525,24561,24555,24568,24554,25106,25105,25220,25239,25238,25216,25206,25225,25197,25226,25212,25214,25209,25203,25234,25199,25240,25198,25237,25235,25233,25222,25913,25915,25912,26097,26356,26463,26446,26447,26448,26449,26460,26454,26462,26441,26438,26464,26451,26455,27493,27599,27714,27742,27801,27777,27784,27785,27781,27803,27754,27770,27792,27760,27788,27752,27798,27794,27773,27779,27762,27774,27764,27782,27766,27789,27796,27800,27778,28790,28796,28797,28792,29282,29281,29280,29380,29378,29590,29996,29995,30007,30008,30338,30447,30691,31169,31168,31167,31350,31995,32597,32918,32915,32925,32920,32923,32922,32946,33391,33426,33419,33421,35211,35282,35328,35895,35910,35925,35997,36196,36208,36275,36523,36554,36763,36784,36802,36806,36805,36804,24033,37009,37026,37034,37030,37027,37193,37318,37324,38450,38446,38449,38442,38444,20006,20054,20083,20107,20123,20126,20139,20140,20335,20381,20365,20339,20351,20332,20379,20363,20358,20355,20336,20341,20360,20329,20347,20374,20350,20367,20369,20346,20820,20818,20821,20841,20855,20854,20856,20925,20989,21051,21048,21047,21050,21040,21038,21046,21057,21182,21179,21330,21332,21331,21329,21350,21367,21368,21369,21462,21460,21463,21619,21621,21654,21624,21653,21632,21627,21623,21636,21650,21638,21628,21648,21617,21622,21644,21658,21602,21608,21643,21629,21646,22266,22403,22391,22378,22377,22369,22374,22372,22396,22812,22857,22855,22856,22852,22868,22974,22971,22996,22969,22958,22993,22982,22992,22989,22987,22995,22986,22959,22963,22994,22981,23391,23396,23395,23447,23450,23448,23452,23449,23451,23578,23624,23621,23622,23735,23713,23736,23721,23723,23729,23731,24088,24090,24086,24085,24091,24081,24184,24218,24215,24220,24213,24214,24310,24358,24359,24361,24448,24449,24447,24444,24541,24544,24573,24565,24575,24591,24596,24623,24629,24598,24618,24597,24609,24615,24617,24619,24603,25110,25109,25151,25150,25152,25215,25289,25292,25284,25279,25282,25273,25298,25307,25259,25299,25300,25291,25288,25256,25277,25276,25296,25305,25287,25293,25269,25306,25265,25304,25302,25303,25286,25260,25294,25918,26023,26044,26106,26132,26131,26124,26118,26114,26126,26112,26127,26133,26122,26119,26381,26379,26477,26507,26517,26481,26524,26483,26487,26503,26525,26519,26479,26480,26495,26505,26494,26512,26485,26522,26515,26492,26474,26482,27427,27494,27495,27519,27667,27675,27875,27880,27891,27825,27852,27877,27827,27837,27838,27836,27874,27819,27861,27859,27832,27844,27833,27841,27822,27863,27845,27889,27839,27835,27873,27867,27850,27820,27887,27868,27862,27872,28821,28814,28818,28810,28825,29228,29229,29240,29256,29287,29289,29376,29390,29401,29399,29392,29609,29608,29599,29611,29605,30013,30109,30105,30106,30340,30402,30450,30452,30693,30717,31038,31040,31041,31177,31176,31354,31353,31482,31998,32596,32652,32651,32773,32954,32933,32930,32945,32929,32939,32937,32948,32938,32943,33253,33278,33293,33459,33437,33433,33453,33469,33439,33465,33457,33452,33445,33455,33464,33443,33456,33470,33463,34382,34417,21021,34920,36555,36814,36820,36817,37045,37048,37041,37046,37319,37329,38263,38272,38428,38464,38463,38459,38468,38466,38585,38632,38738,38750,20127,20141,20142,20449,20405,20399,20415,20448,20433,20431,20445,20419,20406,20440,20447,20426,20439,20398,20432,20420,20418,20442,20430,20446,20407,20823,20882,20881,20896,21070,21059,21066,21069,21068,21067,21063,21191,21193,21187,21185,21261,21335,21371,21402,21467,21676,21696,21672,21710,21705,21688,21670,21683,21703,21698,21693,21674,21697,21700,21704,21679,21675,21681,21691,21673,21671,21695,22271,22402,22411,22432,22435,22434,22478,22446,22419,22869,22865,22863,22862,22864,23004,23000,23039,23011,23016,23043,23013,23018,23002,23014,23041,23035,23401,23459,23462,23460,23458,23461,23553,23630,23631,23629,23627,23769,23762,24055,24093,24101,24095,24189,24224,24230,24314,24328,24365,24421,24456,24453,24458,24459,24455,24460,24457,24594,24605,24608,24613,24590,24616,24653,24688,24680,24674,24646,24643,24684,24683,24682,24676,25153,25308,25366,25353,25340,25325,25345,25326,25341,25351,25329,25335,25327,25324,25342,25332,25361,25346,25919,25925,26027,26045,26082,26149,26157,26144,26151,26159,26143,26152,26161,26148,26359,26623,26579,26609,26580,26576,26604,26550,26543,26613,26601,26607,26564,26577,26548,26586,26597,26552,26575,26590,26611,26544,26585,26594,26589,26578,27498,27523,27526,27573,27602,27607,27679,27849,27915,27954,27946,27969,27941,27916,27953,27934,27927,27963,27965,27966,27958,27931,27893,27961,27943,27960,27945,27950,27957,27918,27947,28843,28858,28851,28844,28847,28845,28856,28846,28836,29232,29298,29295,29300,29417,29408,29409,29623,29642,29627,29618,29645,29632,29619,29978,29997,30031,30028,30030,30027,30123,30116,30117,30114,30115,30328,30342,30343,30344,30408,30406,30403,30405,30465,30457,30456,30473,30475,30462,30460,30471,30684,30722,30740,30732,30733,31046,31049,31048,31047,31161,31162,31185,31186,31179,31359,31361,31487,31485,31869,32002,32005,32000,32009,32007,32004,32006,32568,32654,32703,32772,32784,32781,32785,32822,32982,32997,32986,32963,32964,32972,32993,32987,32974,32990,32996,32989,33268,33314,33511,33539,33541,33507,33499,33510,33540,33509,33538,33545,33490,33495,33521,33537,33500,33492,33489,33502,33491,33503,33519,33542,34384,34425,34427,34426,34893,34923,35201,35284,35336,35330,35331,35998,36000,36212,36211,36276,36557,36556,36848,36838,36834,36842,36837,36845,36843,36836,36840,37066,37070,37057,37059,37195,37194,37325,38274,38480,38475,38476,38477,38754,38761,38859,38893,38899,38913,39080,39131,39135,39318,39321,20056,20147,20492,20493,20515,20463,20518,20517,20472,20521,20502,20486,20540,20511,20506,20498,20497,20474,20480,20500,20520,20465,20513,20491,20505,20504,20467,20462,20525,20522,20478,20523,20489,20860,20900,20901,20898,20941,20940,20934,20939,21078,21084,21076,21083,21085,21290,21375,21407,21405,21471,21736,21776,21761,21815,21756,21733,21746,21766,21754,21780,21737,21741,21729,21769,21742,21738,21734,21799,21767,21757,21775,22275,22276,22466,22484,22475,22467,22537,22799,22871,22872,22874,23057,23064,23068,23071,23067,23059,23020,23072,23075,23081,23077,23052,23049,23403,23640,23472,23475,23478,23476,23470,23477,23481,23480,23556,23633,23637,23632,23789,23805,23803,23786,23784,23792,23798,23809,23796,24046,24109,24107,24235,24237,24231,24369,24466,24465,24464,24665,24675,24677,24656,24661,24685,24681,24687,24708,24735,24730,24717,24724,24716,24709,24726,25159,25331,25352,25343,25422,25406,25391,25429,25410,25414,25423,25417,25402,25424,25405,25386,25387,25384,25421,25420,25928,25929,26009,26049,26053,26178,26185,26191,26179,26194,26188,26181,26177,26360,26388,26389,26391,26657,26680,26696,26694,26707,26681,26690,26708,26665,26803,26647,26700,26705,26685,26612,26704,26688,26684,26691,26666,26693,26643,26648,26689,27530,27529,27575,27683,27687,27688,27686,27684,27888,28010,28053,28040,28039,28006,28024,28023,27993,28051,28012,28041,28014,27994,28020,28009,28044,28042,28025,28037,28005,28052,28874,28888,28900,28889,28872,28879,29241,29305,29436,29433,29437,29432,29431,29574,29677,29705,29678,29664,29674,29662,30036,30045,30044,30042,30041,30142,30149,30151,30130,30131,30141,30140,30137,30146,30136,30347,30384,30410,30413,30414,30505,30495,30496,30504,30697,30768,30759,30776,30749,30772,30775,30757,30765,30752,30751,30770,31061,31056,31072,31071,31062,31070,31069,31063,31066,31204,31203,31207,31199,31206,31209,31192,31364,31368,31449,31494,31505,31881,32033,32023,32011,32010,32032,32034,32020,32016,32021,32026,32028,32013,32025,32027,32570,32607,32660,32709,32705,32774,32792,32789,32793,32791,32829,32831,33009,33026,33008,33029,33005,33012,33030,33016,33011,33032,33021,33034,33020,33007,33261,33260,33280,33296,33322,33323,33320,33324,33467,33579,33618,33620,33610,33592,33616,33609,33589,33588,33615,33586,33593,33590,33559,33600,33585,33576,33603,34388,34442,34474,34451,34468,34473,34444,34467,34460,34928,34935,34945,34946,34941,34937,35352,35344,35342,35340,35349,35338,35351,35347,35350,35343,35345,35912,35962,35961,36001,36002,36215,36524,36562,36564,36559,36785,36865,36870,36855,36864,36858,36852,36867,36861,36869,36856,37013,37089,37085,37090,37202,37197,37196,37336,37341,37335,37340,37337,38275,38498,38499,38497,38491,38493,38500,38488,38494,38587,39138,39340,39592,39640,39717,39730,39740,20094,20602,20605,20572,20551,20547,20556,20570,20553,20581,20598,20558,20565,20597,20596,20599,20559,20495,20591,20589,20828,20885,20976,21098,21103,21202,21209,21208,21205,21264,21263,21273,21311,21312,21310,21443,26364,21830,21866,21862,21828,21854,21857,21827,21834,21809,21846,21839,21845,21807,21860,21816,21806,21852,21804,21859,21811,21825,21847,22280,22283,22281,22495,22533,22538,22534,22496,22500,22522,22530,22581,22519,22521,22816,22882,23094,23105,23113,23142,23146,23104,23100,23138,23130,23110,23114,23408,23495,23493,23492,23490,23487,23494,23561,23560,23559,23648,23644,23645,23815,23814,23822,23835,23830,23842,23825,23849,23828,23833,23844,23847,23831,24034,24120,24118,24115,24119,24247,24248,24246,24245,24254,24373,24375,24407,24428,24425,24427,24471,24473,24478,24472,24481,24480,24476,24703,24739,24713,24736,24744,24779,24756,24806,24765,24773,24763,24757,24796,24764,24792,24789,24774,24799,24760,24794,24775,25114,25115,25160,25504,25511,25458,25494,25506,25509,25463,25447,25496,25514,25457,25513,25481,25475,25499,25451,25512,25476,25480,25497,25505,25516,25490,25487,25472,25467,25449,25448,25466,25949,25942,25937,25945,25943,21855,25935,25944,25941,25940,26012,26011,26028,26063,26059,26060,26062,26205,26202,26212,26216,26214,26206,26361,21207,26395,26753,26799,26786,26771,26805,26751,26742,26801,26791,26775,26800,26755,26820,26797,26758,26757,26772,26781,26792,26783,26785,26754,27442,27578,27627,27628,27691,28046,28092,28147,28121,28082,28129,28108,28132,28155,28154,28165,28103,28107,28079,28113,28078,28126,28153,28088,28151,28149,28101,28114,28186,28085,28122,28139,28120,28138,28145,28142,28136,28102,28100,28074,28140,28095,28134,28921,28937,28938,28925,28911,29245,29309,29313,29468,29467,29462,29459,29465,29575,29701,29706,29699,29702,29694,29709,29920,29942,29943,29980,29986,30053,30054,30050,30064,30095,30164,30165,30133,30154,30157,30350,30420,30418,30427,30519,30526,30524,30518,30520,30522,30827,30787,30798,31077,31080,31085,31227,31378,31381,31520,31528,31515,31532,31526,31513,31518,31534,31890,31895,31893,32070,32067,32113,32046,32057,32060,32064,32048,32051,32068,32047,32066,32050,32049,32573,32670,32666,32716,32718,32722,32796,32842,32838,33071,33046,33059,33067,33065,33072,33060,33282,33333,33335,33334,33337,33678,33694,33688,33656,33698,33686,33725,33707,33682,33674,33683,33673,33696,33655,33659,33660,33670,33703,34389,24426,34503,34496,34486,34500,34485,34502,34507,34481,34479,34505,34899,34974,34952,34987,34962,34966,34957,34955,35219,35215,35370,35357,35363,35365,35377,35373,35359,35355,35362,35913,35930,36009,36012,36011,36008,36010,36007,36199,36198,36286,36282,36571,36575,36889,36877,36890,36887,36899,36895,36893,36880,36885,36894,36896,36879,36898,36886,36891,36884,37096,37101,37117,37207,37326,37365,37350,37347,37351,37357,37353,38281,38506,38517,38515,38520,38512,38516,38518,38519,38508,38592,38634,38633,31456,31455,38914,38915,39770,40165,40565,40575,40613,40635,20642,20621,20613,20633,20625,20608,20630,20632,20634,26368,20977,21106,21108,21109,21097,21214,21213,21211,21338,21413,21883,21888,21927,21884,21898,21917,21912,21890,21916,21930,21908,21895,21899,21891,21939,21934,21919,21822,21938,21914,21947,21932,21937,21886,21897,21931,21913,22285,22575,22570,22580,22564,22576,22577,22561,22557,22560,22777,22778,22880,23159,23194,23167,23186,23195,23207,23411,23409,23506,23500,23507,23504,23562,23563,23601,23884,23888,23860,23879,24061,24133,24125,24128,24131,24190,24266,24257,24258,24260,24380,24429,24489,24490,24488,24785,24801,24754,24758,24800,24860,24867,24826,24853,24816,24827,24820,24936,24817,24846,24822,24841,24832,24850,25119,25161,25507,25484,25551,25536,25577,25545,25542,25549,25554,25571,25552,25569,25558,25581,25582,25462,25588,25578,25563,25682,25562,25593,25950,25958,25954,25955,26001,26000,26031,26222,26224,26228,26230,26223,26257,26234,26238,26231,26366,26367,26399,26397,26874,26837,26848,26840,26839,26885,26847,26869,26862,26855,26873,26834,26866,26851,26827,26829,26893,26898,26894,26825,26842,26990,26875,27454,27450,27453,27544,27542,27580,27631,27694,27695,27692,28207,28216,28244,28193,28210,28263,28234,28192,28197,28195,28187,28251,28248,28196,28246,28270,28205,28198,28271,28212,28237,28218,28204,28227,28189,28222,28363,28297,28185,28238,28259,28228,28274,28265,28255,28953,28954,28966,28976,28961,28982,29038,28956,29260,29316,29312,29494,29477,29492,29481,29754,29738,29747,29730,29733,29749,29750,29748,29743,29723,29734,29736,29989,29990,30059,30058,30178,30171,30179,30169,30168,30174,30176,30331,30332,30358,30355,30388,30428,30543,30701,30813,30828,30831,31245,31240,31243,31237,31232,31384,31383,31382,31461,31459,31561,31574,31558,31568,31570,31572,31565,31563,31567,31569,31903,31909,32094,32080,32104,32085,32043,32110,32114,32097,32102,32098,32112,32115,21892,32724,32725,32779,32850,32901,33109,33108,33099,33105,33102,33081,33094,33086,33100,33107,33140,33298,33308,33769,33795,33784,33805,33760,33733,33803,33729,33775,33777,33780,33879,33802,33776,33804,33740,33789,33778,33738,33848,33806,33796,33756,33799,33748,33759,34395,34527,34521,34541,34516,34523,34532,34512,34526,34903,35009,35010,34993,35203,35222,35387,35424,35413,35422,35388,35393,35412,35419,35408,35398,35380,35386,35382,35414,35937,35970,36015,36028,36019,36029,36033,36027,36032,36020,36023,36022,36031,36024,36234,36229,36225,36302,36317,36299,36314,36305,36300,36315,36294,36603,36600,36604,36764,36910,36917,36913,36920,36914,36918,37122,37109,37129,37118,37219,37221,37327,37396,37397,37411,37385,37406,37389,37392,37383,37393,38292,38287,38283,38289,38291,38290,38286,38538,38542,38539,38525,38533,38534,38541,38514,38532,38593,38597,38596,38598,38599,38639,38642,38860,38917,38918,38920,39143,39146,39151,39145,39154,39149,39342,39341,40643,40653,40657,20098,20653,20661,20658,20659,20677,20670,20652,20663,20667,20655,20679,21119,21111,21117,21215,21222,21220,21218,21219,21295,21983,21992,21971,21990,21966,21980,21959,21969,21987,21988,21999,21978,21985,21957,21958,21989,21961,22290,22291,22622,22609,22616,22615,22618,22612,22635,22604,22637,22602,22626,22610,22603,22887,23233,23241,23244,23230,23229,23228,23219,23234,23218,23913,23919,24140,24185,24265,24264,24338,24409,24492,24494,24858,24847,24904,24863,24819,24859,24825,24833,24840,24910,24908,24900,24909,24894,24884,24871,24845,24838,24887,25121,25122,25619,25662,25630,25642,25645,25661,25644,25615,25628,25620,25613,25654,25622,25623,25606,25964,26015,26032,26263,26249,26247,26248,26262,26244,26264,26253,26371,27028,26989,26970,26999,26976,26964,26997,26928,27010,26954,26984,26987,26974,26963,27001,27014,26973,26979,26971,27463,27506,27584,27583,27603,27645,28322,28335,28371,28342,28354,28304,28317,28359,28357,28325,28312,28348,28346,28331,28369,28310,28316,28356,28372,28330,28327,28340,29006,29017,29033,29028,29001,29031,29020,29036,29030,29004,29029,29022,28998,29032,29014,29242,29266,29495,29509,29503,29502,29807,29786,29781,29791,29790,29761,29759,29785,29787,29788,30070,30072,30208,30192,30209,30194,30193,30202,30207,30196,30195,30430,30431,30555,30571,30566,30558,30563,30585,30570,30572,30556,30565,30568,30562,30702,30862,30896,30871,30872,30860,30857,30844,30865,30867,30847,31098,31103,31105,33836,31165,31260,31258,31264,31252,31263,31262,31391,31392,31607,31680,31584,31598,31591,31921,31923,31925,32147,32121,32145,32129,32143,32091,32622,32617,32618,32626,32681,32680,32676,32854,32856,32902,32900,33137,33136,33144,33125,33134,33139,33131,33145,33146,33126,33285,33351,33922,33911,33853,33841,33909,33894,33899,33865,33900,33883,33852,33845,33889,33891,33897,33901,33862,34398,34396,34399,34553,34579,34568,34567,34560,34558,34555,34562,34563,34566,34570,34905,35039,35028,35033,35036,35032,35037,35041,35018,35029,35026,35228,35299,35435,35442,35443,35430,35433,35440,35463,35452,35427,35488,35441,35461,35437,35426,35438,35436,35449,35451,35390,35432,35938,35978,35977,36042,36039,36040,36036,36018,36035,36034,36037,36321,36319,36328,36335,36339,36346,36330,36324,36326,36530,36611,36617,36606,36618,36767,36786,36939,36938,36947,36930,36948,36924,36949,36944,36935,36943,36942,36941,36945,36926,36929,37138,37143,37228,37226,37225,37321,37431,37463,37432,37437,37440,37438,37467,37451,37476,37457,37428,37449,37453,37445,37433,37439,37466,38296,38552,38548,38549,38605,38603,38601,38602,38647,38651,38649,38646,38742,38772,38774,38928,38929,38931,38922,38930,38924,39164,39156,39165,39166,39347,39345,39348,39649,40169,40578,40718,40723,40736,20711,20718,20709,20694,20717,20698,20693,20687,20689,20721,20686,20713,20834,20979,21123,21122,21297,21421,22014,22016,22043,22039,22013,22036,22022,22025,22029,22030,22007,22038,22047,22024,22032,22006,22296,22294,22645,22654,22659,22675,22666,22649,22661,22653,22781,22821,22818,22820,22890,22889,23265,23270,23273,23255,23254,23256,23267,23413,23518,23527,23521,23525,23526,23528,23522,23524,23519,23565,23650,23940,23943,24155,24163,24149,24151,24148,24275,24278,24330,24390,24432,24505,24903,24895,24907,24951,24930,24931,24927,24922,24920,24949,25130,25735,25688,25684,25764,25720,25695,25722,25681,25703,25652,25709,25723,25970,26017,26071,26070,26274,26280,26269,27036,27048,27029,27073,27054,27091,27083,27035,27063,27067,27051,27060,27088,27085,27053,27084,27046,27075,27043,27465,27468,27699,28467,28436,28414,28435,28404,28457,28478,28448,28460,28431,28418,28450,28415,28399,28422,28465,28472,28466,28451,28437,28459,28463,28552,28458,28396,28417,28402,28364,28407,29076,29081,29053,29066,29060,29074,29246,29330,29334,29508,29520,29796,29795,29802,29808,29805,29956,30097,30247,30221,30219,30217,30227,30433,30435,30596,30589,30591,30561,30913,30879,30887,30899,30889,30883,31118,31119,31117,31278,31281,31402,31401,31469,31471,31649,31637,31627,31605,31639,31645,31636,31631,31672,31623,31620,31929,31933,31934,32187,32176,32156,32189,32190,32160,32202,32180,32178,32177,32186,32162,32191,32181,32184,32173,32210,32199,32172,32624,32736,32737,32735,32862,32858,32903,33104,33152,33167,33160,33162,33151,33154,33255,33274,33287,33300,33310,33355,33993,33983,33990,33988,33945,33950,33970,33948,33995,33976,33984,34003,33936,33980,34001,33994,34623,34588,34619,34594,34597,34612,34584,34645,34615,34601,35059,35074,35060,35065,35064,35069,35048,35098,35055,35494,35468,35486,35491,35469,35489,35475,35492,35498,35493,35496,35480,35473,35482,35495,35946,35981,35980,36051,36049,36050,36203,36249,36245,36348,36628,36626,36629,36627,36771,36960,36952,36956,36963,36953,36958,36962,36957,36955,37145,37144,37150,37237,37240,37239,37236,37496,37504,37509,37528,37526,37499,37523,37532,37544,37500,37521,38305,38312,38313,38307,38309,38308,38553,38556,38555,38604,38610,38656,38780,38789,38902,38935,38936,39087,39089,39171,39173,39180,39177,39361,39599,39600,39654,39745,39746,40180,40182,40179,40636,40763,40778,20740,20736,20731,20725,20729,20738,20744,20745,20741,20956,21127,21128,21129,21133,21130,21232,21426,22062,22075,22073,22066,22079,22068,22057,22099,22094,22103,22132,22070,22063,22064,22656,22687,22686,22707,22684,22702,22697,22694,22893,23305,23291,23307,23285,23308,23304,23534,23532,23529,23531,23652,23653,23965,23956,24162,24159,24161,24290,24282,24287,24285,24291,24288,24392,24433,24503,24501,24950,24935,24942,24925,24917,24962,24956,24944,24939,24958,24999,24976,25003,24974,25004,24986,24996,24980,25006,25134,25705,25711,25721,25758,25778,25736,25744,25776,25765,25747,25749,25769,25746,25774,25773,25771,25754,25772,25753,25762,25779,25973,25975,25976,26286,26283,26292,26289,27171,27167,27112,27137,27166,27161,27133,27169,27155,27146,27123,27138,27141,27117,27153,27472,27470,27556,27589,27590,28479,28540,28548,28497,28518,28500,28550,28525,28507,28536,28526,28558,28538,28528,28516,28567,28504,28373,28527,28512,28511,29087,29100,29105,29096,29270,29339,29518,29527,29801,29835,29827,29822,29824,30079,30240,30249,30239,30244,30246,30241,30242,30362,30394,30436,30606,30599,30604,30609,30603,30923,30917,30906,30922,30910,30933,30908,30928,31295,31292,31296,31293,31287,31291,31407,31406,31661,31665,31684,31668,31686,31687,31681,31648,31692,31946,32224,32244,32239,32251,32216,32236,32221,32232,32227,32218,32222,32233,32158,32217,32242,32249,32629,32631,32687,32745,32806,33179,33180,33181,33184,33178,33176,34071,34109,34074,34030,34092,34093,34067,34065,34083,34081,34068,34028,34085,34047,34054,34690,34676,34678,34656,34662,34680,34664,34649,34647,34636,34643,34907,34909,35088,35079,35090,35091,35093,35082,35516,35538,35527,35524,35477,35531,35576,35506,35529,35522,35519,35504,35542,35533,35510,35513,35547,35916,35918,35948,36064,36062,36070,36068,36076,36077,36066,36067,36060,36074,36065,36205,36255,36259,36395,36368,36381,36386,36367,36393,36383,36385,36382,36538,36637,36635,36639,36649,36646,36650,36636,36638,36645,36969,36974,36968,36973,36983,37168,37165,37159,37169,37255,37257,37259,37251,37573,37563,37559,37610,37548,37604,37569,37555,37564,37586,37575,37616,37554,38317,38321,38660,38662,38663,38665,38752,38797,38795,38799,38945,38955,38940,39091,39178,39187,39186,39192,39389,39376,39391,39387,39377,39381,39378,39385,39607,39662,39663,39719,39749,39748,39799,39791,40198,40201,40195,40617,40638,40654,22696,40786,20754,20760,20756,20752,20757,20864,20906,20957,21137,21139,21235,22105,22123,22137,22121,22116,22136,22122,22120,22117,22129,22127,22124,22114,22134,22721,22718,22727,22725,22894,23325,23348,23416,23536,23566,24394,25010,24977,25001,24970,25037,25014,25022,25034,25032,25136,25797,25793,25803,25787,25788,25818,25796,25799,25794,25805,25791,25810,25812,25790,25972,26310,26313,26297,26308,26311,26296,27197,27192,27194,27225,27243,27224,27193,27204,27234,27233,27211,27207,27189,27231,27208,27481,27511,27653,28610,28593,28577,28611,28580,28609,28583,28595,28608,28601,28598,28582,28576,28596,29118,29129,29136,29138,29128,29141,29113,29134,29145,29148,29123,29124,29544,29852,29859,29848,29855,29854,29922,29964,29965,30260,30264,30266,30439,30437,30624,30622,30623,30629,30952,30938,30956,30951,31142,31309,31310,31302,31308,31307,31418,31705,31761,31689,31716,31707,31713,31721,31718,31957,31958,32266,32273,32264,32283,32291,32286,32285,32265,32272,32633,32690,32752,32753,32750,32808,33203,33193,33192,33275,33288,33368,33369,34122,34137,34120,34152,34153,34115,34121,34157,34154,34142,34691,34719,34718,34722,34701,34913,35114,35122,35109,35115,35105,35242,35238,35558,35578,35563,35569,35584,35548,35559,35566,35582,35585,35586,35575,35565,35571,35574,35580,35947,35949,35987,36084,36420,36401,36404,36418,36409,36405,36667,36655,36664,36659,36776,36774,36981,36980,36984,36978,36988,36986,37172,37266,37664,37686,37624,37683,37679,37666,37628,37675,37636,37658,37648,37670,37665,37653,37678,37657,38331,38567,38568,38570,38613,38670,38673,38678,38669,38675,38671,38747,38748,38758,38808,38960,38968,38971,38967,38957,38969,38948,39184,39208,39198,39195,39201,39194,39405,39394,39409,39608,39612,39675,39661,39720,39825,40213,40227,40230,40232,40210,40219,40664,40660,40845,40860,20778,20767,20769,20786,21237,22158,22144,22160,22149,22151,22159,22741,22739,22737,22734,23344,23338,23332,23418,23607,23656,23996,23994,23997,23992,24171,24396,24509,25033,25026,25031,25062,25035,25138,25140,25806,25802,25816,25824,25840,25830,25836,25841,25826,25837,25986,25987,26329,26326,27264,27284,27268,27298,27292,27355,27299,27262,27287,27280,27296,27484,27566,27610,27656,28632,28657,28639,28640,28635,28644,28651,28655,28544,28652,28641,28649,28629,28654,28656,29159,29151,29166,29158,29157,29165,29164,29172,29152,29237,29254,29552,29554,29865,29872,29862,29864,30278,30274,30284,30442,30643,30634,30640,30636,30631,30637,30703,30967,30970,30964,30959,30977,31143,31146,31319,31423,31751,31757,31742,31735,31756,31712,31968,31964,31966,31970,31967,31961,31965,32302,32318,32326,32311,32306,32323,32299,32317,32305,32325,32321,32308,32313,32328,32309,32319,32303,32580,32755,32764,32881,32882,32880,32879,32883,33222,33219,33210,33218,33216,33215,33213,33225,33214,33256,33289,33393,34218,34180,34174,34204,34193,34196,34223,34203,34183,34216,34186,34407,34752,34769,34739,34770,34758,34731,34747,34746,34760,34763,35131,35126,35140,35128,35133,35244,35598,35607,35609,35611,35594,35616,35613,35588,35600,35905,35903,35955,36090,36093,36092,36088,36091,36264,36425,36427,36424,36426,36676,36670,36674,36677,36671,36991,36989,36996,36993,36994,36992,37177,37283,37278,37276,37709,37762,37672,37749,37706,37733,37707,37656,37758,37740,37723,37744,37722,37716,38346,38347,38348,38344,38342,38577,38584,38614,38684,38686,38816,38867,38982,39094,39221,39425,39423,39854,39851,39850,39853,40251,40255,40587,40655,40670,40668,40669,40667,40766,40779,21474,22165,22190,22745,22744,23352,24413,25059,25139,25844,25842,25854,25862,25850,25851,25847,26039,26332,26406,27315,27308,27331,27323,27320,27330,27310,27311,27487,27512,27567,28681,28683,28670,28678,28666,28689,28687,29179,29180,29182,29176,29559,29557,29863,29887,29973,30294,30296,30290,30653,30655,30651,30652,30990,31150,31329,31330,31328,31428,31429,31787,31783,31786,31774,31779,31777,31975,32340,32341,32350,32346,32353,32338,32345,32584,32761,32763,32887,32886,33229,33231,33290,34255,34217,34253,34256,34249,34224,34234,34233,34214,34799,34796,34802,34784,35206,35250,35316,35624,35641,35628,35627,35920,36101,36441,36451,36454,36452,36447,36437,36544,36681,36685,36999,36995,37000,37291,37292,37328,37780,37770,37782,37794,37811,37806,37804,37808,37784,37786,37783,38356,38358,38352,38357,38626,38620,38617,38619,38622,38692,38819,38822,38829,38905,38989,38991,38988,38990,38995,39098,39230,39231,39229,39214,39333,39438,39617,39683,39686,39759,39758,39757,39882,39881,39933,39880,39872,40273,40285,40288,40672,40725,40748,20787,22181,22750,22751,22754,23541,40848,24300,25074,25079,25078,25077,25856,25871,26336,26333,27365,27357,27354,27347,28699,28703,28712,28698,28701,28693,28696,29190,29197,29272,29346,29560,29562,29885,29898,29923,30087,30086,30303,30305,30663,31001,31153,31339,31337,31806,31807,31800,31805,31799,31808,32363,32365,32377,32361,32362,32645,32371,32694,32697,32696,33240,34281,34269,34282,34261,34276,34277,34295,34811,34821,34829,34809,34814,35168,35167,35158,35166,35649,35676,35672,35657,35674,35662,35663,35654,35673,36104,36106,36476,36466,36487,36470,36460,36474,36468,36692,36686,36781,37002,37003,37297,37294,37857,37841,37855,37827,37832,37852,37853,37846,37858,37837,37848,37860,37847,37864,38364,38580,38627,38698,38695,38753,38876,38907,39006,39000,39003,39100,39237,39241,39446,39449,39693,39912,39911,39894,39899,40329,40289,40306,40298,40300,40594,40599,40595,40628,21240,22184,22199,22198,22196,22204,22756,23360,23363,23421,23542,24009,25080,25082,25880,25876,25881,26342,26407,27372,28734,28720,28722,29200,29563,29903,30306,30309,31014,31018,31020,31019,31431,31478,31820,31811,31821,31983,31984,36782,32381,32380,32386,32588,32768,33242,33382,34299,34297,34321,34298,34310,34315,34311,34314,34836,34837,35172,35258,35320,35696,35692,35686,35695,35679,35691,36111,36109,36489,36481,36485,36482,37300,37323,37912,37891,37885,38369,38704,39108,39250,39249,39336,39467,39472,39479,39477,39955,39949,40569,40629,40680,40751,40799,40803,40801,20791,20792,22209,22208,22210,22804,23660,24013,25084,25086,25885,25884,26005,26345,27387,27396,27386,27570,28748,29211,29351,29910,29908,30313,30675,31824,32399,32396,32700,34327,34349,34330,34851,34850,34849,34847,35178,35180,35261,35700,35703,35709,36115,36490,36493,36491,36703,36783,37306,37934,37939,37941,37946,37944,37938,37931,38370,38712,38713,38706,38911,39015,39013,39255,39493,39491,39488,39486,39631,39764,39761,39981,39973,40367,40372,40386,40376,40605,40687,40729,40796,40806,40807,20796,20795,22216,22218,22217,23423,24020,24018,24398,25087,25892,27402,27489,28753,28760,29568,29924,30090,30318,30316,31155,31840,31839,32894,32893,33247,35186,35183,35324,35712,36118,36119,36497,36499,36705,37192,37956,37969,37970,38717,38718,38851,38849,39019,39253,39509,39501,39634,39706,40009,39985,39998,39995,40403,40407,40756,40812,40810,40852,22220,24022,25088,25891,25899,25898,26348,27408,29914,31434,31844,31843,31845,32403,32406,32404,33250,34360,34367,34865,35722,37008,37007,37987,37984,37988,38760,39023,39260,39514,39515,39511,39635,39636,39633,40020,40023,40022,40421,40607,40692,22225,22761,25900,28766,30321,30322,30679,32592,32648,34870,34873,34914,35731,35730,35734,33399,36123,37312,37994,38722,38728,38724,38854,39024,39519,39714,39768,40031,40441,40442,40572,40573,40711,40823,40818,24307,27414,28771,31852,31854,34875,35264,36513,37313,38002,38000,39025,39262,39638,39715,40652,28772,30682,35738,38007,38857,39522,39525,32412,35740,36522,37317,38013,38014,38012,40055,40056,40695,35924,38015,40474,29224,39530,39729,40475,40478,31858,9312,9313,9314,9315,9316,9317,9318,9319,9320,9321,9332,9333,9334,9335,9336,9337,9338,9339,9340,9341,8560,8561,8562,8563,8564,8565,8566,8567,8568,8569,20022,20031,20101,20128,20866,20886,20907,21241,21304,21353,21430,22794,23424,24027,12083,24191,24308,24400,24417,25908,26080,30098,30326,36789,38582,168,710,12541,12542,12445,12446,12291,20189,12293,12294,12295,12540,65339,65341,10045,12353,12354,12355,12356,12357,12358,12359,12360,12361,12362,12363,12364,12365,12366,12367,12368,12369,12370,12371,12372,12373,12374,12375,12376,12377,12378,12379,12380,12381,12382,12383,12384,12385,12386,12387,12388,12389,12390,12391,12392,12393,12394,12395,12396,12397,12398,12399,12400,12401,12402,12403,12404,12405,12406,12407,12408,12409,12410,12411,12412,12413,12414,12415,12416,12417,12418,12419,12420,12421,12422,12423,12424,12425,12426,12427,12428,12429,12430,12431,12432,12433,12434,12435,12449,12450,12451,12452,12453,12454,12455,12456,12457,12458,12459,12460,12461,12462,12463,12464,12465,12466,12467,12468,12469,12470,12471,12472,12473,12474,12475,12476,12477,12478,12479,12480,12481,12482,12483,12484,12485,12486,12487,12488,12489,12490,12491,12492,12493,12494,12495,12496,12497,12498,12499,12500,12501,12502,12503,12504,12505,12506,12507,12508,12509,12510,12511,12512,12513,12514,12515,12516,12517,12518,12519,12520,12521,12522,12523,12524,12525,12526,12527,12528,12529,12530,12531,12532,12533,12534,1040,1041,1042,1043,1044,1045,1025,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1105,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,8679,8632,8633,12751,131276,20058,131210,20994,17553,40880,20872,40881,161287,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,65506,65508,65287,65282,12849,8470,8481,12443,12444,11904,11908,11910,11911,11912,11914,11916,11917,11925,11932,11933,11941,11943,11946,11948,11950,11958,11964,11966,11974,11978,11980,11981,11983,11990,11991,11998,12003,null,null,null,643,592,603,596,629,339,248,331,650,618,20034,20060,20981,21274,21378,19975,19980,20039,20109,22231,64012,23662,24435,19983,20871,19982,20014,20115,20162,20169,20168,20888,21244,21356,21433,22304,22787,22828,23568,24063,26081,27571,27596,27668,29247,20017,20028,20200,20188,20201,20193,20189,20186,21004,21276,21324,22306,22307,22807,22831,23425,23428,23570,23611,23668,23667,24068,24192,24194,24521,25097,25168,27669,27702,27715,27711,27707,29358,29360,29578,31160,32906,38430,20238,20248,20268,20213,20244,20209,20224,20215,20232,20253,20226,20229,20258,20243,20228,20212,20242,20913,21011,21001,21008,21158,21282,21279,21325,21386,21511,22241,22239,22318,22314,22324,22844,22912,22908,22917,22907,22910,22903,22911,23382,23573,23589,23676,23674,23675,23678,24031,24181,24196,24322,24346,24436,24533,24532,24527,25180,25182,25188,25185,25190,25186,25177,25184,25178,25189,26095,26094,26430,26425,26424,26427,26426,26431,26428,26419,27672,27718,27730,27740,27727,27722,27732,27723,27724,28785,29278,29364,29365,29582,29994,30335,31349,32593,33400,33404,33408,33405,33407,34381,35198,37017,37015,37016,37019,37012,38434,38436,38432,38435,20310,20283,20322,20297,20307,20324,20286,20327,20306,20319,20289,20312,20269,20275,20287,20321,20879,20921,21020,21022,21025,21165,21166,21257,21347,21362,21390,21391,21552,21559,21546,21588,21573,21529,21532,21541,21528,21565,21583,21569,21544,21540,21575,22254,22247,22245,22337,22341,22348,22345,22347,22354,22790,22848,22950,22936,22944,22935,22926,22946,22928,22927,22951,22945,23438,23442,23592,23594,23693,23695,23688,23691,23689,23698,23690,23686,23699,23701,24032,24074,24078,24203,24201,24204,24200,24205,24325,24349,24440,24438,24530,24529,24528,24557,24552,24558,24563,24545,24548,24547,24570,24559,24567,24571,24576,24564,25146,25219,25228,25230,25231,25236,25223,25201,25211,25210,25200,25217,25224,25207,25213,25202,25204,25911,26096,26100,26099,26098,26101,26437,26439,26457,26453,26444,26440,26461,26445,26458,26443,27600,27673,27674,27768,27751,27755,27780,27787,27791,27761,27759,27753,27802,27757,27783,27797,27804,27750,27763,27749,27771,27790,28788,28794,29283,29375,29373,29379,29382,29377,29370,29381,29589,29591,29587,29588,29586,30010,30009,30100,30101,30337,31037,32820,32917,32921,32912,32914,32924,33424,33423,33413,33422,33425,33427,33418,33411,33412,35960,36809,36799,37023,37025,37029,37022,37031,37024,38448,38440,38447,38445,20019,20376,20348,20357,20349,20352,20359,20342,20340,20361,20356,20343,20300,20375,20330,20378,20345,20353,20344,20368,20380,20372,20382,20370,20354,20373,20331,20334,20894,20924,20926,21045,21042,21043,21062,21041,21180,21258,21259,21308,21394,21396,21639,21631,21633,21649,21634,21640,21611,21626,21630,21605,21612,21620,21606,21645,21615,21601,21600,21656,21603,21607,21604,22263,22265,22383,22386,22381,22379,22385,22384,22390,22400,22389,22395,22387,22388,22370,22376,22397,22796,22853,22965,22970,22991,22990,22962,22988,22977,22966,22972,22979,22998,22961,22973,22976,22984,22964,22983,23394,23397,23443,23445,23620,23623,23726,23716,23712,23733,23727,23720,23724,23711,23715,23725,23714,23722,23719,23709,23717,23734,23728,23718,24087,24084,24089,24360,24354,24355,24356,24404,24450,24446,24445,24542,24549,24621,24614,24601,24626,24587,24628,24586,24599,24627,24602,24606,24620,24610,24589,24592,24622,24595,24593,24588,24585,24604,25108,25149,25261,25268,25297,25278,25258,25270,25290,25262,25267,25263,25275,25257,25264,25272,25917,26024,26043,26121,26108,26116,26130,26120,26107,26115,26123,26125,26117,26109,26129,26128,26358,26378,26501,26476,26510,26514,26486,26491,26520,26502,26500,26484,26509,26508,26490,26527,26513,26521,26499,26493,26497,26488,26489,26516,27429,27520,27518,27614,27677,27795,27884,27883,27886,27865,27830,27860,27821,27879,27831,27856,27842,27834,27843,27846,27885,27890,27858,27869,27828,27786,27805,27776,27870,27840,27952,27853,27847,27824,27897,27855,27881,27857,28820,28824,28805,28819,28806,28804,28817,28822,28802,28826,28803,29290,29398,29387,29400,29385,29404,29394,29396,29402,29388,29393,29604,29601,29613,29606,29602,29600,29612,29597,29917,29928,30015,30016,30014,30092,30104,30383,30451,30449,30448,30453,30712,30716,30713,30715,30714,30711,31042,31039,31173,31352,31355,31483,31861,31997,32821,32911,32942,32931,32952,32949,32941,33312,33440,33472,33451,33434,33432,33435,33461,33447,33454,33468,33438,33466,33460,33448,33441,33449,33474,33444,33475,33462,33442,34416,34415,34413,34414,35926,36818,36811,36819,36813,36822,36821,36823,37042,37044,37039,37043,37040,38457,38461,38460,38458,38467,20429,20421,20435,20402,20425,20427,20417,20436,20444,20441,20411,20403,20443,20423,20438,20410,20416,20409,20460,21060,21065,21184,21186,21309,21372,21399,21398,21401,21400,21690,21665,21677,21669,21711,21699,33549,21687,21678,21718,21686,21701,21702,21664,21616,21692,21666,21694,21618,21726,21680,22453,22430,22431,22436,22412,22423,22429,22427,22420,22424,22415,22425,22437,22426,22421,22772,22797,22867,23009,23006,23022,23040,23025,23005,23034,23037,23036,23030,23012,23026,23031,23003,23017,23027,23029,23008,23038,23028,23021,23464,23628,23760,23768,23756,23767,23755,23771,23774,23770,23753,23751,23754,23766,23763,23764,23759,23752,23750,23758,23775,23800,24057,24097,24098,24099,24096,24100,24240,24228,24226,24219,24227,24229,24327,24366,24406,24454,24631,24633,24660,24690,24670,24645,24659,24647,24649,24667,24652,24640,24642,24671,24612,24644,24664,24678,24686,25154,25155,25295,25357,25355,25333,25358,25347,25323,25337,25359,25356,25336,25334,25344,25363,25364,25338,25365,25339,25328,25921,25923,26026,26047,26166,26145,26162,26165,26140,26150,26146,26163,26155,26170,26141,26164,26169,26158,26383,26384,26561,26610,26568,26554,26588,26555,26616,26584,26560,26551,26565,26603,26596,26591,26549,26573,26547,26615,26614,26606,26595,26562,26553,26574,26599,26608,26546,26620,26566,26605,26572,26542,26598,26587,26618,26569,26570,26563,26602,26571,27432,27522,27524,27574,27606,27608,27616,27680,27681,27944,27956,27949,27935,27964,27967,27922,27914,27866,27955,27908,27929,27962,27930,27921,27904,27933,27970,27905,27928,27959,27907,27919,27968,27911,27936,27948,27912,27938,27913,27920,28855,28831,28862,28849,28848,28833,28852,28853,28841,29249,29257,29258,29292,29296,29299,29294,29386,29412,29416,29419,29407,29418,29414,29411,29573,29644,29634,29640,29637,29625,29622,29621,29620,29675,29631,29639,29630,29635,29638,29624,29643,29932,29934,29998,30023,30024,30119,30122,30329,30404,30472,30467,30468,30469,30474,30455,30459,30458,30695,30696,30726,30737,30738,30725,30736,30735,30734,30729,30723,30739,31050,31052,31051,31045,31044,31189,31181,31183,31190,31182,31360,31358,31441,31488,31489,31866,31864,31865,31871,31872,31873,32003,32008,32001,32600,32657,32653,32702,32775,32782,32783,32788,32823,32984,32967,32992,32977,32968,32962,32976,32965,32995,32985,32988,32970,32981,32969,32975,32983,32998,32973,33279,33313,33428,33497,33534,33529,33543,33512,33536,33493,33594,33515,33494,33524,33516,33505,33522,33525,33548,33531,33526,33520,33514,33508,33504,33530,33523,33517,34423,34420,34428,34419,34881,34894,34919,34922,34921,35283,35332,35335,36210,36835,36833,36846,36832,37105,37053,37055,37077,37061,37054,37063,37067,37064,37332,37331,38484,38479,38481,38483,38474,38478,20510,20485,20487,20499,20514,20528,20507,20469,20468,20531,20535,20524,20470,20471,20503,20508,20512,20519,20533,20527,20529,20494,20826,20884,20883,20938,20932,20933,20936,20942,21089,21082,21074,21086,21087,21077,21090,21197,21262,21406,21798,21730,21783,21778,21735,21747,21732,21786,21759,21764,21768,21739,21777,21765,21745,21770,21755,21751,21752,21728,21774,21763,21771,22273,22274,22476,22578,22485,22482,22458,22470,22461,22460,22456,22454,22463,22471,22480,22457,22465,22798,22858,23065,23062,23085,23086,23061,23055,23063,23050,23070,23091,23404,23463,23469,23468,23555,23638,23636,23788,23807,23790,23793,23799,23808,23801,24105,24104,24232,24238,24234,24236,24371,24368,24423,24669,24666,24679,24641,24738,24712,24704,24722,24705,24733,24707,24725,24731,24727,24711,24732,24718,25113,25158,25330,25360,25430,25388,25412,25413,25398,25411,25572,25401,25419,25418,25404,25385,25409,25396,25432,25428,25433,25389,25415,25395,25434,25425,25400,25431,25408,25416,25930,25926,26054,26051,26052,26050,26186,26207,26183,26193,26386,26387,26655,26650,26697,26674,26675,26683,26699,26703,26646,26673,26652,26677,26667,26669,26671,26702,26692,26676,26653,26642,26644,26662,26664,26670,26701,26682,26661,26656,27436,27439,27437,27441,27444,27501,32898,27528,27622,27620,27624,27619,27618,27623,27685,28026,28003,28004,28022,27917,28001,28050,27992,28002,28013,28015,28049,28045,28143,28031,28038,27998,28007,28000,28055,28016,28028,27999,28034,28056,27951,28008,28043,28030,28032,28036,27926,28035,28027,28029,28021,28048,28892,28883,28881,28893,28875,32569,28898,28887,28882,28894,28896,28884,28877,28869,28870,28871,28890,28878,28897,29250,29304,29303,29302,29440,29434,29428,29438,29430,29427,29435,29441,29651,29657,29669,29654,29628,29671,29667,29673,29660,29650,29659,29652,29661,29658,29655,29656,29672,29918,29919,29940,29941,29985,30043,30047,30128,30145,30139,30148,30144,30143,30134,30138,30346,30409,30493,30491,30480,30483,30482,30499,30481,30485,30489,30490,30498,30503,30755,30764,30754,30773,30767,30760,30766,30763,30753,30761,30771,30762,30769,31060,31067,31055,31068,31059,31058,31057,31211,31212,31200,31214,31213,31210,31196,31198,31197,31366,31369,31365,31371,31372,31370,31367,31448,31504,31492,31507,31493,31503,31496,31498,31502,31497,31506,31876,31889,31882,31884,31880,31885,31877,32030,32029,32017,32014,32024,32022,32019,32031,32018,32015,32012,32604,32609,32606,32608,32605,32603,32662,32658,32707,32706,32704,32790,32830,32825,33018,33010,33017,33013,33025,33019,33024,33281,33327,33317,33587,33581,33604,33561,33617,33573,33622,33599,33601,33574,33564,33570,33602,33614,33563,33578,33544,33596,33613,33558,33572,33568,33591,33583,33577,33607,33605,33612,33619,33566,33580,33611,33575,33608,34387,34386,34466,34472,34454,34445,34449,34462,34439,34455,34438,34443,34458,34437,34469,34457,34465,34471,34453,34456,34446,34461,34448,34452,34883,34884,34925,34933,34934,34930,34944,34929,34943,34927,34947,34942,34932,34940,35346,35911,35927,35963,36004,36003,36214,36216,36277,36279,36278,36561,36563,36862,36853,36866,36863,36859,36868,36860,36854,37078,37088,37081,37082,37091,37087,37093,37080,37083,37079,37084,37092,37200,37198,37199,37333,37346,37338,38492,38495,38588,39139,39647,39727,20095,20592,20586,20577,20574,20576,20563,20555,20573,20594,20552,20557,20545,20571,20554,20578,20501,20549,20575,20585,20587,20579,20580,20550,20544,20590,20595,20567,20561,20944,21099,21101,21100,21102,21206,21203,21293,21404,21877,21878,21820,21837,21840,21812,21802,21841,21858,21814,21813,21808,21842,21829,21772,21810,21861,21838,21817,21832,21805,21819,21824,21835,22282,22279,22523,22548,22498,22518,22492,22516,22528,22509,22525,22536,22520,22539,22515,22479,22535,22510,22499,22514,22501,22508,22497,22542,22524,22544,22503,22529,22540,22513,22505,22512,22541,22532,22876,23136,23128,23125,23143,23134,23096,23093,23149,23120,23135,23141,23148,23123,23140,23127,23107,23133,23122,23108,23131,23112,23182,23102,23117,23097,23116,23152,23145,23111,23121,23126,23106,23132,23410,23406,23489,23488,23641,23838,23819,23837,23834,23840,23820,23848,23821,23846,23845,23823,23856,23826,23843,23839,23854,24126,24116,24241,24244,24249,24242,24243,24374,24376,24475,24470,24479,24714,24720,24710,24766,24752,24762,24787,24788,24783,24804,24793,24797,24776,24753,24795,24759,24778,24767,24771,24781,24768,25394,25445,25482,25474,25469,25533,25502,25517,25501,25495,25515,25486,25455,25479,25488,25454,25519,25461,25500,25453,25518,25468,25508,25403,25503,25464,25477,25473,25489,25485,25456,25939,26061,26213,26209,26203,26201,26204,26210,26392,26745,26759,26768,26780,26733,26734,26798,26795,26966,26735,26787,26796,26793,26741,26740,26802,26767,26743,26770,26748,26731,26738,26794,26752,26737,26750,26779,26774,26763,26784,26761,26788,26744,26747,26769,26764,26762,26749,27446,27443,27447,27448,27537,27535,27533,27534,27532,27690,28096,28075,28084,28083,28276,28076,28137,28130,28087,28150,28116,28160,28104,28128,28127,28118,28094,28133,28124,28125,28123,28148,28106,28093,28141,28144,28090,28117,28098,28111,28105,28112,28146,28115,28157,28119,28109,28131,28091,28922,28941,28919,28951,28916,28940,28912,28932,28915,28944,28924,28927,28934,28947,28928,28920,28918,28939,28930,28942,29310,29307,29308,29311,29469,29463,29447,29457,29464,29450,29448,29439,29455,29470,29576,29686,29688,29685,29700,29697,29693,29703,29696,29690,29692,29695,29708,29707,29684,29704,30052,30051,30158,30162,30159,30155,30156,30161,30160,30351,30345,30419,30521,30511,30509,30513,30514,30516,30515,30525,30501,30523,30517,30792,30802,30793,30797,30794,30796,30758,30789,30800,31076,31079,31081,31082,31075,31083,31073,31163,31226,31224,31222,31223,31375,31380,31376,31541,31559,31540,31525,31536,31522,31524,31539,31512,31530,31517,31537,31531,31533,31535,31538,31544,31514,31523,31892,31896,31894,31907,32053,32061,32056,32054,32058,32069,32044,32041,32065,32071,32062,32063,32074,32059,32040,32611,32661,32668,32669,32667,32714,32715,32717,32720,32721,32711,32719,32713,32799,32798,32795,32839,32835,32840,33048,33061,33049,33051,33069,33055,33068,33054,33057,33045,33063,33053,33058,33297,33336,33331,33338,33332,33330,33396,33680,33699,33704,33677,33658,33651,33700,33652,33679,33665,33685,33689,33653,33684,33705,33661,33667,33676,33693,33691,33706,33675,33662,33701,33711,33672,33687,33712,33663,33702,33671,33710,33654,33690,34393,34390,34495,34487,34498,34497,34501,34490,34480,34504,34489,34483,34488,34508,34484,34491,34492,34499,34493,34494,34898,34953,34965,34984,34978,34986,34970,34961,34977,34975,34968,34983,34969,34971,34967,34980,34988,34956,34963,34958,35202,35286,35289,35285,35376,35367,35372,35358,35897,35899,35932,35933,35965,36005,36221,36219,36217,36284,36290,36281,36287,36289,36568,36574,36573,36572,36567,36576,36577,36900,36875,36881,36892,36876,36897,37103,37098,37104,37108,37106,37107,37076,37099,37100,37097,37206,37208,37210,37203,37205,37356,37364,37361,37363,37368,37348,37369,37354,37355,37367,37352,37358,38266,38278,38280,38524,38509,38507,38513,38511,38591,38762,38916,39141,39319,20635,20629,20628,20638,20619,20643,20611,20620,20622,20637,20584,20636,20626,20610,20615,20831,20948,21266,21265,21412,21415,21905,21928,21925,21933,21879,22085,21922,21907,21896,21903,21941,21889,21923,21906,21924,21885,21900,21926,21887,21909,21921,21902,22284,22569,22583,22553,22558,22567,22563,22568,22517,22600,22565,22556,22555,22579,22591,22582,22574,22585,22584,22573,22572,22587,22881,23215,23188,23199,23162,23202,23198,23160,23206,23164,23205,23212,23189,23214,23095,23172,23178,23191,23171,23179,23209,23163,23165,23180,23196,23183,23187,23197,23530,23501,23499,23508,23505,23498,23502,23564,23600,23863,23875,23915,23873,23883,23871,23861,23889,23886,23893,23859,23866,23890,23869,23857,23897,23874,23865,23881,23864,23868,23858,23862,23872,23877,24132,24129,24408,24486,24485,24491,24777,24761,24780,24802,24782,24772,24852,24818,24842,24854,24837,24821,24851,24824,24828,24830,24769,24835,24856,24861,24848,24831,24836,24843,25162,25492,25521,25520,25550,25573,25576,25583,25539,25757,25587,25546,25568,25590,25557,25586,25589,25697,25567,25534,25565,25564,25540,25560,25555,25538,25543,25548,25547,25544,25584,25559,25561,25906,25959,25962,25956,25948,25960,25957,25996,26013,26014,26030,26064,26066,26236,26220,26235,26240,26225,26233,26218,26226,26369,26892,26835,26884,26844,26922,26860,26858,26865,26895,26838,26871,26859,26852,26870,26899,26896,26867,26849,26887,26828,26888,26992,26804,26897,26863,26822,26900,26872,26832,26877,26876,26856,26891,26890,26903,26830,26824,26845,26846,26854,26868,26833,26886,26836,26857,26901,26917,26823,27449,27451,27455,27452,27540,27543,27545,27541,27581,27632,27634,27635,27696,28156,28230,28231,28191,28233,28296,28220,28221,28229,28258,28203,28223,28225,28253,28275,28188,28211,28235,28224,28241,28219,28163,28206,28254,28264,28252,28257,28209,28200,28256,28273,28267,28217,28194,28208,28243,28261,28199,28280,28260,28279,28245,28281,28242,28262,28213,28214,28250,28960,28958,28975,28923,28974,28977,28963,28965,28962,28978,28959,28968,28986,28955,29259,29274,29320,29321,29318,29317,29323,29458,29451,29488,29474,29489,29491,29479,29490,29485,29478,29475,29493,29452,29742,29740,29744,29739,29718,29722,29729,29741,29745,29732,29731,29725,29737,29728,29746,29947,29999,30063,30060,30183,30170,30177,30182,30173,30175,30180,30167,30357,30354,30426,30534,30535,30532,30541,30533,30538,30542,30539,30540,30686,30700,30816,30820,30821,30812,30829,30833,30826,30830,30832,30825,30824,30814,30818,31092,31091,31090,31088,31234,31242,31235,31244,31236,31385,31462,31460,31562,31547,31556,31560,31564,31566,31552,31576,31557,31906,31902,31912,31905,32088,32111,32099,32083,32086,32103,32106,32079,32109,32092,32107,32082,32084,32105,32081,32095,32078,32574,32575,32613,32614,32674,32672,32673,32727,32849,32847,32848,33022,32980,33091,33098,33106,33103,33095,33085,33101,33082,33254,33262,33271,33272,33273,33284,33340,33341,33343,33397,33595,33743,33785,33827,33728,33768,33810,33767,33764,33788,33782,33808,33734,33736,33771,33763,33727,33793,33757,33765,33752,33791,33761,33739,33742,33750,33781,33737,33801,33807,33758,33809,33798,33730,33779,33749,33786,33735,33745,33770,33811,33731,33772,33774,33732,33787,33751,33762,33819,33755,33790,34520,34530,34534,34515,34531,34522,34538,34525,34539,34524,34540,34537,34519,34536,34513,34888,34902,34901,35002,35031,35001,35000,35008,35006,34998,35004,34999,35005,34994,35073,35017,35221,35224,35223,35293,35290,35291,35406,35405,35385,35417,35392,35415,35416,35396,35397,35410,35400,35409,35402,35404,35407,35935,35969,35968,36026,36030,36016,36025,36021,36228,36224,36233,36312,36307,36301,36295,36310,36316,36303,36309,36313,36296,36311,36293,36591,36599,36602,36601,36582,36590,36581,36597,36583,36584,36598,36587,36593,36588,36596,36585,36909,36916,36911,37126,37164,37124,37119,37116,37128,37113,37115,37121,37120,37127,37125,37123,37217,37220,37215,37218,37216,37377,37386,37413,37379,37402,37414,37391,37388,37376,37394,37375,37373,37382,37380,37415,37378,37404,37412,37401,37399,37381,37398,38267,38285,38284,38288,38535,38526,38536,38537,38531,38528,38594,38600,38595,38641,38640,38764,38768,38766,38919,39081,39147,40166,40697,20099,20100,20150,20669,20671,20678,20654,20676,20682,20660,20680,20674,20656,20673,20666,20657,20683,20681,20662,20664,20951,21114,21112,21115,21116,21955,21979,21964,21968,21963,21962,21981,21952,21972,21956,21993,21951,21970,21901,21967,21973,21986,21974,21960,22002,21965,21977,21954,22292,22611,22632,22628,22607,22605,22601,22639,22613,22606,22621,22617,22629,22619,22589,22627,22641,22780,23239,23236,23243,23226,23224,23217,23221,23216,23231,23240,23227,23238,23223,23232,23242,23220,23222,23245,23225,23184,23510,23512,23513,23583,23603,23921,23907,23882,23909,23922,23916,23902,23912,23911,23906,24048,24143,24142,24138,24141,24139,24261,24268,24262,24267,24263,24384,24495,24493,24823,24905,24906,24875,24901,24886,24882,24878,24902,24879,24911,24873,24896,25120,37224,25123,25125,25124,25541,25585,25579,25616,25618,25609,25632,25636,25651,25667,25631,25621,25624,25657,25655,25634,25635,25612,25638,25648,25640,25665,25653,25647,25610,25626,25664,25637,25639,25611,25575,25627,25646,25633,25614,25967,26002,26067,26246,26252,26261,26256,26251,26250,26265,26260,26232,26400,26982,26975,26936,26958,26978,26993,26943,26949,26986,26937,26946,26967,26969,27002,26952,26953,26933,26988,26931,26941,26981,26864,27000,26932,26985,26944,26991,26948,26998,26968,26945,26996,26956,26939,26955,26935,26972,26959,26961,26930,26962,26927,27003,26940,27462,27461,27459,27458,27464,27457,27547,64013,27643,27644,27641,27639,27640,28315,28374,28360,28303,28352,28319,28307,28308,28320,28337,28345,28358,28370,28349,28353,28318,28361,28343,28336,28365,28326,28367,28338,28350,28355,28380,28376,28313,28306,28302,28301,28324,28321,28351,28339,28368,28362,28311,28334,28323,28999,29012,29010,29027,29024,28993,29021,29026,29042,29048,29034,29025,28994,29016,28995,29003,29040,29023,29008,29011,28996,29005,29018,29263,29325,29324,29329,29328,29326,29500,29506,29499,29498,29504,29514,29513,29764,29770,29771,29778,29777,29783,29760,29775,29776,29774,29762,29766,29773,29780,29921,29951,29950,29949,29981,30073,30071,27011,30191,30223,30211,30199,30206,30204,30201,30200,30224,30203,30198,30189,30197,30205,30361,30389,30429,30549,30559,30560,30546,30550,30554,30569,30567,30548,30553,30573,30688,30855,30874,30868,30863,30852,30869,30853,30854,30881,30851,30841,30873,30848,30870,30843,31100,31106,31101,31097,31249,31256,31257,31250,31255,31253,31266,31251,31259,31248,31395,31394,31390,31467,31590,31588,31597,31604,31593,31602,31589,31603,31601,31600,31585,31608,31606,31587,31922,31924,31919,32136,32134,32128,32141,32127,32133,32122,32142,32123,32131,32124,32140,32148,32132,32125,32146,32621,32619,32615,32616,32620,32678,32677,32679,32731,32732,32801,33124,33120,33143,33116,33129,33115,33122,33138,26401,33118,33142,33127,33135,33092,33121,33309,33353,33348,33344,33346,33349,34033,33855,33878,33910,33913,33935,33933,33893,33873,33856,33926,33895,33840,33869,33917,33882,33881,33908,33907,33885,34055,33886,33847,33850,33844,33914,33859,33912,33842,33861,33833,33753,33867,33839,33858,33837,33887,33904,33849,33870,33868,33874,33903,33989,33934,33851,33863,33846,33843,33896,33918,33860,33835,33888,33876,33902,33872,34571,34564,34551,34572,34554,34518,34549,34637,34552,34574,34569,34561,34550,34573,34565,35030,35019,35021,35022,35038,35035,35034,35020,35024,35205,35227,35295,35301,35300,35297,35296,35298,35292,35302,35446,35462,35455,35425,35391,35447,35458,35460,35445,35459,35457,35444,35450,35900,35915,35914,35941,35940,35942,35974,35972,35973,36044,36200,36201,36241,36236,36238,36239,36237,36243,36244,36240,36242,36336,36320,36332,36337,36334,36304,36329,36323,36322,36327,36338,36331,36340,36614,36607,36609,36608,36613,36615,36616,36610,36619,36946,36927,36932,36937,36925,37136,37133,37135,37137,37142,37140,37131,37134,37230,37231,37448,37458,37424,37434,37478,37427,37477,37470,37507,37422,37450,37446,37485,37484,37455,37472,37479,37487,37430,37473,37488,37425,37460,37475,37456,37490,37454,37459,37452,37462,37426,38303,38300,38302,38299,38546,38547,38545,38551,38606,38650,38653,38648,38645,38771,38775,38776,38770,38927,38925,38926,39084,39158,39161,39343,39346,39344,39349,39597,39595,39771,40170,40173,40167,40576,40701,20710,20692,20695,20712,20723,20699,20714,20701,20708,20691,20716,20720,20719,20707,20704,20952,21120,21121,21225,21227,21296,21420,22055,22037,22028,22034,22012,22031,22044,22017,22035,22018,22010,22045,22020,22015,22009,22665,22652,22672,22680,22662,22657,22655,22644,22667,22650,22663,22673,22670,22646,22658,22664,22651,22676,22671,22782,22891,23260,23278,23269,23253,23274,23258,23277,23275,23283,23266,23264,23259,23276,23262,23261,23257,23272,23263,23415,23520,23523,23651,23938,23936,23933,23942,23930,23937,23927,23946,23945,23944,23934,23932,23949,23929,23935,24152,24153,24147,24280,24273,24279,24270,24284,24277,24281,24274,24276,24388,24387,24431,24502,24876,24872,24897,24926,24945,24947,24914,24915,24946,24940,24960,24948,24916,24954,24923,24933,24891,24938,24929,24918,25129,25127,25131,25643,25677,25691,25693,25716,25718,25714,25715,25725,25717,25702,25766,25678,25730,25694,25692,25675,25683,25696,25680,25727,25663,25708,25707,25689,25701,25719,25971,26016,26273,26272,26271,26373,26372,26402,27057,27062,27081,27040,27086,27030,27056,27052,27068,27025,27033,27022,27047,27021,27049,27070,27055,27071,27076,27069,27044,27092,27065,27082,27034,27087,27059,27027,27050,27041,27038,27097,27031,27024,27074,27061,27045,27078,27466,27469,27467,27550,27551,27552,27587,27588,27646,28366,28405,28401,28419,28453,28408,28471,28411,28462,28425,28494,28441,28442,28455,28440,28475,28434,28397,28426,28470,28531,28409,28398,28461,28480,28464,28476,28469,28395,28423,28430,28483,28421,28413,28406,28473,28444,28412,28474,28447,28429,28446,28424,28449,29063,29072,29065,29056,29061,29058,29071,29051,29062,29057,29079,29252,29267,29335,29333,29331,29507,29517,29521,29516,29794,29811,29809,29813,29810,29799,29806,29952,29954,29955,30077,30096,30230,30216,30220,30229,30225,30218,30228,30392,30593,30588,30597,30594,30574,30592,30575,30590,30595,30898,30890,30900,30893,30888,30846,30891,30878,30885,30880,30892,30882,30884,31128,31114,31115,31126,31125,31124,31123,31127,31112,31122,31120,31275,31306,31280,31279,31272,31270,31400,31403,31404,31470,31624,31644,31626,31633,31632,31638,31629,31628,31643,31630,31621,31640,21124,31641,31652,31618,31931,31935,31932,31930,32167,32183,32194,32163,32170,32193,32192,32197,32157,32206,32196,32198,32203,32204,32175,32185,32150,32188,32159,32166,32174,32169,32161,32201,32627,32738,32739,32741,32734,32804,32861,32860,33161,33158,33155,33159,33165,33164,33163,33301,33943,33956,33953,33951,33978,33998,33986,33964,33966,33963,33977,33972,33985,33997,33962,33946,33969,34000,33949,33959,33979,33954,33940,33991,33996,33947,33961,33967,33960,34006,33944,33974,33999,33952,34007,34004,34002,34011,33968,33937,34401,34611,34595,34600,34667,34624,34606,34590,34593,34585,34587,34627,34604,34625,34622,34630,34592,34610,34602,34605,34620,34578,34618,34609,34613,34626,34598,34599,34616,34596,34586,34608,34577,35063,35047,35057,35058,35066,35070,35054,35068,35062,35067,35056,35052,35051,35229,35233,35231,35230,35305,35307,35304,35499,35481,35467,35474,35471,35478,35901,35944,35945,36053,36047,36055,36246,36361,36354,36351,36365,36349,36362,36355,36359,36358,36357,36350,36352,36356,36624,36625,36622,36621,37155,37148,37152,37154,37151,37149,37146,37156,37153,37147,37242,37234,37241,37235,37541,37540,37494,37531,37498,37536,37524,37546,37517,37542,37530,37547,37497,37527,37503,37539,37614,37518,37506,37525,37538,37501,37512,37537,37514,37510,37516,37529,37543,37502,37511,37545,37533,37515,37421,38558,38561,38655,38744,38781,38778,38782,38787,38784,38786,38779,38788,38785,38783,38862,38861,38934,39085,39086,39170,39168,39175,39325,39324,39363,39353,39355,39354,39362,39357,39367,39601,39651,39655,39742,39743,39776,39777,39775,40177,40178,40181,40615,20735,20739,20784,20728,20742,20743,20726,20734,20747,20748,20733,20746,21131,21132,21233,21231,22088,22082,22092,22069,22081,22090,22089,22086,22104,22106,22080,22067,22077,22060,22078,22072,22058,22074,22298,22699,22685,22705,22688,22691,22703,22700,22693,22689,22783,23295,23284,23293,23287,23286,23299,23288,23298,23289,23297,23303,23301,23311,23655,23961,23959,23967,23954,23970,23955,23957,23968,23964,23969,23962,23966,24169,24157,24160,24156,32243,24283,24286,24289,24393,24498,24971,24963,24953,25009,25008,24994,24969,24987,24979,25007,25005,24991,24978,25002,24993,24973,24934,25011,25133,25710,25712,25750,25760,25733,25751,25756,25743,25739,25738,25740,25763,25759,25704,25777,25752,25974,25978,25977,25979,26034,26035,26293,26288,26281,26290,26295,26282,26287,27136,27142,27159,27109,27128,27157,27121,27108,27168,27135,27116,27106,27163,27165,27134,27175,27122,27118,27156,27127,27111,27200,27144,27110,27131,27149,27132,27115,27145,27140,27160,27173,27151,27126,27174,27143,27124,27158,27473,27557,27555,27554,27558,27649,27648,27647,27650,28481,28454,28542,28551,28614,28562,28557,28553,28556,28514,28495,28549,28506,28566,28534,28524,28546,28501,28530,28498,28496,28503,28564,28563,28509,28416,28513,28523,28541,28519,28560,28499,28555,28521,28543,28565,28515,28535,28522,28539,29106,29103,29083,29104,29088,29082,29097,29109,29085,29093,29086,29092,29089,29098,29084,29095,29107,29336,29338,29528,29522,29534,29535,29536,29533,29531,29537,29530,29529,29538,29831,29833,29834,29830,29825,29821,29829,29832,29820,29817,29960,29959,30078,30245,30238,30233,30237,30236,30243,30234,30248,30235,30364,30365,30366,30363,30605,30607,30601,30600,30925,30907,30927,30924,30929,30926,30932,30920,30915,30916,30921,31130,31137,31136,31132,31138,31131,27510,31289,31410,31412,31411,31671,31691,31678,31660,31694,31663,31673,31690,31669,31941,31944,31948,31947,32247,32219,32234,32231,32215,32225,32259,32250,32230,32246,32241,32240,32238,32223,32630,32684,32688,32685,32749,32747,32746,32748,32742,32744,32868,32871,33187,33183,33182,33173,33186,33177,33175,33302,33359,33363,33362,33360,33358,33361,34084,34107,34063,34048,34089,34062,34057,34061,34079,34058,34087,34076,34043,34091,34042,34056,34060,34036,34090,34034,34069,34039,34027,34035,34044,34066,34026,34025,34070,34046,34088,34077,34094,34050,34045,34078,34038,34097,34086,34023,34024,34032,34031,34041,34072,34080,34096,34059,34073,34095,34402,34646,34659,34660,34679,34785,34675,34648,34644,34651,34642,34657,34650,34641,34654,34669,34666,34640,34638,34655,34653,34671,34668,34682,34670,34652,34661,34639,34683,34677,34658,34663,34665,34906,35077,35084,35092,35083,35095,35096,35097,35078,35094,35089,35086,35081,35234,35236,35235,35309,35312,35308,35535,35526,35512,35539,35537,35540,35541,35515,35543,35518,35520,35525,35544,35523,35514,35517,35545,35902,35917,35983,36069,36063,36057,36072,36058,36061,36071,36256,36252,36257,36251,36384,36387,36389,36388,36398,36373,36379,36374,36369,36377,36390,36391,36372,36370,36376,36371,36380,36375,36378,36652,36644,36632,36634,36640,36643,36630,36631,36979,36976,36975,36967,36971,37167,37163,37161,37162,37170,37158,37166,37253,37254,37258,37249,37250,37252,37248,37584,37571,37572,37568,37593,37558,37583,37617,37599,37592,37609,37591,37597,37580,37615,37570,37608,37578,37576,37582,37606,37581,37589,37577,37600,37598,37607,37585,37587,37557,37601,37574,37556,38268,38316,38315,38318,38320,38564,38562,38611,38661,38664,38658,38746,38794,38798,38792,38864,38863,38942,38941,38950,38953,38952,38944,38939,38951,39090,39176,39162,39185,39188,39190,39191,39189,39388,39373,39375,39379,39380,39374,39369,39382,39384,39371,39383,39372,39603,39660,39659,39667,39666,39665,39750,39747,39783,39796,39793,39782,39798,39797,39792,39784,39780,39788,40188,40186,40189,40191,40183,40199,40192,40185,40187,40200,40197,40196,40579,40659,40719,40720,20764,20755,20759,20762,20753,20958,21300,21473,22128,22112,22126,22131,22118,22115,22125,22130,22110,22135,22300,22299,22728,22717,22729,22719,22714,22722,22716,22726,23319,23321,23323,23329,23316,23315,23312,23318,23336,23322,23328,23326,23535,23980,23985,23977,23975,23989,23984,23982,23978,23976,23986,23981,23983,23988,24167,24168,24166,24175,24297,24295,24294,24296,24293,24395,24508,24989,25000,24982,25029,25012,25030,25025,25036,25018,25023,25016,24972,25815,25814,25808,25807,25801,25789,25737,25795,25819,25843,25817,25907,25983,25980,26018,26312,26302,26304,26314,26315,26319,26301,26299,26298,26316,26403,27188,27238,27209,27239,27186,27240,27198,27229,27245,27254,27227,27217,27176,27226,27195,27199,27201,27242,27236,27216,27215,27220,27247,27241,27232,27196,27230,27222,27221,27213,27214,27206,27477,27476,27478,27559,27562,27563,27592,27591,27652,27651,27654,28589,28619,28579,28615,28604,28622,28616,28510,28612,28605,28574,28618,28584,28676,28581,28590,28602,28588,28586,28623,28607,28600,28578,28617,28587,28621,28591,28594,28592,29125,29122,29119,29112,29142,29120,29121,29131,29140,29130,29127,29135,29117,29144,29116,29126,29146,29147,29341,29342,29545,29542,29543,29548,29541,29547,29546,29823,29850,29856,29844,29842,29845,29857,29963,30080,30255,30253,30257,30269,30259,30268,30261,30258,30256,30395,30438,30618,30621,30625,30620,30619,30626,30627,30613,30617,30615,30941,30953,30949,30954,30942,30947,30939,30945,30946,30957,30943,30944,31140,31300,31304,31303,31414,31416,31413,31409,31415,31710,31715,31719,31709,31701,31717,31706,31720,31737,31700,31722,31714,31708,31723,31704,31711,31954,31956,31959,31952,31953,32274,32289,32279,32268,32287,32288,32275,32270,32284,32277,32282,32290,32267,32271,32278,32269,32276,32293,32292,32579,32635,32636,32634,32689,32751,32810,32809,32876,33201,33190,33198,33209,33205,33195,33200,33196,33204,33202,33207,33191,33266,33365,33366,33367,34134,34117,34155,34125,34131,34145,34136,34112,34118,34148,34113,34146,34116,34129,34119,34147,34110,34139,34161,34126,34158,34165,34133,34151,34144,34188,34150,34141,34132,34149,34156,34403,34405,34404,34715,34703,34711,34707,34706,34696,34689,34710,34712,34681,34695,34723,34693,34704,34705,34717,34692,34708,34716,34714,34697,35102,35110,35120,35117,35118,35111,35121,35106,35113,35107,35119,35116,35103,35313,35552,35554,35570,35572,35573,35549,35604,35556,35551,35568,35528,35550,35553,35560,35583,35567,35579,35985,35986,35984,36085,36078,36081,36080,36083,36204,36206,36261,36263,36403,36414,36408,36416,36421,36406,36412,36413,36417,36400,36415,36541,36662,36654,36661,36658,36665,36663,36660,36982,36985,36987,36998,37114,37171,37173,37174,37267,37264,37265,37261,37263,37671,37662,37640,37663,37638,37647,37754,37688,37692,37659,37667,37650,37633,37702,37677,37646,37645,37579,37661,37626,37669,37651,37625,37623,37684,37634,37668,37631,37673,37689,37685,37674,37652,37644,37643,37630,37641,37632,37627,37654,38332,38349,38334,38329,38330,38326,38335,38325,38333,38569,38612,38667,38674,38672,38809,38807,38804,38896,38904,38965,38959,38962,39204,39199,39207,39209,39326,39406,39404,39397,39396,39408,39395,39402,39401,39399,39609,39615,39604,39611,39670,39674,39673,39671,39731,39808,39813,39815,39804,39806,39803,39810,39827,39826,39824,39802,39829,39805,39816,40229,40215,40224,40222,40212,40233,40221,40216,40226,40208,40217,40223,40584,40582,40583,40622,40621,40661,40662,40698,40722,40765,20774,20773,20770,20772,20768,20777,21236,22163,22156,22157,22150,22148,22147,22142,22146,22143,22145,22742,22740,22735,22738,23341,23333,23346,23331,23340,23335,23334,23343,23342,23419,23537,23538,23991,24172,24170,24510,24507,25027,25013,25020,25063,25056,25061,25060,25064,25054,25839,25833,25827,25835,25828,25832,25985,25984,26038,26074,26322,27277,27286,27265,27301,27273,27295,27291,27297,27294,27271,27283,27278,27285,27267,27304,27300,27281,27263,27302,27290,27269,27276,27282,27483,27565,27657,28620,28585,28660,28628,28643,28636,28653,28647,28646,28638,28658,28637,28642,28648,29153,29169,29160,29170,29156,29168,29154,29555,29550,29551,29847,29874,29867,29840,29866,29869,29873,29861,29871,29968,29969,29970,29967,30084,30275,30280,30281,30279,30372,30441,30645,30635,30642,30647,30646,30644,30641,30632,30704,30963,30973,30978,30971,30972,30962,30981,30969,30974,30980,31147,31144,31324,31323,31318,31320,31316,31322,31422,31424,31425,31749,31759,31730,31744,31743,31739,31758,31732,31755,31731,31746,31753,31747,31745,31736,31741,31750,31728,31729,31760,31754,31976,32301,32316,32322,32307,38984,32312,32298,32329,32320,32327,32297,32332,32304,32315,32310,32324,32314,32581,32639,32638,32637,32756,32754,32812,33211,33220,33228,33226,33221,33223,33212,33257,33371,33370,33372,34179,34176,34191,34215,34197,34208,34187,34211,34171,34212,34202,34206,34167,34172,34185,34209,34170,34168,34135,34190,34198,34182,34189,34201,34205,34177,34210,34178,34184,34181,34169,34166,34200,34192,34207,34408,34750,34730,34733,34757,34736,34732,34745,34741,34748,34734,34761,34755,34754,34764,34743,34735,34756,34762,34740,34742,34751,34744,34749,34782,34738,35125,35123,35132,35134,35137,35154,35127,35138,35245,35247,35246,35314,35315,35614,35608,35606,35601,35589,35595,35618,35599,35602,35605,35591,35597,35592,35590,35612,35603,35610,35919,35952,35954,35953,35951,35989,35988,36089,36207,36430,36429,36435,36432,36428,36423,36675,36672,36997,36990,37176,37274,37282,37275,37273,37279,37281,37277,37280,37793,37763,37807,37732,37718,37703,37756,37720,37724,37750,37705,37712,37713,37728,37741,37775,37708,37738,37753,37719,37717,37714,37711,37745,37751,37755,37729,37726,37731,37735,37760,37710,37721,38343,38336,38345,38339,38341,38327,38574,38576,38572,38688,38687,38680,38685,38681,38810,38817,38812,38814,38813,38869,38868,38897,38977,38980,38986,38985,38981,38979,39205,39211,39212,39210,39219,39218,39215,39213,39217,39216,39320,39331,39329,39426,39418,39412,39415,39417,39416,39414,39419,39421,39422,39420,39427,39614,39678,39677,39681,39676,39752,39834,39848,39838,39835,39846,39841,39845,39844,39814,39842,39840,39855,40243,40257,40295,40246,40238,40239,40241,40248,40240,40261,40258,40259,40254,40247,40256,40253,32757,40237,40586,40585,40589,40624,40648,40666,40699,40703,40740,40739,40738,40788,40864,20785,20781,20782,22168,22172,22167,22170,22173,22169,22896,23356,23657,23658,24000,24173,24174,25048,25055,25069,25070,25073,25066,25072,25067,25046,25065,25855,25860,25853,25848,25857,25859,25852,26004,26075,26330,26331,26328,27333,27321,27325,27361,27334,27322,27318,27319,27335,27316,27309,27486,27593,27659,28679,28684,28685,28673,28677,28692,28686,28671,28672,28667,28710,28668,28663,28682,29185,29183,29177,29187,29181,29558,29880,29888,29877,29889,29886,29878,29883,29890,29972,29971,30300,30308,30297,30288,30291,30295,30298,30374,30397,30444,30658,30650,30975,30988,30995,30996,30985,30992,30994,30993,31149,31148,31327,31772,31785,31769,31776,31775,31789,31773,31782,31784,31778,31781,31792,32348,32336,32342,32355,32344,32354,32351,32337,32352,32343,32339,32693,32691,32759,32760,32885,33233,33234,33232,33375,33374,34228,34246,34240,34243,34242,34227,34229,34237,34247,34244,34239,34251,34254,34248,34245,34225,34230,34258,34340,34232,34231,34238,34409,34791,34790,34786,34779,34795,34794,34789,34783,34803,34788,34772,34780,34771,34797,34776,34787,34724,34775,34777,34817,34804,34792,34781,35155,35147,35151,35148,35142,35152,35153,35145,35626,35623,35619,35635,35632,35637,35655,35631,35644,35646,35633,35621,35639,35622,35638,35630,35620,35643,35645,35642,35906,35957,35993,35992,35991,36094,36100,36098,36096,36444,36450,36448,36439,36438,36446,36453,36455,36443,36442,36449,36445,36457,36436,36678,36679,36680,36683,37160,37178,37179,37182,37288,37285,37287,37295,37290,37813,37772,37778,37815,37787,37789,37769,37799,37774,37802,37790,37798,37781,37768,37785,37791,37773,37809,37777,37810,37796,37800,37812,37795,37797,38354,38355,38353,38579,38615,38618,24002,38623,38616,38621,38691,38690,38693,38828,38830,38824,38827,38820,38826,38818,38821,38871,38873,38870,38872,38906,38992,38993,38994,39096,39233,39228,39226,39439,39435,39433,39437,39428,39441,39434,39429,39431,39430,39616,39644,39688,39684,39685,39721,39733,39754,39756,39755,39879,39878,39875,39871,39873,39861,39864,39891,39862,39876,39865,39869,40284,40275,40271,40266,40283,40267,40281,40278,40268,40279,40274,40276,40287,40280,40282,40590,40588,40671,40705,40704,40726,40741,40747,40746,40745,40744,40780,40789,20788,20789,21142,21239,21428,22187,22189,22182,22183,22186,22188,22746,22749,22747,22802,23357,23358,23359,24003,24176,24511,25083,25863,25872,25869,25865,25868,25870,25988,26078,26077,26334,27367,27360,27340,27345,27353,27339,27359,27356,27344,27371,27343,27341,27358,27488,27568,27660,28697,28711,28704,28694,28715,28705,28706,28707,28713,28695,28708,28700,28714,29196,29194,29191,29186,29189,29349,29350,29348,29347,29345,29899,29893,29879,29891,29974,30304,30665,30666,30660,30705,31005,31003,31009,31004,30999,31006,31152,31335,31336,31795,31804,31801,31788,31803,31980,31978,32374,32373,32376,32368,32375,32367,32378,32370,32372,32360,32587,32586,32643,32646,32695,32765,32766,32888,33239,33237,33380,33377,33379,34283,34289,34285,34265,34273,34280,34266,34263,34284,34290,34296,34264,34271,34275,34268,34257,34288,34278,34287,34270,34274,34816,34810,34819,34806,34807,34825,34828,34827,34822,34812,34824,34815,34826,34818,35170,35162,35163,35159,35169,35164,35160,35165,35161,35208,35255,35254,35318,35664,35656,35658,35648,35667,35670,35668,35659,35669,35665,35650,35666,35671,35907,35959,35958,35994,36102,36103,36105,36268,36266,36269,36267,36461,36472,36467,36458,36463,36475,36546,36690,36689,36687,36688,36691,36788,37184,37183,37296,37293,37854,37831,37839,37826,37850,37840,37881,37868,37836,37849,37801,37862,37834,37844,37870,37859,37845,37828,37838,37824,37842,37863,38269,38362,38363,38625,38697,38699,38700,38696,38694,38835,38839,38838,38877,38878,38879,39004,39001,39005,38999,39103,39101,39099,39102,39240,39239,39235,39334,39335,39450,39445,39461,39453,39460,39451,39458,39456,39463,39459,39454,39452,39444,39618,39691,39690,39694,39692,39735,39914,39915,39904,39902,39908,39910,39906,39920,39892,39895,39916,39900,39897,39909,39893,39905,39898,40311,40321,40330,40324,40328,40305,40320,40312,40326,40331,40332,40317,40299,40308,40309,40304,40297,40325,40307,40315,40322,40303,40313,40319,40327,40296,40596,40593,40640,40700,40749,40768,40769,40781,40790,40791,40792,21303,22194,22197,22195,22755,23365,24006,24007,24302,24303,24512,24513,25081,25879,25878,25877,25875,26079,26344,26339,26340,27379,27376,27370,27368,27385,27377,27374,27375,28732,28725,28719,28727,28724,28721,28738,28728,28735,28730,28729,28736,28731,28723,28737,29203,29204,29352,29565,29564,29882,30379,30378,30398,30445,30668,30670,30671,30669,30706,31013,31011,31015,31016,31012,31017,31154,31342,31340,31341,31479,31817,31816,31818,31815,31813,31982,32379,32382,32385,32384,32698,32767,32889,33243,33241,33291,33384,33385,34338,34303,34305,34302,34331,34304,34294,34308,34313,34309,34316,34301,34841,34832,34833,34839,34835,34838,35171,35174,35257,35319,35680,35690,35677,35688,35683,35685,35687,35693,36270,36486,36488,36484,36697,36694,36695,36693,36696,36698,37005,37187,37185,37303,37301,37298,37299,37899,37907,37883,37920,37903,37908,37886,37909,37904,37928,37913,37901,37877,37888,37879,37895,37902,37910,37906,37882,37897,37880,37898,37887,37884,37900,37878,37905,37894,38366,38368,38367,38702,38703,38841,38843,38909,38910,39008,39010,39011,39007,39105,39106,39248,39246,39257,39244,39243,39251,39474,39476,39473,39468,39466,39478,39465,39470,39480,39469,39623,39626,39622,39696,39698,39697,39947,39944,39927,39941,39954,39928,40000,39943,39950,39942,39959,39956,39945,40351,40345,40356,40349,40338,40344,40336,40347,40352,40340,40348,40362,40343,40353,40346,40354,40360,40350,40355,40383,40361,40342,40358,40359,40601,40603,40602,40677,40676,40679,40678,40752,40750,40795,40800,40798,40797,40793,40849,20794,20793,21144,21143,22211,22205,22206,23368,23367,24011,24015,24305,25085,25883,27394,27388,27395,27384,27392,28739,28740,28746,28744,28745,28741,28742,29213,29210,29209,29566,29975,30314,30672,31021,31025,31023,31828,31827,31986,32394,32391,32392,32395,32390,32397,32589,32699,32816,33245,34328,34346,34342,34335,34339,34332,34329,34343,34350,34337,34336,34345,34334,34341,34857,34845,34843,34848,34852,34844,34859,34890,35181,35177,35182,35179,35322,35705,35704,35653,35706,35707,36112,36116,36271,36494,36492,36702,36699,36701,37190,37188,37189,37305,37951,37947,37942,37929,37949,37948,37936,37945,37930,37943,37932,37952,37937,38373,38372,38371,38709,38714,38847,38881,39012,39113,39110,39104,39256,39254,39481,39485,39494,39492,39490,39489,39482,39487,39629,39701,39703,39704,39702,39738,39762,39979,39965,39964,39980,39971,39976,39977,39972,39969,40375,40374,40380,40385,40391,40394,40399,40382,40389,40387,40379,40373,40398,40377,40378,40364,40392,40369,40365,40396,40371,40397,40370,40570,40604,40683,40686,40685,40731,40728,40730,40753,40782,40805,40804,40850,20153,22214,22213,22219,22897,23371,23372,24021,24017,24306,25889,25888,25894,25890,27403,27400,27401,27661,28757,28758,28759,28754,29214,29215,29353,29567,29912,29909,29913,29911,30317,30381,31029,31156,31344,31345,31831,31836,31833,31835,31834,31988,31985,32401,32591,32647,33246,33387,34356,34357,34355,34348,34354,34358,34860,34856,34854,34858,34853,35185,35263,35262,35323,35710,35716,35714,35718,35717,35711,36117,36501,36500,36506,36498,36496,36502,36503,36704,36706,37191,37964,37968,37962,37963,37967,37959,37957,37960,37961,37958,38719,38883,39018,39017,39115,39252,39259,39502,39507,39508,39500,39503,39496,39498,39497,39506,39504,39632,39705,39723,39739,39766,39765,40006,40008,39999,40004,39993,39987,40001,39996,39991,39988,39986,39997,39990,40411,40402,40414,40410,40395,40400,40412,40401,40415,40425,40409,40408,40406,40437,40405,40413,40630,40688,40757,40755,40754,40770,40811,40853,40866,20797,21145,22760,22759,22898,23373,24024,34863,24399,25089,25091,25092,25897,25893,26006,26347,27409,27410,27407,27594,28763,28762,29218,29570,29569,29571,30320,30676,31847,31846,32405,33388,34362,34368,34361,34364,34353,34363,34366,34864,34866,34862,34867,35190,35188,35187,35326,35724,35726,35723,35720,35909,36121,36504,36708,36707,37308,37986,37973,37981,37975,37982,38852,38853,38912,39510,39513,39710,39711,39712,40018,40024,40016,40010,40013,40011,40021,40025,40012,40014,40443,40439,40431,40419,40427,40440,40420,40438,40417,40430,40422,40434,40432,40418,40428,40436,40435,40424,40429,40642,40656,40690,40691,40710,40732,40760,40759,40758,40771,40783,40817,40816,40814,40815,22227,22221,23374,23661,25901,26349,26350,27411,28767,28769,28765,28768,29219,29915,29925,30677,31032,31159,31158,31850,32407,32649,33389,34371,34872,34871,34869,34891,35732,35733,36510,36511,36512,36509,37310,37309,37314,37995,37992,37993,38629,38726,38723,38727,38855,38885,39518,39637,39769,40035,40039,40038,40034,40030,40032,40450,40446,40455,40451,40454,40453,40448,40449,40457,40447,40445,40452,40608,40734,40774,40820,40821,40822,22228,25902,26040,27416,27417,27415,27418,28770,29222,29354,30680,30681,31033,31849,31851,31990,32410,32408,32411,32409,33248,33249,34374,34375,34376,35193,35194,35196,35195,35327,35736,35737,36517,36516,36515,37998,37997,37999,38001,38003,38729,39026,39263,40040,40046,40045,40459,40461,40464,40463,40466,40465,40609,40693,40713,40775,40824,40827,40826,40825,22302,28774,31855,34876,36274,36518,37315,38004,38008,38006,38005,39520,40052,40051,40049,40053,40468,40467,40694,40714,40868,28776,28773,31991,34410,34878,34877,34879,35742,35996,36521,36553,38731,39027,39028,39116,39265,39339,39524,39526,39527,39716,40469,40471,40776,25095,27422,29223,34380,36520,38018,38016,38017,39529,39528,39726,40473,29225,34379,35743,38019,40057,40631,30325,39531,40058,40477,28777,28778,40612,40830,40777,40856,30849,37561,35023,22715,24658,31911,23290,9556,9574,9559,9568,9580,9571,9562,9577,9565,9554,9572,9557,9566,9578,9569,9560,9575,9563,9555,9573,9558,9567,9579,9570,9561,9576,9564,9553,9552,9581,9582,9584,9583,65517,132423,37595,132575,147397,34124,17077,29679,20917,13897,149826,166372,37700,137691,33518,146632,30780,26436,25311,149811,166314,131744,158643,135941,20395,140525,20488,159017,162436,144896,150193,140563,20521,131966,24484,131968,131911,28379,132127,20605,20737,13434,20750,39020,14147,33814,149924,132231,20832,144308,20842,134143,139516,131813,140592,132494,143923,137603,23426,34685,132531,146585,20914,20920,40244,20937,20943,20945,15580,20947,150182,20915,20962,21314,20973,33741,26942,145197,24443,21003,21030,21052,21173,21079,21140,21177,21189,31765,34114,21216,34317,158483,21253,166622,21833,28377,147328,133460,147436,21299,21316,134114,27851,136998,26651,29653,24650,16042,14540,136936,29149,17570,21357,21364,165547,21374,21375,136598,136723,30694,21395,166555,21408,21419,21422,29607,153458,16217,29596,21441,21445,27721,20041,22526,21465,15019,134031,21472,147435,142755,21494,134263,21523,28793,21803,26199,27995,21613,158547,134516,21853,21647,21668,18342,136973,134877,15796,134477,166332,140952,21831,19693,21551,29719,21894,21929,22021,137431,147514,17746,148533,26291,135348,22071,26317,144010,26276,26285,22093,22095,30961,22257,38791,21502,22272,22255,22253,166758,13859,135759,22342,147877,27758,28811,22338,14001,158846,22502,136214,22531,136276,148323,22566,150517,22620,22698,13665,22752,22748,135740,22779,23551,22339,172368,148088,37843,13729,22815,26790,14019,28249,136766,23076,21843,136850,34053,22985,134478,158849,159018,137180,23001,137211,137138,159142,28017,137256,136917,23033,159301,23211,23139,14054,149929,23159,14088,23190,29797,23251,159649,140628,15749,137489,14130,136888,24195,21200,23414,25992,23420,162318,16388,18525,131588,23509,24928,137780,154060,132517,23539,23453,19728,23557,138052,23571,29646,23572,138405,158504,23625,18653,23685,23785,23791,23947,138745,138807,23824,23832,23878,138916,23738,24023,33532,14381,149761,139337,139635,33415,14390,15298,24110,27274,24181,24186,148668,134355,21414,20151,24272,21416,137073,24073,24308,164994,24313,24315,14496,24316,26686,37915,24333,131521,194708,15070,18606,135994,24378,157832,140240,24408,140401,24419,38845,159342,24434,37696,166454,24487,23990,15711,152144,139114,159992,140904,37334,131742,166441,24625,26245,137335,14691,15815,13881,22416,141236,31089,15936,24734,24740,24755,149890,149903,162387,29860,20705,23200,24932,33828,24898,194726,159442,24961,20980,132694,24967,23466,147383,141407,25043,166813,170333,25040,14642,141696,141505,24611,24924,25886,25483,131352,25285,137072,25301,142861,25452,149983,14871,25656,25592,136078,137212,25744,28554,142902,38932,147596,153373,25825,25829,38011,14950,25658,14935,25933,28438,150056,150051,25989,25965,25951,143486,26037,149824,19255,26065,16600,137257,26080,26083,24543,144384,26136,143863,143864,26180,143780,143781,26187,134773,26215,152038,26227,26228,138813,143921,165364,143816,152339,30661,141559,39332,26370,148380,150049,15147,27130,145346,26462,26471,26466,147917,168173,26583,17641,26658,28240,37436,26625,144358,159136,26717,144495,27105,27147,166623,26995,26819,144845,26881,26880,15666,14849,144956,15232,26540,26977,166474,17148,26934,27032,15265,132041,33635,20624,27129,144985,139562,27205,145155,27293,15347,26545,27336,168348,15373,27421,133411,24798,27445,27508,141261,28341,146139,132021,137560,14144,21537,146266,27617,147196,27612,27703,140427,149745,158545,27738,33318,27769,146876,17605,146877,147876,149772,149760,146633,14053,15595,134450,39811,143865,140433,32655,26679,159013,159137,159211,28054,27996,28284,28420,149887,147589,159346,34099,159604,20935,27804,28189,33838,166689,28207,146991,29779,147330,31180,28239,23185,143435,28664,14093,28573,146992,28410,136343,147517,17749,37872,28484,28508,15694,28532,168304,15675,28575,147780,28627,147601,147797,147513,147440,147380,147775,20959,147798,147799,147776,156125,28747,28798,28839,28801,28876,28885,28886,28895,16644,15848,29108,29078,148087,28971,28997,23176,29002,29038,23708,148325,29007,37730,148161,28972,148570,150055,150050,29114,166888,28861,29198,37954,29205,22801,37955,29220,37697,153093,29230,29248,149876,26813,29269,29271,15957,143428,26637,28477,29314,29482,29483,149539,165931,18669,165892,29480,29486,29647,29610,134202,158254,29641,29769,147938,136935,150052,26147,14021,149943,149901,150011,29687,29717,26883,150054,29753,132547,16087,29788,141485,29792,167602,29767,29668,29814,33721,29804,14128,29812,37873,27180,29826,18771,150156,147807,150137,166799,23366,166915,137374,29896,137608,29966,29929,29982,167641,137803,23511,167596,37765,30029,30026,30055,30062,151426,16132,150803,30094,29789,30110,30132,30210,30252,30289,30287,30319,30326,156661,30352,33263,14328,157969,157966,30369,30373,30391,30412,159647,33890,151709,151933,138780,30494,30502,30528,25775,152096,30552,144044,30639,166244,166248,136897,30708,30729,136054,150034,26826,30895,30919,30931,38565,31022,153056,30935,31028,30897,161292,36792,34948,166699,155779,140828,31110,35072,26882,31104,153687,31133,162617,31036,31145,28202,160038,16040,31174,168205,31188],
  "euc-kr":[44034,44035,44037,44038,44043,44044,44045,44046,44047,44056,44062,44063,44065,44066,44067,44069,44070,44071,44072,44073,44074,44075,44078,44082,44083,44084,null,null,null,null,null,null,44085,44086,44087,44090,44091,44093,44094,44095,44097,44098,44099,44100,44101,44102,44103,44104,44105,44106,44108,44110,44111,44112,44113,44114,44115,44117,null,null,null,null,null,null,44118,44119,44121,44122,44123,44125,44126,44127,44128,44129,44130,44131,44132,44133,44134,44135,44136,44137,44138,44139,44140,44141,44142,44143,44146,44147,44149,44150,44153,44155,44156,44157,44158,44159,44162,44167,44168,44173,44174,44175,44177,44178,44179,44181,44182,44183,44184,44185,44186,44187,44190,44194,44195,44196,44197,44198,44199,44203,44205,44206,44209,44210,44211,44212,44213,44214,44215,44218,44222,44223,44224,44226,44227,44229,44230,44231,44233,44234,44235,44237,44238,44239,44240,44241,44242,44243,44244,44246,44248,44249,44250,44251,44252,44253,44254,44255,44258,44259,44261,44262,44265,44267,44269,44270,44274,44276,44279,44280,44281,44282,44283,44286,44287,44289,44290,44291,44293,44295,44296,44297,44298,44299,44302,44304,44306,44307,44308,44309,44310,44311,44313,44314,44315,44317,44318,44319,44321,44322,44323,44324,44325,44326,44327,44328,44330,44331,44334,44335,44336,44337,44338,44339,null,null,null,null,null,null,44342,44343,44345,44346,44347,44349,44350,44351,44352,44353,44354,44355,44358,44360,44362,44363,44364,44365,44366,44367,44369,44370,44371,44373,44374,44375,null,null,null,null,null,null,44377,44378,44379,44380,44381,44382,44383,44384,44386,44388,44389,44390,44391,44392,44393,44394,44395,44398,44399,44401,44402,44407,44408,44409,44410,44414,44416,44419,44420,44421,44422,44423,44426,44427,44429,44430,44431,44433,44434,44435,44436,44437,44438,44439,44440,44441,44442,44443,44446,44447,44448,44449,44450,44451,44453,44454,44455,44456,44457,44458,44459,44460,44461,44462,44463,44464,44465,44466,44467,44468,44469,44470,44472,44473,44474,44475,44476,44477,44478,44479,44482,44483,44485,44486,44487,44489,44490,44491,44492,44493,44494,44495,44498,44500,44501,44502,44503,44504,44505,44506,44507,44509,44510,44511,44513,44514,44515,44517,44518,44519,44520,44521,44522,44523,44524,44525,44526,44527,44528,44529,44530,44531,44532,44533,44534,44535,44538,44539,44541,44542,44546,44547,44548,44549,44550,44551,44554,44556,44558,44559,44560,44561,44562,44563,44565,44566,44567,44568,44569,44570,44571,44572,null,null,null,null,null,null,44573,44574,44575,44576,44577,44578,44579,44580,44581,44582,44583,44584,44585,44586,44587,44588,44589,44590,44591,44594,44595,44597,44598,44601,44603,44604,null,null,null,null,null,null,44605,44606,44607,44610,44612,44615,44616,44617,44619,44623,44625,44626,44627,44629,44631,44632,44633,44634,44635,44638,44642,44643,44644,44646,44647,44650,44651,44653,44654,44655,44657,44658,44659,44660,44661,44662,44663,44666,44670,44671,44672,44673,44674,44675,44678,44679,44680,44681,44682,44683,44685,44686,44687,44688,44689,44690,44691,44692,44693,44694,44695,44696,44697,44698,44699,44700,44701,44702,44703,44704,44705,44706,44707,44708,44709,44710,44711,44712,44713,44714,44715,44716,44717,44718,44719,44720,44721,44722,44723,44724,44725,44726,44727,44728,44729,44730,44731,44735,44737,44738,44739,44741,44742,44743,44744,44745,44746,44747,44750,44754,44755,44756,44757,44758,44759,44762,44763,44765,44766,44767,44768,44769,44770,44771,44772,44773,44774,44775,44777,44778,44780,44782,44783,44784,44785,44786,44787,44789,44790,44791,44793,44794,44795,44797,44798,44799,44800,44801,44802,44803,44804,44805,null,null,null,null,null,null,44806,44809,44810,44811,44812,44814,44815,44817,44818,44819,44820,44821,44822,44823,44824,44825,44826,44827,44828,44829,44830,44831,44832,44833,44834,44835,null,null,null,null,null,null,44836,44837,44838,44839,44840,44841,44842,44843,44846,44847,44849,44851,44853,44854,44855,44856,44857,44858,44859,44862,44864,44868,44869,44870,44871,44874,44875,44876,44877,44878,44879,44881,44882,44883,44884,44885,44886,44887,44888,44889,44890,44891,44894,44895,44896,44897,44898,44899,44902,44903,44904,44905,44906,44907,44908,44909,44910,44911,44912,44913,44914,44915,44916,44917,44918,44919,44920,44922,44923,44924,44925,44926,44927,44929,44930,44931,44933,44934,44935,44937,44938,44939,44940,44941,44942,44943,44946,44947,44948,44950,44951,44952,44953,44954,44955,44957,44958,44959,44960,44961,44962,44963,44964,44965,44966,44967,44968,44969,44970,44971,44972,44973,44974,44975,44976,44977,44978,44979,44980,44981,44982,44983,44986,44987,44989,44990,44991,44993,44994,44995,44996,44997,44998,45002,45004,45007,45008,45009,45010,45011,45013,45014,45015,45016,45017,45018,45019,45021,45022,45023,45024,45025,null,null,null,null,null,null,45026,45027,45028,45029,45030,45031,45034,45035,45036,45037,45038,45039,45042,45043,45045,45046,45047,45049,45050,45051,45052,45053,45054,45055,45058,45059,null,null,null,null,null,null,45061,45062,45063,45064,45065,45066,45067,45069,45070,45071,45073,45074,45075,45077,45078,45079,45080,45081,45082,45083,45086,45087,45088,45089,45090,45091,45092,45093,45094,45095,45097,45098,45099,45100,45101,45102,45103,45104,45105,45106,45107,45108,45109,45110,45111,45112,45113,45114,45115,45116,45117,45118,45119,45120,45121,45122,45123,45126,45127,45129,45131,45133,45135,45136,45137,45138,45142,45144,45146,45147,45148,45150,45151,45152,45153,45154,45155,45156,45157,45158,45159,45160,45161,45162,45163,45164,45165,45166,45167,45168,45169,45170,45171,45172,45173,45174,45175,45176,45177,45178,45179,45182,45183,45185,45186,45187,45189,45190,45191,45192,45193,45194,45195,45198,45200,45202,45203,45204,45205,45206,45207,45211,45213,45214,45219,45220,45221,45222,45223,45226,45232,45234,45238,45239,45241,45242,45243,45245,45246,45247,45248,45249,45250,45251,45254,45258,45259,45260,45261,45262,45263,45266,null,null,null,null,null,null,45267,45269,45270,45271,45273,45274,45275,45276,45277,45278,45279,45281,45282,45283,45284,45286,45287,45288,45289,45290,45291,45292,45293,45294,45295,45296,null,null,null,null,null,null,45297,45298,45299,45300,45301,45302,45303,45304,45305,45306,45307,45308,45309,45310,45311,45312,45313,45314,45315,45316,45317,45318,45319,45322,45325,45326,45327,45329,45332,45333,45334,45335,45338,45342,45343,45344,45345,45346,45350,45351,45353,45354,45355,45357,45358,45359,45360,45361,45362,45363,45366,45370,45371,45372,45373,45374,45375,45378,45379,45381,45382,45383,45385,45386,45387,45388,45389,45390,45391,45394,45395,45398,45399,45401,45402,45403,45405,45406,45407,45409,45410,45411,45412,45413,45414,45415,45416,45417,45418,45419,45420,45421,45422,45423,45424,45425,45426,45427,45428,45429,45430,45431,45434,45435,45437,45438,45439,45441,45443,45444,45445,45446,45447,45450,45452,45454,45455,45456,45457,45461,45462,45463,45465,45466,45467,45469,45470,45471,45472,45473,45474,45475,45476,45477,45478,45479,45481,45482,45483,45484,45485,45486,45487,45488,45489,45490,45491,45492,45493,45494,45495,45496,null,null,null,null,null,null,45497,45498,45499,45500,45501,45502,45503,45504,45505,45506,45507,45508,45509,45510,45511,45512,45513,45514,45515,45517,45518,45519,45521,45522,45523,45525,null,null,null,null,null,null,45526,45527,45528,45529,45530,45531,45534,45536,45537,45538,45539,45540,45541,45542,45543,45546,45547,45549,45550,45551,45553,45554,45555,45556,45557,45558,45559,45560,45562,45564,45566,45567,45568,45569,45570,45571,45574,45575,45577,45578,45581,45582,45583,45584,45585,45586,45587,45590,45592,45594,45595,45596,45597,45598,45599,45601,45602,45603,45604,45605,45606,45607,45608,45609,45610,45611,45612,45613,45614,45615,45616,45617,45618,45619,45621,45622,45623,45624,45625,45626,45627,45629,45630,45631,45632,45633,45634,45635,45636,45637,45638,45639,45640,45641,45642,45643,45644,45645,45646,45647,45648,45649,45650,45651,45652,45653,45654,45655,45657,45658,45659,45661,45662,45663,45665,45666,45667,45668,45669,45670,45671,45674,45675,45676,45677,45678,45679,45680,45681,45682,45683,45686,45687,45688,45689,45690,45691,45693,45694,45695,45696,45697,45698,45699,45702,45703,45704,45706,45707,45708,45709,45710,null,null,null,null,null,null,45711,45714,45715,45717,45718,45719,45723,45724,45725,45726,45727,45730,45732,45735,45736,45737,45739,45741,45742,45743,45745,45746,45747,45749,45750,45751,null,null,null,null,null,null,45752,45753,45754,45755,45756,45757,45758,45759,45760,45761,45762,45763,45764,45765,45766,45767,45770,45771,45773,45774,45775,45777,45779,45780,45781,45782,45783,45786,45788,45790,45791,45792,45793,45795,45799,45801,45802,45808,45809,45810,45814,45820,45821,45822,45826,45827,45829,45830,45831,45833,45834,45835,45836,45837,45838,45839,45842,45846,45847,45848,45849,45850,45851,45853,45854,45855,45856,45857,45858,45859,45860,45861,45862,45863,45864,45865,45866,45867,45868,45869,45870,45871,45872,45873,45874,45875,45876,45877,45878,45879,45880,45881,45882,45883,45884,45885,45886,45887,45888,45889,45890,45891,45892,45893,45894,45895,45896,45897,45898,45899,45900,45901,45902,45903,45904,45905,45906,45907,45911,45913,45914,45917,45920,45921,45922,45923,45926,45928,45930,45932,45933,45935,45938,45939,45941,45942,45943,45945,45946,45947,45948,45949,45950,45951,45954,45958,45959,45960,45961,45962,45963,45965,null,null,null,null,null,null,45966,45967,45969,45970,45971,45973,45974,45975,45976,45977,45978,45979,45980,45981,45982,45983,45986,45987,45988,45989,45990,45991,45993,45994,45995,45997,null,null,null,null,null,null,45998,45999,46000,46001,46002,46003,46004,46005,46006,46007,46008,46009,46010,46011,46012,46013,46014,46015,46016,46017,46018,46019,46022,46023,46025,46026,46029,46031,46033,46034,46035,46038,46040,46042,46044,46046,46047,46049,46050,46051,46053,46054,46055,46057,46058,46059,46060,46061,46062,46063,46064,46065,46066,46067,46068,46069,46070,46071,46072,46073,46074,46075,46077,46078,46079,46080,46081,46082,46083,46084,46085,46086,46087,46088,46089,46090,46091,46092,46093,46094,46095,46097,46098,46099,46100,46101,46102,46103,46105,46106,46107,46109,46110,46111,46113,46114,46115,46116,46117,46118,46119,46122,46124,46125,46126,46127,46128,46129,46130,46131,46133,46134,46135,46136,46137,46138,46139,46140,46141,46142,46143,46144,46145,46146,46147,46148,46149,46150,46151,46152,46153,46154,46155,46156,46157,46158,46159,46162,46163,46165,46166,46167,46169,46170,46171,46172,46173,46174,46175,46178,46180,46182,null,null,null,null,null,null,46183,46184,46185,46186,46187,46189,46190,46191,46192,46193,46194,46195,46196,46197,46198,46199,46200,46201,46202,46203,46204,46205,46206,46207,46209,46210,null,null,null,null,null,null,46211,46212,46213,46214,46215,46217,46218,46219,46220,46221,46222,46223,46224,46225,46226,46227,46228,46229,46230,46231,46232,46233,46234,46235,46236,46238,46239,46240,46241,46242,46243,46245,46246,46247,46249,46250,46251,46253,46254,46255,46256,46257,46258,46259,46260,46262,46264,46266,46267,46268,46269,46270,46271,46273,46274,46275,46277,46278,46279,46281,46282,46283,46284,46285,46286,46287,46289,46290,46291,46292,46294,46295,46296,46297,46298,46299,46302,46303,46305,46306,46309,46311,46312,46313,46314,46315,46318,46320,46322,46323,46324,46325,46326,46327,46329,46330,46331,46332,46333,46334,46335,46336,46337,46338,46339,46340,46341,46342,46343,46344,46345,46346,46347,46348,46349,46350,46351,46352,46353,46354,46355,46358,46359,46361,46362,46365,46366,46367,46368,46369,46370,46371,46374,46379,46380,46381,46382,46383,46386,46387,46389,46390,46391,46393,46394,46395,46396,46397,46398,46399,46402,46406,null,null,null,null,null,null,46407,46408,46409,46410,46414,46415,46417,46418,46419,46421,46422,46423,46424,46425,46426,46427,46430,46434,46435,46436,46437,46438,46439,46440,46441,46442,null,null,null,null,null,null,46443,46444,46445,46446,46447,46448,46449,46450,46451,46452,46453,46454,46455,46456,46457,46458,46459,46460,46461,46462,46463,46464,46465,46466,46467,46468,46469,46470,46471,46472,46473,46474,46475,46476,46477,46478,46479,46480,46481,46482,46483,46484,46485,46486,46487,46488,46489,46490,46491,46492,46493,46494,46495,46498,46499,46501,46502,46503,46505,46508,46509,46510,46511,46514,46518,46519,46520,46521,46522,46526,46527,46529,46530,46531,46533,46534,46535,46536,46537,46538,46539,46542,46546,46547,46548,46549,46550,46551,46553,46554,46555,46556,46557,46558,46559,46560,46561,46562,46563,46564,46565,46566,46567,46568,46569,46570,46571,46573,46574,46575,46576,46577,46578,46579,46580,46581,46582,46583,46584,46585,46586,46587,46588,46589,46590,46591,46592,46593,46594,46595,46596,46597,46598,46599,46600,46601,46602,46603,46604,46605,46606,46607,46610,46611,46613,46614,46615,46617,46618,46619,46620,46621,null,null,null,null,null,null,46622,46623,46624,46625,46626,46627,46628,46630,46631,46632,46633,46634,46635,46637,46638,46639,46640,46641,46642,46643,46645,46646,46647,46648,46649,46650,null,null,null,null,null,null,46651,46652,46653,46654,46655,46656,46657,46658,46659,46660,46661,46662,46663,46665,46666,46667,46668,46669,46670,46671,46672,46673,46674,46675,46676,46677,46678,46679,46680,46681,46682,46683,46684,46685,46686,46687,46688,46689,46690,46691,46693,46694,46695,46697,46698,46699,46700,46701,46702,46703,46704,46705,46706,46707,46708,46709,46710,46711,46712,46713,46714,46715,46716,46717,46718,46719,46720,46721,46722,46723,46724,46725,46726,46727,46728,46729,46730,46731,46732,46733,46734,46735,46736,46737,46738,46739,46740,46741,46742,46743,46744,46745,46746,46747,46750,46751,46753,46754,46755,46757,46758,46759,46760,46761,46762,46765,46766,46767,46768,46770,46771,46772,46773,46774,46775,46776,46777,46778,46779,46780,46781,46782,46783,46784,46785,46786,46787,46788,46789,46790,46791,46792,46793,46794,46795,46796,46797,46798,46799,46800,46801,46802,46803,46805,46806,46807,46808,46809,46810,46811,46812,46813,null,null,null,null,null,null,46814,46815,46816,46817,46818,46819,46820,46821,46822,46823,46824,46825,46826,46827,46828,46829,46830,46831,46833,46834,46835,46837,46838,46839,46841,46842,null,null,null,null,null,null,46843,46844,46845,46846,46847,46850,46851,46852,46854,46855,46856,46857,46858,46859,46860,46861,46862,46863,46864,46865,46866,46867,46868,46869,46870,46871,46872,46873,46874,46875,46876,46877,46878,46879,46880,46881,46882,46883,46884,46885,46886,46887,46890,46891,46893,46894,46897,46898,46899,46900,46901,46902,46903,46906,46908,46909,46910,46911,46912,46913,46914,46915,46917,46918,46919,46921,46922,46923,46925,46926,46927,46928,46929,46930,46931,46934,46935,46936,46937,46938,46939,46940,46941,46942,46943,46945,46946,46947,46949,46950,46951,46953,46954,46955,46956,46957,46958,46959,46962,46964,46966,46967,46968,46969,46970,46971,46974,46975,46977,46978,46979,46981,46982,46983,46984,46985,46986,46987,46990,46995,46996,46997,47002,47003,47005,47006,47007,47009,47010,47011,47012,47013,47014,47015,47018,47022,47023,47024,47025,47026,47027,47030,47031,47033,47034,47035,47036,47037,47038,47039,47040,47041,null,null,null,null,null,null,47042,47043,47044,47045,47046,47048,47050,47051,47052,47053,47054,47055,47056,47057,47058,47059,47060,47061,47062,47063,47064,47065,47066,47067,47068,47069,null,null,null,null,null,null,47070,47071,47072,47073,47074,47075,47076,47077,47078,47079,47080,47081,47082,47083,47086,47087,47089,47090,47091,47093,47094,47095,47096,47097,47098,47099,47102,47106,47107,47108,47109,47110,47114,47115,47117,47118,47119,47121,47122,47123,47124,47125,47126,47127,47130,47132,47134,47135,47136,47137,47138,47139,47142,47143,47145,47146,47147,47149,47150,47151,47152,47153,47154,47155,47158,47162,47163,47164,47165,47166,47167,47169,47170,47171,47173,47174,47175,47176,47177,47178,47179,47180,47181,47182,47183,47184,47186,47188,47189,47190,47191,47192,47193,47194,47195,47198,47199,47201,47202,47203,47205,47206,47207,47208,47209,47210,47211,47214,47216,47218,47219,47220,47221,47222,47223,47225,47226,47227,47229,47230,47231,47232,47233,47234,47235,47236,47237,47238,47239,47240,47241,47242,47243,47244,47246,47247,47248,47249,47250,47251,47252,47253,47254,47255,47256,47257,47258,47259,47260,47261,47262,47263,null,null,null,null,null,null,47264,47265,47266,47267,47268,47269,47270,47271,47273,47274,47275,47276,47277,47278,47279,47281,47282,47283,47285,47286,47287,47289,47290,47291,47292,47293,null,null,null,null,null,null,47294,47295,47298,47300,47302,47303,47304,47305,47306,47307,47309,47310,47311,47313,47314,47315,47317,47318,47319,47320,47321,47322,47323,47324,47326,47328,47330,47331,47332,47333,47334,47335,47338,47339,47341,47342,47343,47345,47346,47347,47348,47349,47350,47351,47354,47356,47358,47359,47360,47361,47362,47363,47365,47366,47367,47368,47369,47370,47371,47372,47373,47374,47375,47376,47377,47378,47379,47380,47381,47382,47383,47385,47386,47387,47388,47389,47390,47391,47393,47394,47395,47396,47397,47398,47399,47400,47401,47402,47403,47404,47405,47406,47407,47408,47409,47410,47411,47412,47413,47414,47415,47416,47417,47418,47419,47422,47423,47425,47426,47427,47429,47430,47431,47432,47433,47434,47435,47437,47438,47440,47442,47443,47444,47445,47446,47447,47450,47451,47453,47454,47455,47457,47458,47459,47460,47461,47462,47463,47466,47468,47470,47471,47472,47473,47474,47475,47478,47479,47481,47482,47483,47485,null,null,null,null,null,null,47486,47487,47488,47489,47490,47491,47494,47496,47499,47500,47503,47504,47505,47506,47507,47508,47509,47510,47511,47512,47513,47514,47515,47516,47517,47518,null,null,null,null,null,null,47519,47520,47521,47522,47523,47524,47525,47526,47527,47528,47529,47530,47531,47534,47535,47537,47538,47539,47541,47542,47543,47544,47545,47546,47547,47550,47552,47554,47555,47556,47557,47558,47559,47562,47563,47565,47571,47572,47573,47574,47575,47578,47580,47583,47584,47586,47590,47591,47593,47594,47595,47597,47598,47599,47600,47601,47602,47603,47606,47611,47612,47613,47614,47615,47618,47619,47620,47621,47622,47623,47625,47626,47627,47628,47629,47630,47631,47632,47633,47634,47635,47636,47638,47639,47640,47641,47642,47643,47644,47645,47646,47647,47648,47649,47650,47651,47652,47653,47654,47655,47656,47657,47658,47659,47660,47661,47662,47663,47664,47665,47666,47667,47668,47669,47670,47671,47674,47675,47677,47678,47679,47681,47683,47684,47685,47686,47687,47690,47692,47695,47696,47697,47698,47702,47703,47705,47706,47707,47709,47710,47711,47712,47713,47714,47715,47718,47722,47723,47724,47725,47726,47727,null,null,null,null,null,null,47730,47731,47733,47734,47735,47737,47738,47739,47740,47741,47742,47743,47744,47745,47746,47750,47752,47753,47754,47755,47757,47758,47759,47760,47761,47762,null,null,null,null,null,null,47763,47764,47765,47766,47767,47768,47769,47770,47771,47772,47773,47774,47775,47776,47777,47778,47779,47780,47781,47782,47783,47786,47789,47790,47791,47793,47795,47796,47797,47798,47799,47802,47804,47806,47807,47808,47809,47810,47811,47813,47814,47815,47817,47818,47819,47820,47821,47822,47823,47824,47825,47826,47827,47828,47829,47830,47831,47834,47835,47836,47837,47838,47839,47840,47841,47842,47843,47844,47845,47846,47847,47848,47849,47850,47851,47852,47853,47854,47855,47856,47857,47858,47859,47860,47861,47862,47863,47864,47865,47866,47867,47869,47870,47871,47873,47874,47875,47877,47878,47879,47880,47881,47882,47883,47884,47886,47888,47890,47891,47892,47893,47894,47895,47897,47898,47899,47901,47902,47903,47905,47906,47907,47908,47909,47910,47911,47912,47914,47916,47917,47918,47919,47920,47921,47922,47923,47927,47929,47930,47935,47936,47937,47938,47939,47942,47944,47946,47947,47948,47950,47953,47954,null,null,null,null,null,null,47955,47957,47958,47959,47961,47962,47963,47964,47965,47966,47967,47968,47970,47972,47973,47974,47975,47976,47977,47978,47979,47981,47982,47983,47984,47985,null,null,null,null,null,null,47986,47987,47988,47989,47990,47991,47992,47993,47994,47995,47996,47997,47998,47999,48000,48001,48002,48003,48004,48005,48006,48007,48009,48010,48011,48013,48014,48015,48017,48018,48019,48020,48021,48022,48023,48024,48025,48026,48027,48028,48029,48030,48031,48032,48033,48034,48035,48037,48038,48039,48041,48042,48043,48045,48046,48047,48048,48049,48050,48051,48053,48054,48056,48057,48058,48059,48060,48061,48062,48063,48065,48066,48067,48069,48070,48071,48073,48074,48075,48076,48077,48078,48079,48081,48082,48084,48085,48086,48087,48088,48089,48090,48091,48092,48093,48094,48095,48096,48097,48098,48099,48100,48101,48102,48103,48104,48105,48106,48107,48108,48109,48110,48111,48112,48113,48114,48115,48116,48117,48118,48119,48122,48123,48125,48126,48129,48131,48132,48133,48134,48135,48138,48142,48144,48146,48147,48153,48154,48160,48161,48162,48163,48166,48168,48170,48171,48172,48174,48175,48178,48179,48181,null,null,null,null,null,null,48182,48183,48185,48186,48187,48188,48189,48190,48191,48194,48198,48199,48200,48202,48203,48206,48207,48209,48210,48211,48212,48213,48214,48215,48216,48217,null,null,null,null,null,null,48218,48219,48220,48222,48223,48224,48225,48226,48227,48228,48229,48230,48231,48232,48233,48234,48235,48236,48237,48238,48239,48240,48241,48242,48243,48244,48245,48246,48247,48248,48249,48250,48251,48252,48253,48254,48255,48256,48257,48258,48259,48262,48263,48265,48266,48269,48271,48272,48273,48274,48275,48278,48280,48283,48284,48285,48286,48287,48290,48291,48293,48294,48297,48298,48299,48300,48301,48302,48303,48306,48310,48311,48312,48313,48314,48315,48318,48319,48321,48322,48323,48325,48326,48327,48328,48329,48330,48331,48332,48334,48338,48339,48340,48342,48343,48345,48346,48347,48349,48350,48351,48352,48353,48354,48355,48356,48357,48358,48359,48360,48361,48362,48363,48364,48365,48366,48367,48368,48369,48370,48371,48375,48377,48378,48379,48381,48382,48383,48384,48385,48386,48387,48390,48392,48394,48395,48396,48397,48398,48399,48401,48402,48403,48405,48406,48407,48408,48409,48410,48411,48412,48413,null,null,null,null,null,null,48414,48415,48416,48417,48418,48419,48421,48422,48423,48424,48425,48426,48427,48429,48430,48431,48432,48433,48434,48435,48436,48437,48438,48439,48440,48441,null,null,null,null,null,null,48442,48443,48444,48445,48446,48447,48449,48450,48451,48452,48453,48454,48455,48458,48459,48461,48462,48463,48465,48466,48467,48468,48469,48470,48471,48474,48475,48476,48477,48478,48479,48480,48481,48482,48483,48485,48486,48487,48489,48490,48491,48492,48493,48494,48495,48496,48497,48498,48499,48500,48501,48502,48503,48504,48505,48506,48507,48508,48509,48510,48511,48514,48515,48517,48518,48523,48524,48525,48526,48527,48530,48532,48534,48535,48536,48539,48541,48542,48543,48544,48545,48546,48547,48549,48550,48551,48552,48553,48554,48555,48556,48557,48558,48559,48561,48562,48563,48564,48565,48566,48567,48569,48570,48571,48572,48573,48574,48575,48576,48577,48578,48579,48580,48581,48582,48583,48584,48585,48586,48587,48588,48589,48590,48591,48592,48593,48594,48595,48598,48599,48601,48602,48603,48605,48606,48607,48608,48609,48610,48611,48612,48613,48614,48615,48616,48618,48619,48620,48621,48622,48623,48625,null,null,null,null,null,null,48626,48627,48629,48630,48631,48633,48634,48635,48636,48637,48638,48639,48641,48642,48644,48646,48647,48648,48649,48650,48651,48654,48655,48657,48658,48659,null,null,null,null,null,null,48661,48662,48663,48664,48665,48666,48667,48670,48672,48673,48674,48675,48676,48677,48678,48679,48680,48681,48682,48683,48684,48685,48686,48687,48688,48689,48690,48691,48692,48693,48694,48695,48696,48697,48698,48699,48700,48701,48702,48703,48704,48705,48706,48707,48710,48711,48713,48714,48715,48717,48719,48720,48721,48722,48723,48726,48728,48732,48733,48734,48735,48738,48739,48741,48742,48743,48745,48747,48748,48749,48750,48751,48754,48758,48759,48760,48761,48762,48766,48767,48769,48770,48771,48773,48774,48775,48776,48777,48778,48779,48782,48786,48787,48788,48789,48790,48791,48794,48795,48796,48797,48798,48799,48800,48801,48802,48803,48804,48805,48806,48807,48809,48810,48811,48812,48813,48814,48815,48816,48817,48818,48819,48820,48821,48822,48823,48824,48825,48826,48827,48828,48829,48830,48831,48832,48833,48834,48835,48836,48837,48838,48839,48840,48841,48842,48843,48844,48845,48846,48847,48850,48851,null,null,null,null,null,null,48853,48854,48857,48858,48859,48860,48861,48862,48863,48865,48866,48870,48871,48872,48873,48874,48875,48877,48878,48879,48880,48881,48882,48883,48884,48885,null,null,null,null,null,null,48886,48887,48888,48889,48890,48891,48892,48893,48894,48895,48896,48898,48899,48900,48901,48902,48903,48906,48907,48908,48909,48910,48911,48912,48913,48914,48915,48916,48917,48918,48919,48922,48926,48927,48928,48929,48930,48931,48932,48933,48934,48935,48936,48937,48938,48939,48940,48941,48942,48943,48944,48945,48946,48947,48948,48949,48950,48951,48952,48953,48954,48955,48956,48957,48958,48959,48962,48963,48965,48966,48967,48969,48970,48971,48972,48973,48974,48975,48978,48979,48980,48982,48983,48984,48985,48986,48987,48988,48989,48990,48991,48992,48993,48994,48995,48996,48997,48998,48999,49000,49001,49002,49003,49004,49005,49006,49007,49008,49009,49010,49011,49012,49013,49014,49015,49016,49017,49018,49019,49020,49021,49022,49023,49024,49025,49026,49027,49028,49029,49030,49031,49032,49033,49034,49035,49036,49037,49038,49039,49040,49041,49042,49043,49045,49046,49047,49048,49049,49050,49051,49052,49053,null,null,null,null,null,null,49054,49055,49056,49057,49058,49059,49060,49061,49062,49063,49064,49065,49066,49067,49068,49069,49070,49071,49073,49074,49075,49076,49077,49078,49079,49080,null,null,null,null,null,null,49081,49082,49083,49084,49085,49086,49087,49088,49089,49090,49091,49092,49094,49095,49096,49097,49098,49099,49102,49103,49105,49106,49107,49109,49110,49111,49112,49113,49114,49115,49117,49118,49120,49122,49123,49124,49125,49126,49127,49128,49129,49130,49131,49132,49133,49134,49135,49136,49137,49138,49139,49140,49141,49142,49143,49144,49145,49146,49147,49148,49149,49150,49151,49152,49153,49154,49155,49156,49157,49158,49159,49160,49161,49162,49163,49164,49165,49166,49167,49168,49169,49170,49171,49172,49173,49174,49175,49176,49177,49178,49179,49180,49181,49182,49183,49184,49185,49186,49187,49188,49189,49190,49191,49192,49193,49194,49195,49196,49197,49198,49199,49200,49201,49202,49203,49204,49205,49206,49207,49208,49209,49210,49211,49213,49214,49215,49216,49217,49218,49219,49220,49221,49222,49223,49224,49225,49226,49227,49228,49229,49230,49231,49232,49234,49235,49236,49237,49238,49239,49241,49242,49243,null,null,null,null,null,null,49245,49246,49247,49249,49250,49251,49252,49253,49254,49255,49258,49259,49260,49261,49262,49263,49264,49265,49266,49267,49268,49269,49270,49271,49272,49273,null,null,null,null,null,null,49274,49275,49276,49277,49278,49279,49280,49281,49282,49283,49284,49285,49286,49287,49288,49289,49290,49291,49292,49293,49294,49295,49298,49299,49301,49302,49303,49305,49306,49307,49308,49309,49310,49311,49314,49316,49318,49319,49320,49321,49322,49323,49326,49329,49330,49335,49336,49337,49338,49339,49342,49346,49347,49348,49350,49351,49354,49355,49357,49358,49359,49361,49362,49363,49364,49365,49366,49367,49370,49374,49375,49376,49377,49378,49379,49382,49383,49385,49386,49387,49389,49390,49391,49392,49393,49394,49395,49398,49400,49402,49403,49404,49405,49406,49407,49409,49410,49411,49413,49414,49415,49417,49418,49419,49420,49421,49422,49423,49425,49426,49427,49428,49430,49431,49432,49433,49434,49435,49441,49442,49445,49448,49449,49450,49451,49454,49458,49459,49460,49461,49463,49466,49467,49469,49470,49471,49473,49474,49475,49476,49477,49478,49479,49482,49486,49487,49488,49489,49490,49491,49494,49495,null,null,null,null,null,null,49497,49498,49499,49501,49502,49503,49504,49505,49506,49507,49510,49514,49515,49516,49517,49518,49519,49521,49522,49523,49525,49526,49527,49529,49530,49531,null,null,null,null,null,null,49532,49533,49534,49535,49536,49537,49538,49539,49540,49542,49543,49544,49545,49546,49547,49551,49553,49554,49555,49557,49559,49560,49561,49562,49563,49566,49568,49570,49571,49572,49574,49575,49578,49579,49581,49582,49583,49585,49586,49587,49588,49589,49590,49591,49592,49593,49594,49595,49596,49598,49599,49600,49601,49602,49603,49605,49606,49607,49609,49610,49611,49613,49614,49615,49616,49617,49618,49619,49621,49622,49625,49626,49627,49628,49629,49630,49631,49633,49634,49635,49637,49638,49639,49641,49642,49643,49644,49645,49646,49647,49650,49652,49653,49654,49655,49656,49657,49658,49659,49662,49663,49665,49666,49667,49669,49670,49671,49672,49673,49674,49675,49678,49680,49682,49683,49684,49685,49686,49687,49690,49691,49693,49694,49697,49698,49699,49700,49701,49702,49703,49706,49708,49710,49712,49715,49717,49718,49719,49720,49721,49722,49723,49724,49725,49726,49727,49728,49729,49730,49731,49732,49733,null,null,null,null,null,null,49734,49735,49737,49738,49739,49740,49741,49742,49743,49746,49747,49749,49750,49751,49753,49754,49755,49756,49757,49758,49759,49761,49762,49763,49764,49766,null,null,null,null,null,null,49767,49768,49769,49770,49771,49774,49775,49777,49778,49779,49781,49782,49783,49784,49785,49786,49787,49790,49792,49794,49795,49796,49797,49798,49799,49802,49803,49804,49805,49806,49807,49809,49810,49811,49812,49813,49814,49815,49817,49818,49820,49822,49823,49824,49825,49826,49827,49830,49831,49833,49834,49835,49838,49839,49840,49841,49842,49843,49846,49848,49850,49851,49852,49853,49854,49855,49856,49857,49858,49859,49860,49861,49862,49863,49864,49865,49866,49867,49868,49869,49870,49871,49872,49873,49874,49875,49876,49877,49878,49879,49880,49881,49882,49883,49886,49887,49889,49890,49893,49894,49895,49896,49897,49898,49902,49904,49906,49907,49908,49909,49911,49914,49917,49918,49919,49921,49922,49923,49924,49925,49926,49927,49930,49931,49934,49935,49936,49937,49938,49942,49943,49945,49946,49947,49949,49950,49951,49952,49953,49954,49955,49958,49959,49962,49963,49964,49965,49966,49967,49968,49969,49970,null,null,null,null,null,null,49971,49972,49973,49974,49975,49976,49977,49978,49979,49980,49981,49982,49983,49984,49985,49986,49987,49988,49990,49991,49992,49993,49994,49995,49996,49997,null,null,null,null,null,null,49998,49999,50000,50001,50002,50003,50004,50005,50006,50007,50008,50009,50010,50011,50012,50013,50014,50015,50016,50017,50018,50019,50020,50021,50022,50023,50026,50027,50029,50030,50031,50033,50035,50036,50037,50038,50039,50042,50043,50046,50047,50048,50049,50050,50051,50053,50054,50055,50057,50058,50059,50061,50062,50063,50064,50065,50066,50067,50068,50069,50070,50071,50072,50073,50074,50075,50076,50077,50078,50079,50080,50081,50082,50083,50084,50085,50086,50087,50088,50089,50090,50091,50092,50093,50094,50095,50096,50097,50098,50099,50100,50101,50102,50103,50104,50105,50106,50107,50108,50109,50110,50111,50113,50114,50115,50116,50117,50118,50119,50120,50121,50122,50123,50124,50125,50126,50127,50128,50129,50130,50131,50132,50133,50134,50135,50138,50139,50141,50142,50145,50147,50148,50149,50150,50151,50154,50155,50156,50158,50159,50160,50161,50162,50163,50166,50167,50169,50170,50171,50172,50173,50174,null,null,null,null,null,null,50175,50176,50177,50178,50179,50180,50181,50182,50183,50185,50186,50187,50188,50189,50190,50191,50193,50194,50195,50196,50197,50198,50199,50200,50201,50202,null,null,null,null,null,null,50203,50204,50205,50206,50207,50208,50209,50210,50211,50213,50214,50215,50216,50217,50218,50219,50221,50222,50223,50225,50226,50227,50229,50230,50231,50232,50233,50234,50235,50238,50239,50240,50241,50242,50243,50244,50245,50246,50247,50249,50250,50251,50252,50253,50254,50255,50256,50257,50258,50259,50260,50261,50262,50263,50264,50265,50266,50267,50268,50269,50270,50271,50272,50273,50274,50275,50278,50279,50281,50282,50283,50285,50286,50287,50288,50289,50290,50291,50294,50295,50296,50298,50299,50300,50301,50302,50303,50305,50306,50307,50308,50309,50310,50311,50312,50313,50314,50315,50316,50317,50318,50319,50320,50321,50322,50323,50325,50326,50327,50328,50329,50330,50331,50333,50334,50335,50336,50337,50338,50339,50340,50341,50342,50343,50344,50345,50346,50347,50348,50349,50350,50351,50352,50353,50354,50355,50356,50357,50358,50359,50361,50362,50363,50365,50366,50367,50368,50369,50370,50371,50372,50373,null,null,null,null,null,null,50374,50375,50376,50377,50378,50379,50380,50381,50382,50383,50384,50385,50386,50387,50388,50389,50390,50391,50392,50393,50394,50395,50396,50397,50398,50399,null,null,null,null,null,null,50400,50401,50402,50403,50404,50405,50406,50407,50408,50410,50411,50412,50413,50414,50415,50418,50419,50421,50422,50423,50425,50427,50428,50429,50430,50434,50435,50436,50437,50438,50439,50440,50441,50442,50443,50445,50446,50447,50449,50450,50451,50453,50454,50455,50456,50457,50458,50459,50461,50462,50463,50464,50465,50466,50467,50468,50469,50470,50471,50474,50475,50477,50478,50479,50481,50482,50483,50484,50485,50486,50487,50490,50492,50494,50495,50496,50497,50498,50499,50502,50503,50507,50511,50512,50513,50514,50518,50522,50523,50524,50527,50530,50531,50533,50534,50535,50537,50538,50539,50540,50541,50542,50543,50546,50550,50551,50552,50553,50554,50555,50558,50559,50561,50562,50563,50565,50566,50568,50569,50570,50571,50574,50576,50578,50579,50580,50582,50585,50586,50587,50589,50590,50591,50593,50594,50595,50596,50597,50598,50599,50600,50602,50603,50604,50605,50606,50607,50608,50609,50610,50611,50614,null,null,null,null,null,null,50615,50618,50623,50624,50625,50626,50627,50635,50637,50639,50642,50643,50645,50646,50647,50649,50650,50651,50652,50653,50654,50655,50658,50660,50662,50663,null,null,null,null,null,null,50664,50665,50666,50667,50671,50673,50674,50675,50677,50680,50681,50682,50683,50690,50691,50692,50697,50698,50699,50701,50702,50703,50705,50706,50707,50708,50709,50710,50711,50714,50717,50718,50719,50720,50721,50722,50723,50726,50727,50729,50730,50731,50735,50737,50738,50742,50744,50746,50748,50749,50750,50751,50754,50755,50757,50758,50759,50761,50762,50763,50764,50765,50766,50767,50770,50774,50775,50776,50777,50778,50779,50782,50783,50785,50786,50787,50788,50789,50790,50791,50792,50793,50794,50795,50797,50798,50800,50802,50803,50804,50805,50806,50807,50810,50811,50813,50814,50815,50817,50818,50819,50820,50821,50822,50823,50826,50828,50830,50831,50832,50833,50834,50835,50838,50839,50841,50842,50843,50845,50846,50847,50848,50849,50850,50851,50854,50856,50858,50859,50860,50861,50862,50863,50866,50867,50869,50870,50871,50875,50876,50877,50878,50879,50882,50884,50886,50887,50888,50889,50890,50891,50894,null,null,null,null,null,null,50895,50897,50898,50899,50901,50902,50903,50904,50905,50906,50907,50910,50911,50914,50915,50916,50917,50918,50919,50922,50923,50925,50926,50927,50929,50930,null,null,null,null,null,null,50931,50932,50933,50934,50935,50938,50939,50940,50942,50943,50944,50945,50946,50947,50950,50951,50953,50954,50955,50957,50958,50959,50960,50961,50962,50963,50966,50968,50970,50971,50972,50973,50974,50975,50978,50979,50981,50982,50983,50985,50986,50987,50988,50989,50990,50991,50994,50996,50998,51000,51001,51002,51003,51006,51007,51009,51010,51011,51013,51014,51015,51016,51017,51019,51022,51024,51033,51034,51035,51037,51038,51039,51041,51042,51043,51044,51045,51046,51047,51049,51050,51052,51053,51054,51055,51056,51057,51058,51059,51062,51063,51065,51066,51067,51071,51072,51073,51074,51078,51083,51084,51085,51087,51090,51091,51093,51097,51099,51100,51101,51102,51103,51106,51111,51112,51113,51114,51115,51118,51119,51121,51122,51123,51125,51126,51127,51128,51129,51130,51131,51134,51138,51139,51140,51141,51142,51143,51146,51147,51149,51151,51153,51154,51155,51156,51157,51158,51159,51161,51162,51163,51164,null,null,null,null,null,null,51166,51167,51168,51169,51170,51171,51173,51174,51175,51177,51178,51179,51181,51182,51183,51184,51185,51186,51187,51188,51189,51190,51191,51192,51193,51194,null,null,null,null,null,null,51195,51196,51197,51198,51199,51202,51203,51205,51206,51207,51209,51211,51212,51213,51214,51215,51218,51220,51223,51224,51225,51226,51227,51230,51231,51233,51234,51235,51237,51238,51239,51240,51241,51242,51243,51246,51248,51250,51251,51252,51253,51254,51255,51257,51258,51259,51261,51262,51263,51265,51266,51267,51268,51269,51270,51271,51274,51275,51278,51279,51280,51281,51282,51283,51285,51286,51287,51288,51289,51290,51291,51292,51293,51294,51295,51296,51297,51298,51299,51300,51301,51302,51303,51304,51305,51306,51307,51308,51309,51310,51311,51314,51315,51317,51318,51319,51321,51323,51324,51325,51326,51327,51330,51332,51336,51337,51338,51342,51343,51344,51345,51346,51347,51349,51350,51351,51352,51353,51354,51355,51356,51358,51360,51362,51363,51364,51365,51366,51367,51369,51370,51371,51372,51373,51374,51375,51376,51377,51378,51379,51380,51381,51382,51383,51384,51385,51386,51387,51390,51391,51392,51393,null,null,null,null,null,null,51394,51395,51397,51398,51399,51401,51402,51403,51405,51406,51407,51408,51409,51410,51411,51414,51416,51418,51419,51420,51421,51422,51423,51426,51427,51429,null,null,null,null,null,null,51430,51431,51432,51433,51434,51435,51436,51437,51438,51439,51440,51441,51442,51443,51444,51446,51447,51448,51449,51450,51451,51454,51455,51457,51458,51459,51463,51464,51465,51466,51467,51470,12288,12289,12290,183,8229,8230,168,12291,173,8213,8741,65340,8764,8216,8217,8220,8221,12308,12309,12296,12297,12298,12299,12300,12301,12302,12303,12304,12305,177,215,247,8800,8804,8805,8734,8756,176,8242,8243,8451,8491,65504,65505,65509,9794,9792,8736,8869,8978,8706,8711,8801,8786,167,8251,9734,9733,9675,9679,9678,9671,9670,9633,9632,9651,9650,9661,9660,8594,8592,8593,8595,8596,12307,8810,8811,8730,8765,8733,8757,8747,8748,8712,8715,8838,8839,8834,8835,8746,8745,8743,8744,65506,51472,51474,51475,51476,51477,51478,51479,51481,51482,51483,51484,51485,51486,51487,51488,51489,51490,51491,51492,51493,51494,51495,51496,51497,51498,51499,null,null,null,null,null,null,51501,51502,51503,51504,51505,51506,51507,51509,51510,51511,51512,51513,51514,51515,51516,51517,51518,51519,51520,51521,51522,51523,51524,51525,51526,51527,null,null,null,null,null,null,51528,51529,51530,51531,51532,51533,51534,51535,51538,51539,51541,51542,51543,51545,51546,51547,51548,51549,51550,51551,51554,51556,51557,51558,51559,51560,51561,51562,51563,51565,51566,51567,8658,8660,8704,8707,180,65374,711,728,733,730,729,184,731,161,191,720,8750,8721,8719,164,8457,8240,9665,9664,9655,9654,9828,9824,9825,9829,9831,9827,8857,9672,9635,9680,9681,9618,9636,9637,9640,9639,9638,9641,9832,9743,9742,9756,9758,182,8224,8225,8597,8599,8601,8598,8600,9837,9833,9834,9836,12927,12828,8470,13255,8482,13250,13272,8481,8364,174,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,51569,51570,51571,51573,51574,51575,51576,51577,51578,51579,51581,51582,51583,51584,51585,51586,51587,51588,51589,51590,51591,51594,51595,51597,51598,51599,null,null,null,null,null,null,51601,51602,51603,51604,51605,51606,51607,51610,51612,51614,51615,51616,51617,51618,51619,51620,51621,51622,51623,51624,51625,51626,51627,51628,51629,51630,null,null,null,null,null,null,51631,51632,51633,51634,51635,51636,51637,51638,51639,51640,51641,51642,51643,51644,51645,51646,51647,51650,51651,51653,51654,51657,51659,51660,51661,51662,51663,51666,51668,51671,51672,51675,65281,65282,65283,65284,65285,65286,65287,65288,65289,65290,65291,65292,65293,65294,65295,65296,65297,65298,65299,65300,65301,65302,65303,65304,65305,65306,65307,65308,65309,65310,65311,65312,65313,65314,65315,65316,65317,65318,65319,65320,65321,65322,65323,65324,65325,65326,65327,65328,65329,65330,65331,65332,65333,65334,65335,65336,65337,65338,65339,65510,65341,65342,65343,65344,65345,65346,65347,65348,65349,65350,65351,65352,65353,65354,65355,65356,65357,65358,65359,65360,65361,65362,65363,65364,65365,65366,65367,65368,65369,65370,65371,65372,65373,65507,51678,51679,51681,51683,51685,51686,51688,51689,51690,51691,51694,51698,51699,51700,51701,51702,51703,51706,51707,51709,51710,51711,51713,51714,51715,51716,null,null,null,null,null,null,51717,51718,51719,51722,51726,51727,51728,51729,51730,51731,51733,51734,51735,51737,51738,51739,51740,51741,51742,51743,51744,51745,51746,51747,51748,51749,null,null,null,null,null,null,51750,51751,51752,51754,51755,51756,51757,51758,51759,51760,51761,51762,51763,51764,51765,51766,51767,51768,51769,51770,51771,51772,51773,51774,51775,51776,51777,51778,51779,51780,51781,51782,12593,12594,12595,12596,12597,12598,12599,12600,12601,12602,12603,12604,12605,12606,12607,12608,12609,12610,12611,12612,12613,12614,12615,12616,12617,12618,12619,12620,12621,12622,12623,12624,12625,12626,12627,12628,12629,12630,12631,12632,12633,12634,12635,12636,12637,12638,12639,12640,12641,12642,12643,12644,12645,12646,12647,12648,12649,12650,12651,12652,12653,12654,12655,12656,12657,12658,12659,12660,12661,12662,12663,12664,12665,12666,12667,12668,12669,12670,12671,12672,12673,12674,12675,12676,12677,12678,12679,12680,12681,12682,12683,12684,12685,12686,51783,51784,51785,51786,51787,51790,51791,51793,51794,51795,51797,51798,51799,51800,51801,51802,51803,51806,51810,51811,51812,51813,51814,51815,51817,51818,null,null,null,null,null,null,51819,51820,51821,51822,51823,51824,51825,51826,51827,51828,51829,51830,51831,51832,51833,51834,51835,51836,51838,51839,51840,51841,51842,51843,51845,51846,null,null,null,null,null,null,51847,51848,51849,51850,51851,51852,51853,51854,51855,51856,51857,51858,51859,51860,51861,51862,51863,51865,51866,51867,51868,51869,51870,51871,51872,51873,51874,51875,51876,51877,51878,51879,8560,8561,8562,8563,8564,8565,8566,8567,8568,8569,null,null,null,null,null,8544,8545,8546,8547,8548,8549,8550,8551,8552,8553,null,null,null,null,null,null,null,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,931,932,933,934,935,936,937,null,null,null,null,null,null,null,null,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,963,964,965,966,967,968,969,null,null,null,null,null,null,51880,51881,51882,51883,51884,51885,51886,51887,51888,51889,51890,51891,51892,51893,51894,51895,51896,51897,51898,51899,51902,51903,51905,51906,51907,51909,null,null,null,null,null,null,51910,51911,51912,51913,51914,51915,51918,51920,51922,51924,51925,51926,51927,51930,51931,51932,51933,51934,51935,51937,51938,51939,51940,51941,51942,51943,null,null,null,null,null,null,51944,51945,51946,51947,51949,51950,51951,51952,51953,51954,51955,51957,51958,51959,51960,51961,51962,51963,51964,51965,51966,51967,51968,51969,51970,51971,51972,51973,51974,51975,51977,51978,9472,9474,9484,9488,9496,9492,9500,9516,9508,9524,9532,9473,9475,9487,9491,9499,9495,9507,9523,9515,9531,9547,9504,9519,9512,9527,9535,9501,9520,9509,9528,9538,9490,9489,9498,9497,9494,9493,9486,9485,9502,9503,9505,9506,9510,9511,9513,9514,9517,9518,9521,9522,9525,9526,9529,9530,9533,9534,9536,9537,9539,9540,9541,9542,9543,9544,9545,9546,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,51979,51980,51981,51982,51983,51985,51986,51987,51989,51990,51991,51993,51994,51995,51996,51997,51998,51999,52002,52003,52004,52005,52006,52007,52008,52009,null,null,null,null,null,null,52010,52011,52012,52013,52014,52015,52016,52017,52018,52019,52020,52021,52022,52023,52024,52025,52026,52027,52028,52029,52030,52031,52032,52034,52035,52036,null,null,null,null,null,null,52037,52038,52039,52042,52043,52045,52046,52047,52049,52050,52051,52052,52053,52054,52055,52058,52059,52060,52062,52063,52064,52065,52066,52067,52069,52070,52071,52072,52073,52074,52075,52076,13205,13206,13207,8467,13208,13252,13219,13220,13221,13222,13209,13210,13211,13212,13213,13214,13215,13216,13217,13218,13258,13197,13198,13199,13263,13192,13193,13256,13223,13224,13232,13233,13234,13235,13236,13237,13238,13239,13240,13241,13184,13185,13186,13187,13188,13242,13243,13244,13245,13246,13247,13200,13201,13202,13203,13204,8486,13248,13249,13194,13195,13196,13270,13253,13229,13230,13231,13275,13225,13226,13227,13228,13277,13264,13267,13251,13257,13276,13254,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,52077,52078,52079,52080,52081,52082,52083,52084,52085,52086,52087,52090,52091,52092,52093,52094,52095,52096,52097,52098,52099,52100,52101,52102,52103,52104,null,null,null,null,null,null,52105,52106,52107,52108,52109,52110,52111,52112,52113,52114,52115,52116,52117,52118,52119,52120,52121,52122,52123,52125,52126,52127,52128,52129,52130,52131,null,null,null,null,null,null,52132,52133,52134,52135,52136,52137,52138,52139,52140,52141,52142,52143,52144,52145,52146,52147,52148,52149,52150,52151,52153,52154,52155,52156,52157,52158,52159,52160,52161,52162,52163,52164,198,208,170,294,null,306,null,319,321,216,338,186,222,358,330,null,12896,12897,12898,12899,12900,12901,12902,12903,12904,12905,12906,12907,12908,12909,12910,12911,12912,12913,12914,12915,12916,12917,12918,12919,12920,12921,12922,12923,9424,9425,9426,9427,9428,9429,9430,9431,9432,9433,9434,9435,9436,9437,9438,9439,9440,9441,9442,9443,9444,9445,9446,9447,9448,9449,9312,9313,9314,9315,9316,9317,9318,9319,9320,9321,9322,9323,9324,9325,9326,189,8531,8532,188,190,8539,8540,8541,8542,52165,52166,52167,52168,52169,52170,52171,52172,52173,52174,52175,52176,52177,52178,52179,52181,52182,52183,52184,52185,52186,52187,52188,52189,52190,52191,null,null,null,null,null,null,52192,52193,52194,52195,52197,52198,52200,52202,52203,52204,52205,52206,52207,52208,52209,52210,52211,52212,52213,52214,52215,52216,52217,52218,52219,52220,null,null,null,null,null,null,52221,52222,52223,52224,52225,52226,52227,52228,52229,52230,52231,52232,52233,52234,52235,52238,52239,52241,52242,52243,52245,52246,52247,52248,52249,52250,52251,52254,52255,52256,52259,52260,230,273,240,295,305,307,312,320,322,248,339,223,254,359,331,329,12800,12801,12802,12803,12804,12805,12806,12807,12808,12809,12810,12811,12812,12813,12814,12815,12816,12817,12818,12819,12820,12821,12822,12823,12824,12825,12826,12827,9372,9373,9374,9375,9376,9377,9378,9379,9380,9381,9382,9383,9384,9385,9386,9387,9388,9389,9390,9391,9392,9393,9394,9395,9396,9397,9332,9333,9334,9335,9336,9337,9338,9339,9340,9341,9342,9343,9344,9345,9346,185,178,179,8308,8319,8321,8322,8323,8324,52261,52262,52266,52267,52269,52271,52273,52274,52275,52276,52277,52278,52279,52282,52287,52288,52289,52290,52291,52294,52295,52297,52298,52299,52301,52302,null,null,null,null,null,null,52303,52304,52305,52306,52307,52310,52314,52315,52316,52317,52318,52319,52321,52322,52323,52325,52327,52329,52330,52331,52332,52333,52334,52335,52337,52338,null,null,null,null,null,null,52339,52340,52342,52343,52344,52345,52346,52347,52348,52349,52350,52351,52352,52353,52354,52355,52356,52357,52358,52359,52360,52361,52362,52363,52364,52365,52366,52367,52368,52369,52370,52371,12353,12354,12355,12356,12357,12358,12359,12360,12361,12362,12363,12364,12365,12366,12367,12368,12369,12370,12371,12372,12373,12374,12375,12376,12377,12378,12379,12380,12381,12382,12383,12384,12385,12386,12387,12388,12389,12390,12391,12392,12393,12394,12395,12396,12397,12398,12399,12400,12401,12402,12403,12404,12405,12406,12407,12408,12409,12410,12411,12412,12413,12414,12415,12416,12417,12418,12419,12420,12421,12422,12423,12424,12425,12426,12427,12428,12429,12430,12431,12432,12433,12434,12435,null,null,null,null,null,null,null,null,null,null,null,52372,52373,52374,52375,52378,52379,52381,52382,52383,52385,52386,52387,52388,52389,52390,52391,52394,52398,52399,52400,52401,52402,52403,52406,52407,52409,null,null,null,null,null,null,52410,52411,52413,52414,52415,52416,52417,52418,52419,52422,52424,52426,52427,52428,52429,52430,52431,52433,52434,52435,52437,52438,52439,52440,52441,52442,null,null,null,null,null,null,52443,52444,52445,52446,52447,52448,52449,52450,52451,52453,52454,52455,52456,52457,52458,52459,52461,52462,52463,52465,52466,52467,52468,52469,52470,52471,52472,52473,52474,52475,52476,52477,12449,12450,12451,12452,12453,12454,12455,12456,12457,12458,12459,12460,12461,12462,12463,12464,12465,12466,12467,12468,12469,12470,12471,12472,12473,12474,12475,12476,12477,12478,12479,12480,12481,12482,12483,12484,12485,12486,12487,12488,12489,12490,12491,12492,12493,12494,12495,12496,12497,12498,12499,12500,12501,12502,12503,12504,12505,12506,12507,12508,12509,12510,12511,12512,12513,12514,12515,12516,12517,12518,12519,12520,12521,12522,12523,12524,12525,12526,12527,12528,12529,12530,12531,12532,12533,12534,null,null,null,null,null,null,null,null,52478,52479,52480,52482,52483,52484,52485,52486,52487,52490,52491,52493,52494,52495,52497,52498,52499,52500,52501,52502,52503,52506,52508,52510,52511,52512,null,null,null,null,null,null,52513,52514,52515,52517,52518,52519,52521,52522,52523,52525,52526,52527,52528,52529,52530,52531,52532,52533,52534,52535,52536,52538,52539,52540,52541,52542,null,null,null,null,null,null,52543,52544,52545,52546,52547,52548,52549,52550,52551,52552,52553,52554,52555,52556,52557,52558,52559,52560,52561,52562,52563,52564,52565,52566,52567,52568,52569,52570,52571,52573,52574,52575,1040,1041,1042,1043,1044,1045,1025,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1072,1073,1074,1075,1076,1077,1105,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,null,null,null,null,null,null,null,null,null,null,null,null,null,52577,52578,52579,52581,52582,52583,52584,52585,52586,52587,52590,52592,52594,52595,52596,52597,52598,52599,52601,52602,52603,52604,52605,52606,52607,52608,null,null,null,null,null,null,52609,52610,52611,52612,52613,52614,52615,52617,52618,52619,52620,52621,52622,52623,52624,52625,52626,52627,52630,52631,52633,52634,52635,52637,52638,52639,null,null,null,null,null,null,52640,52641,52642,52643,52646,52648,52650,52651,52652,52653,52654,52655,52657,52658,52659,52660,52661,52662,52663,52664,52665,52666,52667,52668,52669,52670,52671,52672,52673,52674,52675,52677,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,52678,52679,52680,52681,52682,52683,52685,52686,52687,52689,52690,52691,52692,52693,52694,52695,52696,52697,52698,52699,52700,52701,52702,52703,52704,52705,null,null,null,null,null,null,52706,52707,52708,52709,52710,52711,52713,52714,52715,52717,52718,52719,52721,52722,52723,52724,52725,52726,52727,52730,52732,52734,52735,52736,52737,52738,null,null,null,null,null,null,52739,52741,52742,52743,52745,52746,52747,52749,52750,52751,52752,52753,52754,52755,52757,52758,52759,52760,52762,52763,52764,52765,52766,52767,52770,52771,52773,52774,52775,52777,52778,52779,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,52780,52781,52782,52783,52786,52788,52790,52791,52792,52793,52794,52795,52796,52797,52798,52799,52800,52801,52802,52803,52804,52805,52806,52807,52808,52809,null,null,null,null,null,null,52810,52811,52812,52813,52814,52815,52816,52817,52818,52819,52820,52821,52822,52823,52826,52827,52829,52830,52834,52835,52836,52837,52838,52839,52842,52844,null,null,null,null,null,null,52846,52847,52848,52849,52850,52851,52854,52855,52857,52858,52859,52861,52862,52863,52864,52865,52866,52867,52870,52872,52874,52875,52876,52877,52878,52879,52882,52883,52885,52886,52887,52889,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,52890,52891,52892,52893,52894,52895,52898,52902,52903,52904,52905,52906,52907,52910,52911,52912,52913,52914,52915,52916,52917,52918,52919,52920,52921,52922,null,null,null,null,null,null,52923,52924,52925,52926,52927,52928,52930,52931,52932,52933,52934,52935,52936,52937,52938,52939,52940,52941,52942,52943,52944,52945,52946,52947,52948,52949,null,null,null,null,null,null,52950,52951,52952,52953,52954,52955,52956,52957,52958,52959,52960,52961,52962,52963,52966,52967,52969,52970,52973,52974,52975,52976,52977,52978,52979,52982,52986,52987,52988,52989,52990,52991,44032,44033,44036,44039,44040,44041,44042,44048,44049,44050,44051,44052,44053,44054,44055,44057,44058,44059,44060,44061,44064,44068,44076,44077,44079,44080,44081,44088,44089,44092,44096,44107,44109,44116,44120,44124,44144,44145,44148,44151,44152,44154,44160,44161,44163,44164,44165,44166,44169,44170,44171,44172,44176,44180,44188,44189,44191,44192,44193,44200,44201,44202,44204,44207,44208,44216,44217,44219,44220,44221,44225,44228,44232,44236,44245,44247,44256,44257,44260,44263,44264,44266,44268,44271,44272,44273,44275,44277,44278,44284,44285,44288,44292,44294,52994,52995,52997,52998,52999,53001,53002,53003,53004,53005,53006,53007,53010,53012,53014,53015,53016,53017,53018,53019,53021,53022,53023,53025,53026,53027,null,null,null,null,null,null,53029,53030,53031,53032,53033,53034,53035,53038,53042,53043,53044,53045,53046,53047,53049,53050,53051,53052,53053,53054,53055,53056,53057,53058,53059,53060,null,null,null,null,null,null,53061,53062,53063,53064,53065,53066,53067,53068,53069,53070,53071,53072,53073,53074,53075,53078,53079,53081,53082,53083,53085,53086,53087,53088,53089,53090,53091,53094,53096,53098,53099,53100,44300,44301,44303,44305,44312,44316,44320,44329,44332,44333,44340,44341,44344,44348,44356,44357,44359,44361,44368,44372,44376,44385,44387,44396,44397,44400,44403,44404,44405,44406,44411,44412,44413,44415,44417,44418,44424,44425,44428,44432,44444,44445,44452,44471,44480,44481,44484,44488,44496,44497,44499,44508,44512,44516,44536,44537,44540,44543,44544,44545,44552,44553,44555,44557,44564,44592,44593,44596,44599,44600,44602,44608,44609,44611,44613,44614,44618,44620,44621,44622,44624,44628,44630,44636,44637,44639,44640,44641,44645,44648,44649,44652,44656,44664,53101,53102,53103,53106,53107,53109,53110,53111,53113,53114,53115,53116,53117,53118,53119,53121,53122,53123,53124,53126,53127,53128,53129,53130,53131,53133,null,null,null,null,null,null,53134,53135,53136,53137,53138,53139,53140,53141,53142,53143,53144,53145,53146,53147,53148,53149,53150,53151,53152,53154,53155,53156,53157,53158,53159,53161,null,null,null,null,null,null,53162,53163,53164,53165,53166,53167,53169,53170,53171,53172,53173,53174,53175,53176,53177,53178,53179,53180,53181,53182,53183,53184,53185,53186,53187,53189,53190,53191,53192,53193,53194,53195,44665,44667,44668,44669,44676,44677,44684,44732,44733,44734,44736,44740,44748,44749,44751,44752,44753,44760,44761,44764,44776,44779,44781,44788,44792,44796,44807,44808,44813,44816,44844,44845,44848,44850,44852,44860,44861,44863,44865,44866,44867,44872,44873,44880,44892,44893,44900,44901,44921,44928,44932,44936,44944,44945,44949,44956,44984,44985,44988,44992,44999,45000,45001,45003,45005,45006,45012,45020,45032,45033,45040,45041,45044,45048,45056,45057,45060,45068,45072,45076,45084,45085,45096,45124,45125,45128,45130,45132,45134,45139,45140,45141,45143,45145,53196,53197,53198,53199,53200,53201,53202,53203,53204,53205,53206,53207,53208,53209,53210,53211,53212,53213,53214,53215,53218,53219,53221,53222,53223,53225,null,null,null,null,null,null,53226,53227,53228,53229,53230,53231,53234,53236,53238,53239,53240,53241,53242,53243,53245,53246,53247,53249,53250,53251,53253,53254,53255,53256,53257,53258,null,null,null,null,null,null,53259,53260,53261,53262,53263,53264,53266,53267,53268,53269,53270,53271,53273,53274,53275,53276,53277,53278,53279,53280,53281,53282,53283,53284,53285,53286,53287,53288,53289,53290,53291,53292,45149,45180,45181,45184,45188,45196,45197,45199,45201,45208,45209,45210,45212,45215,45216,45217,45218,45224,45225,45227,45228,45229,45230,45231,45233,45235,45236,45237,45240,45244,45252,45253,45255,45256,45257,45264,45265,45268,45272,45280,45285,45320,45321,45323,45324,45328,45330,45331,45336,45337,45339,45340,45341,45347,45348,45349,45352,45356,45364,45365,45367,45368,45369,45376,45377,45380,45384,45392,45393,45396,45397,45400,45404,45408,45432,45433,45436,45440,45442,45448,45449,45451,45453,45458,45459,45460,45464,45468,45480,45516,45520,45524,45532,45533,53294,53295,53296,53297,53298,53299,53302,53303,53305,53306,53307,53309,53310,53311,53312,53313,53314,53315,53318,53320,53322,53323,53324,53325,53326,53327,null,null,null,null,null,null,53329,53330,53331,53333,53334,53335,53337,53338,53339,53340,53341,53342,53343,53345,53346,53347,53348,53349,53350,53351,53352,53353,53354,53355,53358,53359,null,null,null,null,null,null,53361,53362,53363,53365,53366,53367,53368,53369,53370,53371,53374,53375,53376,53378,53379,53380,53381,53382,53383,53384,53385,53386,53387,53388,53389,53390,53391,53392,53393,53394,53395,53396,45535,45544,45545,45548,45552,45561,45563,45565,45572,45573,45576,45579,45580,45588,45589,45591,45593,45600,45620,45628,45656,45660,45664,45672,45673,45684,45685,45692,45700,45701,45705,45712,45713,45716,45720,45721,45722,45728,45729,45731,45733,45734,45738,45740,45744,45748,45768,45769,45772,45776,45778,45784,45785,45787,45789,45794,45796,45797,45798,45800,45803,45804,45805,45806,45807,45811,45812,45813,45815,45816,45817,45818,45819,45823,45824,45825,45828,45832,45840,45841,45843,45844,45845,45852,45908,45909,45910,45912,45915,45916,45918,45919,45924,45925,53397,53398,53399,53400,53401,53402,53403,53404,53405,53406,53407,53408,53409,53410,53411,53414,53415,53417,53418,53419,53421,53422,53423,53424,53425,53426,null,null,null,null,null,null,53427,53430,53432,53434,53435,53436,53437,53438,53439,53442,53443,53445,53446,53447,53450,53451,53452,53453,53454,53455,53458,53462,53463,53464,53465,53466,null,null,null,null,null,null,53467,53470,53471,53473,53474,53475,53477,53478,53479,53480,53481,53482,53483,53486,53490,53491,53492,53493,53494,53495,53497,53498,53499,53500,53501,53502,53503,53504,53505,53506,53507,53508,45927,45929,45931,45934,45936,45937,45940,45944,45952,45953,45955,45956,45957,45964,45968,45972,45984,45985,45992,45996,46020,46021,46024,46027,46028,46030,46032,46036,46037,46039,46041,46043,46045,46048,46052,46056,46076,46096,46104,46108,46112,46120,46121,46123,46132,46160,46161,46164,46168,46176,46177,46179,46181,46188,46208,46216,46237,46244,46248,46252,46261,46263,46265,46272,46276,46280,46288,46293,46300,46301,46304,46307,46308,46310,46316,46317,46319,46321,46328,46356,46357,46360,46363,46364,46372,46373,46375,46376,46377,46378,46384,46385,46388,46392,53509,53510,53511,53512,53513,53514,53515,53516,53518,53519,53520,53521,53522,53523,53524,53525,53526,53527,53528,53529,53530,53531,53532,53533,53534,53535,null,null,null,null,null,null,53536,53537,53538,53539,53540,53541,53542,53543,53544,53545,53546,53547,53548,53549,53550,53551,53554,53555,53557,53558,53559,53561,53563,53564,53565,53566,null,null,null,null,null,null,53567,53570,53574,53575,53576,53577,53578,53579,53582,53583,53585,53586,53587,53589,53590,53591,53592,53593,53594,53595,53598,53600,53602,53603,53604,53605,53606,53607,53609,53610,53611,53613,46400,46401,46403,46404,46405,46411,46412,46413,46416,46420,46428,46429,46431,46432,46433,46496,46497,46500,46504,46506,46507,46512,46513,46515,46516,46517,46523,46524,46525,46528,46532,46540,46541,46543,46544,46545,46552,46572,46608,46609,46612,46616,46629,46636,46644,46664,46692,46696,46748,46749,46752,46756,46763,46764,46769,46804,46832,46836,46840,46848,46849,46853,46888,46889,46892,46895,46896,46904,46905,46907,46916,46920,46924,46932,46933,46944,46948,46952,46960,46961,46963,46965,46972,46973,46976,46980,46988,46989,46991,46992,46993,46994,46998,46999,53614,53615,53616,53617,53618,53619,53620,53621,53622,53623,53624,53625,53626,53627,53629,53630,53631,53632,53633,53634,53635,53637,53638,53639,53641,53642,null,null,null,null,null,null,53643,53644,53645,53646,53647,53648,53649,53650,53651,53652,53653,53654,53655,53656,53657,53658,53659,53660,53661,53662,53663,53666,53667,53669,53670,53671,null,null,null,null,null,null,53673,53674,53675,53676,53677,53678,53679,53682,53684,53686,53687,53688,53689,53691,53693,53694,53695,53697,53698,53699,53700,53701,53702,53703,53704,53705,53706,53707,53708,53709,53710,53711,47000,47001,47004,47008,47016,47017,47019,47020,47021,47028,47029,47032,47047,47049,47084,47085,47088,47092,47100,47101,47103,47104,47105,47111,47112,47113,47116,47120,47128,47129,47131,47133,47140,47141,47144,47148,47156,47157,47159,47160,47161,47168,47172,47185,47187,47196,47197,47200,47204,47212,47213,47215,47217,47224,47228,47245,47272,47280,47284,47288,47296,47297,47299,47301,47308,47312,47316,47325,47327,47329,47336,47337,47340,47344,47352,47353,47355,47357,47364,47384,47392,47420,47421,47424,47428,47436,47439,47441,47448,47449,47452,47456,47464,47465,53712,53713,53714,53715,53716,53717,53718,53719,53721,53722,53723,53724,53725,53726,53727,53728,53729,53730,53731,53732,53733,53734,53735,53736,53737,53738,null,null,null,null,null,null,53739,53740,53741,53742,53743,53744,53745,53746,53747,53749,53750,53751,53753,53754,53755,53756,53757,53758,53759,53760,53761,53762,53763,53764,53765,53766,null,null,null,null,null,null,53768,53770,53771,53772,53773,53774,53775,53777,53778,53779,53780,53781,53782,53783,53784,53785,53786,53787,53788,53789,53790,53791,53792,53793,53794,53795,53796,53797,53798,53799,53800,53801,47467,47469,47476,47477,47480,47484,47492,47493,47495,47497,47498,47501,47502,47532,47533,47536,47540,47548,47549,47551,47553,47560,47561,47564,47566,47567,47568,47569,47570,47576,47577,47579,47581,47582,47585,47587,47588,47589,47592,47596,47604,47605,47607,47608,47609,47610,47616,47617,47624,47637,47672,47673,47676,47680,47682,47688,47689,47691,47693,47694,47699,47700,47701,47704,47708,47716,47717,47719,47720,47721,47728,47729,47732,47736,47747,47748,47749,47751,47756,47784,47785,47787,47788,47792,47794,47800,47801,47803,47805,47812,47816,47832,47833,47868,53802,53803,53806,53807,53809,53810,53811,53813,53814,53815,53816,53817,53818,53819,53822,53824,53826,53827,53828,53829,53830,53831,53833,53834,53835,53836,null,null,null,null,null,null,53837,53838,53839,53840,53841,53842,53843,53844,53845,53846,53847,53848,53849,53850,53851,53853,53854,53855,53856,53857,53858,53859,53861,53862,53863,53864,null,null,null,null,null,null,53865,53866,53867,53868,53869,53870,53871,53872,53873,53874,53875,53876,53877,53878,53879,53880,53881,53882,53883,53884,53885,53886,53887,53890,53891,53893,53894,53895,53897,53898,53899,53900,47872,47876,47885,47887,47889,47896,47900,47904,47913,47915,47924,47925,47926,47928,47931,47932,47933,47934,47940,47941,47943,47945,47949,47951,47952,47956,47960,47969,47971,47980,48008,48012,48016,48036,48040,48044,48052,48055,48064,48068,48072,48080,48083,48120,48121,48124,48127,48128,48130,48136,48137,48139,48140,48141,48143,48145,48148,48149,48150,48151,48152,48155,48156,48157,48158,48159,48164,48165,48167,48169,48173,48176,48177,48180,48184,48192,48193,48195,48196,48197,48201,48204,48205,48208,48221,48260,48261,48264,48267,48268,48270,48276,48277,48279,53901,53902,53903,53906,53907,53908,53910,53911,53912,53913,53914,53915,53917,53918,53919,53921,53922,53923,53925,53926,53927,53928,53929,53930,53931,53933,null,null,null,null,null,null,53934,53935,53936,53938,53939,53940,53941,53942,53943,53946,53947,53949,53950,53953,53955,53956,53957,53958,53959,53962,53964,53965,53966,53967,53968,53969,null,null,null,null,null,null,53970,53971,53973,53974,53975,53977,53978,53979,53981,53982,53983,53984,53985,53986,53987,53990,53991,53992,53993,53994,53995,53996,53997,53998,53999,54002,54003,54005,54006,54007,54009,54010,48281,48282,48288,48289,48292,48295,48296,48304,48305,48307,48308,48309,48316,48317,48320,48324,48333,48335,48336,48337,48341,48344,48348,48372,48373,48374,48376,48380,48388,48389,48391,48393,48400,48404,48420,48428,48448,48456,48457,48460,48464,48472,48473,48484,48488,48512,48513,48516,48519,48520,48521,48522,48528,48529,48531,48533,48537,48538,48540,48548,48560,48568,48596,48597,48600,48604,48617,48624,48628,48632,48640,48643,48645,48652,48653,48656,48660,48668,48669,48671,48708,48709,48712,48716,48718,48724,48725,48727,48729,48730,48731,48736,48737,48740,54011,54012,54013,54014,54015,54018,54020,54022,54023,54024,54025,54026,54027,54031,54033,54034,54035,54037,54039,54040,54041,54042,54043,54046,54050,54051,null,null,null,null,null,null,54052,54054,54055,54058,54059,54061,54062,54063,54065,54066,54067,54068,54069,54070,54071,54074,54078,54079,54080,54081,54082,54083,54086,54087,54088,54089,null,null,null,null,null,null,54090,54091,54092,54093,54094,54095,54096,54097,54098,54099,54100,54101,54102,54103,54104,54105,54106,54107,54108,54109,54110,54111,54112,54113,54114,54115,54116,54117,54118,54119,54120,54121,48744,48746,48752,48753,48755,48756,48757,48763,48764,48765,48768,48772,48780,48781,48783,48784,48785,48792,48793,48808,48848,48849,48852,48855,48856,48864,48867,48868,48869,48876,48897,48904,48905,48920,48921,48923,48924,48925,48960,48961,48964,48968,48976,48977,48981,49044,49072,49093,49100,49101,49104,49108,49116,49119,49121,49212,49233,49240,49244,49248,49256,49257,49296,49297,49300,49304,49312,49313,49315,49317,49324,49325,49327,49328,49331,49332,49333,49334,49340,49341,49343,49344,49345,49349,49352,49353,49356,49360,49368,49369,49371,49372,49373,49380,54122,54123,54124,54125,54126,54127,54128,54129,54130,54131,54132,54133,54134,54135,54136,54137,54138,54139,54142,54143,54145,54146,54147,54149,54150,54151,null,null,null,null,null,null,54152,54153,54154,54155,54158,54162,54163,54164,54165,54166,54167,54170,54171,54173,54174,54175,54177,54178,54179,54180,54181,54182,54183,54186,54188,54190,null,null,null,null,null,null,54191,54192,54193,54194,54195,54197,54198,54199,54201,54202,54203,54205,54206,54207,54208,54209,54210,54211,54214,54215,54218,54219,54220,54221,54222,54223,54225,54226,54227,54228,54229,54230,49381,49384,49388,49396,49397,49399,49401,49408,49412,49416,49424,49429,49436,49437,49438,49439,49440,49443,49444,49446,49447,49452,49453,49455,49456,49457,49462,49464,49465,49468,49472,49480,49481,49483,49484,49485,49492,49493,49496,49500,49508,49509,49511,49512,49513,49520,49524,49528,49541,49548,49549,49550,49552,49556,49558,49564,49565,49567,49569,49573,49576,49577,49580,49584,49597,49604,49608,49612,49620,49623,49624,49632,49636,49640,49648,49649,49651,49660,49661,49664,49668,49676,49677,49679,49681,49688,49689,49692,49695,49696,49704,49705,49707,49709,54231,54233,54234,54235,54236,54237,54238,54239,54240,54242,54244,54245,54246,54247,54248,54249,54250,54251,54254,54255,54257,54258,54259,54261,54262,54263,null,null,null,null,null,null,54264,54265,54266,54267,54270,54272,54274,54275,54276,54277,54278,54279,54281,54282,54283,54284,54285,54286,54287,54288,54289,54290,54291,54292,54293,54294,null,null,null,null,null,null,54295,54296,54297,54298,54299,54300,54302,54303,54304,54305,54306,54307,54308,54309,54310,54311,54312,54313,54314,54315,54316,54317,54318,54319,54320,54321,54322,54323,54324,54325,54326,54327,49711,49713,49714,49716,49736,49744,49745,49748,49752,49760,49765,49772,49773,49776,49780,49788,49789,49791,49793,49800,49801,49808,49816,49819,49821,49828,49829,49832,49836,49837,49844,49845,49847,49849,49884,49885,49888,49891,49892,49899,49900,49901,49903,49905,49910,49912,49913,49915,49916,49920,49928,49929,49932,49933,49939,49940,49941,49944,49948,49956,49957,49960,49961,49989,50024,50025,50028,50032,50034,50040,50041,50044,50045,50052,50056,50060,50112,50136,50137,50140,50143,50144,50146,50152,50153,50157,50164,50165,50168,50184,50192,50212,50220,50224,54328,54329,54330,54331,54332,54333,54334,54335,54337,54338,54339,54341,54342,54343,54344,54345,54346,54347,54348,54349,54350,54351,54352,54353,54354,54355,null,null,null,null,null,null,54356,54357,54358,54359,54360,54361,54362,54363,54365,54366,54367,54369,54370,54371,54373,54374,54375,54376,54377,54378,54379,54380,54382,54384,54385,54386,null,null,null,null,null,null,54387,54388,54389,54390,54391,54394,54395,54397,54398,54401,54403,54404,54405,54406,54407,54410,54412,54414,54415,54416,54417,54418,54419,54421,54422,54423,54424,54425,54426,54427,54428,54429,50228,50236,50237,50248,50276,50277,50280,50284,50292,50293,50297,50304,50324,50332,50360,50364,50409,50416,50417,50420,50424,50426,50431,50432,50433,50444,50448,50452,50460,50472,50473,50476,50480,50488,50489,50491,50493,50500,50501,50504,50505,50506,50508,50509,50510,50515,50516,50517,50519,50520,50521,50525,50526,50528,50529,50532,50536,50544,50545,50547,50548,50549,50556,50557,50560,50564,50567,50572,50573,50575,50577,50581,50583,50584,50588,50592,50601,50612,50613,50616,50617,50619,50620,50621,50622,50628,50629,50630,50631,50632,50633,50634,50636,50638,54430,54431,54432,54433,54434,54435,54436,54437,54438,54439,54440,54442,54443,54444,54445,54446,54447,54448,54449,54450,54451,54452,54453,54454,54455,54456,null,null,null,null,null,null,54457,54458,54459,54460,54461,54462,54463,54464,54465,54466,54467,54468,54469,54470,54471,54472,54473,54474,54475,54477,54478,54479,54481,54482,54483,54485,null,null,null,null,null,null,54486,54487,54488,54489,54490,54491,54493,54494,54496,54497,54498,54499,54500,54501,54502,54503,54505,54506,54507,54509,54510,54511,54513,54514,54515,54516,54517,54518,54519,54521,54522,54524,50640,50641,50644,50648,50656,50657,50659,50661,50668,50669,50670,50672,50676,50678,50679,50684,50685,50686,50687,50688,50689,50693,50694,50695,50696,50700,50704,50712,50713,50715,50716,50724,50725,50728,50732,50733,50734,50736,50739,50740,50741,50743,50745,50747,50752,50753,50756,50760,50768,50769,50771,50772,50773,50780,50781,50784,50796,50799,50801,50808,50809,50812,50816,50824,50825,50827,50829,50836,50837,50840,50844,50852,50853,50855,50857,50864,50865,50868,50872,50873,50874,50880,50881,50883,50885,50892,50893,50896,50900,50908,50909,50912,50913,50920,54526,54527,54528,54529,54530,54531,54533,54534,54535,54537,54538,54539,54541,54542,54543,54544,54545,54546,54547,54550,54552,54553,54554,54555,54556,54557,null,null,null,null,null,null,54558,54559,54560,54561,54562,54563,54564,54565,54566,54567,54568,54569,54570,54571,54572,54573,54574,54575,54576,54577,54578,54579,54580,54581,54582,54583,null,null,null,null,null,null,54584,54585,54586,54587,54590,54591,54593,54594,54595,54597,54598,54599,54600,54601,54602,54603,54606,54608,54610,54611,54612,54613,54614,54615,54618,54619,54621,54622,54623,54625,54626,54627,50921,50924,50928,50936,50937,50941,50948,50949,50952,50956,50964,50965,50967,50969,50976,50977,50980,50984,50992,50993,50995,50997,50999,51004,51005,51008,51012,51018,51020,51021,51023,51025,51026,51027,51028,51029,51030,51031,51032,51036,51040,51048,51051,51060,51061,51064,51068,51069,51070,51075,51076,51077,51079,51080,51081,51082,51086,51088,51089,51092,51094,51095,51096,51098,51104,51105,51107,51108,51109,51110,51116,51117,51120,51124,51132,51133,51135,51136,51137,51144,51145,51148,51150,51152,51160,51165,51172,51176,51180,51200,51201,51204,51208,51210,54628,54630,54631,54634,54636,54638,54639,54640,54641,54642,54643,54646,54647,54649,54650,54651,54653,54654,54655,54656,54657,54658,54659,54662,54666,54667,null,null,null,null,null,null,54668,54669,54670,54671,54673,54674,54675,54676,54677,54678,54679,54680,54681,54682,54683,54684,54685,54686,54687,54688,54689,54690,54691,54692,54694,54695,null,null,null,null,null,null,54696,54697,54698,54699,54700,54701,54702,54703,54704,54705,54706,54707,54708,54709,54710,54711,54712,54713,54714,54715,54716,54717,54718,54719,54720,54721,54722,54723,54724,54725,54726,54727,51216,51217,51219,51221,51222,51228,51229,51232,51236,51244,51245,51247,51249,51256,51260,51264,51272,51273,51276,51277,51284,51312,51313,51316,51320,51322,51328,51329,51331,51333,51334,51335,51339,51340,51341,51348,51357,51359,51361,51368,51388,51389,51396,51400,51404,51412,51413,51415,51417,51424,51425,51428,51445,51452,51453,51456,51460,51461,51462,51468,51469,51471,51473,51480,51500,51508,51536,51537,51540,51544,51552,51553,51555,51564,51568,51572,51580,51592,51593,51596,51600,51608,51609,51611,51613,51648,51649,51652,51655,51656,51658,51664,51665,51667,54730,54731,54733,54734,54735,54737,54739,54740,54741,54742,54743,54746,54748,54750,54751,54752,54753,54754,54755,54758,54759,54761,54762,54763,54765,54766,null,null,null,null,null,null,54767,54768,54769,54770,54771,54774,54776,54778,54779,54780,54781,54782,54783,54786,54787,54789,54790,54791,54793,54794,54795,54796,54797,54798,54799,54802,null,null,null,null,null,null,54806,54807,54808,54809,54810,54811,54813,54814,54815,54817,54818,54819,54821,54822,54823,54824,54825,54826,54827,54828,54830,54831,54832,54833,54834,54835,54836,54837,54838,54839,54842,54843,51669,51670,51673,51674,51676,51677,51680,51682,51684,51687,51692,51693,51695,51696,51697,51704,51705,51708,51712,51720,51721,51723,51724,51725,51732,51736,51753,51788,51789,51792,51796,51804,51805,51807,51808,51809,51816,51837,51844,51864,51900,51901,51904,51908,51916,51917,51919,51921,51923,51928,51929,51936,51948,51956,51976,51984,51988,51992,52000,52001,52033,52040,52041,52044,52048,52056,52057,52061,52068,52088,52089,52124,52152,52180,52196,52199,52201,52236,52237,52240,52244,52252,52253,52257,52258,52263,52264,52265,52268,52270,52272,52280,52281,52283,54845,54846,54847,54849,54850,54851,54852,54854,54855,54858,54860,54862,54863,54864,54866,54867,54870,54871,54873,54874,54875,54877,54878,54879,54880,54881,null,null,null,null,null,null,54882,54883,54884,54885,54886,54888,54890,54891,54892,54893,54894,54895,54898,54899,54901,54902,54903,54904,54905,54906,54907,54908,54909,54910,54911,54912,null,null,null,null,null,null,54913,54914,54916,54918,54919,54920,54921,54922,54923,54926,54927,54929,54930,54931,54933,54934,54935,54936,54937,54938,54939,54940,54942,54944,54946,54947,54948,54949,54950,54951,54953,54954,52284,52285,52286,52292,52293,52296,52300,52308,52309,52311,52312,52313,52320,52324,52326,52328,52336,52341,52376,52377,52380,52384,52392,52393,52395,52396,52397,52404,52405,52408,52412,52420,52421,52423,52425,52432,52436,52452,52460,52464,52481,52488,52489,52492,52496,52504,52505,52507,52509,52516,52520,52524,52537,52572,52576,52580,52588,52589,52591,52593,52600,52616,52628,52629,52632,52636,52644,52645,52647,52649,52656,52676,52684,52688,52712,52716,52720,52728,52729,52731,52733,52740,52744,52748,52756,52761,52768,52769,52772,52776,52784,52785,52787,52789,54955,54957,54958,54959,54961,54962,54963,54964,54965,54966,54967,54968,54970,54972,54973,54974,54975,54976,54977,54978,54979,54982,54983,54985,54986,54987,null,null,null,null,null,null,54989,54990,54991,54992,54994,54995,54997,54998,55000,55002,55003,55004,55005,55006,55007,55009,55010,55011,55013,55014,55015,55017,55018,55019,55020,55021,null,null,null,null,null,null,55022,55023,55025,55026,55027,55028,55030,55031,55032,55033,55034,55035,55038,55039,55041,55042,55043,55045,55046,55047,55048,55049,55050,55051,55052,55053,55054,55055,55056,55058,55059,55060,52824,52825,52828,52831,52832,52833,52840,52841,52843,52845,52852,52853,52856,52860,52868,52869,52871,52873,52880,52881,52884,52888,52896,52897,52899,52900,52901,52908,52909,52929,52964,52965,52968,52971,52972,52980,52981,52983,52984,52985,52992,52993,52996,53000,53008,53009,53011,53013,53020,53024,53028,53036,53037,53039,53040,53041,53048,53076,53077,53080,53084,53092,53093,53095,53097,53104,53105,53108,53112,53120,53125,53132,53153,53160,53168,53188,53216,53217,53220,53224,53232,53233,53235,53237,53244,53248,53252,53265,53272,53293,53300,53301,53304,53308,55061,55062,55063,55066,55067,55069,55070,55071,55073,55074,55075,55076,55077,55078,55079,55082,55084,55086,55087,55088,55089,55090,55091,55094,55095,55097,null,null,null,null,null,null,55098,55099,55101,55102,55103,55104,55105,55106,55107,55109,55110,55112,55114,55115,55116,55117,55118,55119,55122,55123,55125,55130,55131,55132,55133,55134,null,null,null,null,null,null,55135,55138,55140,55142,55143,55144,55146,55147,55149,55150,55151,55153,55154,55155,55157,55158,55159,55160,55161,55162,55163,55166,55167,55168,55170,55171,55172,55173,55174,55175,55178,55179,53316,53317,53319,53321,53328,53332,53336,53344,53356,53357,53360,53364,53372,53373,53377,53412,53413,53416,53420,53428,53429,53431,53433,53440,53441,53444,53448,53449,53456,53457,53459,53460,53461,53468,53469,53472,53476,53484,53485,53487,53488,53489,53496,53517,53552,53553,53556,53560,53562,53568,53569,53571,53572,53573,53580,53581,53584,53588,53596,53597,53599,53601,53608,53612,53628,53636,53640,53664,53665,53668,53672,53680,53681,53683,53685,53690,53692,53696,53720,53748,53752,53767,53769,53776,53804,53805,53808,53812,53820,53821,53823,53825,53832,53852,55181,55182,55183,55185,55186,55187,55188,55189,55190,55191,55194,55196,55198,55199,55200,55201,55202,55203,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,53860,53888,53889,53892,53896,53904,53905,53909,53916,53920,53924,53932,53937,53944,53945,53948,53951,53952,53954,53960,53961,53963,53972,53976,53980,53988,53989,54000,54001,54004,54008,54016,54017,54019,54021,54028,54029,54030,54032,54036,54038,54044,54045,54047,54048,54049,54053,54056,54057,54060,54064,54072,54073,54075,54076,54077,54084,54085,54140,54141,54144,54148,54156,54157,54159,54160,54161,54168,54169,54172,54176,54184,54185,54187,54189,54196,54200,54204,54212,54213,54216,54217,54224,54232,54241,54243,54252,54253,54256,54260,54268,54269,54271,54273,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,54280,54301,54336,54340,54364,54368,54372,54381,54383,54392,54393,54396,54399,54400,54402,54408,54409,54411,54413,54420,54441,54476,54480,54484,54492,54495,54504,54508,54512,54520,54523,54525,54532,54536,54540,54548,54549,54551,54588,54589,54592,54596,54604,54605,54607,54609,54616,54617,54620,54624,54629,54632,54633,54635,54637,54644,54645,54648,54652,54660,54661,54663,54664,54665,54672,54693,54728,54729,54732,54736,54738,54744,54745,54747,54749,54756,54757,54760,54764,54772,54773,54775,54777,54784,54785,54788,54792,54800,54801,54803,54804,54805,54812,54816,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,54820,54829,54840,54841,54844,54848,54853,54856,54857,54859,54861,54865,54868,54869,54872,54876,54887,54889,54896,54897,54900,54915,54917,54924,54925,54928,54932,54941,54943,54945,54952,54956,54960,54969,54971,54980,54981,54984,54988,54993,54996,54999,55001,55008,55012,55016,55024,55029,55036,55037,55040,55044,55057,55064,55065,55068,55072,55080,55081,55083,55085,55092,55093,55096,55100,55108,55111,55113,55120,55121,55124,55126,55127,55128,55129,55136,55137,55139,55141,55145,55148,55152,55156,55164,55165,55169,55176,55177,55180,55184,55192,55193,55195,55197,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,20285,20339,20551,20729,21152,21487,21621,21733,22025,23233,23478,26247,26550,26551,26607,27468,29634,30146,31292,33499,33540,34903,34952,35382,36040,36303,36603,36838,39381,21051,21364,21508,24682,24932,27580,29647,33050,35258,35282,38307,20355,21002,22718,22904,23014,24178,24185,25031,25536,26438,26604,26751,28567,30286,30475,30965,31240,31487,31777,32925,33390,33393,35563,38291,20075,21917,26359,28212,30883,31469,33883,35088,34638,38824,21208,22350,22570,23884,24863,25022,25121,25954,26577,27204,28187,29976,30131,30435,30640,32058,37039,37969,37970,40853,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,21283,23724,30002,32987,37440,38296,21083,22536,23004,23713,23831,24247,24378,24394,24951,27743,30074,30086,31968,32115,32177,32652,33108,33313,34193,35137,35611,37628,38477,40007,20171,20215,20491,20977,22607,24887,24894,24936,25913,27114,28433,30117,30342,30422,31623,33445,33995,63744,37799,38283,21888,23458,22353,63745,31923,32697,37301,20520,21435,23621,24040,25298,25454,25818,25831,28192,28844,31067,36317,36382,63746,36989,37445,37624,20094,20214,20581,24062,24314,24838,26967,33137,34388,36423,37749,39467,20062,20625,26480,26688,20745,21133,21138,27298,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,30652,37392,40660,21163,24623,36850,20552,25001,25581,25802,26684,27268,28608,33160,35233,38548,22533,29309,29356,29956,32121,32365,32937,35211,35700,36963,40273,25225,27770,28500,32080,32570,35363,20860,24906,31645,35609,37463,37772,20140,20435,20510,20670,20742,21185,21197,21375,22384,22659,24218,24465,24950,25004,25806,25964,26223,26299,26356,26775,28039,28805,28913,29855,29861,29898,30169,30828,30956,31455,31478,32069,32147,32789,32831,33051,33686,35686,36629,36885,37857,38915,38968,39514,39912,20418,21843,22586,22865,23395,23622,24760,25106,26690,26800,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,26856,28330,30028,30328,30926,31293,31995,32363,32380,35336,35489,35903,38542,40388,21476,21481,21578,21617,22266,22993,23396,23611,24235,25335,25911,25925,25970,26272,26543,27073,27837,30204,30352,30590,31295,32660,32771,32929,33167,33510,33533,33776,34241,34865,34996,35493,63747,36764,37678,38599,39015,39640,40723,21741,26011,26354,26767,31296,35895,40288,22256,22372,23825,26118,26801,26829,28414,29736,34974,39908,27752,63748,39592,20379,20844,20849,21151,23380,24037,24656,24685,25329,25511,25915,29657,31354,34467,36002,38799,20018,23521,25096,26524,29916,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,31185,33747,35463,35506,36328,36942,37707,38982,24275,27112,34303,37101,63749,20896,23448,23532,24931,26874,27454,28748,29743,29912,31649,32592,33733,35264,36011,38364,39208,21038,24669,25324,36866,20362,20809,21281,22745,24291,26336,27960,28826,29378,29654,31568,33009,37979,21350,25499,32619,20054,20608,22602,22750,24618,24871,25296,27088,39745,23439,32024,32945,36703,20132,20689,21676,21932,23308,23968,24039,25898,25934,26657,27211,29409,30350,30703,32094,32761,33184,34126,34527,36611,36686,37066,39171,39509,39851,19992,20037,20061,20167,20465,20855,21246,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,21312,21475,21477,21646,22036,22389,22434,23495,23943,24272,25084,25304,25937,26552,26601,27083,27472,27590,27628,27714,28317,28792,29399,29590,29699,30655,30697,31350,32127,32777,33276,33285,33290,33503,34914,35635,36092,36544,36881,37041,37476,37558,39378,39493,40169,40407,40860,22283,23616,33738,38816,38827,40628,21531,31384,32676,35033,36557,37089,22528,23624,25496,31391,23470,24339,31353,31406,33422,36524,20518,21048,21240,21367,22280,25331,25458,27402,28099,30519,21413,29527,34152,36470,38357,26426,27331,28528,35437,36556,39243,63750,26231,27512,36020,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,39740,63751,21483,22317,22862,25542,27131,29674,30789,31418,31429,31998,33909,35215,36211,36917,38312,21243,22343,30023,31584,33740,37406,63752,27224,20811,21067,21127,25119,26840,26997,38553,20677,21156,21220,25027,26020,26681,27135,29822,31563,33465,33771,35250,35641,36817,39241,63753,20170,22935,25810,26129,27278,29748,31105,31165,33449,34942,34943,35167,63754,37670,20235,21450,24613,25201,27762,32026,32102,20120,20834,30684,32943,20225,20238,20854,20864,21980,22120,22331,22522,22524,22804,22855,22931,23492,23696,23822,24049,24190,24524,25216,26071,26083,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,26398,26399,26462,26827,26820,27231,27450,27683,27773,27778,28103,29592,29734,29738,29826,29859,30072,30079,30849,30959,31041,31047,31048,31098,31637,32000,32186,32648,32774,32813,32908,35352,35663,35912,36215,37665,37668,39138,39249,39438,39439,39525,40594,32202,20342,21513,25326,26708,37329,21931,20794,63755,63756,23068,25062,63757,25295,25343,63758,63759,63760,63761,63762,63763,37027,63764,63765,63766,63767,63768,35582,63769,63770,63771,63772,26262,63773,29014,63774,63775,38627,63776,25423,25466,21335,63777,26511,26976,28275,63778,30007,63779,63780,63781,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,32013,63782,63783,34930,22218,23064,63784,63785,63786,63787,63788,20035,63789,20839,22856,26608,32784,63790,22899,24180,25754,31178,24565,24684,25288,25467,23527,23511,21162,63791,22900,24361,24594,63792,63793,63794,29785,63795,63796,63797,63798,63799,63800,39377,63801,63802,63803,63804,63805,63806,63807,63808,63809,63810,63811,28611,63812,63813,33215,36786,24817,63814,63815,33126,63816,63817,23615,63818,63819,63820,63821,63822,63823,63824,63825,23273,35365,26491,32016,63826,63827,63828,63829,63830,63831,33021,63832,63833,23612,27877,21311,28346,22810,33590,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,20025,20150,20294,21934,22296,22727,24406,26039,26086,27264,27573,28237,30701,31471,31774,32222,34507,34962,37170,37723,25787,28606,29562,30136,36948,21846,22349,25018,25812,26311,28129,28251,28525,28601,30192,32835,33213,34113,35203,35527,35674,37663,27795,30035,31572,36367,36957,21776,22530,22616,24162,25095,25758,26848,30070,31958,34739,40680,20195,22408,22382,22823,23565,23729,24118,24453,25140,25825,29619,33274,34955,36024,38538,40667,23429,24503,24755,20498,20992,21040,22294,22581,22615,23566,23648,23798,23947,24230,24466,24764,25361,25481,25623,26691,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,26873,27330,28120,28193,28372,28644,29182,30428,30585,31153,31291,33796,35241,36077,36339,36424,36867,36884,36947,37117,37709,38518,38876,27602,28678,29272,29346,29544,30563,31167,31716,32411,35712,22697,24775,25958,26109,26302,27788,28958,29129,35930,38931,20077,31361,20189,20908,20941,21205,21516,24999,26481,26704,26847,27934,28540,30140,30643,31461,33012,33891,37509,20828,26007,26460,26515,30168,31431,33651,63834,35910,36887,38957,23663,33216,33434,36929,36975,37389,24471,23965,27225,29128,30331,31561,34276,35588,37159,39472,21895,25078,63835,30313,32645,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,34367,34746,35064,37007,63836,27931,28889,29662,32097,33853,63837,37226,39409,63838,20098,21365,27396,27410,28734,29211,34349,40478,21068,36771,23888,25829,25900,27414,28651,31811,32412,34253,35172,35261,25289,33240,34847,24266,26391,28010,29436,29701,29807,34690,37086,20358,23821,24480,33802,20919,25504,30053,20142,20486,20841,20937,26753,27153,31918,31921,31975,33391,35538,36635,37327,20406,20791,21237,21570,24300,24942,25150,26053,27354,28670,31018,34268,34851,38317,39522,39530,40599,40654,21147,26310,27511,28701,31019,36706,38722,24976,25088,25891,28451,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,29001,29833,32244,32879,34030,36646,36899,37706,20925,21015,21155,27916,28872,35010,24265,25986,27566,28610,31806,29557,20196,20278,22265,63839,23738,23994,24604,29618,31533,32666,32718,32838,36894,37428,38646,38728,38936,40801,20363,28583,31150,37300,38583,21214,63840,25736,25796,27347,28510,28696,29200,30439,32769,34310,34396,36335,36613,38706,39791,40442,40565,30860,31103,32160,33737,37636,40575,40595,35542,22751,24324,26407,28711,29903,31840,32894,20769,28712,29282,30922,36034,36058,36084,38647,20102,20698,23534,24278,26009,29134,30274,30637,32842,34044,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36988,39719,40845,22744,23105,23650,27155,28122,28431,30267,32047,32311,34078,35128,37860,38475,21129,26066,26611,27060,27969,28316,28687,29705,29792,30041,30244,30827,35628,39006,20845,25134,38520,20374,20523,23833,28138,32184,36650,24459,24900,26647,63841,38534,21202,32907,20956,20940,26974,31260,32190,33777,38517,20442,21033,21400,21519,21774,23653,24743,26446,26792,28012,29313,29432,29702,29827,63842,30178,31852,32633,32696,33673,35023,35041,37324,37328,38626,39881,21533,28542,29136,29848,34298,36522,38563,40023,40607,26519,28107,29747,33256,38678,30764,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,31435,31520,31890,25705,29802,30194,30908,30952,39340,39764,40635,23518,24149,28448,33180,33707,37000,19975,21325,23081,24018,24398,24930,25405,26217,26364,28415,28459,28771,30622,33836,34067,34875,36627,39237,39995,21788,25273,26411,27819,33545,35178,38778,20129,22916,24536,24537,26395,32178,32596,33426,33579,33725,36638,37017,22475,22969,23186,23504,26151,26522,26757,27599,29028,32629,36023,36067,36993,39749,33032,35978,38476,39488,40613,23391,27667,29467,30450,30431,33804,20906,35219,20813,20885,21193,26825,27796,30468,30496,32191,32236,38754,40629,28357,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,34065,20901,21517,21629,26126,26269,26919,28319,30399,30609,33559,33986,34719,37225,37528,40180,34946,20398,20882,21215,22982,24125,24917,25720,25721,26286,26576,27169,27597,27611,29279,29281,29761,30520,30683,32791,33468,33541,35584,35624,35980,26408,27792,29287,30446,30566,31302,40361,27519,27794,22818,26406,33945,21359,22675,22937,24287,25551,26164,26483,28218,29483,31447,33495,37672,21209,24043,25006,25035,25098,25287,25771,26080,26969,27494,27595,28961,29687,30045,32326,33310,33538,34154,35491,36031,38695,40289,22696,40664,20497,21006,21563,21839,25991,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,27766,32010,32011,32862,34442,38272,38639,21247,27797,29289,21619,23194,23614,23883,24396,24494,26410,26806,26979,28220,28228,30473,31859,32654,34183,35598,36855,38753,40692,23735,24758,24845,25003,25935,26107,26108,27665,27887,29599,29641,32225,38292,23494,34588,35600,21085,21338,25293,25615,25778,26420,27192,27850,29632,29854,31636,31893,32283,33162,33334,34180,36843,38649,39361,20276,21322,21453,21467,25292,25644,25856,26001,27075,27886,28504,29677,30036,30242,30436,30460,30928,30971,31020,32070,33324,34784,36820,38930,39151,21187,25300,25765,28196,28497,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,30332,36299,37297,37474,39662,39747,20515,20621,22346,22952,23592,24135,24439,25151,25918,26041,26049,26121,26507,27036,28354,30917,32033,32938,33152,33323,33459,33953,34444,35370,35607,37030,38450,40848,20493,20467,63843,22521,24472,25308,25490,26479,28227,28953,30403,32972,32986,35060,35061,35097,36064,36649,37197,38506,20271,20336,24091,26575,26658,30333,30334,39748,24161,27146,29033,29140,30058,63844,32321,34115,34281,39132,20240,31567,32624,38309,20961,24070,26805,27710,27726,27867,29359,31684,33539,27861,29754,20731,21128,22721,25816,27287,29863,30294,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,30887,34327,38370,38713,63845,21342,24321,35722,36776,36783,37002,21029,30629,40009,40712,19993,20482,20853,23643,24183,26142,26170,26564,26821,28851,29953,30149,31177,31453,36647,39200,39432,20445,22561,22577,23542,26222,27493,27921,28282,28541,29668,29995,33769,35036,35091,35676,36628,20239,20693,21264,21340,23443,24489,26381,31119,33145,33583,34068,35079,35206,36665,36667,39333,39954,26412,20086,20472,22857,23553,23791,23792,25447,26834,28925,29090,29739,32299,34028,34562,36898,37586,40179,19981,20184,20463,20613,21078,21103,21542,21648,22496,22827,23142,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,23386,23413,23500,24220,63846,25206,25975,26023,28014,28325,29238,31526,31807,32566,33104,33105,33178,33344,33433,33705,35331,36000,36070,36091,36212,36282,37096,37340,38428,38468,39385,40167,21271,20998,21545,22132,22707,22868,22894,24575,24996,25198,26128,27774,28954,30406,31881,31966,32027,33452,36033,38640,63847,20315,24343,24447,25282,23849,26379,26842,30844,32323,40300,19989,20633,21269,21290,21329,22915,23138,24199,24754,24970,25161,25209,26000,26503,27047,27604,27606,27607,27608,27832,63848,29749,30202,30738,30865,31189,31192,31875,32203,32737,32933,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,33086,33218,33778,34586,35048,35513,35692,36027,37145,38750,39131,40763,22188,23338,24428,25996,27315,27567,27996,28657,28693,29277,29613,36007,36051,38971,24977,27703,32856,39425,20045,20107,20123,20181,20282,20284,20351,20447,20735,21490,21496,21766,21987,22235,22763,22882,23057,23531,23546,23556,24051,24107,24473,24605,25448,26012,26031,26614,26619,26797,27515,27801,27863,28195,28681,29509,30722,31038,31040,31072,31169,31721,32023,32114,32902,33293,33678,34001,34503,35039,35408,35422,35613,36060,36198,36781,37034,39164,39391,40605,21066,63849,26388,63850,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,20632,21034,23665,25955,27733,29642,29987,30109,31639,33948,37240,38704,20087,25746,27578,29022,34217,19977,63851,26441,26862,28183,33439,34072,34923,25591,28545,37394,39087,19978,20663,20687,20767,21830,21930,22039,23360,23577,23776,24120,24202,24224,24258,24819,26705,27233,28248,29245,29248,29376,30456,31077,31665,32724,35059,35316,35443,35937,36062,38684,22622,29885,36093,21959,63852,31329,32034,33394,29298,29983,29989,63853,31513,22661,22779,23996,24207,24246,24464,24661,25234,25471,25933,26257,26329,26360,26646,26866,29312,29790,31598,32110,32214,32626,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,32997,33298,34223,35199,35475,36893,37604,40653,40736,22805,22893,24109,24796,26132,26227,26512,27728,28101,28511,30707,30889,33990,37323,37675,20185,20682,20808,21892,23307,23459,25159,25982,26059,28210,29053,29697,29764,29831,29887,30316,31146,32218,32341,32680,33146,33203,33337,34330,34796,35445,36323,36984,37521,37925,39245,39854,21352,23633,26964,27844,27945,28203,33292,34203,35131,35373,35498,38634,40807,21089,26297,27570,32406,34814,36109,38275,38493,25885,28041,29166,63854,22478,22995,23468,24615,24826,25104,26143,26207,29481,29689,30427,30465,31596,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,32854,32882,33125,35488,37266,19990,21218,27506,27927,31237,31545,32048,63855,36016,21484,22063,22609,23477,23567,23569,24034,25152,25475,25620,26157,26803,27836,28040,28335,28703,28836,29138,29990,30095,30094,30233,31505,31712,31787,32032,32057,34092,34157,34311,35380,36877,36961,37045,37559,38902,39479,20439,23660,26463,28049,31903,32396,35606,36118,36895,23403,24061,25613,33984,36956,39137,29575,23435,24730,26494,28126,35359,35494,36865,38924,21047,63856,28753,30862,37782,34928,37335,20462,21463,22013,22234,22402,22781,23234,23432,23723,23744,24101,24833,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,25101,25163,25480,25628,25910,25976,27193,27530,27700,27929,28465,29159,29417,29560,29703,29874,30246,30561,31168,31319,31466,31929,32143,32172,32353,32670,33065,33585,33936,34010,34282,34966,35504,35728,36664,36930,36995,37228,37526,37561,38539,38567,38568,38614,38656,38920,39318,39635,39706,21460,22654,22809,23408,23487,28113,28506,29087,29729,29881,32901,33789,24033,24455,24490,24642,26092,26642,26991,27219,27529,27957,28147,29667,30462,30636,31565,32020,33059,33308,33600,34036,34147,35426,35524,37255,37662,38918,39348,25100,34899,36848,37477,23815,23847,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,23913,29791,33181,34664,28629,25342,32722,35126,35186,19998,20056,20711,21213,21319,25215,26119,32361,34821,38494,20365,21273,22070,22987,23204,23608,23630,23629,24066,24337,24643,26045,26159,26178,26558,26612,29468,30690,31034,32709,33940,33997,35222,35430,35433,35553,35925,35962,22516,23508,24335,24687,25325,26893,27542,28252,29060,31698,34645,35672,36606,39135,39166,20280,20353,20449,21627,23072,23480,24892,26032,26216,29180,30003,31070,32051,33102,33251,33688,34218,34254,34563,35338,36523,36763,63857,36805,22833,23460,23526,24713,23529,23563,24515,27777,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,63858,28145,28683,29978,33455,35574,20160,21313,63859,38617,27663,20126,20420,20818,21854,23077,23784,25105,29273,33469,33706,34558,34905,35357,38463,38597,39187,40201,40285,22538,23731,23997,24132,24801,24853,25569,27138,28197,37122,37716,38990,39952,40823,23433,23736,25353,26191,26696,30524,38593,38797,38996,39839,26017,35585,36555,38332,21813,23721,24022,24245,26263,30284,33780,38343,22739,25276,29390,40232,20208,22830,24591,26171,27523,31207,40230,21395,21696,22467,23830,24859,26326,28079,30861,33406,38552,38724,21380,25212,25494,28082,32266,33099,38989,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,27387,32588,40367,40474,20063,20539,20918,22812,24825,25590,26928,29242,32822,63860,37326,24369,63861,63862,32004,33509,33903,33979,34277,36493,63863,20335,63864,63865,22756,23363,24665,25562,25880,25965,26264,63866,26954,27171,27915,28673,29036,30162,30221,31155,31344,63867,32650,63868,35140,63869,35731,37312,38525,63870,39178,22276,24481,26044,28417,30208,31142,35486,39341,39770,40812,20740,25014,25233,27277,33222,20547,22576,24422,28937,35328,35578,23420,34326,20474,20796,22196,22852,25513,28153,23978,26989,20870,20104,20313,63871,63872,63873,22914,63874,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,63875,27487,27741,63876,29877,30998,63877,33287,33349,33593,36671,36701,63878,39192,63879,63880,63881,20134,63882,22495,24441,26131,63883,63884,30123,32377,35695,63885,36870,39515,22181,22567,23032,23071,23476,63886,24310,63887,63888,25424,25403,63889,26941,27783,27839,28046,28051,28149,28436,63890,28895,28982,29017,63891,29123,29141,63892,30799,30831,63893,31605,32227,63894,32303,63895,34893,36575,63896,63897,63898,37467,63899,40182,63900,63901,63902,24709,28037,63903,29105,63904,63905,38321,21421,63906,63907,63908,26579,63909,28814,28976,29744,33398,33490,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,63910,38331,39653,40573,26308,63911,29121,33865,63912,63913,22603,63914,63915,23992,24433,63916,26144,26254,27001,27054,27704,27891,28214,28481,28634,28699,28719,29008,29151,29552,63917,29787,63918,29908,30408,31310,32403,63919,63920,33521,35424,36814,63921,37704,63922,38681,63923,63924,20034,20522,63925,21000,21473,26355,27757,28618,29450,30591,31330,33454,34269,34306,63926,35028,35427,35709,35947,63927,37555,63928,38675,38928,20116,20237,20425,20658,21320,21566,21555,21978,22626,22714,22887,23067,23524,24735,63929,25034,25942,26111,26212,26791,27738,28595,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,28879,29100,29522,31613,34568,35492,39986,40711,23627,27779,29508,29577,37434,28331,29797,30239,31337,32277,34314,20800,22725,25793,29934,29973,30320,32705,37013,38605,39252,28198,29926,31401,31402,33253,34521,34680,35355,23113,23436,23451,26785,26880,28003,29609,29715,29740,30871,32233,32747,33048,33109,33694,35916,38446,38929,26352,24448,26106,26505,27754,29579,20525,23043,27498,30702,22806,23916,24013,29477,30031,63930,63931,20709,20985,22575,22829,22934,23002,23525,63932,63933,23970,25303,25622,25747,25854,63934,26332,63935,27208,63936,29183,29796,63937,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,31368,31407,32327,32350,32768,33136,63938,34799,35201,35616,36953,63939,36992,39250,24958,27442,28020,32287,35109,36785,20433,20653,20887,21191,22471,22665,23481,24248,24898,27029,28044,28263,28342,29076,29794,29992,29996,32883,33592,33993,36362,37780,37854,63940,20110,20305,20598,20778,21448,21451,21491,23431,23507,23588,24858,24962,26100,29275,29591,29760,30402,31056,31121,31161,32006,32701,33419,34261,34398,36802,36935,37109,37354,38533,38632,38633,21206,24423,26093,26161,26671,29020,31286,37057,38922,20113,63941,27218,27550,28560,29065,32792,33464,34131,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36939,38549,38642,38907,34074,39729,20112,29066,38596,20803,21407,21729,22291,22290,22435,23195,23236,23491,24616,24895,25588,27781,27961,28274,28304,29232,29503,29783,33489,34945,36677,36960,63942,38498,39000,40219,26376,36234,37470,20301,20553,20702,21361,22285,22996,23041,23561,24944,26256,28205,29234,29771,32239,32963,33806,33894,34111,34655,34907,35096,35586,36949,38859,39759,20083,20369,20754,20842,63943,21807,21929,23418,23461,24188,24189,24254,24736,24799,24840,24841,25540,25912,26377,63944,26580,26586,63945,26977,26978,27833,27943,63946,28216,63947,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,28641,29494,29495,63948,29788,30001,63949,30290,63950,63951,32173,33278,33848,35029,35480,35547,35565,36400,36418,36938,36926,36986,37193,37321,37742,63952,63953,22537,63954,27603,32905,32946,63955,63956,20801,22891,23609,63957,63958,28516,29607,32996,36103,63959,37399,38287,63960,63961,63962,63963,32895,25102,28700,32104,34701,63964,22432,24681,24903,27575,35518,37504,38577,20057,21535,28139,34093,38512,38899,39150,25558,27875,37009,20957,25033,33210,40441,20381,20506,20736,23452,24847,25087,25836,26885,27589,30097,30691,32681,33380,34191,34811,34915,35516,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,35696,37291,20108,20197,20234,63965,63966,22839,23016,63967,24050,24347,24411,24609,63968,63969,63970,63971,29246,29669,63972,30064,30157,63973,31227,63974,32780,32819,32900,33505,33617,63975,63976,36029,36019,36999,63977,63978,39156,39180,63979,63980,28727,30410,32714,32716,32764,35610,20154,20161,20995,21360,63981,21693,22240,23035,23493,24341,24525,28270,63982,63983,32106,33589,63984,34451,35469,63985,38765,38775,63986,63987,19968,20314,20350,22777,26085,28322,36920,37808,39353,20219,22764,22922,23001,24641,63988,63989,31252,63990,33615,36035,20837,21316,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,63991,63992,63993,20173,21097,23381,33471,20180,21050,21672,22985,23039,23376,23383,23388,24675,24904,28363,28825,29038,29574,29943,30133,30913,32043,32773,33258,33576,34071,34249,35566,36039,38604,20316,21242,22204,26027,26152,28796,28856,29237,32189,33421,37196,38592,40306,23409,26855,27544,28538,30430,23697,26283,28507,31668,31786,34870,38620,19976,20183,21280,22580,22715,22767,22892,23559,24115,24196,24373,25484,26290,26454,27167,27299,27404,28479,29254,63994,29520,29835,31456,31911,33144,33247,33255,33674,33900,34083,34196,34255,35037,36115,37292,38263,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,38556,20877,21705,22312,23472,25165,26448,26685,26771,28221,28371,28797,32289,35009,36001,36617,40779,40782,29229,31631,35533,37658,20295,20302,20786,21632,22992,24213,25269,26485,26990,27159,27822,28186,29401,29482,30141,31672,32053,33511,33785,33879,34295,35419,36015,36487,36889,37048,38606,40799,21219,21514,23265,23490,25688,25973,28404,29380,63995,30340,31309,31515,31821,32318,32735,33659,35627,36042,36196,36321,36447,36842,36857,36969,37841,20291,20346,20659,20840,20856,21069,21098,22625,22652,22880,23560,23637,24283,24731,25136,26643,27583,27656,28593,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,29006,29728,30000,30008,30033,30322,31564,31627,31661,31686,32399,35438,36670,36681,37439,37523,37666,37931,38651,39002,39019,39198,20999,25130,25240,27993,30308,31434,31680,32118,21344,23742,24215,28472,28857,31896,38673,39822,40670,25509,25722,34678,19969,20117,20141,20572,20597,21576,22979,23450,24128,24237,24311,24449,24773,25402,25919,25972,26060,26230,26232,26622,26984,27273,27491,27712,28096,28136,28191,28254,28702,28833,29582,29693,30010,30555,30855,31118,31243,31357,31934,32142,33351,35330,35562,35998,37165,37194,37336,37478,37580,37664,38662,38742,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,38748,38914,40718,21046,21137,21884,22564,24093,24351,24716,25552,26799,28639,31085,31532,33229,34234,35069,35576,36420,37261,38500,38555,38717,38988,40778,20430,20806,20939,21161,22066,24340,24427,25514,25805,26089,26177,26362,26361,26397,26781,26839,27133,28437,28526,29031,29157,29226,29866,30522,31062,31066,31199,31264,31381,31895,31967,32068,32368,32903,34299,34468,35412,35519,36249,36481,36896,36973,37347,38459,38613,40165,26063,31751,36275,37827,23384,23562,21330,25305,29469,20519,23447,24478,24752,24939,26837,28121,29742,31278,32066,32156,32305,33131,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36394,36405,37758,37912,20304,22352,24038,24231,25387,32618,20027,20303,20367,20570,23005,32964,21610,21608,22014,22863,23449,24030,24282,26205,26417,26609,26666,27880,27954,28234,28557,28855,29664,30087,31820,32002,32044,32162,33311,34523,35387,35461,36208,36490,36659,36913,37198,37202,37956,39376,31481,31909,20426,20737,20934,22472,23535,23803,26201,27197,27994,28310,28652,28940,30063,31459,34850,36897,36981,38603,39423,33537,20013,20210,34886,37325,21373,27355,26987,27713,33914,22686,24974,26366,25327,28893,29969,30151,32338,33976,35657,36104,20043,21482,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,21675,22320,22336,24535,25345,25351,25711,25903,26088,26234,26525,26547,27490,27744,27802,28460,30693,30757,31049,31063,32025,32930,33026,33267,33437,33463,34584,35468,63996,36100,36286,36978,30452,31257,31287,32340,32887,21767,21972,22645,25391,25634,26185,26187,26733,27035,27524,27941,28337,29645,29800,29857,30043,30137,30433,30494,30603,31206,32265,32285,33275,34095,34967,35386,36049,36587,36784,36914,37805,38499,38515,38663,20356,21489,23018,23241,24089,26702,29894,30142,31209,31378,33187,34541,36074,36300,36845,26015,26389,63997,22519,28503,32221,36655,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,37878,38598,24501,25074,28548,19988,20376,20511,21449,21983,23919,24046,27425,27492,30923,31642,63998,36425,36554,36974,25417,25662,30528,31364,37679,38015,40810,25776,28591,29158,29864,29914,31428,31762,32386,31922,32408,35738,36106,38013,39184,39244,21049,23519,25830,26413,32046,20717,21443,22649,24920,24921,25082,26028,31449,35730,35734,20489,20513,21109,21809,23100,24288,24432,24884,25950,26124,26166,26274,27085,28356,28466,29462,30241,31379,33081,33369,33750,33980,20661,22512,23488,23528,24425,25505,30758,32181,33756,34081,37319,37365,20874,26613,31574,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36012,20932,22971,24765,34389,20508,63999,21076,23610,24957,25114,25299,25842,26021,28364,30240,33034,36448,38495,38587,20191,21315,21912,22825,24029,25797,27849,28154,29588,31359,33307,34214,36068,36368,36983,37351,38369,38433,38854,20984,21746,21894,24505,25764,28552,32180,36639,36685,37941,20681,23574,27838,28155,29979,30651,31805,31844,35449,35522,22558,22974,24086,25463,29266,30090,30571,35548,36028,36626,24307,26228,28152,32893,33729,35531,38737,39894,64000,21059,26367,28053,28399,32224,35558,36910,36958,39636,21021,21119,21736,24980,25220,25307,26786,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,26898,26970,27189,28818,28966,30813,30977,30990,31186,31245,32918,33400,33493,33609,34121,35970,36229,37218,37259,37294,20419,22225,29165,30679,34560,35320,23544,24534,26449,37032,21474,22618,23541,24740,24961,25696,32317,32880,34085,37507,25774,20652,23828,26368,22684,25277,25512,26894,27000,27166,28267,30394,31179,33467,33833,35535,36264,36861,37138,37195,37276,37648,37656,37786,38619,39478,39949,19985,30044,31069,31482,31569,31689,32302,33988,36441,36468,36600,36880,26149,26943,29763,20986,26414,40668,20805,24544,27798,34802,34909,34935,24756,33205,33795,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36101,21462,21561,22068,23094,23601,28810,32736,32858,33030,33261,36259,37257,39519,40434,20596,20164,21408,24827,28204,23652,20360,20516,21988,23769,24159,24677,26772,27835,28100,29118,30164,30196,30305,31258,31305,32199,32251,32622,33268,34473,36636,38601,39347,40786,21063,21189,39149,35242,19971,26578,28422,20405,23522,26517,27784,28024,29723,30759,37341,37756,34756,31204,31281,24555,20182,21668,21822,22702,22949,24816,25171,25302,26422,26965,33333,38464,39345,39389,20524,21331,21828,22396,64001,25176,64002,25826,26219,26589,28609,28655,29730,29752,35351,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,37944,21585,22022,22374,24392,24986,27470,28760,28845,32187,35477,22890,33067,25506,30472,32829,36010,22612,25645,27067,23445,24081,28271,64003,34153,20812,21488,22826,24608,24907,27526,27760,27888,31518,32974,33492,36294,37040,39089,64004,25799,28580,25745,25860,20814,21520,22303,35342,24927,26742,64005,30171,31570,32113,36890,22534,27084,33151,35114,36864,38969,20600,22871,22956,25237,36879,39722,24925,29305,38358,22369,23110,24052,25226,25773,25850,26487,27874,27966,29228,29750,30772,32631,33453,36315,38935,21028,22338,26495,29256,29923,36009,36774,37393,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,38442,20843,21485,25420,20329,21764,24726,25943,27803,28031,29260,29437,31255,35207,35997,24429,28558,28921,33192,24846,20415,20559,25153,29255,31687,32232,32745,36941,38829,39449,36022,22378,24179,26544,33805,35413,21536,23318,24163,24290,24330,25987,32954,34109,38281,38491,20296,21253,21261,21263,21638,21754,22275,24067,24598,25243,25265,25429,64006,27873,28006,30129,30770,32990,33071,33502,33889,33970,34957,35090,36875,37610,39165,39825,24133,26292,26333,28689,29190,64007,20469,21117,24426,24915,26451,27161,28418,29922,31080,34920,35961,39111,39108,39491,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,21697,31263,26963,35575,35914,39080,39342,24444,25259,30130,30382,34987,36991,38466,21305,24380,24517,27852,29644,30050,30091,31558,33534,39325,20047,36924,19979,20309,21414,22799,24264,26160,27827,29781,33655,34662,36032,36944,38686,39957,22737,23416,34384,35604,40372,23506,24680,24717,26097,27735,28450,28579,28698,32597,32752,38289,38290,38480,38867,21106,36676,20989,21547,21688,21859,21898,27323,28085,32216,33382,37532,38519,40569,21512,21704,30418,34532,38308,38356,38492,20130,20233,23022,23270,24055,24658,25239,26477,26689,27782,28207,32568,32923,33322,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,64008,64009,38917,20133,20565,21683,22419,22874,23401,23475,25032,26999,28023,28707,34809,35299,35442,35559,36994,39405,39608,21182,26680,20502,24184,26447,33607,34892,20139,21521,22190,29670,37141,38911,39177,39255,39321,22099,22687,34395,35377,25010,27382,29563,36562,27463,38570,39511,22869,29184,36203,38761,20436,23796,24358,25080,26203,27883,28843,29572,29625,29694,30505,30541,32067,32098,32291,33335,34898,64010,36066,37449,39023,23377,31348,34880,38913,23244,20448,21332,22846,23805,25406,28025,29433,33029,33031,33698,37583,38960,20136,20804,21009,22411,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,24418,27842,28366,28677,28752,28847,29074,29673,29801,33610,34722,34913,36872,37026,37795,39336,20846,24407,24800,24935,26291,34137,36426,37295,38795,20046,20114,21628,22741,22778,22909,23733,24359,25142,25160,26122,26215,27627,28009,28111,28246,28408,28564,28640,28649,28765,29392,29733,29786,29920,30355,31068,31946,32286,32993,33446,33899,33983,34382,34399,34676,35703,35946,37804,38912,39013,24785,25110,37239,23130,26127,28151,28222,29759,39746,24573,24794,31503,21700,24344,27742,27859,27946,28888,32005,34425,35340,40251,21270,21644,23301,27194,28779,30069,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,31117,31166,33457,33775,35441,35649,36008,38772,64011,25844,25899,30906,30907,31339,20024,21914,22864,23462,24187,24739,25563,27489,26213,26707,28185,29029,29872,32008,36996,39529,39973,27963,28369,29502,35905,38346,20976,24140,24488,24653,24822,24880,24908,26179,26180,27045,27841,28255,28361,28514,29004,29852,30343,31681,31783,33618,34647,36945,38541,40643,21295,22238,24315,24458,24674,24724,25079,26214,26371,27292,28142,28590,28784,29546,32362,33214,33588,34516,35496,36036,21123,29554,23446,27243,37892,21742,22150,23389,25928,25989,26313,26783,28045,28102,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,29243,32948,37237,39501,20399,20505,21402,21518,21564,21897,21957,24127,24460,26429,29030,29661,36869,21211,21235,22628,22734,28932,29071,29179,34224,35347,26248,34216,21927,26244,29002,33841,21321,21913,27585,24409,24509,25582,26249,28999,35569,36637,40638,20241,25658,28875,30054,34407,24676,35662,40440,20807,20982,21256,27958,33016,40657,26133,27427,28824,30165,21507,23673,32007,35350,27424,27453,27462,21560,24688,27965,32725,33288,20694,20958,21916,22123,22221,23020,23305,24076,24985,24984,25137,26206,26342,29081,29113,29114,29351,31143,31232,32690,35440,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  "gb18030":[19970,19972,19973,19974,19983,19986,19991,19999,20000,20001,20003,20006,20009,20014,20015,20017,20019,20021,20023,20028,20032,20033,20034,20036,20038,20042,20049,20053,20055,20058,20059,20066,20067,20068,20069,20071,20072,20074,20075,20076,20077,20078,20079,20082,20084,20085,20086,20087,20088,20089,20090,20091,20092,20093,20095,20096,20097,20098,20099,20100,20101,20103,20106,20112,20118,20119,20121,20124,20125,20126,20131,20138,20143,20144,20145,20148,20150,20151,20152,20153,20156,20157,20158,20168,20172,20175,20176,20178,20186,20187,20188,20192,20194,20198,20199,20201,20205,20206,20207,20209,20212,20216,20217,20218,20220,20222,20224,20226,20227,20228,20229,20230,20231,20232,20235,20236,20242,20243,20244,20245,20246,20252,20253,20257,20259,20264,20265,20268,20269,20270,20273,20275,20277,20279,20281,20283,20286,20287,20288,20289,20290,20292,20293,20295,20296,20297,20298,20299,20300,20306,20308,20310,20321,20322,20326,20328,20330,20331,20333,20334,20337,20338,20341,20343,20344,20345,20346,20349,20352,20353,20354,20357,20358,20359,20362,20364,20366,20368,20370,20371,20373,20374,20376,20377,20378,20380,20382,20383,20385,20386,20388,20395,20397,20400,20401,20402,20403,20404,20406,20407,20408,20409,20410,20411,20412,20413,20414,20416,20417,20418,20422,20423,20424,20425,20427,20428,20429,20434,20435,20436,20437,20438,20441,20443,20448,20450,20452,20453,20455,20459,20460,20464,20466,20468,20469,20470,20471,20473,20475,20476,20477,20479,20480,20481,20482,20483,20484,20485,20486,20487,20488,20489,20490,20491,20494,20496,20497,20499,20501,20502,20503,20507,20509,20510,20512,20514,20515,20516,20519,20523,20527,20528,20529,20530,20531,20532,20533,20534,20535,20536,20537,20539,20541,20543,20544,20545,20546,20548,20549,20550,20553,20554,20555,20557,20560,20561,20562,20563,20564,20566,20567,20568,20569,20571,20573,20574,20575,20576,20577,20578,20579,20580,20582,20583,20584,20585,20586,20587,20589,20590,20591,20592,20593,20594,20595,20596,20597,20600,20601,20602,20604,20605,20609,20610,20611,20612,20614,20615,20617,20618,20619,20620,20622,20623,20624,20625,20626,20627,20628,20629,20630,20631,20632,20633,20634,20635,20636,20637,20638,20639,20640,20641,20642,20644,20646,20650,20651,20653,20654,20655,20656,20657,20659,20660,20661,20662,20663,20664,20665,20668,20669,20670,20671,20672,20673,20674,20675,20676,20677,20678,20679,20680,20681,20682,20683,20684,20685,20686,20688,20689,20690,20691,20692,20693,20695,20696,20697,20699,20700,20701,20702,20703,20704,20705,20706,20707,20708,20709,20712,20713,20714,20715,20719,20720,20721,20722,20724,20726,20727,20728,20729,20730,20732,20733,20734,20735,20736,20737,20738,20739,20740,20741,20744,20745,20746,20748,20749,20750,20751,20752,20753,20755,20756,20757,20758,20759,20760,20761,20762,20763,20764,20765,20766,20767,20768,20770,20771,20772,20773,20774,20775,20776,20777,20778,20779,20780,20781,20782,20783,20784,20785,20786,20787,20788,20789,20790,20791,20792,20793,20794,20795,20796,20797,20798,20802,20807,20810,20812,20814,20815,20816,20818,20819,20823,20824,20825,20827,20829,20830,20831,20832,20833,20835,20836,20838,20839,20841,20842,20847,20850,20858,20862,20863,20867,20868,20870,20871,20874,20875,20878,20879,20880,20881,20883,20884,20888,20890,20893,20894,20895,20897,20899,20902,20903,20904,20905,20906,20909,20910,20916,20920,20921,20922,20926,20927,20929,20930,20931,20933,20936,20938,20941,20942,20944,20946,20947,20948,20949,20950,20951,20952,20953,20954,20956,20958,20959,20962,20963,20965,20966,20967,20968,20969,20970,20972,20974,20977,20978,20980,20983,20990,20996,20997,21001,21003,21004,21007,21008,21011,21012,21013,21020,21022,21023,21025,21026,21027,21029,21030,21031,21034,21036,21039,21041,21042,21044,21045,21052,21054,21060,21061,21062,21063,21064,21065,21067,21070,21071,21074,21075,21077,21079,21080,21081,21082,21083,21085,21087,21088,21090,21091,21092,21094,21096,21099,21100,21101,21102,21104,21105,21107,21108,21109,21110,21111,21112,21113,21114,21115,21116,21118,21120,21123,21124,21125,21126,21127,21129,21130,21131,21132,21133,21134,21135,21137,21138,21140,21141,21142,21143,21144,21145,21146,21148,21156,21157,21158,21159,21166,21167,21168,21172,21173,21174,21175,21176,21177,21178,21179,21180,21181,21184,21185,21186,21188,21189,21190,21192,21194,21196,21197,21198,21199,21201,21203,21204,21205,21207,21209,21210,21211,21212,21213,21214,21216,21217,21218,21219,21221,21222,21223,21224,21225,21226,21227,21228,21229,21230,21231,21233,21234,21235,21236,21237,21238,21239,21240,21243,21244,21245,21249,21250,21251,21252,21255,21257,21258,21259,21260,21262,21265,21266,21267,21268,21272,21275,21276,21278,21279,21282,21284,21285,21287,21288,21289,21291,21292,21293,21295,21296,21297,21298,21299,21300,21301,21302,21303,21304,21308,21309,21312,21314,21316,21318,21323,21324,21325,21328,21332,21336,21337,21339,21341,21349,21352,21354,21356,21357,21362,21366,21369,21371,21372,21373,21374,21376,21377,21379,21383,21384,21386,21390,21391,21392,21393,21394,21395,21396,21398,21399,21401,21403,21404,21406,21408,21409,21412,21415,21418,21419,21420,21421,21423,21424,21425,21426,21427,21428,21429,21431,21432,21433,21434,21436,21437,21438,21440,21443,21444,21445,21446,21447,21454,21455,21456,21458,21459,21461,21466,21468,21469,21470,21473,21474,21479,21492,21498,21502,21503,21504,21506,21509,21511,21515,21524,21528,21529,21530,21532,21538,21540,21541,21546,21552,21555,21558,21559,21562,21565,21567,21569,21570,21572,21573,21575,21577,21580,21581,21582,21583,21585,21594,21597,21598,21599,21600,21601,21603,21605,21607,21609,21610,21611,21612,21613,21614,21615,21616,21620,21625,21626,21630,21631,21633,21635,21637,21639,21640,21641,21642,21645,21649,21651,21655,21656,21660,21662,21663,21664,21665,21666,21669,21678,21680,21682,21685,21686,21687,21689,21690,21692,21694,21699,21701,21706,21707,21718,21720,21723,21728,21729,21730,21731,21732,21739,21740,21743,21744,21745,21748,21749,21750,21751,21752,21753,21755,21758,21760,21762,21763,21764,21765,21768,21770,21771,21772,21773,21774,21778,21779,21781,21782,21783,21784,21785,21786,21788,21789,21790,21791,21793,21797,21798,21800,21801,21803,21805,21810,21812,21813,21814,21816,21817,21818,21819,21821,21824,21826,21829,21831,21832,21835,21836,21837,21838,21839,21841,21842,21843,21844,21847,21848,21849,21850,21851,21853,21854,21855,21856,21858,21859,21864,21865,21867,21871,21872,21873,21874,21875,21876,21881,21882,21885,21887,21893,21894,21900,21901,21902,21904,21906,21907,21909,21910,21911,21914,21915,21918,21920,21921,21922,21923,21924,21925,21926,21928,21929,21930,21931,21932,21933,21934,21935,21936,21938,21940,21942,21944,21946,21948,21951,21952,21953,21954,21955,21958,21959,21960,21962,21963,21966,21967,21968,21973,21975,21976,21977,21978,21979,21982,21984,21986,21991,21993,21997,21998,22000,22001,22004,22006,22008,22009,22010,22011,22012,22015,22018,22019,22020,22021,22022,22023,22026,22027,22029,22032,22033,22034,22035,22036,22037,22038,22039,22041,22042,22044,22045,22048,22049,22050,22053,22054,22056,22057,22058,22059,22062,22063,22064,22067,22069,22071,22072,22074,22076,22077,22078,22080,22081,22082,22083,22084,22085,22086,22087,22088,22089,22090,22091,22095,22096,22097,22098,22099,22101,22102,22106,22107,22109,22110,22111,22112,22113,22115,22117,22118,22119,22125,22126,22127,22128,22130,22131,22132,22133,22135,22136,22137,22138,22141,22142,22143,22144,22145,22146,22147,22148,22151,22152,22153,22154,22155,22156,22157,22160,22161,22162,22164,22165,22166,22167,22168,22169,22170,22171,22172,22173,22174,22175,22176,22177,22178,22180,22181,22182,22183,22184,22185,22186,22187,22188,22189,22190,22192,22193,22194,22195,22196,22197,22198,22200,22201,22202,22203,22205,22206,22207,22208,22209,22210,22211,22212,22213,22214,22215,22216,22217,22219,22220,22221,22222,22223,22224,22225,22226,22227,22229,22230,22232,22233,22236,22243,22245,22246,22247,22248,22249,22250,22252,22254,22255,22258,22259,22262,22263,22264,22267,22268,22272,22273,22274,22277,22279,22283,22284,22285,22286,22287,22288,22289,22290,22291,22292,22293,22294,22295,22296,22297,22298,22299,22301,22302,22304,22305,22306,22308,22309,22310,22311,22315,22321,22322,22324,22325,22326,22327,22328,22332,22333,22335,22337,22339,22340,22341,22342,22344,22345,22347,22354,22355,22356,22357,22358,22360,22361,22370,22371,22373,22375,22380,22382,22384,22385,22386,22388,22389,22392,22393,22394,22397,22398,22399,22400,22401,22407,22408,22409,22410,22413,22414,22415,22416,22417,22420,22421,22422,22423,22424,22425,22426,22428,22429,22430,22431,22437,22440,22442,22444,22447,22448,22449,22451,22453,22454,22455,22457,22458,22459,22460,22461,22462,22463,22464,22465,22468,22469,22470,22471,22472,22473,22474,22476,22477,22480,22481,22483,22486,22487,22491,22492,22494,22497,22498,22499,22501,22502,22503,22504,22505,22506,22507,22508,22510,22512,22513,22514,22515,22517,22518,22519,22523,22524,22526,22527,22529,22531,22532,22533,22536,22537,22538,22540,22542,22543,22544,22546,22547,22548,22550,22551,22552,22554,22555,22556,22557,22559,22562,22563,22565,22566,22567,22568,22569,22571,22572,22573,22574,22575,22577,22578,22579,22580,22582,22583,22584,22585,22586,22587,22588,22589,22590,22591,22592,22593,22594,22595,22597,22598,22599,22600,22601,22602,22603,22606,22607,22608,22610,22611,22613,22614,22615,22617,22618,22619,22620,22621,22623,22624,22625,22626,22627,22628,22630,22631,22632,22633,22634,22637,22638,22639,22640,22641,22642,22643,22644,22645,22646,22647,22648,22649,22650,22651,22652,22653,22655,22658,22660,22662,22663,22664,22666,22667,22668,22669,22670,22671,22672,22673,22676,22677,22678,22679,22680,22683,22684,22685,22688,22689,22690,22691,22692,22693,22694,22695,22698,22699,22700,22701,22702,22703,22704,22705,22706,22707,22708,22709,22710,22711,22712,22713,22714,22715,22717,22718,22719,22720,22722,22723,22724,22726,22727,22728,22729,22730,22731,22732,22733,22734,22735,22736,22738,22739,22740,22742,22743,22744,22745,22746,22747,22748,22749,22750,22751,22752,22753,22754,22755,22757,22758,22759,22760,22761,22762,22765,22767,22769,22770,22772,22773,22775,22776,22778,22779,22780,22781,22782,22783,22784,22785,22787,22789,22790,22792,22793,22794,22795,22796,22798,22800,22801,22802,22803,22807,22808,22811,22813,22814,22816,22817,22818,22819,22822,22824,22828,22832,22834,22835,22837,22838,22843,22845,22846,22847,22848,22851,22853,22854,22858,22860,22861,22864,22866,22867,22873,22875,22876,22877,22878,22879,22881,22883,22884,22886,22887,22888,22889,22890,22891,22892,22893,22894,22895,22896,22897,22898,22901,22903,22906,22907,22908,22910,22911,22912,22917,22921,22923,22924,22926,22927,22928,22929,22932,22933,22936,22938,22939,22940,22941,22943,22944,22945,22946,22950,22951,22956,22957,22960,22961,22963,22964,22965,22966,22967,22968,22970,22972,22973,22975,22976,22977,22978,22979,22980,22981,22983,22984,22985,22988,22989,22990,22991,22997,22998,23001,23003,23006,23007,23008,23009,23010,23012,23014,23015,23017,23018,23019,23021,23022,23023,23024,23025,23026,23027,23028,23029,23030,23031,23032,23034,23036,23037,23038,23040,23042,23050,23051,23053,23054,23055,23056,23058,23060,23061,23062,23063,23065,23066,23067,23069,23070,23073,23074,23076,23078,23079,23080,23082,23083,23084,23085,23086,23087,23088,23091,23093,23095,23096,23097,23098,23099,23101,23102,23103,23105,23106,23107,23108,23109,23111,23112,23115,23116,23117,23118,23119,23120,23121,23122,23123,23124,23126,23127,23128,23129,23131,23132,23133,23134,23135,23136,23137,23139,23140,23141,23142,23144,23145,23147,23148,23149,23150,23151,23152,23153,23154,23155,23160,23161,23163,23164,23165,23166,23168,23169,23170,23171,23172,23173,23174,23175,23176,23177,23178,23179,23180,23181,23182,23183,23184,23185,23187,23188,23189,23190,23191,23192,23193,23196,23197,23198,23199,23200,23201,23202,23203,23204,23205,23206,23207,23208,23209,23211,23212,23213,23214,23215,23216,23217,23220,23222,23223,23225,23226,23227,23228,23229,23231,23232,23235,23236,23237,23238,23239,23240,23242,23243,23245,23246,23247,23248,23249,23251,23253,23255,23257,23258,23259,23261,23262,23263,23266,23268,23269,23271,23272,23274,23276,23277,23278,23279,23280,23282,23283,23284,23285,23286,23287,23288,23289,23290,23291,23292,23293,23294,23295,23296,23297,23298,23299,23300,23301,23302,23303,23304,23306,23307,23308,23309,23310,23311,23312,23313,23314,23315,23316,23317,23320,23321,23322,23323,23324,23325,23326,23327,23328,23329,23330,23331,23332,23333,23334,23335,23336,23337,23338,23339,23340,23341,23342,23343,23344,23345,23347,23349,23350,23352,23353,23354,23355,23356,23357,23358,23359,23361,23362,23363,23364,23365,23366,23367,23368,23369,23370,23371,23372,23373,23374,23375,23378,23382,23390,23392,23393,23399,23400,23403,23405,23406,23407,23410,23412,23414,23415,23416,23417,23419,23420,23422,23423,23426,23430,23434,23437,23438,23440,23441,23442,23444,23446,23455,23463,23464,23465,23468,23469,23470,23471,23473,23474,23479,23482,23483,23484,23488,23489,23491,23496,23497,23498,23499,23501,23502,23503,23505,23508,23509,23510,23511,23512,23513,23514,23515,23516,23520,23522,23523,23526,23527,23529,23530,23531,23532,23533,23535,23537,23538,23539,23540,23541,23542,23543,23549,23550,23552,23554,23555,23557,23559,23560,23563,23564,23565,23566,23568,23570,23571,23575,23577,23579,23582,23583,23584,23585,23587,23590,23592,23593,23594,23595,23597,23598,23599,23600,23602,23603,23605,23606,23607,23619,23620,23622,23623,23628,23629,23634,23635,23636,23638,23639,23640,23642,23643,23644,23645,23647,23650,23652,23655,23656,23657,23658,23659,23660,23661,23664,23666,23667,23668,23669,23670,23671,23672,23675,23676,23677,23678,23680,23683,23684,23685,23686,23687,23689,23690,23691,23694,23695,23698,23699,23701,23709,23710,23711,23712,23713,23716,23717,23718,23719,23720,23722,23726,23727,23728,23730,23732,23734,23737,23738,23739,23740,23742,23744,23746,23747,23749,23750,23751,23752,23753,23754,23756,23757,23758,23759,23760,23761,23763,23764,23765,23766,23767,23768,23770,23771,23772,23773,23774,23775,23776,23778,23779,23783,23785,23787,23788,23790,23791,23793,23794,23795,23796,23797,23798,23799,23800,23801,23802,23804,23805,23806,23807,23808,23809,23812,23813,23816,23817,23818,23819,23820,23821,23823,23824,23825,23826,23827,23829,23831,23832,23833,23834,23836,23837,23839,23840,23841,23842,23843,23845,23848,23850,23851,23852,23855,23856,23857,23858,23859,23861,23862,23863,23864,23865,23866,23867,23868,23871,23872,23873,23874,23875,23876,23877,23878,23880,23881,23885,23886,23887,23888,23889,23890,23891,23892,23893,23894,23895,23897,23898,23900,23902,23903,23904,23905,23906,23907,23908,23909,23910,23911,23912,23914,23917,23918,23920,23921,23922,23923,23925,23926,23927,23928,23929,23930,23931,23932,23933,23934,23935,23936,23937,23939,23940,23941,23942,23943,23944,23945,23946,23947,23948,23949,23950,23951,23952,23953,23954,23955,23956,23957,23958,23959,23960,23962,23963,23964,23966,23967,23968,23969,23970,23971,23972,23973,23974,23975,23976,23977,23978,23979,23980,23981,23982,23983,23984,23985,23986,23987,23988,23989,23990,23992,23993,23994,23995,23996,23997,23998,23999,24000,24001,24002,24003,24004,24006,24007,24008,24009,24010,24011,24012,24014,24015,24016,24017,24018,24019,24020,24021,24022,24023,24024,24025,24026,24028,24031,24032,24035,24036,24042,24044,24045,24048,24053,24054,24056,24057,24058,24059,24060,24063,24064,24068,24071,24073,24074,24075,24077,24078,24082,24083,24087,24094,24095,24096,24097,24098,24099,24100,24101,24104,24105,24106,24107,24108,24111,24112,24114,24115,24116,24117,24118,24121,24122,24126,24127,24128,24129,24131,24134,24135,24136,24137,24138,24139,24141,24142,24143,24144,24145,24146,24147,24150,24151,24152,24153,24154,24156,24157,24159,24160,24163,24164,24165,24166,24167,24168,24169,24170,24171,24172,24173,24174,24175,24176,24177,24181,24183,24185,24190,24193,24194,24195,24197,24200,24201,24204,24205,24206,24210,24216,24219,24221,24225,24226,24227,24228,24232,24233,24234,24235,24236,24238,24239,24240,24241,24242,24244,24250,24251,24252,24253,24255,24256,24257,24258,24259,24260,24261,24262,24263,24264,24267,24268,24269,24270,24271,24272,24276,24277,24279,24280,24281,24282,24284,24285,24286,24287,24288,24289,24290,24291,24292,24293,24294,24295,24297,24299,24300,24301,24302,24303,24304,24305,24306,24307,24309,24312,24313,24315,24316,24317,24325,24326,24327,24329,24332,24333,24334,24336,24338,24340,24342,24345,24346,24348,24349,24350,24353,24354,24355,24356,24360,24363,24364,24366,24368,24370,24371,24372,24373,24374,24375,24376,24379,24381,24382,24383,24385,24386,24387,24388,24389,24390,24391,24392,24393,24394,24395,24396,24397,24398,24399,24401,24404,24409,24410,24411,24412,24414,24415,24416,24419,24421,24423,24424,24427,24430,24431,24434,24436,24437,24438,24440,24442,24445,24446,24447,24451,24454,24461,24462,24463,24465,24467,24468,24470,24474,24475,24477,24478,24479,24480,24482,24483,24484,24485,24486,24487,24489,24491,24492,24495,24496,24497,24498,24499,24500,24502,24504,24505,24506,24507,24510,24511,24512,24513,24514,24519,24520,24522,24523,24526,24531,24532,24533,24538,24539,24540,24542,24543,24546,24547,24549,24550,24552,24553,24556,24559,24560,24562,24563,24564,24566,24567,24569,24570,24572,24583,24584,24585,24587,24588,24592,24593,24595,24599,24600,24602,24606,24607,24610,24611,24612,24620,24621,24622,24624,24625,24626,24627,24628,24630,24631,24632,24633,24634,24637,24638,24640,24644,24645,24646,24647,24648,24649,24650,24652,24654,24655,24657,24659,24660,24662,24663,24664,24667,24668,24670,24671,24672,24673,24677,24678,24686,24689,24690,24692,24693,24695,24702,24704,24705,24706,24709,24710,24711,24712,24714,24715,24718,24719,24720,24721,24723,24725,24727,24728,24729,24732,24734,24737,24738,24740,24741,24743,24745,24746,24750,24752,24755,24757,24758,24759,24761,24762,24765,24766,24767,24768,24769,24770,24771,24772,24775,24776,24777,24780,24781,24782,24783,24784,24786,24787,24788,24790,24791,24793,24795,24798,24801,24802,24803,24804,24805,24810,24817,24818,24821,24823,24824,24827,24828,24829,24830,24831,24834,24835,24836,24837,24839,24842,24843,24844,24848,24849,24850,24851,24852,24854,24855,24856,24857,24859,24860,24861,24862,24865,24866,24869,24872,24873,24874,24876,24877,24878,24879,24880,24881,24882,24883,24884,24885,24886,24887,24888,24889,24890,24891,24892,24893,24894,24896,24897,24898,24899,24900,24901,24902,24903,24905,24907,24909,24911,24912,24914,24915,24916,24918,24919,24920,24921,24922,24923,24924,24926,24927,24928,24929,24931,24932,24933,24934,24937,24938,24939,24940,24941,24942,24943,24945,24946,24947,24948,24950,24952,24953,24954,24955,24956,24957,24958,24959,24960,24961,24962,24963,24964,24965,24966,24967,24968,24969,24970,24972,24973,24975,24976,24977,24978,24979,24981,24982,24983,24984,24985,24986,24987,24988,24990,24991,24992,24993,24994,24995,24996,24997,24998,25002,25003,25005,25006,25007,25008,25009,25010,25011,25012,25013,25014,25016,25017,25018,25019,25020,25021,25023,25024,25025,25027,25028,25029,25030,25031,25033,25036,25037,25038,25039,25040,25043,25045,25046,25047,25048,25049,25050,25051,25052,25053,25054,25055,25056,25057,25058,25059,25060,25061,25063,25064,25065,25066,25067,25068,25069,25070,25071,25072,25073,25074,25075,25076,25078,25079,25080,25081,25082,25083,25084,25085,25086,25088,25089,25090,25091,25092,25093,25095,25097,25107,25108,25113,25116,25117,25118,25120,25123,25126,25127,25128,25129,25131,25133,25135,25136,25137,25138,25141,25142,25144,25145,25146,25147,25148,25154,25156,25157,25158,25162,25167,25168,25173,25174,25175,25177,25178,25180,25181,25182,25183,25184,25185,25186,25188,25189,25192,25201,25202,25204,25205,25207,25208,25210,25211,25213,25217,25218,25219,25221,25222,25223,25224,25227,25228,25229,25230,25231,25232,25236,25241,25244,25245,25246,25251,25254,25255,25257,25258,25261,25262,25263,25264,25266,25267,25268,25270,25271,25272,25274,25278,25280,25281,25283,25291,25295,25297,25301,25309,25310,25312,25313,25316,25322,25323,25328,25330,25333,25336,25337,25338,25339,25344,25347,25348,25349,25350,25354,25355,25356,25357,25359,25360,25362,25363,25364,25365,25367,25368,25369,25372,25382,25383,25385,25388,25389,25390,25392,25393,25395,25396,25397,25398,25399,25400,25403,25404,25406,25407,25408,25409,25412,25415,25416,25418,25425,25426,25427,25428,25430,25431,25432,25433,25434,25435,25436,25437,25440,25444,25445,25446,25448,25450,25451,25452,25455,25456,25458,25459,25460,25461,25464,25465,25468,25469,25470,25471,25473,25475,25476,25477,25478,25483,25485,25489,25491,25492,25493,25495,25497,25498,25499,25500,25501,25502,25503,25505,25508,25510,25515,25519,25521,25522,25525,25526,25529,25531,25533,25535,25536,25537,25538,25539,25541,25543,25544,25546,25547,25548,25553,25555,25556,25557,25559,25560,25561,25562,25563,25564,25565,25567,25570,25572,25573,25574,25575,25576,25579,25580,25582,25583,25584,25585,25587,25589,25591,25593,25594,25595,25596,25598,25603,25604,25606,25607,25608,25609,25610,25613,25614,25617,25618,25621,25622,25623,25624,25625,25626,25629,25631,25634,25635,25636,25637,25639,25640,25641,25643,25646,25647,25648,25649,25650,25651,25653,25654,25655,25656,25657,25659,25660,25662,25664,25666,25667,25673,25675,25676,25677,25678,25679,25680,25681,25683,25685,25686,25687,25689,25690,25691,25692,25693,25695,25696,25697,25698,25699,25700,25701,25702,25704,25706,25707,25708,25710,25711,25712,25713,25714,25715,25716,25717,25718,25719,25723,25724,25725,25726,25727,25728,25729,25731,25734,25736,25737,25738,25739,25740,25741,25742,25743,25744,25747,25748,25751,25752,25754,25755,25756,25757,25759,25760,25761,25762,25763,25765,25766,25767,25768,25770,25771,25775,25777,25778,25779,25780,25782,25785,25787,25789,25790,25791,25793,25795,25796,25798,25799,25800,25801,25802,25803,25804,25807,25809,25811,25812,25813,25814,25817,25818,25819,25820,25821,25823,25824,25825,25827,25829,25831,25832,25833,25834,25835,25836,25837,25838,25839,25840,25841,25842,25843,25844,25845,25846,25847,25848,25849,25850,25851,25852,25853,25854,25855,25857,25858,25859,25860,25861,25862,25863,25864,25866,25867,25868,25869,25870,25871,25872,25873,25875,25876,25877,25878,25879,25881,25882,25883,25884,25885,25886,25887,25888,25889,25890,25891,25892,25894,25895,25896,25897,25898,25900,25901,25904,25905,25906,25907,25911,25914,25916,25917,25920,25921,25922,25923,25924,25926,25927,25930,25931,25933,25934,25936,25938,25939,25940,25943,25944,25946,25948,25951,25952,25953,25956,25957,25959,25960,25961,25962,25965,25966,25967,25969,25971,25973,25974,25976,25977,25978,25979,25980,25981,25982,25983,25984,25985,25986,25987,25988,25989,25990,25992,25993,25994,25997,25998,25999,26002,26004,26005,26006,26008,26010,26013,26014,26016,26018,26019,26022,26024,26026,26028,26030,26033,26034,26035,26036,26037,26038,26039,26040,26042,26043,26046,26047,26048,26050,26055,26056,26057,26058,26061,26064,26065,26067,26068,26069,26072,26073,26074,26075,26076,26077,26078,26079,26081,26083,26084,26090,26091,26098,26099,26100,26101,26104,26105,26107,26108,26109,26110,26111,26113,26116,26117,26119,26120,26121,26123,26125,26128,26129,26130,26134,26135,26136,26138,26139,26140,26142,26145,26146,26147,26148,26150,26153,26154,26155,26156,26158,26160,26162,26163,26167,26168,26169,26170,26171,26173,26175,26176,26178,26180,26181,26182,26183,26184,26185,26186,26189,26190,26192,26193,26200,26201,26203,26204,26205,26206,26208,26210,26211,26213,26215,26217,26218,26219,26220,26221,26225,26226,26227,26229,26232,26233,26235,26236,26237,26239,26240,26241,26243,26245,26246,26248,26249,26250,26251,26253,26254,26255,26256,26258,26259,26260,26261,26264,26265,26266,26267,26268,26270,26271,26272,26273,26274,26275,26276,26277,26278,26281,26282,26283,26284,26285,26287,26288,26289,26290,26291,26293,26294,26295,26296,26298,26299,26300,26301,26303,26304,26305,26306,26307,26308,26309,26310,26311,26312,26313,26314,26315,26316,26317,26318,26319,26320,26321,26322,26323,26324,26325,26326,26327,26328,26330,26334,26335,26336,26337,26338,26339,26340,26341,26343,26344,26346,26347,26348,26349,26350,26351,26353,26357,26358,26360,26362,26363,26365,26369,26370,26371,26372,26373,26374,26375,26380,26382,26383,26385,26386,26387,26390,26392,26393,26394,26396,26398,26400,26401,26402,26403,26404,26405,26407,26409,26414,26416,26418,26419,26422,26423,26424,26425,26427,26428,26430,26431,26433,26436,26437,26439,26442,26443,26445,26450,26452,26453,26455,26456,26457,26458,26459,26461,26466,26467,26468,26470,26471,26475,26476,26478,26481,26484,26486,26488,26489,26490,26491,26493,26496,26498,26499,26501,26502,26504,26506,26508,26509,26510,26511,26513,26514,26515,26516,26518,26521,26523,26527,26528,26529,26532,26534,26537,26540,26542,26545,26546,26548,26553,26554,26555,26556,26557,26558,26559,26560,26562,26565,26566,26567,26568,26569,26570,26571,26572,26573,26574,26581,26582,26583,26587,26591,26593,26595,26596,26598,26599,26600,26602,26603,26605,26606,26610,26613,26614,26615,26616,26617,26618,26619,26620,26622,26625,26626,26627,26628,26630,26637,26640,26642,26644,26645,26648,26649,26650,26651,26652,26654,26655,26656,26658,26659,26660,26661,26662,26663,26664,26667,26668,26669,26670,26671,26672,26673,26676,26677,26678,26682,26683,26687,26695,26699,26701,26703,26706,26710,26711,26712,26713,26714,26715,26716,26717,26718,26719,26730,26732,26733,26734,26735,26736,26737,26738,26739,26741,26744,26745,26746,26747,26748,26749,26750,26751,26752,26754,26756,26759,26760,26761,26762,26763,26764,26765,26766,26768,26769,26770,26772,26773,26774,26776,26777,26778,26779,26780,26781,26782,26783,26784,26785,26787,26788,26789,26793,26794,26795,26796,26798,26801,26802,26804,26806,26807,26808,26809,26810,26811,26812,26813,26814,26815,26817,26819,26820,26821,26822,26823,26824,26826,26828,26830,26831,26832,26833,26835,26836,26838,26839,26841,26843,26844,26845,26846,26847,26849,26850,26852,26853,26854,26855,26856,26857,26858,26859,26860,26861,26863,26866,26867,26868,26870,26871,26872,26875,26877,26878,26879,26880,26882,26883,26884,26886,26887,26888,26889,26890,26892,26895,26897,26899,26900,26901,26902,26903,26904,26905,26906,26907,26908,26909,26910,26913,26914,26915,26917,26918,26919,26920,26921,26922,26923,26924,26926,26927,26929,26930,26931,26933,26934,26935,26936,26938,26939,26940,26942,26944,26945,26947,26948,26949,26950,26951,26952,26953,26954,26955,26956,26957,26958,26959,26960,26961,26962,26963,26965,26966,26968,26969,26971,26972,26975,26977,26978,26980,26981,26983,26984,26985,26986,26988,26989,26991,26992,26994,26995,26996,26997,26998,27002,27003,27005,27006,27007,27009,27011,27013,27018,27019,27020,27022,27023,27024,27025,27026,27027,27030,27031,27033,27034,27037,27038,27039,27040,27041,27042,27043,27044,27045,27046,27049,27050,27052,27054,27055,27056,27058,27059,27061,27062,27064,27065,27066,27068,27069,27070,27071,27072,27074,27075,27076,27077,27078,27079,27080,27081,27083,27085,27087,27089,27090,27091,27093,27094,27095,27096,27097,27098,27100,27101,27102,27105,27106,27107,27108,27109,27110,27111,27112,27113,27114,27115,27116,27118,27119,27120,27121,27123,27124,27125,27126,27127,27128,27129,27130,27131,27132,27134,27136,27137,27138,27139,27140,27141,27142,27143,27144,27145,27147,27148,27149,27150,27151,27152,27153,27154,27155,27156,27157,27158,27161,27162,27163,27164,27165,27166,27168,27170,27171,27172,27173,27174,27175,27177,27179,27180,27181,27182,27184,27186,27187,27188,27190,27191,27192,27193,27194,27195,27196,27199,27200,27201,27202,27203,27205,27206,27208,27209,27210,27211,27212,27213,27214,27215,27217,27218,27219,27220,27221,27222,27223,27226,27228,27229,27230,27231,27232,27234,27235,27236,27238,27239,27240,27241,27242,27243,27244,27245,27246,27247,27248,27250,27251,27252,27253,27254,27255,27256,27258,27259,27261,27262,27263,27265,27266,27267,27269,27270,27271,27272,27273,27274,27275,27276,27277,27279,27282,27283,27284,27285,27286,27288,27289,27290,27291,27292,27293,27294,27295,27297,27298,27299,27300,27301,27302,27303,27304,27306,27309,27310,27311,27312,27313,27314,27315,27316,27317,27318,27319,27320,27321,27322,27323,27324,27325,27326,27327,27328,27329,27330,27331,27332,27333,27334,27335,27336,27337,27338,27339,27340,27341,27342,27343,27344,27345,27346,27347,27348,27349,27350,27351,27352,27353,27354,27355,27356,27357,27358,27359,27360,27361,27362,27363,27364,27365,27366,27367,27368,27369,27370,27371,27372,27373,27374,27375,27376,27377,27378,27379,27380,27381,27382,27383,27384,27385,27386,27387,27388,27389,27390,27391,27392,27393,27394,27395,27396,27397,27398,27399,27400,27401,27402,27403,27404,27405,27406,27407,27408,27409,27410,27411,27412,27413,27414,27415,27416,27417,27418,27419,27420,27421,27422,27423,27429,27430,27432,27433,27434,27435,27436,27437,27438,27439,27440,27441,27443,27444,27445,27446,27448,27451,27452,27453,27455,27456,27457,27458,27460,27461,27464,27466,27467,27469,27470,27471,27472,27473,27474,27475,27476,27477,27478,27479,27480,27482,27483,27484,27485,27486,27487,27488,27489,27496,27497,27499,27500,27501,27502,27503,27504,27505,27506,27507,27508,27509,27510,27511,27512,27514,27517,27518,27519,27520,27525,27528,27532,27534,27535,27536,27537,27540,27541,27543,27544,27545,27548,27549,27550,27551,27552,27554,27555,27556,27557,27558,27559,27560,27561,27563,27564,27565,27566,27567,27568,27569,27570,27574,27576,27577,27578,27579,27580,27581,27582,27584,27587,27588,27590,27591,27592,27593,27594,27596,27598,27600,27601,27608,27610,27612,27613,27614,27615,27616,27618,27619,27620,27621,27622,27623,27624,27625,27628,27629,27630,27632,27633,27634,27636,27638,27639,27640,27642,27643,27644,27646,27647,27648,27649,27650,27651,27652,27656,27657,27658,27659,27660,27662,27666,27671,27676,27677,27678,27680,27683,27685,27691,27692,27693,27697,27699,27702,27703,27705,27706,27707,27708,27710,27711,27715,27716,27717,27720,27723,27724,27725,27726,27727,27729,27730,27731,27734,27736,27737,27738,27746,27747,27749,27750,27751,27755,27756,27757,27758,27759,27761,27763,27765,27767,27768,27770,27771,27772,27775,27776,27780,27783,27786,27787,27789,27790,27793,27794,27797,27798,27799,27800,27802,27804,27805,27806,27808,27810,27816,27820,27823,27824,27828,27829,27830,27831,27834,27840,27841,27842,27843,27846,27847,27848,27851,27853,27854,27855,27857,27858,27864,27865,27866,27868,27869,27871,27876,27878,27879,27881,27884,27885,27890,27892,27897,27903,27904,27906,27907,27909,27910,27912,27913,27914,27917,27919,27920,27921,27923,27924,27925,27926,27928,27932,27933,27935,27936,27937,27938,27939,27940,27942,27944,27945,27948,27949,27951,27952,27956,27958,27959,27960,27962,27967,27968,27970,27972,27977,27980,27984,27989,27990,27991,27992,27995,27997,27999,28001,28002,28004,28005,28007,28008,28011,28012,28013,28016,28017,28018,28019,28021,28022,28025,28026,28027,28029,28030,28031,28032,28033,28035,28036,28038,28039,28042,28043,28045,28047,28048,28050,28054,28055,28056,28057,28058,28060,28066,28069,28076,28077,28080,28081,28083,28084,28086,28087,28089,28090,28091,28092,28093,28094,28097,28098,28099,28104,28105,28106,28109,28110,28111,28112,28114,28115,28116,28117,28119,28122,28123,28124,28127,28130,28131,28133,28135,28136,28137,28138,28141,28143,28144,28146,28148,28149,28150,28152,28154,28157,28158,28159,28160,28161,28162,28163,28164,28166,28167,28168,28169,28171,28175,28178,28179,28181,28184,28185,28187,28188,28190,28191,28194,28198,28199,28200,28202,28204,28206,28208,28209,28211,28213,28214,28215,28217,28219,28220,28221,28222,28223,28224,28225,28226,28229,28230,28231,28232,28233,28234,28235,28236,28239,28240,28241,28242,28245,28247,28249,28250,28252,28253,28254,28256,28257,28258,28259,28260,28261,28262,28263,28264,28265,28266,28268,28269,28271,28272,28273,28274,28275,28276,28277,28278,28279,28280,28281,28282,28283,28284,28285,28288,28289,28290,28292,28295,28296,28298,28299,28300,28301,28302,28305,28306,28307,28308,28309,28310,28311,28313,28314,28315,28317,28318,28320,28321,28323,28324,28326,28328,28329,28331,28332,28333,28334,28336,28339,28341,28344,28345,28348,28350,28351,28352,28355,28356,28357,28358,28360,28361,28362,28364,28365,28366,28368,28370,28374,28376,28377,28379,28380,28381,28387,28391,28394,28395,28396,28397,28398,28399,28400,28401,28402,28403,28405,28406,28407,28408,28410,28411,28412,28413,28414,28415,28416,28417,28419,28420,28421,28423,28424,28426,28427,28428,28429,28430,28432,28433,28434,28438,28439,28440,28441,28442,28443,28444,28445,28446,28447,28449,28450,28451,28453,28454,28455,28456,28460,28462,28464,28466,28468,28469,28471,28472,28473,28474,28475,28476,28477,28479,28480,28481,28482,28483,28484,28485,28488,28489,28490,28492,28494,28495,28496,28497,28498,28499,28500,28501,28502,28503,28505,28506,28507,28509,28511,28512,28513,28515,28516,28517,28519,28520,28521,28522,28523,28524,28527,28528,28529,28531,28533,28534,28535,28537,28539,28541,28542,28543,28544,28545,28546,28547,28549,28550,28551,28554,28555,28559,28560,28561,28562,28563,28564,28565,28566,28567,28568,28569,28570,28571,28573,28574,28575,28576,28578,28579,28580,28581,28582,28584,28585,28586,28587,28588,28589,28590,28591,28592,28593,28594,28596,28597,28599,28600,28602,28603,28604,28605,28606,28607,28609,28611,28612,28613,28614,28615,28616,28618,28619,28620,28621,28622,28623,28624,28627,28628,28629,28630,28631,28632,28633,28634,28635,28636,28637,28639,28642,28643,28644,28645,28646,28647,28648,28649,28650,28651,28652,28653,28656,28657,28658,28659,28660,28661,28662,28663,28664,28665,28666,28667,28668,28669,28670,28671,28672,28673,28674,28675,28676,28677,28678,28679,28680,28681,28682,28683,28684,28685,28686,28687,28688,28690,28691,28692,28693,28694,28695,28696,28697,28700,28701,28702,28703,28704,28705,28706,28708,28709,28710,28711,28712,28713,28714,28715,28716,28717,28718,28719,28720,28721,28722,28723,28724,28726,28727,28728,28730,28731,28732,28733,28734,28735,28736,28737,28738,28739,28740,28741,28742,28743,28744,28745,28746,28747,28749,28750,28752,28753,28754,28755,28756,28757,28758,28759,28760,28761,28762,28763,28764,28765,28767,28768,28769,28770,28771,28772,28773,28774,28775,28776,28777,28778,28782,28785,28786,28787,28788,28791,28793,28794,28795,28797,28801,28802,28803,28804,28806,28807,28808,28811,28812,28813,28815,28816,28817,28819,28823,28824,28826,28827,28830,28831,28832,28833,28834,28835,28836,28837,28838,28839,28840,28841,28842,28848,28850,28852,28853,28854,28858,28862,28863,28868,28869,28870,28871,28873,28875,28876,28877,28878,28879,28880,28881,28882,28883,28884,28885,28886,28887,28890,28892,28893,28894,28896,28897,28898,28899,28901,28906,28910,28912,28913,28914,28915,28916,28917,28918,28920,28922,28923,28924,28926,28927,28928,28929,28930,28931,28932,28933,28934,28935,28936,28939,28940,28941,28942,28943,28945,28946,28948,28951,28955,28956,28957,28958,28959,28960,28961,28962,28963,28964,28965,28967,28968,28969,28970,28971,28972,28973,28974,28978,28979,28980,28981,28983,28984,28985,28986,28987,28988,28989,28990,28991,28992,28993,28994,28995,28996,28998,28999,29000,29001,29003,29005,29007,29008,29009,29010,29011,29012,29013,29014,29015,29016,29017,29018,29019,29021,29023,29024,29025,29026,29027,29029,29033,29034,29035,29036,29037,29039,29040,29041,29044,29045,29046,29047,29049,29051,29052,29054,29055,29056,29057,29058,29059,29061,29062,29063,29064,29065,29067,29068,29069,29070,29072,29073,29074,29075,29077,29078,29079,29082,29083,29084,29085,29086,29089,29090,29091,29092,29093,29094,29095,29097,29098,29099,29101,29102,29103,29104,29105,29106,29108,29110,29111,29112,29114,29115,29116,29117,29118,29119,29120,29121,29122,29124,29125,29126,29127,29128,29129,29130,29131,29132,29133,29135,29136,29137,29138,29139,29142,29143,29144,29145,29146,29147,29148,29149,29150,29151,29153,29154,29155,29156,29158,29160,29161,29162,29163,29164,29165,29167,29168,29169,29170,29171,29172,29173,29174,29175,29176,29178,29179,29180,29181,29182,29183,29184,29185,29186,29187,29188,29189,29191,29192,29193,29194,29195,29196,29197,29198,29199,29200,29201,29202,29203,29204,29205,29206,29207,29208,29209,29210,29211,29212,29214,29215,29216,29217,29218,29219,29220,29221,29222,29223,29225,29227,29229,29230,29231,29234,29235,29236,29242,29244,29246,29248,29249,29250,29251,29252,29253,29254,29257,29258,29259,29262,29263,29264,29265,29267,29268,29269,29271,29272,29274,29276,29278,29280,29283,29284,29285,29288,29290,29291,29292,29293,29296,29297,29299,29300,29302,29303,29304,29307,29308,29309,29314,29315,29317,29318,29319,29320,29321,29324,29326,29328,29329,29331,29332,29333,29334,29335,29336,29337,29338,29339,29340,29341,29342,29344,29345,29346,29347,29348,29349,29350,29351,29352,29353,29354,29355,29358,29361,29362,29363,29365,29370,29371,29372,29373,29374,29375,29376,29381,29382,29383,29385,29386,29387,29388,29391,29393,29395,29396,29397,29398,29400,29402,29403,58566,58567,58568,58569,58570,58571,58572,58573,58574,58575,58576,58577,58578,58579,58580,58581,58582,58583,58584,58585,58586,58587,58588,58589,58590,58591,58592,58593,58594,58595,58596,58597,58598,58599,58600,58601,58602,58603,58604,58605,58606,58607,58608,58609,58610,58611,58612,58613,58614,58615,58616,58617,58618,58619,58620,58621,58622,58623,58624,58625,58626,58627,58628,58629,58630,58631,58632,58633,58634,58635,58636,58637,58638,58639,58640,58641,58642,58643,58644,58645,58646,58647,58648,58649,58650,58651,58652,58653,58654,58655,58656,58657,58658,58659,58660,58661,12288,12289,12290,183,713,711,168,12291,12293,8212,65374,8214,8230,8216,8217,8220,8221,12308,12309,12296,12297,12298,12299,12300,12301,12302,12303,12310,12311,12304,12305,177,215,247,8758,8743,8744,8721,8719,8746,8745,8712,8759,8730,8869,8741,8736,8978,8857,8747,8750,8801,8780,8776,8765,8733,8800,8814,8815,8804,8805,8734,8757,8756,9794,9792,176,8242,8243,8451,65284,164,65504,65505,8240,167,8470,9734,9733,9675,9679,9678,9671,9670,9633,9632,9651,9650,8251,8594,8592,8593,8595,12307,58662,58663,58664,58665,58666,58667,58668,58669,58670,58671,58672,58673,58674,58675,58676,58677,58678,58679,58680,58681,58682,58683,58684,58685,58686,58687,58688,58689,58690,58691,58692,58693,58694,58695,58696,58697,58698,58699,58700,58701,58702,58703,58704,58705,58706,58707,58708,58709,58710,58711,58712,58713,58714,58715,58716,58717,58718,58719,58720,58721,58722,58723,58724,58725,58726,58727,58728,58729,58730,58731,58732,58733,58734,58735,58736,58737,58738,58739,58740,58741,58742,58743,58744,58745,58746,58747,58748,58749,58750,58751,58752,58753,58754,58755,58756,58757,8560,8561,8562,8563,8564,8565,8566,8567,8568,8569,59238,59239,59240,59241,59242,59243,9352,9353,9354,9355,9356,9357,9358,9359,9360,9361,9362,9363,9364,9365,9366,9367,9368,9369,9370,9371,9332,9333,9334,9335,9336,9337,9338,9339,9340,9341,9342,9343,9344,9345,9346,9347,9348,9349,9350,9351,9312,9313,9314,9315,9316,9317,9318,9319,9320,9321,8364,59245,12832,12833,12834,12835,12836,12837,12838,12839,12840,12841,59246,59247,8544,8545,8546,8547,8548,8549,8550,8551,8552,8553,8554,8555,59248,59249,58758,58759,58760,58761,58762,58763,58764,58765,58766,58767,58768,58769,58770,58771,58772,58773,58774,58775,58776,58777,58778,58779,58780,58781,58782,58783,58784,58785,58786,58787,58788,58789,58790,58791,58792,58793,58794,58795,58796,58797,58798,58799,58800,58801,58802,58803,58804,58805,58806,58807,58808,58809,58810,58811,58812,58813,58814,58815,58816,58817,58818,58819,58820,58821,58822,58823,58824,58825,58826,58827,58828,58829,58830,58831,58832,58833,58834,58835,58836,58837,58838,58839,58840,58841,58842,58843,58844,58845,58846,58847,58848,58849,58850,58851,58852,12288,65281,65282,65283,65509,65285,65286,65287,65288,65289,65290,65291,65292,65293,65294,65295,65296,65297,65298,65299,65300,65301,65302,65303,65304,65305,65306,65307,65308,65309,65310,65311,65312,65313,65314,65315,65316,65317,65318,65319,65320,65321,65322,65323,65324,65325,65326,65327,65328,65329,65330,65331,65332,65333,65334,65335,65336,65337,65338,65339,65340,65341,65342,65343,65344,65345,65346,65347,65348,65349,65350,65351,65352,65353,65354,65355,65356,65357,65358,65359,65360,65361,65362,65363,65364,65365,65366,65367,65368,65369,65370,65371,65372,65373,65507,58854,58855,58856,58857,58858,58859,58860,58861,58862,58863,58864,58865,58866,58867,58868,58869,58870,58871,58872,58873,58874,58875,58876,58877,58878,58879,58880,58881,58882,58883,58884,58885,58886,58887,58888,58889,58890,58891,58892,58893,58894,58895,58896,58897,58898,58899,58900,58901,58902,58903,58904,58905,58906,58907,58908,58909,58910,58911,58912,58913,58914,58915,58916,58917,58918,58919,58920,58921,58922,58923,58924,58925,58926,58927,58928,58929,58930,58931,58932,58933,58934,58935,58936,58937,58938,58939,58940,58941,58942,58943,58944,58945,58946,58947,58948,58949,12353,12354,12355,12356,12357,12358,12359,12360,12361,12362,12363,12364,12365,12366,12367,12368,12369,12370,12371,12372,12373,12374,12375,12376,12377,12378,12379,12380,12381,12382,12383,12384,12385,12386,12387,12388,12389,12390,12391,12392,12393,12394,12395,12396,12397,12398,12399,12400,12401,12402,12403,12404,12405,12406,12407,12408,12409,12410,12411,12412,12413,12414,12415,12416,12417,12418,12419,12420,12421,12422,12423,12424,12425,12426,12427,12428,12429,12430,12431,12432,12433,12434,12435,59250,59251,59252,59253,59254,59255,59256,59257,59258,59259,59260,58950,58951,58952,58953,58954,58955,58956,58957,58958,58959,58960,58961,58962,58963,58964,58965,58966,58967,58968,58969,58970,58971,58972,58973,58974,58975,58976,58977,58978,58979,58980,58981,58982,58983,58984,58985,58986,58987,58988,58989,58990,58991,58992,58993,58994,58995,58996,58997,58998,58999,59000,59001,59002,59003,59004,59005,59006,59007,59008,59009,59010,59011,59012,59013,59014,59015,59016,59017,59018,59019,59020,59021,59022,59023,59024,59025,59026,59027,59028,59029,59030,59031,59032,59033,59034,59035,59036,59037,59038,59039,59040,59041,59042,59043,59044,59045,12449,12450,12451,12452,12453,12454,12455,12456,12457,12458,12459,12460,12461,12462,12463,12464,12465,12466,12467,12468,12469,12470,12471,12472,12473,12474,12475,12476,12477,12478,12479,12480,12481,12482,12483,12484,12485,12486,12487,12488,12489,12490,12491,12492,12493,12494,12495,12496,12497,12498,12499,12500,12501,12502,12503,12504,12505,12506,12507,12508,12509,12510,12511,12512,12513,12514,12515,12516,12517,12518,12519,12520,12521,12522,12523,12524,12525,12526,12527,12528,12529,12530,12531,12532,12533,12534,59261,59262,59263,59264,59265,59266,59267,59268,59046,59047,59048,59049,59050,59051,59052,59053,59054,59055,59056,59057,59058,59059,59060,59061,59062,59063,59064,59065,59066,59067,59068,59069,59070,59071,59072,59073,59074,59075,59076,59077,59078,59079,59080,59081,59082,59083,59084,59085,59086,59087,59088,59089,59090,59091,59092,59093,59094,59095,59096,59097,59098,59099,59100,59101,59102,59103,59104,59105,59106,59107,59108,59109,59110,59111,59112,59113,59114,59115,59116,59117,59118,59119,59120,59121,59122,59123,59124,59125,59126,59127,59128,59129,59130,59131,59132,59133,59134,59135,59136,59137,59138,59139,59140,59141,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,931,932,933,934,935,936,937,59269,59270,59271,59272,59273,59274,59275,59276,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,963,964,965,966,967,968,969,59277,59278,59279,59280,59281,59282,59283,65077,65078,65081,65082,65087,65088,65085,65086,65089,65090,65091,65092,59284,59285,65083,65084,65079,65080,65073,59286,65075,65076,59287,59288,59289,59290,59291,59292,59293,59294,59295,59142,59143,59144,59145,59146,59147,59148,59149,59150,59151,59152,59153,59154,59155,59156,59157,59158,59159,59160,59161,59162,59163,59164,59165,59166,59167,59168,59169,59170,59171,59172,59173,59174,59175,59176,59177,59178,59179,59180,59181,59182,59183,59184,59185,59186,59187,59188,59189,59190,59191,59192,59193,59194,59195,59196,59197,59198,59199,59200,59201,59202,59203,59204,59205,59206,59207,59208,59209,59210,59211,59212,59213,59214,59215,59216,59217,59218,59219,59220,59221,59222,59223,59224,59225,59226,59227,59228,59229,59230,59231,59232,59233,59234,59235,59236,59237,1040,1041,1042,1043,1044,1045,1025,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,59296,59297,59298,59299,59300,59301,59302,59303,59304,59305,59306,59307,59308,59309,59310,1072,1073,1074,1075,1076,1077,1105,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,59311,59312,59313,59314,59315,59316,59317,59318,59319,59320,59321,59322,59323,714,715,729,8211,8213,8229,8245,8453,8457,8598,8599,8600,8601,8725,8735,8739,8786,8806,8807,8895,9552,9553,9554,9555,9556,9557,9558,9559,9560,9561,9562,9563,9564,9565,9566,9567,9568,9569,9570,9571,9572,9573,9574,9575,9576,9577,9578,9579,9580,9581,9582,9583,9584,9585,9586,9587,9601,9602,9603,9604,9605,9606,9607,9608,9609,9610,9611,9612,9613,9614,9615,9619,9620,9621,9660,9661,9698,9699,9700,9701,9737,8853,12306,12317,12318,59324,59325,59326,59327,59328,59329,59330,59331,59332,59333,59334,257,225,462,224,275,233,283,232,299,237,464,236,333,243,466,242,363,250,468,249,470,472,474,476,252,234,593,7743,324,328,505,609,59337,59338,59339,59340,12549,12550,12551,12552,12553,12554,12555,12556,12557,12558,12559,12560,12561,12562,12563,12564,12565,12566,12567,12568,12569,12570,12571,12572,12573,12574,12575,12576,12577,12578,12579,12580,12581,12582,12583,12584,12585,59341,59342,59343,59344,59345,59346,59347,59348,59349,59350,59351,59352,59353,59354,59355,59356,59357,59358,59359,59360,59361,12321,12322,12323,12324,12325,12326,12327,12328,12329,12963,13198,13199,13212,13213,13214,13217,13252,13262,13265,13266,13269,65072,65506,65508,59362,8481,12849,59363,8208,59364,59365,59366,12540,12443,12444,12541,12542,12294,12445,12446,65097,65098,65099,65100,65101,65102,65103,65104,65105,65106,65108,65109,65110,65111,65113,65114,65115,65116,65117,65118,65119,65120,65121,65122,65123,65124,65125,65126,65128,65129,65130,65131,12350,12272,12273,12274,12275,12276,12277,12278,12279,12280,12281,12282,12283,12295,59380,59381,59382,59383,59384,59385,59386,59387,59388,59389,59390,59391,59392,9472,9473,9474,9475,9476,9477,9478,9479,9480,9481,9482,9483,9484,9485,9486,9487,9488,9489,9490,9491,9492,9493,9494,9495,9496,9497,9498,9499,9500,9501,9502,9503,9504,9505,9506,9507,9508,9509,9510,9511,9512,9513,9514,9515,9516,9517,9518,9519,9520,9521,9522,9523,9524,9525,9526,9527,9528,9529,9530,9531,9532,9533,9534,9535,9536,9537,9538,9539,9540,9541,9542,9543,9544,9545,9546,9547,59393,59394,59395,59396,59397,59398,59399,59400,59401,59402,59403,59404,59405,59406,59407,29404,29405,29407,29410,29411,29412,29413,29414,29415,29418,29419,29429,29430,29433,29437,29438,29439,29440,29442,29444,29445,29446,29447,29448,29449,29451,29452,29453,29455,29456,29457,29458,29460,29464,29465,29466,29471,29472,29475,29476,29478,29479,29480,29485,29487,29488,29490,29491,29493,29494,29498,29499,29500,29501,29504,29505,29506,29507,29508,29509,29510,29511,29512,29513,29514,29515,29516,29518,29519,29521,29523,29524,29525,29526,29528,29529,29530,29531,29532,29533,29534,29535,29537,29538,29539,29540,29541,29542,29543,29544,29545,29546,29547,29550,29552,29553,57344,57345,57346,57347,57348,57349,57350,57351,57352,57353,57354,57355,57356,57357,57358,57359,57360,57361,57362,57363,57364,57365,57366,57367,57368,57369,57370,57371,57372,57373,57374,57375,57376,57377,57378,57379,57380,57381,57382,57383,57384,57385,57386,57387,57388,57389,57390,57391,57392,57393,57394,57395,57396,57397,57398,57399,57400,57401,57402,57403,57404,57405,57406,57407,57408,57409,57410,57411,57412,57413,57414,57415,57416,57417,57418,57419,57420,57421,57422,57423,57424,57425,57426,57427,57428,57429,57430,57431,57432,57433,57434,57435,57436,57437,29554,29555,29556,29557,29558,29559,29560,29561,29562,29563,29564,29565,29567,29568,29569,29570,29571,29573,29574,29576,29578,29580,29581,29583,29584,29586,29587,29588,29589,29591,29592,29593,29594,29596,29597,29598,29600,29601,29603,29604,29605,29606,29607,29608,29610,29612,29613,29617,29620,29621,29622,29624,29625,29628,29629,29630,29631,29633,29635,29636,29637,29638,29639,29643,29644,29646,29650,29651,29652,29653,29654,29655,29656,29658,29659,29660,29661,29663,29665,29666,29667,29668,29670,29672,29674,29675,29676,29678,29679,29680,29681,29683,29684,29685,29686,29687,57438,57439,57440,57441,57442,57443,57444,57445,57446,57447,57448,57449,57450,57451,57452,57453,57454,57455,57456,57457,57458,57459,57460,57461,57462,57463,57464,57465,57466,57467,57468,57469,57470,57471,57472,57473,57474,57475,57476,57477,57478,57479,57480,57481,57482,57483,57484,57485,57486,57487,57488,57489,57490,57491,57492,57493,57494,57495,57496,57497,57498,57499,57500,57501,57502,57503,57504,57505,57506,57507,57508,57509,57510,57511,57512,57513,57514,57515,57516,57517,57518,57519,57520,57521,57522,57523,57524,57525,57526,57527,57528,57529,57530,57531,29688,29689,29690,29691,29692,29693,29694,29695,29696,29697,29698,29700,29703,29704,29707,29708,29709,29710,29713,29714,29715,29716,29717,29718,29719,29720,29721,29724,29725,29726,29727,29728,29729,29731,29732,29735,29737,29739,29741,29743,29745,29746,29751,29752,29753,29754,29755,29757,29758,29759,29760,29762,29763,29764,29765,29766,29767,29768,29769,29770,29771,29772,29773,29774,29775,29776,29777,29778,29779,29780,29782,29784,29789,29792,29793,29794,29795,29796,29797,29798,29799,29800,29801,29802,29803,29804,29806,29807,29809,29810,29811,29812,29813,29816,29817,29818,57532,57533,57534,57535,57536,57537,57538,57539,57540,57541,57542,57543,57544,57545,57546,57547,57548,57549,57550,57551,57552,57553,57554,57555,57556,57557,57558,57559,57560,57561,57562,57563,57564,57565,57566,57567,57568,57569,57570,57571,57572,57573,57574,57575,57576,57577,57578,57579,57580,57581,57582,57583,57584,57585,57586,57587,57588,57589,57590,57591,57592,57593,57594,57595,57596,57597,57598,57599,57600,57601,57602,57603,57604,57605,57606,57607,57608,57609,57610,57611,57612,57613,57614,57615,57616,57617,57618,57619,57620,57621,57622,57623,57624,57625,29819,29820,29821,29823,29826,29828,29829,29830,29832,29833,29834,29836,29837,29839,29841,29842,29843,29844,29845,29846,29847,29848,29849,29850,29851,29853,29855,29856,29857,29858,29859,29860,29861,29862,29866,29867,29868,29869,29870,29871,29872,29873,29874,29875,29876,29877,29878,29879,29880,29881,29883,29884,29885,29886,29887,29888,29889,29890,29891,29892,29893,29894,29895,29896,29897,29898,29899,29900,29901,29902,29903,29904,29905,29907,29908,29909,29910,29911,29912,29913,29914,29915,29917,29919,29921,29925,29927,29928,29929,29930,29931,29932,29933,29936,29937,29938,57626,57627,57628,57629,57630,57631,57632,57633,57634,57635,57636,57637,57638,57639,57640,57641,57642,57643,57644,57645,57646,57647,57648,57649,57650,57651,57652,57653,57654,57655,57656,57657,57658,57659,57660,57661,57662,57663,57664,57665,57666,57667,57668,57669,57670,57671,57672,57673,57674,57675,57676,57677,57678,57679,57680,57681,57682,57683,57684,57685,57686,57687,57688,57689,57690,57691,57692,57693,57694,57695,57696,57697,57698,57699,57700,57701,57702,57703,57704,57705,57706,57707,57708,57709,57710,57711,57712,57713,57714,57715,57716,57717,57718,57719,29939,29941,29944,29945,29946,29947,29948,29949,29950,29952,29953,29954,29955,29957,29958,29959,29960,29961,29962,29963,29964,29966,29968,29970,29972,29973,29974,29975,29979,29981,29982,29984,29985,29986,29987,29988,29990,29991,29994,29998,30004,30006,30009,30012,30013,30015,30017,30018,30019,30020,30022,30023,30025,30026,30029,30032,30033,30034,30035,30037,30038,30039,30040,30045,30046,30047,30048,30049,30050,30051,30052,30055,30056,30057,30059,30060,30061,30062,30063,30064,30065,30067,30069,30070,30071,30074,30075,30076,30077,30078,30080,30081,30082,30084,30085,30087,57720,57721,57722,57723,57724,57725,57726,57727,57728,57729,57730,57731,57732,57733,57734,57735,57736,57737,57738,57739,57740,57741,57742,57743,57744,57745,57746,57747,57748,57749,57750,57751,57752,57753,57754,57755,57756,57757,57758,57759,57760,57761,57762,57763,57764,57765,57766,57767,57768,57769,57770,57771,57772,57773,57774,57775,57776,57777,57778,57779,57780,57781,57782,57783,57784,57785,57786,57787,57788,57789,57790,57791,57792,57793,57794,57795,57796,57797,57798,57799,57800,57801,57802,57803,57804,57805,57806,57807,57808,57809,57810,57811,57812,57813,30088,30089,30090,30092,30093,30094,30096,30099,30101,30104,30107,30108,30110,30114,30118,30119,30120,30121,30122,30125,30134,30135,30138,30139,30143,30144,30145,30150,30155,30156,30158,30159,30160,30161,30163,30167,30169,30170,30172,30173,30175,30176,30177,30181,30185,30188,30189,30190,30191,30194,30195,30197,30198,30199,30200,30202,30203,30205,30206,30210,30212,30214,30215,30216,30217,30219,30221,30222,30223,30225,30226,30227,30228,30230,30234,30236,30237,30238,30241,30243,30247,30248,30252,30254,30255,30257,30258,30262,30263,30265,30266,30267,30269,30273,30274,30276,57814,57815,57816,57817,57818,57819,57820,57821,57822,57823,57824,57825,57826,57827,57828,57829,57830,57831,57832,57833,57834,57835,57836,57837,57838,57839,57840,57841,57842,57843,57844,57845,57846,57847,57848,57849,57850,57851,57852,57853,57854,57855,57856,57857,57858,57859,57860,57861,57862,57863,57864,57865,57866,57867,57868,57869,57870,57871,57872,57873,57874,57875,57876,57877,57878,57879,57880,57881,57882,57883,57884,57885,57886,57887,57888,57889,57890,57891,57892,57893,57894,57895,57896,57897,57898,57899,57900,57901,57902,57903,57904,57905,57906,57907,30277,30278,30279,30280,30281,30282,30283,30286,30287,30288,30289,30290,30291,30293,30295,30296,30297,30298,30299,30301,30303,30304,30305,30306,30308,30309,30310,30311,30312,30313,30314,30316,30317,30318,30320,30321,30322,30323,30324,30325,30326,30327,30329,30330,30332,30335,30336,30337,30339,30341,30345,30346,30348,30349,30351,30352,30354,30356,30357,30359,30360,30362,30363,30364,30365,30366,30367,30368,30369,30370,30371,30373,30374,30375,30376,30377,30378,30379,30380,30381,30383,30384,30387,30389,30390,30391,30392,30393,30394,30395,30396,30397,30398,30400,30401,30403,21834,38463,22467,25384,21710,21769,21696,30353,30284,34108,30702,33406,30861,29233,38552,38797,27688,23433,20474,25353,26263,23736,33018,26696,32942,26114,30414,20985,25942,29100,32753,34948,20658,22885,25034,28595,33453,25420,25170,21485,21543,31494,20843,30116,24052,25300,36299,38774,25226,32793,22365,38712,32610,29240,30333,26575,30334,25670,20336,36133,25308,31255,26001,29677,25644,25203,33324,39041,26495,29256,25198,25292,20276,29923,21322,21150,32458,37030,24110,26758,27036,33152,32465,26834,30917,34444,38225,20621,35876,33502,32990,21253,35090,21093,30404,30407,30409,30411,30412,30419,30421,30425,30426,30428,30429,30430,30432,30433,30434,30435,30436,30438,30439,30440,30441,30442,30443,30444,30445,30448,30451,30453,30454,30455,30458,30459,30461,30463,30464,30466,30467,30469,30470,30474,30476,30478,30479,30480,30481,30482,30483,30484,30485,30486,30487,30488,30491,30492,30493,30494,30497,30499,30500,30501,30503,30506,30507,30508,30510,30512,30513,30514,30515,30516,30521,30523,30525,30526,30527,30530,30532,30533,30534,30536,30537,30538,30539,30540,30541,30542,30543,30546,30547,30548,30549,30550,30551,30552,30553,30556,34180,38649,20445,22561,39281,23453,25265,25253,26292,35961,40077,29190,26479,30865,24754,21329,21271,36744,32972,36125,38049,20493,29384,22791,24811,28953,34987,22868,33519,26412,31528,23849,32503,29997,27893,36454,36856,36924,40763,27604,37145,31508,24444,30887,34006,34109,27605,27609,27606,24065,24199,30201,38381,25949,24330,24517,36767,22721,33218,36991,38491,38829,36793,32534,36140,25153,20415,21464,21342,36776,36777,36779,36941,26631,24426,33176,34920,40150,24971,21035,30250,24428,25996,28626,28392,23486,25672,20853,20912,26564,19993,31177,39292,28851,30557,30558,30559,30560,30564,30567,30569,30570,30573,30574,30575,30576,30577,30578,30579,30580,30581,30582,30583,30584,30586,30587,30588,30593,30594,30595,30598,30599,30600,30601,30602,30603,30607,30608,30611,30612,30613,30614,30615,30616,30617,30618,30619,30620,30621,30622,30625,30627,30628,30630,30632,30635,30637,30638,30639,30641,30642,30644,30646,30647,30648,30649,30650,30652,30654,30656,30657,30658,30659,30660,30661,30662,30663,30664,30665,30666,30667,30668,30670,30671,30672,30673,30674,30675,30676,30677,30678,30680,30681,30682,30685,30686,30687,30688,30689,30692,30149,24182,29627,33760,25773,25320,38069,27874,21338,21187,25615,38082,31636,20271,24091,33334,33046,33162,28196,27850,39539,25429,21340,21754,34917,22496,19981,24067,27493,31807,37096,24598,25830,29468,35009,26448,25165,36130,30572,36393,37319,24425,33756,34081,39184,21442,34453,27531,24813,24808,28799,33485,33329,20179,27815,34255,25805,31961,27133,26361,33609,21397,31574,20391,20876,27979,23618,36461,25554,21449,33580,33590,26597,30900,25661,23519,23700,24046,35815,25286,26612,35962,25600,25530,34633,39307,35863,32544,38130,20135,38416,39076,26124,29462,30694,30696,30698,30703,30704,30705,30706,30708,30709,30711,30713,30714,30715,30716,30723,30724,30725,30726,30727,30728,30730,30731,30734,30735,30736,30739,30741,30745,30747,30750,30752,30753,30754,30756,30760,30762,30763,30766,30767,30769,30770,30771,30773,30774,30781,30783,30785,30786,30787,30788,30790,30792,30793,30794,30795,30797,30799,30801,30803,30804,30808,30809,30810,30811,30812,30814,30815,30816,30817,30818,30819,30820,30821,30822,30823,30824,30825,30831,30832,30833,30834,30835,30836,30837,30838,30840,30841,30842,30843,30845,30846,30847,30848,30849,30850,30851,22330,23581,24120,38271,20607,32928,21378,25950,30021,21809,20513,36229,25220,38046,26397,22066,28526,24034,21557,28818,36710,25199,25764,25507,24443,28552,37108,33251,36784,23576,26216,24561,27785,38472,36225,34924,25745,31216,22478,27225,25104,21576,20056,31243,24809,28548,35802,25215,36894,39563,31204,21507,30196,25345,21273,27744,36831,24347,39536,32827,40831,20360,23610,36196,32709,26021,28861,20805,20914,34411,23815,23456,25277,37228,30068,36364,31264,24833,31609,20167,32504,30597,19985,33261,21021,20986,27249,21416,36487,38148,38607,28353,38500,26970,30852,30853,30854,30856,30858,30859,30863,30864,30866,30868,30869,30870,30873,30877,30878,30880,30882,30884,30886,30888,30889,30890,30891,30892,30893,30894,30895,30901,30902,30903,30904,30906,30907,30908,30909,30911,30912,30914,30915,30916,30918,30919,30920,30924,30925,30926,30927,30929,30930,30931,30934,30935,30936,30938,30939,30940,30941,30942,30943,30944,30945,30946,30947,30948,30949,30950,30951,30953,30954,30955,30957,30958,30959,30960,30961,30963,30965,30966,30968,30969,30971,30972,30973,30974,30975,30976,30978,30979,30980,30982,30983,30984,30985,30986,30987,30988,30784,20648,30679,25616,35302,22788,25571,24029,31359,26941,20256,33337,21912,20018,30126,31383,24162,24202,38383,21019,21561,28810,25462,38180,22402,26149,26943,37255,21767,28147,32431,34850,25139,32496,30133,33576,30913,38604,36766,24904,29943,35789,27492,21050,36176,27425,32874,33905,22257,21254,20174,19995,20945,31895,37259,31751,20419,36479,31713,31388,25703,23828,20652,33030,30209,31929,28140,32736,26449,23384,23544,30923,25774,25619,25514,25387,38169,25645,36798,31572,30249,25171,22823,21574,27513,20643,25140,24102,27526,20195,36151,34955,24453,36910,30989,30990,30991,30992,30993,30994,30996,30997,30998,30999,31000,31001,31002,31003,31004,31005,31007,31008,31009,31010,31011,31013,31014,31015,31016,31017,31018,31019,31020,31021,31022,31023,31024,31025,31026,31027,31029,31030,31031,31032,31033,31037,31039,31042,31043,31044,31045,31047,31050,31051,31052,31053,31054,31055,31056,31057,31058,31060,31061,31064,31065,31073,31075,31076,31078,31081,31082,31083,31084,31086,31088,31089,31090,31091,31092,31093,31094,31097,31099,31100,31101,31102,31103,31106,31107,31110,31111,31112,31113,31115,31116,31117,31118,31120,31121,31122,24608,32829,25285,20025,21333,37112,25528,32966,26086,27694,20294,24814,28129,35806,24377,34507,24403,25377,20826,33633,26723,20992,25443,36424,20498,23707,31095,23548,21040,31291,24764,36947,30423,24503,24471,30340,36460,28783,30331,31561,30634,20979,37011,22564,20302,28404,36842,25932,31515,29380,28068,32735,23265,25269,24213,22320,33922,31532,24093,24351,36882,32532,39072,25474,28359,30872,28857,20856,38747,22443,30005,20291,30008,24215,24806,22880,28096,27583,30857,21500,38613,20939,20993,25481,21514,38035,35843,36300,29241,30879,34678,36845,35853,21472,31123,31124,31125,31126,31127,31128,31129,31131,31132,31133,31134,31135,31136,31137,31138,31139,31140,31141,31142,31144,31145,31146,31147,31148,31149,31150,31151,31152,31153,31154,31156,31157,31158,31159,31160,31164,31167,31170,31172,31173,31175,31176,31178,31180,31182,31183,31184,31187,31188,31190,31191,31193,31194,31195,31196,31197,31198,31200,31201,31202,31205,31208,31210,31212,31214,31217,31218,31219,31220,31221,31222,31223,31225,31226,31228,31230,31231,31233,31236,31237,31239,31240,31241,31242,31244,31247,31248,31249,31250,31251,31253,31254,31256,31257,31259,31260,19969,30447,21486,38025,39030,40718,38189,23450,35746,20002,19996,20908,33891,25026,21160,26635,20375,24683,20923,27934,20828,25238,26007,38497,35910,36887,30168,37117,30563,27602,29322,29420,35835,22581,30585,36172,26460,38208,32922,24230,28193,22930,31471,30701,38203,27573,26029,32526,22534,20817,38431,23545,22697,21544,36466,25958,39039,22244,38045,30462,36929,25479,21702,22810,22842,22427,36530,26421,36346,33333,21057,24816,22549,34558,23784,40517,20420,39069,35769,23077,24694,21380,25212,36943,37122,39295,24681,32780,20799,32819,23572,39285,27953,20108,31261,31263,31265,31266,31268,31269,31270,31271,31272,31273,31274,31275,31276,31277,31278,31279,31280,31281,31282,31284,31285,31286,31288,31290,31294,31296,31297,31298,31299,31300,31301,31303,31304,31305,31306,31307,31308,31309,31310,31311,31312,31314,31315,31316,31317,31318,31320,31321,31322,31323,31324,31325,31326,31327,31328,31329,31330,31331,31332,31333,31334,31335,31336,31337,31338,31339,31340,31341,31342,31343,31345,31346,31347,31349,31355,31356,31357,31358,31362,31365,31367,31369,31370,31371,31372,31374,31375,31376,31379,31380,31385,31386,31387,31390,31393,31394,36144,21457,32602,31567,20240,20047,38400,27861,29648,34281,24070,30058,32763,27146,30718,38034,32321,20961,28902,21453,36820,33539,36137,29359,39277,27867,22346,33459,26041,32938,25151,38450,22952,20223,35775,32442,25918,33778,38750,21857,39134,32933,21290,35837,21536,32954,24223,27832,36153,33452,37210,21545,27675,20998,32439,22367,28954,27774,31881,22859,20221,24575,24868,31914,20016,23553,26539,34562,23792,38155,39118,30127,28925,36898,20911,32541,35773,22857,20964,20315,21542,22827,25975,32932,23413,25206,25282,36752,24133,27679,31526,20239,20440,26381,31395,31396,31399,31401,31402,31403,31406,31407,31408,31409,31410,31412,31413,31414,31415,31416,31417,31418,31419,31420,31421,31422,31424,31425,31426,31427,31428,31429,31430,31431,31432,31433,31434,31436,31437,31438,31439,31440,31441,31442,31443,31444,31445,31447,31448,31450,31451,31452,31453,31457,31458,31460,31463,31464,31465,31466,31467,31468,31470,31472,31473,31474,31475,31476,31477,31478,31479,31480,31483,31484,31486,31488,31489,31490,31493,31495,31497,31500,31501,31502,31504,31506,31507,31510,31511,31512,31514,31516,31517,31519,31521,31522,31523,31527,31529,31533,28014,28074,31119,34993,24343,29995,25242,36741,20463,37340,26023,33071,33105,24220,33104,36212,21103,35206,36171,22797,20613,20184,38428,29238,33145,36127,23500,35747,38468,22919,32538,21648,22134,22030,35813,25913,27010,38041,30422,28297,24178,29976,26438,26577,31487,32925,36214,24863,31174,25954,36195,20872,21018,38050,32568,32923,32434,23703,28207,26464,31705,30347,39640,33167,32660,31957,25630,38224,31295,21578,21733,27468,25601,25096,40509,33011,30105,21106,38761,33883,26684,34532,38401,38548,38124,20010,21508,32473,26681,36319,32789,26356,24218,32697,31535,31536,31538,31540,31541,31542,31543,31545,31547,31549,31551,31552,31553,31554,31555,31556,31558,31560,31562,31565,31566,31571,31573,31575,31577,31580,31582,31583,31585,31587,31588,31589,31590,31591,31592,31593,31594,31595,31596,31597,31599,31600,31603,31604,31606,31608,31610,31612,31613,31615,31617,31618,31619,31620,31622,31623,31624,31625,31626,31627,31628,31630,31631,31633,31634,31635,31638,31640,31641,31642,31643,31646,31647,31648,31651,31652,31653,31662,31663,31664,31666,31667,31669,31670,31671,31673,31674,31675,31676,31677,31678,31679,31680,31682,31683,31684,22466,32831,26775,24037,25915,21151,24685,40858,20379,36524,20844,23467,24339,24041,27742,25329,36129,20849,38057,21246,27807,33503,29399,22434,26500,36141,22815,36764,33735,21653,31629,20272,27837,23396,22993,40723,21476,34506,39592,35895,32929,25925,39038,22266,38599,21038,29916,21072,23521,25346,35074,20054,25296,24618,26874,20851,23448,20896,35266,31649,39302,32592,24815,28748,36143,20809,24191,36891,29808,35268,22317,30789,24402,40863,38394,36712,39740,35809,30328,26690,26588,36330,36149,21053,36746,28378,26829,38149,37101,22269,26524,35065,36807,21704,31685,31688,31689,31690,31691,31693,31694,31695,31696,31698,31700,31701,31702,31703,31704,31707,31708,31710,31711,31712,31714,31715,31716,31719,31720,31721,31723,31724,31725,31727,31728,31730,31731,31732,31733,31734,31736,31737,31738,31739,31741,31743,31744,31745,31746,31747,31748,31749,31750,31752,31753,31754,31757,31758,31760,31761,31762,31763,31764,31765,31767,31768,31769,31770,31771,31772,31773,31774,31776,31777,31778,31779,31780,31781,31784,31785,31787,31788,31789,31790,31791,31792,31793,31794,31795,31796,31797,31798,31799,31801,31802,31803,31804,31805,31806,31810,39608,23401,28023,27686,20133,23475,39559,37219,25000,37039,38889,21547,28085,23506,20989,21898,32597,32752,25788,25421,26097,25022,24717,28938,27735,27721,22831,26477,33322,22741,22158,35946,27627,37085,22909,32791,21495,28009,21621,21917,33655,33743,26680,31166,21644,20309,21512,30418,35977,38402,27827,28088,36203,35088,40548,36154,22079,40657,30165,24456,29408,24680,21756,20136,27178,34913,24658,36720,21700,28888,34425,40511,27946,23439,24344,32418,21897,20399,29492,21564,21402,20505,21518,21628,20046,24573,29786,22774,33899,32993,34676,29392,31946,28246,31811,31812,31813,31814,31815,31816,31817,31818,31819,31820,31822,31823,31824,31825,31826,31827,31828,31829,31830,31831,31832,31833,31834,31835,31836,31837,31838,31839,31840,31841,31842,31843,31844,31845,31846,31847,31848,31849,31850,31851,31852,31853,31854,31855,31856,31857,31858,31861,31862,31863,31864,31865,31866,31870,31871,31872,31873,31874,31875,31876,31877,31878,31879,31880,31882,31883,31884,31885,31886,31887,31888,31891,31892,31894,31897,31898,31899,31904,31905,31907,31910,31911,31912,31913,31915,31916,31917,31919,31920,31924,31925,31926,31927,31928,31930,31931,24359,34382,21804,25252,20114,27818,25143,33457,21719,21326,29502,28369,30011,21010,21270,35805,27088,24458,24576,28142,22351,27426,29615,26707,36824,32531,25442,24739,21796,30186,35938,28949,28067,23462,24187,33618,24908,40644,30970,34647,31783,30343,20976,24822,29004,26179,24140,24653,35854,28784,25381,36745,24509,24674,34516,22238,27585,24724,24935,21321,24800,26214,36159,31229,20250,28905,27719,35763,35826,32472,33636,26127,23130,39746,27985,28151,35905,27963,20249,28779,33719,25110,24785,38669,36135,31096,20987,22334,22522,26426,30072,31293,31215,31637,31935,31936,31938,31939,31940,31942,31945,31947,31950,31951,31952,31953,31954,31955,31956,31960,31962,31963,31965,31966,31969,31970,31971,31972,31973,31974,31975,31977,31978,31979,31980,31981,31982,31984,31985,31986,31987,31988,31989,31990,31991,31993,31994,31996,31997,31998,31999,32000,32001,32002,32003,32004,32005,32006,32007,32008,32009,32011,32012,32013,32014,32015,32016,32017,32018,32019,32020,32021,32022,32023,32024,32025,32026,32027,32028,32029,32030,32031,32033,32035,32036,32037,32038,32040,32041,32042,32044,32045,32046,32048,32049,32050,32051,32052,32053,32054,32908,39269,36857,28608,35749,40481,23020,32489,32521,21513,26497,26840,36753,31821,38598,21450,24613,30142,27762,21363,23241,32423,25380,20960,33034,24049,34015,25216,20864,23395,20238,31085,21058,24760,27982,23492,23490,35745,35760,26082,24524,38469,22931,32487,32426,22025,26551,22841,20339,23478,21152,33626,39050,36158,30002,38078,20551,31292,20215,26550,39550,23233,27516,30417,22362,23574,31546,38388,29006,20860,32937,33392,22904,32516,33575,26816,26604,30897,30839,25315,25441,31616,20461,21098,20943,33616,27099,37492,36341,36145,35265,38190,31661,20214,32055,32056,32057,32058,32059,32060,32061,32062,32063,32064,32065,32066,32067,32068,32069,32070,32071,32072,32073,32074,32075,32076,32077,32078,32079,32080,32081,32082,32083,32084,32085,32086,32087,32088,32089,32090,32091,32092,32093,32094,32095,32096,32097,32098,32099,32100,32101,32102,32103,32104,32105,32106,32107,32108,32109,32111,32112,32113,32114,32115,32116,32117,32118,32120,32121,32122,32123,32124,32125,32126,32127,32128,32129,32130,32131,32132,32133,32134,32135,32136,32137,32138,32139,32140,32141,32142,32143,32144,32145,32146,32147,32148,32149,32150,32151,32152,20581,33328,21073,39279,28176,28293,28071,24314,20725,23004,23558,27974,27743,30086,33931,26728,22870,35762,21280,37233,38477,34121,26898,30977,28966,33014,20132,37066,27975,39556,23047,22204,25605,38128,30699,20389,33050,29409,35282,39290,32564,32478,21119,25945,37237,36735,36739,21483,31382,25581,25509,30342,31224,34903,38454,25130,21163,33410,26708,26480,25463,30571,31469,27905,32467,35299,22992,25106,34249,33445,30028,20511,20171,30117,35819,23626,24062,31563,26020,37329,20170,27941,35167,32039,38182,20165,35880,36827,38771,26187,31105,36817,28908,28024,32153,32154,32155,32156,32157,32158,32159,32160,32161,32162,32163,32164,32165,32167,32168,32169,32170,32171,32172,32173,32175,32176,32177,32178,32179,32180,32181,32182,32183,32184,32185,32186,32187,32188,32189,32190,32191,32192,32193,32194,32195,32196,32197,32198,32199,32200,32201,32202,32203,32204,32205,32206,32207,32208,32209,32210,32211,32212,32213,32214,32215,32216,32217,32218,32219,32220,32221,32222,32223,32224,32225,32226,32227,32228,32229,32230,32231,32232,32233,32234,32235,32236,32237,32238,32239,32240,32241,32242,32243,32244,32245,32246,32247,32248,32249,32250,23613,21170,33606,20834,33550,30555,26230,40120,20140,24778,31934,31923,32463,20117,35686,26223,39048,38745,22659,25964,38236,24452,30153,38742,31455,31454,20928,28847,31384,25578,31350,32416,29590,38893,20037,28792,20061,37202,21417,25937,26087,33276,33285,21646,23601,30106,38816,25304,29401,30141,23621,39545,33738,23616,21632,30697,20030,27822,32858,25298,25454,24040,20855,36317,36382,38191,20465,21477,24807,28844,21095,25424,40515,23071,20518,30519,21367,32482,25733,25899,25225,25496,20500,29237,35273,20915,35776,32477,22343,33740,38055,20891,21531,23803,32251,32252,32253,32254,32255,32256,32257,32258,32259,32260,32261,32262,32263,32264,32265,32266,32267,32268,32269,32270,32271,32272,32273,32274,32275,32276,32277,32278,32279,32280,32281,32282,32283,32284,32285,32286,32287,32288,32289,32290,32291,32292,32293,32294,32295,32296,32297,32298,32299,32300,32301,32302,32303,32304,32305,32306,32307,32308,32309,32310,32311,32312,32313,32314,32316,32317,32318,32319,32320,32322,32323,32324,32325,32326,32328,32329,32330,32331,32332,32333,32334,32335,32336,32337,32338,32339,32340,32341,32342,32343,32344,32345,32346,32347,32348,32349,20426,31459,27994,37089,39567,21888,21654,21345,21679,24320,25577,26999,20975,24936,21002,22570,21208,22350,30733,30475,24247,24951,31968,25179,25239,20130,28821,32771,25335,28900,38752,22391,33499,26607,26869,30933,39063,31185,22771,21683,21487,28212,20811,21051,23458,35838,32943,21827,22438,24691,22353,21549,31354,24656,23380,25511,25248,21475,25187,23495,26543,21741,31391,33510,37239,24211,35044,22840,22446,25358,36328,33007,22359,31607,20393,24555,23485,27454,21281,31568,29378,26694,30719,30518,26103,20917,20111,30420,23743,31397,33909,22862,39745,20608,32350,32351,32352,32353,32354,32355,32356,32357,32358,32359,32360,32361,32362,32363,32364,32365,32366,32367,32368,32369,32370,32371,32372,32373,32374,32375,32376,32377,32378,32379,32380,32381,32382,32383,32384,32385,32387,32388,32389,32390,32391,32392,32393,32394,32395,32396,32397,32398,32399,32400,32401,32402,32403,32404,32405,32406,32407,32408,32409,32410,32412,32413,32414,32430,32436,32443,32444,32470,32484,32492,32505,32522,32528,32542,32567,32569,32571,32572,32573,32574,32575,32576,32577,32579,32582,32583,32584,32585,32586,32587,32588,32589,32590,32591,32594,32595,39304,24871,28291,22372,26118,25414,22256,25324,25193,24275,38420,22403,25289,21895,34593,33098,36771,21862,33713,26469,36182,34013,23146,26639,25318,31726,38417,20848,28572,35888,25597,35272,25042,32518,28866,28389,29701,27028,29436,24266,37070,26391,28010,25438,21171,29282,32769,20332,23013,37226,28889,28061,21202,20048,38647,38253,34174,30922,32047,20769,22418,25794,32907,31867,27882,26865,26974,20919,21400,26792,29313,40654,31729,29432,31163,28435,29702,26446,37324,40100,31036,33673,33620,21519,26647,20029,21385,21169,30782,21382,21033,20616,20363,20432,32598,32601,32603,32604,32605,32606,32608,32611,32612,32613,32614,32615,32619,32620,32621,32623,32624,32627,32629,32630,32631,32632,32634,32635,32636,32637,32639,32640,32642,32643,32644,32645,32646,32647,32648,32649,32651,32653,32655,32656,32657,32658,32659,32661,32662,32663,32664,32665,32667,32668,32672,32674,32675,32677,32678,32680,32681,32682,32683,32684,32685,32686,32689,32691,32692,32693,32694,32695,32698,32699,32702,32704,32706,32707,32708,32710,32711,32712,32713,32715,32717,32719,32720,32721,32722,32723,32726,32727,32729,32730,32731,32732,32733,32734,32738,32739,30178,31435,31890,27813,38582,21147,29827,21737,20457,32852,33714,36830,38256,24265,24604,28063,24088,25947,33080,38142,24651,28860,32451,31918,20937,26753,31921,33391,20004,36742,37327,26238,20142,35845,25769,32842,20698,30103,29134,23525,36797,28518,20102,25730,38243,24278,26009,21015,35010,28872,21155,29454,29747,26519,30967,38678,20020,37051,40158,28107,20955,36161,21533,25294,29618,33777,38646,40836,38083,20278,32666,20940,28789,38517,23725,39046,21478,20196,28316,29705,27060,30827,39311,30041,21016,30244,27969,26611,20845,40857,32843,21657,31548,31423,32740,32743,32744,32746,32747,32748,32749,32751,32754,32756,32757,32758,32759,32760,32761,32762,32765,32766,32767,32770,32775,32776,32777,32778,32782,32783,32785,32787,32794,32795,32797,32798,32799,32801,32803,32804,32811,32812,32813,32814,32815,32816,32818,32820,32825,32826,32828,32830,32832,32833,32836,32837,32839,32840,32841,32846,32847,32848,32849,32851,32853,32854,32855,32857,32859,32860,32861,32862,32863,32864,32865,32866,32867,32868,32869,32870,32871,32872,32875,32876,32877,32878,32879,32880,32882,32883,32884,32885,32886,32887,32888,32889,32890,32891,32892,32893,38534,22404,25314,38471,27004,23044,25602,31699,28431,38475,33446,21346,39045,24208,28809,25523,21348,34383,40065,40595,30860,38706,36335,36162,40575,28510,31108,24405,38470,25134,39540,21525,38109,20387,26053,23653,23649,32533,34385,27695,24459,29575,28388,32511,23782,25371,23402,28390,21365,20081,25504,30053,25249,36718,20262,20177,27814,32438,35770,33821,34746,32599,36923,38179,31657,39585,35064,33853,27931,39558,32476,22920,40635,29595,30721,34434,39532,39554,22043,21527,22475,20080,40614,21334,36808,33033,30610,39314,34542,28385,34067,26364,24930,28459,32894,32897,32898,32901,32904,32906,32909,32910,32911,32912,32913,32914,32916,32917,32919,32921,32926,32931,32934,32935,32936,32940,32944,32947,32949,32950,32952,32953,32955,32965,32967,32968,32969,32970,32971,32975,32976,32977,32978,32979,32980,32981,32984,32991,32992,32994,32995,32998,33006,33013,33015,33017,33019,33022,33023,33024,33025,33027,33028,33029,33031,33032,33035,33036,33045,33047,33049,33051,33052,33053,33055,33056,33057,33058,33059,33060,33061,33062,33063,33064,33065,33066,33067,33069,33070,33072,33075,33076,33077,33079,33081,33082,33083,33084,33085,33087,35881,33426,33579,30450,27667,24537,33725,29483,33541,38170,27611,30683,38086,21359,33538,20882,24125,35980,36152,20040,29611,26522,26757,37238,38665,29028,27809,30473,23186,38209,27599,32654,26151,23504,22969,23194,38376,38391,20204,33804,33945,27308,30431,38192,29467,26790,23391,30511,37274,38753,31964,36855,35868,24357,31859,31192,35269,27852,34588,23494,24130,26825,30496,32501,20885,20813,21193,23081,32517,38754,33495,25551,30596,34256,31186,28218,24217,22937,34065,28781,27665,25279,30399,25935,24751,38397,26126,34719,40483,38125,21517,21629,35884,25720,33088,33089,33090,33091,33092,33093,33095,33097,33101,33102,33103,33106,33110,33111,33112,33115,33116,33117,33118,33119,33121,33122,33123,33124,33126,33128,33130,33131,33132,33135,33138,33139,33141,33142,33143,33144,33153,33155,33156,33157,33158,33159,33161,33163,33164,33165,33166,33168,33170,33171,33172,33173,33174,33175,33177,33178,33182,33183,33184,33185,33186,33188,33189,33191,33193,33195,33196,33197,33198,33199,33200,33201,33202,33204,33205,33206,33207,33208,33209,33212,33213,33214,33215,33220,33221,33223,33224,33225,33227,33229,33230,33231,33232,33233,33234,33235,25721,34321,27169,33180,30952,25705,39764,25273,26411,33707,22696,40664,27819,28448,23518,38476,35851,29279,26576,25287,29281,20137,22982,27597,22675,26286,24149,21215,24917,26408,30446,30566,29287,31302,25343,21738,21584,38048,37027,23068,32435,27670,20035,22902,32784,22856,21335,30007,38590,22218,25376,33041,24700,38393,28118,21602,39297,20869,23273,33021,22958,38675,20522,27877,23612,25311,20320,21311,33147,36870,28346,34091,25288,24180,30910,25781,25467,24565,23064,37247,40479,23615,25423,32834,23421,21870,38218,38221,28037,24744,26592,29406,20957,23425,33236,33237,33238,33239,33240,33241,33242,33243,33244,33245,33246,33247,33248,33249,33250,33252,33253,33254,33256,33257,33259,33262,33263,33264,33265,33266,33269,33270,33271,33272,33273,33274,33277,33279,33283,33287,33288,33289,33290,33291,33294,33295,33297,33299,33301,33302,33303,33304,33305,33306,33309,33312,33316,33317,33318,33319,33321,33326,33330,33338,33340,33341,33343,33344,33345,33346,33347,33349,33350,33352,33354,33356,33357,33358,33360,33361,33362,33363,33364,33365,33366,33367,33369,33371,33372,33373,33374,33376,33377,33378,33379,33380,33381,33382,33383,33385,25319,27870,29275,25197,38062,32445,33043,27987,20892,24324,22900,21162,24594,22899,26262,34384,30111,25386,25062,31983,35834,21734,27431,40485,27572,34261,21589,20598,27812,21866,36276,29228,24085,24597,29750,25293,25490,29260,24472,28227,27966,25856,28504,30424,30928,30460,30036,21028,21467,20051,24222,26049,32810,32982,25243,21638,21032,28846,34957,36305,27873,21624,32986,22521,35060,36180,38506,37197,20329,27803,21943,30406,30768,25256,28921,28558,24429,34028,26842,30844,31735,33192,26379,40527,25447,30896,22383,30738,38713,25209,25259,21128,29749,27607,33386,33387,33388,33389,33393,33397,33398,33399,33400,33403,33404,33408,33409,33411,33413,33414,33415,33417,33420,33424,33427,33428,33429,33430,33434,33435,33438,33440,33442,33443,33447,33458,33461,33462,33466,33467,33468,33471,33472,33474,33475,33477,33478,33481,33488,33494,33497,33498,33501,33506,33511,33512,33513,33514,33516,33517,33518,33520,33522,33523,33525,33526,33528,33530,33532,33533,33534,33535,33536,33546,33547,33549,33552,33554,33555,33558,33560,33561,33565,33566,33567,33568,33569,33570,33571,33572,33573,33574,33577,33578,33582,33584,33586,33591,33595,33597,21860,33086,30130,30382,21305,30174,20731,23617,35692,31687,20559,29255,39575,39128,28418,29922,31080,25735,30629,25340,39057,36139,21697,32856,20050,22378,33529,33805,24179,20973,29942,35780,23631,22369,27900,39047,23110,30772,39748,36843,31893,21078,25169,38138,20166,33670,33889,33769,33970,22484,26420,22275,26222,28006,35889,26333,28689,26399,27450,26646,25114,22971,19971,20932,28422,26578,27791,20854,26827,22855,27495,30054,23822,33040,40784,26071,31048,31041,39569,36215,23682,20062,20225,21551,22865,30732,22120,27668,36804,24323,27773,27875,35755,25488,33598,33599,33601,33602,33604,33605,33608,33610,33611,33612,33613,33614,33619,33621,33622,33623,33624,33625,33629,33634,33648,33649,33650,33651,33652,33653,33654,33657,33658,33662,33663,33664,33665,33666,33667,33668,33671,33672,33674,33675,33676,33677,33679,33680,33681,33684,33685,33686,33687,33689,33690,33693,33695,33697,33698,33699,33700,33701,33702,33703,33708,33709,33710,33711,33717,33723,33726,33727,33730,33731,33732,33734,33736,33737,33739,33741,33742,33744,33745,33746,33747,33749,33751,33753,33754,33755,33758,33762,33763,33764,33766,33767,33768,33771,33772,33773,24688,27965,29301,25190,38030,38085,21315,36801,31614,20191,35878,20094,40660,38065,38067,21069,28508,36963,27973,35892,22545,23884,27424,27465,26538,21595,33108,32652,22681,34103,24378,25250,27207,38201,25970,24708,26725,30631,20052,20392,24039,38808,25772,32728,23789,20431,31373,20999,33540,19988,24623,31363,38054,20405,20146,31206,29748,21220,33465,25810,31165,23517,27777,38738,36731,27682,20542,21375,28165,25806,26228,27696,24773,39031,35831,24198,29756,31351,31179,19992,37041,29699,27714,22234,37195,27845,36235,21306,34502,26354,36527,23624,39537,28192,33774,33775,33779,33780,33781,33782,33783,33786,33787,33788,33790,33791,33792,33794,33797,33799,33800,33801,33802,33808,33810,33811,33812,33813,33814,33815,33817,33818,33819,33822,33823,33824,33825,33826,33827,33833,33834,33835,33836,33837,33838,33839,33840,33842,33843,33844,33845,33846,33847,33849,33850,33851,33854,33855,33856,33857,33858,33859,33860,33861,33863,33864,33865,33866,33867,33868,33869,33870,33871,33872,33874,33875,33876,33877,33878,33880,33885,33886,33887,33888,33890,33892,33893,33894,33895,33896,33898,33902,33903,33904,33906,33908,33911,33913,33915,33916,21462,23094,40843,36259,21435,22280,39079,26435,37275,27849,20840,30154,25331,29356,21048,21149,32570,28820,30264,21364,40522,27063,30830,38592,35033,32676,28982,29123,20873,26579,29924,22756,25880,22199,35753,39286,25200,32469,24825,28909,22764,20161,20154,24525,38887,20219,35748,20995,22922,32427,25172,20173,26085,25102,33592,33993,33635,34701,29076,28342,23481,32466,20887,25545,26580,32905,33593,34837,20754,23418,22914,36785,20083,27741,20837,35109,36719,38446,34122,29790,38160,38384,28070,33509,24369,25746,27922,33832,33134,40131,22622,36187,19977,21441,33917,33918,33919,33920,33921,33923,33924,33925,33926,33930,33933,33935,33936,33937,33938,33939,33940,33941,33942,33944,33946,33947,33949,33950,33951,33952,33954,33955,33956,33957,33958,33959,33960,33961,33962,33963,33964,33965,33966,33968,33969,33971,33973,33974,33975,33979,33980,33982,33984,33986,33987,33989,33990,33991,33992,33995,33996,33998,33999,34002,34004,34005,34007,34008,34009,34010,34011,34012,34014,34017,34018,34020,34023,34024,34025,34026,34027,34029,34030,34031,34033,34034,34035,34036,34037,34038,34039,34040,34041,34042,34043,34045,34046,34048,34049,34050,20254,25955,26705,21971,20007,25620,39578,25195,23234,29791,33394,28073,26862,20711,33678,30722,26432,21049,27801,32433,20667,21861,29022,31579,26194,29642,33515,26441,23665,21024,29053,34923,38378,38485,25797,36193,33203,21892,27733,25159,32558,22674,20260,21830,36175,26188,19978,23578,35059,26786,25422,31245,28903,33421,21242,38902,23569,21736,37045,32461,22882,36170,34503,33292,33293,36198,25668,23556,24913,28041,31038,35774,30775,30003,21627,20280,36523,28145,23072,32453,31070,27784,23457,23158,29978,32958,24910,28183,22768,29983,29989,29298,21319,32499,34051,34052,34053,34054,34055,34056,34057,34058,34059,34061,34062,34063,34064,34066,34068,34069,34070,34072,34073,34075,34076,34077,34078,34080,34082,34083,34084,34085,34086,34087,34088,34089,34090,34093,34094,34095,34096,34097,34098,34099,34100,34101,34102,34110,34111,34112,34113,34114,34116,34117,34118,34119,34123,34124,34125,34126,34127,34128,34129,34130,34131,34132,34133,34135,34136,34138,34139,34140,34141,34143,34144,34145,34146,34147,34149,34150,34151,34153,34154,34155,34156,34157,34158,34159,34160,34161,34163,34165,34166,34167,34168,34172,34173,34175,34176,34177,30465,30427,21097,32988,22307,24072,22833,29422,26045,28287,35799,23608,34417,21313,30707,25342,26102,20160,39135,34432,23454,35782,21490,30690,20351,23630,39542,22987,24335,31034,22763,19990,26623,20107,25325,35475,36893,21183,26159,21980,22124,36866,20181,20365,37322,39280,27663,24066,24643,23460,35270,35797,25910,25163,39318,23432,23551,25480,21806,21463,30246,20861,34092,26530,26803,27530,25234,36755,21460,33298,28113,30095,20070,36174,23408,29087,34223,26257,26329,32626,34560,40653,40736,23646,26415,36848,26641,26463,25101,31446,22661,24246,25968,28465,34178,34179,34182,34184,34185,34186,34187,34188,34189,34190,34192,34193,34194,34195,34196,34197,34198,34199,34200,34201,34202,34205,34206,34207,34208,34209,34210,34211,34213,34214,34215,34217,34219,34220,34221,34225,34226,34227,34228,34229,34230,34232,34234,34235,34236,34237,34238,34239,34240,34242,34243,34244,34245,34246,34247,34248,34250,34251,34252,34253,34254,34257,34258,34260,34262,34263,34264,34265,34266,34267,34269,34270,34271,34272,34273,34274,34275,34277,34278,34279,34280,34282,34283,34284,34285,34286,34287,34288,34289,34290,34291,34292,34293,34294,34295,34296,24661,21047,32781,25684,34928,29993,24069,26643,25332,38684,21452,29245,35841,27700,30561,31246,21550,30636,39034,33308,35828,30805,26388,28865,26031,25749,22070,24605,31169,21496,19997,27515,32902,23546,21987,22235,20282,20284,39282,24051,26494,32824,24578,39042,36865,23435,35772,35829,25628,33368,25822,22013,33487,37221,20439,32032,36895,31903,20723,22609,28335,23487,35785,32899,37240,33948,31639,34429,38539,38543,32485,39635,30862,23681,31319,36930,38567,31071,23385,25439,31499,34001,26797,21766,32553,29712,32034,38145,25152,22604,20182,23427,22905,22612,34297,34298,34300,34301,34302,34304,34305,34306,34307,34308,34310,34311,34312,34313,34314,34315,34316,34317,34318,34319,34320,34322,34323,34324,34325,34327,34328,34329,34330,34331,34332,34333,34334,34335,34336,34337,34338,34339,34340,34341,34342,34344,34346,34347,34348,34349,34350,34351,34352,34353,34354,34355,34356,34357,34358,34359,34361,34362,34363,34365,34366,34367,34368,34369,34370,34371,34372,34373,34374,34375,34376,34377,34378,34379,34380,34386,34387,34389,34390,34391,34392,34393,34395,34396,34397,34399,34400,34401,34403,34404,34405,34406,34407,34408,34409,34410,29549,25374,36427,36367,32974,33492,25260,21488,27888,37214,22826,24577,27760,22349,25674,36138,30251,28393,22363,27264,30192,28525,35885,35848,22374,27631,34962,30899,25506,21497,28845,27748,22616,25642,22530,26848,33179,21776,31958,20504,36538,28108,36255,28907,25487,28059,28372,32486,33796,26691,36867,28120,38518,35752,22871,29305,34276,33150,30140,35466,26799,21076,36386,38161,25552,39064,36420,21884,20307,26367,22159,24789,28053,21059,23625,22825,28155,22635,30000,29980,24684,33300,33094,25361,26465,36834,30522,36339,36148,38081,24086,21381,21548,28867,34413,34415,34416,34418,34419,34420,34421,34422,34423,34424,34435,34436,34437,34438,34439,34440,34441,34446,34447,34448,34449,34450,34452,34454,34455,34456,34457,34458,34459,34462,34463,34464,34465,34466,34469,34470,34475,34477,34478,34482,34483,34487,34488,34489,34491,34492,34493,34494,34495,34497,34498,34499,34501,34504,34508,34509,34514,34515,34517,34518,34519,34522,34524,34525,34528,34529,34530,34531,34533,34534,34535,34536,34538,34539,34540,34543,34549,34550,34551,34554,34555,34556,34557,34559,34561,34564,34565,34566,34571,34572,34574,34575,34576,34577,34580,34582,27712,24311,20572,20141,24237,25402,33351,36890,26704,37230,30643,21516,38108,24420,31461,26742,25413,31570,32479,30171,20599,25237,22836,36879,20984,31171,31361,22270,24466,36884,28034,23648,22303,21520,20820,28237,22242,25512,39059,33151,34581,35114,36864,21534,23663,33216,25302,25176,33073,40501,38464,39534,39548,26925,22949,25299,21822,25366,21703,34521,27964,23043,29926,34972,27498,22806,35916,24367,28286,29609,39037,20024,28919,23436,30871,25405,26202,30358,24779,23451,23113,19975,33109,27754,29579,20129,26505,32593,24448,26106,26395,24536,22916,23041,34585,34587,34589,34591,34592,34596,34598,34599,34600,34602,34603,34604,34605,34607,34608,34610,34611,34613,34614,34616,34617,34618,34620,34621,34624,34625,34626,34627,34628,34629,34630,34634,34635,34637,34639,34640,34641,34642,34644,34645,34646,34648,34650,34651,34652,34653,34654,34655,34657,34658,34662,34663,34664,34665,34666,34667,34668,34669,34671,34673,34674,34675,34677,34679,34680,34681,34682,34687,34688,34689,34692,34694,34695,34697,34698,34700,34702,34703,34704,34705,34706,34708,34709,34710,34712,34713,34714,34715,34716,34717,34718,34720,34721,34722,34723,34724,24013,24494,21361,38886,36829,26693,22260,21807,24799,20026,28493,32500,33479,33806,22996,20255,20266,23614,32428,26410,34074,21619,30031,32963,21890,39759,20301,28205,35859,23561,24944,21355,30239,28201,34442,25991,38395,32441,21563,31283,32010,38382,21985,32705,29934,25373,34583,28065,31389,25105,26017,21351,25569,27779,24043,21596,38056,20044,27745,35820,23627,26080,33436,26791,21566,21556,27595,27494,20116,25410,21320,33310,20237,20398,22366,25098,38654,26212,29289,21247,21153,24735,35823,26132,29081,26512,35199,30802,30717,26224,22075,21560,38177,29306,34725,34726,34727,34729,34730,34734,34736,34737,34738,34740,34742,34743,34744,34745,34747,34748,34750,34751,34753,34754,34755,34756,34757,34759,34760,34761,34764,34765,34766,34767,34768,34772,34773,34774,34775,34776,34777,34778,34780,34781,34782,34783,34785,34786,34787,34788,34790,34791,34792,34793,34795,34796,34797,34799,34800,34801,34802,34803,34804,34805,34806,34807,34808,34810,34811,34812,34813,34815,34816,34817,34818,34820,34821,34822,34823,34824,34825,34827,34828,34829,34830,34831,34832,34833,34834,34836,34839,34840,34841,34842,34844,34845,34846,34847,34848,34851,31232,24687,24076,24713,33181,22805,24796,29060,28911,28330,27728,29312,27268,34989,24109,20064,23219,21916,38115,27927,31995,38553,25103,32454,30606,34430,21283,38686,36758,26247,23777,20384,29421,19979,21414,22799,21523,25472,38184,20808,20185,40092,32420,21688,36132,34900,33335,38386,28046,24358,23244,26174,38505,29616,29486,21439,33146,39301,32673,23466,38519,38480,32447,30456,21410,38262,39321,31665,35140,28248,20065,32724,31077,35814,24819,21709,20139,39033,24055,27233,20687,21521,35937,33831,30813,38660,21066,21742,22179,38144,28040,23477,28102,26195,34852,34853,34854,34855,34856,34857,34858,34859,34860,34861,34862,34863,34864,34865,34867,34868,34869,34870,34871,34872,34874,34875,34877,34878,34879,34881,34882,34883,34886,34887,34888,34889,34890,34891,34894,34895,34896,34897,34898,34899,34901,34902,34904,34906,34907,34908,34909,34910,34911,34912,34918,34919,34922,34925,34927,34929,34931,34932,34933,34934,34936,34937,34938,34939,34940,34944,34947,34950,34951,34953,34954,34956,34958,34959,34960,34961,34963,34964,34965,34967,34968,34969,34970,34971,34973,34974,34975,34976,34977,34979,34981,34982,34983,34984,34985,34986,23567,23389,26657,32918,21880,31505,25928,26964,20123,27463,34638,38795,21327,25375,25658,37034,26012,32961,35856,20889,26800,21368,34809,25032,27844,27899,35874,23633,34218,33455,38156,27427,36763,26032,24571,24515,20449,34885,26143,33125,29481,24826,20852,21009,22411,24418,37026,34892,37266,24184,26447,24615,22995,20804,20982,33016,21256,27769,38596,29066,20241,20462,32670,26429,21957,38152,31168,34966,32483,22687,25100,38656,34394,22040,39035,24464,35768,33988,37207,21465,26093,24207,30044,24676,32110,23167,32490,32493,36713,21927,23459,24748,26059,29572,34988,34990,34991,34992,34994,34995,34996,34997,34998,35000,35001,35002,35003,35005,35006,35007,35008,35011,35012,35015,35016,35018,35019,35020,35021,35023,35024,35025,35027,35030,35031,35034,35035,35036,35037,35038,35040,35041,35046,35047,35049,35050,35051,35052,35053,35054,35055,35058,35061,35062,35063,35066,35067,35069,35071,35072,35073,35075,35076,35077,35078,35079,35080,35081,35083,35084,35085,35086,35087,35089,35092,35093,35094,35095,35096,35100,35101,35102,35103,35104,35106,35107,35108,35110,35111,35112,35113,35116,35117,35118,35119,35121,35122,35123,35125,35127,36873,30307,30505,32474,38772,34203,23398,31348,38634,34880,21195,29071,24490,26092,35810,23547,39535,24033,27529,27739,35757,35759,36874,36805,21387,25276,40486,40493,21568,20011,33469,29273,34460,23830,34905,28079,38597,21713,20122,35766,28937,21693,38409,28895,28153,30416,20005,30740,34578,23721,24310,35328,39068,38414,28814,27839,22852,25513,30524,34893,28436,33395,22576,29141,21388,30746,38593,21761,24422,28976,23476,35866,39564,27523,22830,40495,31207,26472,25196,20335,30113,32650,27915,38451,27687,20208,30162,20859,26679,28478,36992,33136,22934,29814,35128,35129,35130,35131,35132,35133,35134,35135,35136,35138,35139,35141,35142,35143,35144,35145,35146,35147,35148,35149,35150,35151,35152,35153,35154,35155,35156,35157,35158,35159,35160,35161,35162,35163,35164,35165,35168,35169,35170,35171,35172,35173,35175,35176,35177,35178,35179,35180,35181,35182,35183,35184,35185,35186,35187,35188,35189,35190,35191,35192,35193,35194,35196,35197,35198,35200,35202,35204,35205,35207,35208,35209,35210,35211,35212,35213,35214,35215,35216,35217,35218,35219,35220,35221,35222,35223,35224,35225,35226,35227,35228,35229,35230,35231,35232,35233,25671,23591,36965,31377,35875,23002,21676,33280,33647,35201,32768,26928,22094,32822,29239,37326,20918,20063,39029,25494,19994,21494,26355,33099,22812,28082,19968,22777,21307,25558,38129,20381,20234,34915,39056,22839,36951,31227,20202,33008,30097,27778,23452,23016,24413,26885,34433,20506,24050,20057,30691,20197,33402,25233,26131,37009,23673,20159,24441,33222,36920,32900,30123,20134,35028,24847,27589,24518,20041,30410,28322,35811,35758,35850,35793,24322,32764,32716,32462,33589,33643,22240,27575,38899,38452,23035,21535,38134,28139,23493,39278,23609,24341,38544,35234,35235,35236,35237,35238,35239,35240,35241,35242,35243,35244,35245,35246,35247,35248,35249,35250,35251,35252,35253,35254,35255,35256,35257,35258,35259,35260,35261,35262,35263,35264,35267,35277,35283,35284,35285,35287,35288,35289,35291,35293,35295,35296,35297,35298,35300,35303,35304,35305,35306,35308,35309,35310,35312,35313,35314,35316,35317,35318,35319,35320,35321,35322,35323,35324,35325,35326,35327,35329,35330,35331,35332,35333,35334,35336,35337,35338,35339,35340,35341,35342,35343,35344,35345,35346,35347,35348,35349,35350,35351,35352,35353,35354,35355,35356,35357,21360,33521,27185,23156,40560,24212,32552,33721,33828,33829,33639,34631,36814,36194,30408,24433,39062,30828,26144,21727,25317,20323,33219,30152,24248,38605,36362,34553,21647,27891,28044,27704,24703,21191,29992,24189,20248,24736,24551,23588,30001,37038,38080,29369,27833,28216,37193,26377,21451,21491,20305,37321,35825,21448,24188,36802,28132,20110,30402,27014,34398,24858,33286,20313,20446,36926,40060,24841,28189,28180,38533,20104,23089,38632,19982,23679,31161,23431,35821,32701,29577,22495,33419,37057,21505,36935,21947,23786,24481,24840,27442,29425,32946,35465,35358,35359,35360,35361,35362,35363,35364,35365,35366,35367,35368,35369,35370,35371,35372,35373,35374,35375,35376,35377,35378,35379,35380,35381,35382,35383,35384,35385,35386,35387,35388,35389,35391,35392,35393,35394,35395,35396,35397,35398,35399,35401,35402,35403,35404,35405,35406,35407,35408,35409,35410,35411,35412,35413,35414,35415,35416,35417,35418,35419,35420,35421,35422,35423,35424,35425,35426,35427,35428,35429,35430,35431,35432,35433,35434,35435,35436,35437,35438,35439,35440,35441,35442,35443,35444,35445,35446,35447,35448,35450,35451,35452,35453,35454,35455,35456,28020,23507,35029,39044,35947,39533,40499,28170,20900,20803,22435,34945,21407,25588,36757,22253,21592,22278,29503,28304,32536,36828,33489,24895,24616,38498,26352,32422,36234,36291,38053,23731,31908,26376,24742,38405,32792,20113,37095,21248,38504,20801,36816,34164,37213,26197,38901,23381,21277,30776,26434,26685,21705,28798,23472,36733,20877,22312,21681,25874,26242,36190,36163,33039,33900,36973,31967,20991,34299,26531,26089,28577,34468,36481,22122,36896,30338,28790,29157,36131,25321,21017,27901,36156,24590,22686,24974,26366,36192,25166,21939,28195,26413,36711,35457,35458,35459,35460,35461,35462,35463,35464,35467,35468,35469,35470,35471,35472,35473,35474,35476,35477,35478,35479,35480,35481,35482,35483,35484,35485,35486,35487,35488,35489,35490,35491,35492,35493,35494,35495,35496,35497,35498,35499,35500,35501,35502,35503,35504,35505,35506,35507,35508,35509,35510,35511,35512,35513,35514,35515,35516,35517,35518,35519,35520,35521,35522,35523,35524,35525,35526,35527,35528,35529,35530,35531,35532,35533,35534,35535,35536,35537,35538,35539,35540,35541,35542,35543,35544,35545,35546,35547,35548,35549,35550,35551,35552,35553,35554,35555,38113,38392,30504,26629,27048,21643,20045,28856,35784,25688,25995,23429,31364,20538,23528,30651,27617,35449,31896,27838,30415,26025,36759,23853,23637,34360,26632,21344,25112,31449,28251,32509,27167,31456,24432,28467,24352,25484,28072,26454,19976,24080,36134,20183,32960,30260,38556,25307,26157,25214,27836,36213,29031,32617,20806,32903,21484,36974,25240,21746,34544,36761,32773,38167,34071,36825,27993,29645,26015,30495,29956,30759,33275,36126,38024,20390,26517,30137,35786,38663,25391,38215,38453,33976,25379,30529,24449,29424,20105,24596,25972,25327,27491,25919,35556,35557,35558,35559,35560,35561,35562,35563,35564,35565,35566,35567,35568,35569,35570,35571,35572,35573,35574,35575,35576,35577,35578,35579,35580,35581,35582,35583,35584,35585,35586,35587,35588,35589,35590,35592,35593,35594,35595,35596,35597,35598,35599,35600,35601,35602,35603,35604,35605,35606,35607,35608,35609,35610,35611,35612,35613,35614,35615,35616,35617,35618,35619,35620,35621,35623,35624,35625,35626,35627,35628,35629,35630,35631,35632,35633,35634,35635,35636,35637,35638,35639,35640,35641,35642,35643,35644,35645,35646,35647,35648,35649,35650,35651,35652,35653,24103,30151,37073,35777,33437,26525,25903,21553,34584,30693,32930,33026,27713,20043,32455,32844,30452,26893,27542,25191,20540,20356,22336,25351,27490,36286,21482,26088,32440,24535,25370,25527,33267,33268,32622,24092,23769,21046,26234,31209,31258,36136,28825,30164,28382,27835,31378,20013,30405,24544,38047,34935,32456,31181,32959,37325,20210,20247,33311,21608,24030,27954,35788,31909,36724,32920,24090,21650,30385,23449,26172,39588,29664,26666,34523,26417,29482,35832,35803,36880,31481,28891,29038,25284,30633,22065,20027,33879,26609,21161,34496,36142,38136,31569,35654,35655,35656,35657,35658,35659,35660,35661,35662,35663,35664,35665,35666,35667,35668,35669,35670,35671,35672,35673,35674,35675,35676,35677,35678,35679,35680,35681,35682,35683,35684,35685,35687,35688,35689,35690,35691,35693,35694,35695,35696,35697,35698,35699,35700,35701,35702,35703,35704,35705,35706,35707,35708,35709,35710,35711,35712,35713,35714,35715,35716,35717,35718,35719,35720,35721,35722,35723,35724,35725,35726,35727,35728,35729,35730,35731,35732,35733,35734,35735,35736,35737,35738,35739,35740,35741,35742,35743,35756,35761,35771,35783,35792,35818,35849,35870,20303,27880,31069,39547,25235,29226,25341,19987,30742,36716,25776,36186,31686,26729,24196,35013,22918,25758,22766,29366,26894,38181,36861,36184,22368,32512,35846,20934,25417,25305,21331,26700,29730,33537,37196,21828,30528,28796,27978,20857,21672,36164,23039,28363,28100,23388,32043,20180,31869,28371,23376,33258,28173,23383,39683,26837,36394,23447,32508,24635,32437,37049,36208,22863,25549,31199,36275,21330,26063,31062,35781,38459,32452,38075,32386,22068,37257,26368,32618,23562,36981,26152,24038,20304,26590,20570,20316,22352,24231,59408,59409,59410,59411,59412,35896,35897,35898,35899,35900,35901,35902,35903,35904,35906,35907,35908,35909,35912,35914,35915,35917,35918,35919,35920,35921,35922,35923,35924,35926,35927,35928,35929,35931,35932,35933,35934,35935,35936,35939,35940,35941,35942,35943,35944,35945,35948,35949,35950,35951,35952,35953,35954,35956,35957,35958,35959,35963,35964,35965,35966,35967,35968,35969,35971,35972,35974,35975,35976,35979,35981,35982,35983,35984,35985,35986,35987,35989,35990,35991,35993,35994,35995,35996,35997,35998,35999,36000,36001,36002,36003,36004,36005,36006,36007,36008,36009,36010,36011,36012,36013,20109,19980,20800,19984,24319,21317,19989,20120,19998,39730,23404,22121,20008,31162,20031,21269,20039,22829,29243,21358,27664,22239,32996,39319,27603,30590,40727,20022,20127,40720,20060,20073,20115,33416,23387,21868,22031,20164,21389,21405,21411,21413,21422,38757,36189,21274,21493,21286,21294,21310,36188,21350,21347,20994,21000,21006,21037,21043,21055,21056,21068,21086,21089,21084,33967,21117,21122,21121,21136,21139,20866,32596,20155,20163,20169,20162,20200,20193,20203,20190,20251,20211,20258,20324,20213,20261,20263,20233,20267,20318,20327,25912,20314,20317,36014,36015,36016,36017,36018,36019,36020,36021,36022,36023,36024,36025,36026,36027,36028,36029,36030,36031,36032,36033,36034,36035,36036,36037,36038,36039,36040,36041,36042,36043,36044,36045,36046,36047,36048,36049,36050,36051,36052,36053,36054,36055,36056,36057,36058,36059,36060,36061,36062,36063,36064,36065,36066,36067,36068,36069,36070,36071,36072,36073,36074,36075,36076,36077,36078,36079,36080,36081,36082,36083,36084,36085,36086,36087,36088,36089,36090,36091,36092,36093,36094,36095,36096,36097,36098,36099,36100,36101,36102,36103,36104,36105,36106,36107,36108,36109,20319,20311,20274,20285,20342,20340,20369,20361,20355,20367,20350,20347,20394,20348,20396,20372,20454,20456,20458,20421,20442,20451,20444,20433,20447,20472,20521,20556,20467,20524,20495,20526,20525,20478,20508,20492,20517,20520,20606,20547,20565,20552,20558,20588,20603,20645,20647,20649,20666,20694,20742,20717,20716,20710,20718,20743,20747,20189,27709,20312,20325,20430,40864,27718,31860,20846,24061,40649,39320,20865,22804,21241,21261,35335,21264,20971,22809,20821,20128,20822,20147,34926,34980,20149,33044,35026,31104,23348,34819,32696,20907,20913,20925,20924,36110,36111,36112,36113,36114,36115,36116,36117,36118,36119,36120,36121,36122,36123,36124,36128,36177,36178,36183,36191,36197,36200,36201,36202,36204,36206,36207,36209,36210,36216,36217,36218,36219,36220,36221,36222,36223,36224,36226,36227,36230,36231,36232,36233,36236,36237,36238,36239,36240,36242,36243,36245,36246,36247,36248,36249,36250,36251,36252,36253,36254,36256,36257,36258,36260,36261,36262,36263,36264,36265,36266,36267,36268,36269,36270,36271,36272,36274,36278,36279,36281,36283,36285,36288,36289,36290,36293,36295,36296,36297,36298,36301,36304,36306,36307,36308,20935,20886,20898,20901,35744,35750,35751,35754,35764,35765,35767,35778,35779,35787,35791,35790,35794,35795,35796,35798,35800,35801,35804,35807,35808,35812,35816,35817,35822,35824,35827,35830,35833,35836,35839,35840,35842,35844,35847,35852,35855,35857,35858,35860,35861,35862,35865,35867,35864,35869,35871,35872,35873,35877,35879,35882,35883,35886,35887,35890,35891,35893,35894,21353,21370,38429,38434,38433,38449,38442,38461,38460,38466,38473,38484,38495,38503,38508,38514,38516,38536,38541,38551,38576,37015,37019,37021,37017,37036,37025,37044,37043,37046,37050,36309,36312,36313,36316,36320,36321,36322,36325,36326,36327,36329,36333,36334,36336,36337,36338,36340,36342,36348,36350,36351,36352,36353,36354,36355,36356,36358,36359,36360,36363,36365,36366,36368,36369,36370,36371,36373,36374,36375,36376,36377,36378,36379,36380,36384,36385,36388,36389,36390,36391,36392,36395,36397,36400,36402,36403,36404,36406,36407,36408,36411,36412,36414,36415,36419,36421,36422,36428,36429,36430,36431,36432,36435,36436,36437,36438,36439,36440,36442,36443,36444,36445,36446,36447,36448,36449,36450,36451,36452,36453,36455,36456,36458,36459,36462,36465,37048,37040,37071,37061,37054,37072,37060,37063,37075,37094,37090,37084,37079,37083,37099,37103,37118,37124,37154,37150,37155,37169,37167,37177,37187,37190,21005,22850,21154,21164,21165,21182,21759,21200,21206,21232,21471,29166,30669,24308,20981,20988,39727,21430,24321,30042,24047,22348,22441,22433,22654,22716,22725,22737,22313,22316,22314,22323,22329,22318,22319,22364,22331,22338,22377,22405,22379,22406,22396,22395,22376,22381,22390,22387,22445,22436,22412,22450,22479,22439,22452,22419,22432,22485,22488,22490,22489,22482,22456,22516,22511,22520,22500,22493,36467,36469,36471,36472,36473,36474,36475,36477,36478,36480,36482,36483,36484,36486,36488,36489,36490,36491,36492,36493,36494,36497,36498,36499,36501,36502,36503,36504,36505,36506,36507,36509,36511,36512,36513,36514,36515,36516,36517,36518,36519,36520,36521,36522,36525,36526,36528,36529,36531,36532,36533,36534,36535,36536,36537,36539,36540,36541,36542,36543,36544,36545,36546,36547,36548,36549,36550,36551,36552,36553,36554,36555,36556,36557,36559,36560,36561,36562,36563,36564,36565,36566,36567,36568,36569,36570,36571,36572,36573,36574,36575,36576,36577,36578,36579,36580,22539,22541,22525,22509,22528,22558,22553,22596,22560,22629,22636,22657,22665,22682,22656,39336,40729,25087,33401,33405,33407,33423,33418,33448,33412,33422,33425,33431,33433,33451,33464,33470,33456,33480,33482,33507,33432,33463,33454,33483,33484,33473,33449,33460,33441,33450,33439,33476,33486,33444,33505,33545,33527,33508,33551,33543,33500,33524,33490,33496,33548,33531,33491,33553,33562,33542,33556,33557,33504,33493,33564,33617,33627,33628,33544,33682,33596,33588,33585,33691,33630,33583,33615,33607,33603,33631,33600,33559,33632,33581,33594,33587,33638,33637,36581,36582,36583,36584,36585,36586,36587,36588,36589,36590,36591,36592,36593,36594,36595,36596,36597,36598,36599,36600,36601,36602,36603,36604,36605,36606,36607,36608,36609,36610,36611,36612,36613,36614,36615,36616,36617,36618,36619,36620,36621,36622,36623,36624,36625,36626,36627,36628,36629,36630,36631,36632,36633,36634,36635,36636,36637,36638,36639,36640,36641,36642,36643,36644,36645,36646,36647,36648,36649,36650,36651,36652,36653,36654,36655,36656,36657,36658,36659,36660,36661,36662,36663,36664,36665,36666,36667,36668,36669,36670,36671,36672,36673,36674,36675,36676,33640,33563,33641,33644,33642,33645,33646,33712,33656,33715,33716,33696,33706,33683,33692,33669,33660,33718,33705,33661,33720,33659,33688,33694,33704,33722,33724,33729,33793,33765,33752,22535,33816,33803,33757,33789,33750,33820,33848,33809,33798,33748,33759,33807,33795,33784,33785,33770,33733,33728,33830,33776,33761,33884,33873,33882,33881,33907,33927,33928,33914,33929,33912,33852,33862,33897,33910,33932,33934,33841,33901,33985,33997,34000,34022,33981,34003,33994,33983,33978,34016,33953,33977,33972,33943,34021,34019,34060,29965,34104,34032,34105,34079,34106,36677,36678,36679,36680,36681,36682,36683,36684,36685,36686,36687,36688,36689,36690,36691,36692,36693,36694,36695,36696,36697,36698,36699,36700,36701,36702,36703,36704,36705,36706,36707,36708,36709,36714,36736,36748,36754,36765,36768,36769,36770,36772,36773,36774,36775,36778,36780,36781,36782,36783,36786,36787,36788,36789,36791,36792,36794,36795,36796,36799,36800,36803,36806,36809,36810,36811,36812,36813,36815,36818,36822,36823,36826,36832,36833,36835,36839,36844,36847,36849,36850,36852,36853,36854,36858,36859,36860,36862,36863,36871,36872,36876,36878,36883,36885,36888,34134,34107,34047,34044,34137,34120,34152,34148,34142,34170,30626,34115,34162,34171,34212,34216,34183,34191,34169,34222,34204,34181,34233,34231,34224,34259,34241,34268,34303,34343,34309,34345,34326,34364,24318,24328,22844,22849,32823,22869,22874,22872,21263,23586,23589,23596,23604,25164,25194,25247,25275,25290,25306,25303,25326,25378,25334,25401,25419,25411,25517,25590,25457,25466,25486,25524,25453,25516,25482,25449,25518,25532,25586,25592,25568,25599,25540,25566,25550,25682,25542,25534,25669,25665,25611,25627,25632,25612,25638,25633,25694,25732,25709,25750,36889,36892,36899,36900,36901,36903,36904,36905,36906,36907,36908,36912,36913,36914,36915,36916,36919,36921,36922,36925,36927,36928,36931,36933,36934,36936,36937,36938,36939,36940,36942,36948,36949,36950,36953,36954,36956,36957,36958,36959,36960,36961,36964,36966,36967,36969,36970,36971,36972,36975,36976,36977,36978,36979,36982,36983,36984,36985,36986,36987,36988,36990,36993,36996,36997,36998,36999,37001,37002,37004,37005,37006,37007,37008,37010,37012,37014,37016,37018,37020,37022,37023,37024,37028,37029,37031,37032,37033,37035,37037,37042,37047,37052,37053,37055,37056,25722,25783,25784,25753,25786,25792,25808,25815,25828,25826,25865,25893,25902,24331,24530,29977,24337,21343,21489,21501,21481,21480,21499,21522,21526,21510,21579,21586,21587,21588,21590,21571,21537,21591,21593,21539,21554,21634,21652,21623,21617,21604,21658,21659,21636,21622,21606,21661,21712,21677,21698,21684,21714,21671,21670,21715,21716,21618,21667,21717,21691,21695,21708,21721,21722,21724,21673,21674,21668,21725,21711,21726,21787,21735,21792,21757,21780,21747,21794,21795,21775,21777,21799,21802,21863,21903,21941,21833,21869,21825,21845,21823,21840,21820,37058,37059,37062,37064,37065,37067,37068,37069,37074,37076,37077,37078,37080,37081,37082,37086,37087,37088,37091,37092,37093,37097,37098,37100,37102,37104,37105,37106,37107,37109,37110,37111,37113,37114,37115,37116,37119,37120,37121,37123,37125,37126,37127,37128,37129,37130,37131,37132,37133,37134,37135,37136,37137,37138,37139,37140,37141,37142,37143,37144,37146,37147,37148,37149,37151,37152,37153,37156,37157,37158,37159,37160,37161,37162,37163,37164,37165,37166,37168,37170,37171,37172,37173,37174,37175,37176,37178,37179,37180,37181,37182,37183,37184,37185,37186,37188,21815,21846,21877,21878,21879,21811,21808,21852,21899,21970,21891,21937,21945,21896,21889,21919,21886,21974,21905,21883,21983,21949,21950,21908,21913,21994,22007,21961,22047,21969,21995,21996,21972,21990,21981,21956,21999,21989,22002,22003,21964,21965,21992,22005,21988,36756,22046,22024,22028,22017,22052,22051,22014,22016,22055,22061,22104,22073,22103,22060,22093,22114,22105,22108,22092,22100,22150,22116,22129,22123,22139,22140,22149,22163,22191,22228,22231,22237,22241,22261,22251,22265,22271,22276,22282,22281,22300,24079,24089,24084,24081,24113,24123,24124,37189,37191,37192,37201,37203,37204,37205,37206,37208,37209,37211,37212,37215,37216,37222,37223,37224,37227,37229,37235,37242,37243,37244,37248,37249,37250,37251,37252,37254,37256,37258,37262,37263,37267,37268,37269,37270,37271,37272,37273,37276,37277,37278,37279,37280,37281,37284,37285,37286,37287,37288,37289,37291,37292,37296,37297,37298,37299,37302,37303,37304,37305,37307,37308,37309,37310,37311,37312,37313,37314,37315,37316,37317,37318,37320,37323,37328,37330,37331,37332,37333,37334,37335,37336,37337,37338,37339,37341,37342,37343,37344,37345,37346,37347,37348,37349,24119,24132,24148,24155,24158,24161,23692,23674,23693,23696,23702,23688,23704,23705,23697,23706,23708,23733,23714,23741,23724,23723,23729,23715,23745,23735,23748,23762,23780,23755,23781,23810,23811,23847,23846,23854,23844,23838,23814,23835,23896,23870,23860,23869,23916,23899,23919,23901,23915,23883,23882,23913,23924,23938,23961,23965,35955,23991,24005,24435,24439,24450,24455,24457,24460,24469,24473,24476,24488,24493,24501,24508,34914,24417,29357,29360,29364,29367,29368,29379,29377,29390,29389,29394,29416,29423,29417,29426,29428,29431,29441,29427,29443,29434,37350,37351,37352,37353,37354,37355,37356,37357,37358,37359,37360,37361,37362,37363,37364,37365,37366,37367,37368,37369,37370,37371,37372,37373,37374,37375,37376,37377,37378,37379,37380,37381,37382,37383,37384,37385,37386,37387,37388,37389,37390,37391,37392,37393,37394,37395,37396,37397,37398,37399,37400,37401,37402,37403,37404,37405,37406,37407,37408,37409,37410,37411,37412,37413,37414,37415,37416,37417,37418,37419,37420,37421,37422,37423,37424,37425,37426,37427,37428,37429,37430,37431,37432,37433,37434,37435,37436,37437,37438,37439,37440,37441,37442,37443,37444,37445,29435,29463,29459,29473,29450,29470,29469,29461,29474,29497,29477,29484,29496,29489,29520,29517,29527,29536,29548,29551,29566,33307,22821,39143,22820,22786,39267,39271,39272,39273,39274,39275,39276,39284,39287,39293,39296,39300,39303,39306,39309,39312,39313,39315,39316,39317,24192,24209,24203,24214,24229,24224,24249,24245,24254,24243,36179,24274,24273,24283,24296,24298,33210,24516,24521,24534,24527,24579,24558,24580,24545,24548,24574,24581,24582,24554,24557,24568,24601,24629,24614,24603,24591,24589,24617,24619,24586,24639,24609,24696,24697,24699,24698,24642,37446,37447,37448,37449,37450,37451,37452,37453,37454,37455,37456,37457,37458,37459,37460,37461,37462,37463,37464,37465,37466,37467,37468,37469,37470,37471,37472,37473,37474,37475,37476,37477,37478,37479,37480,37481,37482,37483,37484,37485,37486,37487,37488,37489,37490,37491,37493,37494,37495,37496,37497,37498,37499,37500,37501,37502,37503,37504,37505,37506,37507,37508,37509,37510,37511,37512,37513,37514,37515,37516,37517,37519,37520,37521,37522,37523,37524,37525,37526,37527,37528,37529,37530,37531,37532,37533,37534,37535,37536,37537,37538,37539,37540,37541,37542,37543,24682,24701,24726,24730,24749,24733,24707,24722,24716,24731,24812,24763,24753,24797,24792,24774,24794,24756,24864,24870,24853,24867,24820,24832,24846,24875,24906,24949,25004,24980,24999,25015,25044,25077,24541,38579,38377,38379,38385,38387,38389,38390,38396,38398,38403,38404,38406,38408,38410,38411,38412,38413,38415,38418,38421,38422,38423,38425,38426,20012,29247,25109,27701,27732,27740,27722,27811,27781,27792,27796,27788,27752,27753,27764,27766,27782,27817,27856,27860,27821,27895,27896,27889,27863,27826,27872,27862,27898,27883,27886,27825,27859,27887,27902,37544,37545,37546,37547,37548,37549,37551,37552,37553,37554,37555,37556,37557,37558,37559,37560,37561,37562,37563,37564,37565,37566,37567,37568,37569,37570,37571,37572,37573,37574,37575,37577,37578,37579,37580,37581,37582,37583,37584,37585,37586,37587,37588,37589,37590,37591,37592,37593,37594,37595,37596,37597,37598,37599,37600,37601,37602,37603,37604,37605,37606,37607,37608,37609,37610,37611,37612,37613,37614,37615,37616,37617,37618,37619,37620,37621,37622,37623,37624,37625,37626,37627,37628,37629,37630,37631,37632,37633,37634,37635,37636,37637,37638,37639,37640,37641,27961,27943,27916,27971,27976,27911,27908,27929,27918,27947,27981,27950,27957,27930,27983,27986,27988,27955,28049,28015,28062,28064,27998,28051,28052,27996,28000,28028,28003,28186,28103,28101,28126,28174,28095,28128,28177,28134,28125,28121,28182,28075,28172,28078,28203,28270,28238,28267,28338,28255,28294,28243,28244,28210,28197,28228,28383,28337,28312,28384,28461,28386,28325,28327,28349,28347,28343,28375,28340,28367,28303,28354,28319,28514,28486,28487,28452,28437,28409,28463,28470,28491,28532,28458,28425,28457,28553,28557,28556,28536,28530,28540,28538,28625,37642,37643,37644,37645,37646,37647,37648,37649,37650,37651,37652,37653,37654,37655,37656,37657,37658,37659,37660,37661,37662,37663,37664,37665,37666,37667,37668,37669,37670,37671,37672,37673,37674,37675,37676,37677,37678,37679,37680,37681,37682,37683,37684,37685,37686,37687,37688,37689,37690,37691,37692,37693,37695,37696,37697,37698,37699,37700,37701,37702,37703,37704,37705,37706,37707,37708,37709,37710,37711,37712,37713,37714,37715,37716,37717,37718,37719,37720,37721,37722,37723,37724,37725,37726,37727,37728,37729,37730,37731,37732,37733,37734,37735,37736,37737,37739,28617,28583,28601,28598,28610,28641,28654,28638,28640,28655,28698,28707,28699,28729,28725,28751,28766,23424,23428,23445,23443,23461,23480,29999,39582,25652,23524,23534,35120,23536,36423,35591,36790,36819,36821,36837,36846,36836,36841,36838,36851,36840,36869,36868,36875,36902,36881,36877,36886,36897,36917,36918,36909,36911,36932,36945,36946,36944,36968,36952,36962,36955,26297,36980,36989,36994,37000,36995,37003,24400,24407,24406,24408,23611,21675,23632,23641,23409,23651,23654,32700,24362,24361,24365,33396,24380,39739,23662,22913,22915,22925,22953,22954,22947,37740,37741,37742,37743,37744,37745,37746,37747,37748,37749,37750,37751,37752,37753,37754,37755,37756,37757,37758,37759,37760,37761,37762,37763,37764,37765,37766,37767,37768,37769,37770,37771,37772,37773,37774,37776,37777,37778,37779,37780,37781,37782,37783,37784,37785,37786,37787,37788,37789,37790,37791,37792,37793,37794,37795,37796,37797,37798,37799,37800,37801,37802,37803,37804,37805,37806,37807,37808,37809,37810,37811,37812,37813,37814,37815,37816,37817,37818,37819,37820,37821,37822,37823,37824,37825,37826,37827,37828,37829,37830,37831,37832,37833,37835,37836,37837,22935,22986,22955,22942,22948,22994,22962,22959,22999,22974,23045,23046,23005,23048,23011,23000,23033,23052,23049,23090,23092,23057,23075,23059,23104,23143,23114,23125,23100,23138,23157,33004,23210,23195,23159,23162,23230,23275,23218,23250,23252,23224,23264,23267,23281,23254,23270,23256,23260,23305,23319,23318,23346,23351,23360,23573,23580,23386,23397,23411,23377,23379,23394,39541,39543,39544,39546,39551,39549,39552,39553,39557,39560,39562,39568,39570,39571,39574,39576,39579,39580,39581,39583,39584,39586,39587,39589,39591,32415,32417,32419,32421,32424,32425,37838,37839,37840,37841,37842,37843,37844,37845,37847,37848,37849,37850,37851,37852,37853,37854,37855,37856,37857,37858,37859,37860,37861,37862,37863,37864,37865,37866,37867,37868,37869,37870,37871,37872,37873,37874,37875,37876,37877,37878,37879,37880,37881,37882,37883,37884,37885,37886,37887,37888,37889,37890,37891,37892,37893,37894,37895,37896,37897,37898,37899,37900,37901,37902,37903,37904,37905,37906,37907,37908,37909,37910,37911,37912,37913,37914,37915,37916,37917,37918,37919,37920,37921,37922,37923,37924,37925,37926,37927,37928,37929,37930,37931,37932,37933,37934,32429,32432,32446,32448,32449,32450,32457,32459,32460,32464,32468,32471,32475,32480,32481,32488,32491,32494,32495,32497,32498,32525,32502,32506,32507,32510,32513,32514,32515,32519,32520,32523,32524,32527,32529,32530,32535,32537,32540,32539,32543,32545,32546,32547,32548,32549,32550,32551,32554,32555,32556,32557,32559,32560,32561,32562,32563,32565,24186,30079,24027,30014,37013,29582,29585,29614,29602,29599,29647,29634,29649,29623,29619,29632,29641,29640,29669,29657,39036,29706,29673,29671,29662,29626,29682,29711,29738,29787,29734,29733,29736,29744,29742,29740,37935,37936,37937,37938,37939,37940,37941,37942,37943,37944,37945,37946,37947,37948,37949,37951,37952,37953,37954,37955,37956,37957,37958,37959,37960,37961,37962,37963,37964,37965,37966,37967,37968,37969,37970,37971,37972,37973,37974,37975,37976,37977,37978,37979,37980,37981,37982,37983,37984,37985,37986,37987,37988,37989,37990,37991,37992,37993,37994,37996,37997,37998,37999,38000,38001,38002,38003,38004,38005,38006,38007,38008,38009,38010,38011,38012,38013,38014,38015,38016,38017,38018,38019,38020,38033,38038,38040,38087,38095,38099,38100,38106,38118,38139,38172,38176,29723,29722,29761,29788,29783,29781,29785,29815,29805,29822,29852,29838,29824,29825,29831,29835,29854,29864,29865,29840,29863,29906,29882,38890,38891,38892,26444,26451,26462,26440,26473,26533,26503,26474,26483,26520,26535,26485,26536,26526,26541,26507,26487,26492,26608,26633,26584,26634,26601,26544,26636,26585,26549,26586,26547,26589,26624,26563,26552,26594,26638,26561,26621,26674,26675,26720,26721,26702,26722,26692,26724,26755,26653,26709,26726,26689,26727,26688,26686,26698,26697,26665,26805,26767,26740,26743,26771,26731,26818,26990,26876,26911,26912,26873,38183,38195,38205,38211,38216,38219,38229,38234,38240,38254,38260,38261,38263,38264,38265,38266,38267,38268,38269,38270,38272,38273,38274,38275,38276,38277,38278,38279,38280,38281,38282,38283,38284,38285,38286,38287,38288,38289,38290,38291,38292,38293,38294,38295,38296,38297,38298,38299,38300,38301,38302,38303,38304,38305,38306,38307,38308,38309,38310,38311,38312,38313,38314,38315,38316,38317,38318,38319,38320,38321,38322,38323,38324,38325,38326,38327,38328,38329,38330,38331,38332,38333,38334,38335,38336,38337,38338,38339,38340,38341,38342,38343,38344,38345,38346,38347,26916,26864,26891,26881,26967,26851,26896,26993,26937,26976,26946,26973,27012,26987,27008,27032,27000,26932,27084,27015,27016,27086,27017,26982,26979,27001,27035,27047,27067,27051,27053,27092,27057,27073,27082,27103,27029,27104,27021,27135,27183,27117,27159,27160,27237,27122,27204,27198,27296,27216,27227,27189,27278,27257,27197,27176,27224,27260,27281,27280,27305,27287,27307,29495,29522,27521,27522,27527,27524,27538,27539,27533,27546,27547,27553,27562,36715,36717,36721,36722,36723,36725,36726,36728,36727,36729,36730,36732,36734,36737,36738,36740,36743,36747,38348,38349,38350,38351,38352,38353,38354,38355,38356,38357,38358,38359,38360,38361,38362,38363,38364,38365,38366,38367,38368,38369,38370,38371,38372,38373,38374,38375,38380,38399,38407,38419,38424,38427,38430,38432,38435,38436,38437,38438,38439,38440,38441,38443,38444,38445,38447,38448,38455,38456,38457,38458,38462,38465,38467,38474,38478,38479,38481,38482,38483,38486,38487,38488,38489,38490,38492,38493,38494,38496,38499,38501,38502,38507,38509,38510,38511,38512,38513,38515,38520,38521,38522,38523,38524,38525,38526,38527,38528,38529,38530,38531,38532,38535,38537,38538,36749,36750,36751,36760,36762,36558,25099,25111,25115,25119,25122,25121,25125,25124,25132,33255,29935,29940,29951,29967,29969,29971,25908,26094,26095,26096,26122,26137,26482,26115,26133,26112,28805,26359,26141,26164,26161,26166,26165,32774,26207,26196,26177,26191,26198,26209,26199,26231,26244,26252,26279,26269,26302,26331,26332,26342,26345,36146,36147,36150,36155,36157,36160,36165,36166,36168,36169,36167,36173,36181,36185,35271,35274,35275,35276,35278,35279,35280,35281,29294,29343,29277,29286,29295,29310,29311,29316,29323,29325,29327,29330,25352,25394,25520,38540,38542,38545,38546,38547,38549,38550,38554,38555,38557,38558,38559,38560,38561,38562,38563,38564,38565,38566,38568,38569,38570,38571,38572,38573,38574,38575,38577,38578,38580,38581,38583,38584,38586,38587,38591,38594,38595,38600,38602,38603,38608,38609,38611,38612,38614,38615,38616,38617,38618,38619,38620,38621,38622,38623,38625,38626,38627,38628,38629,38630,38631,38635,38636,38637,38638,38640,38641,38642,38644,38645,38648,38650,38651,38652,38653,38655,38658,38659,38661,38666,38667,38668,38672,38673,38674,38676,38677,38679,38680,38681,38682,38683,38685,38687,38688,25663,25816,32772,27626,27635,27645,27637,27641,27653,27655,27654,27661,27669,27672,27673,27674,27681,27689,27684,27690,27698,25909,25941,25963,29261,29266,29270,29232,34402,21014,32927,32924,32915,32956,26378,32957,32945,32939,32941,32948,32951,32999,33000,33001,33002,32987,32962,32964,32985,32973,32983,26384,32989,33003,33009,33012,33005,33037,33038,33010,33020,26389,33042,35930,33078,33054,33068,33048,33074,33096,33100,33107,33140,33113,33114,33137,33120,33129,33148,33149,33133,33127,22605,23221,33160,33154,33169,28373,33187,33194,33228,26406,33226,33211,38689,38690,38691,38692,38693,38694,38695,38696,38697,38699,38700,38702,38703,38705,38707,38708,38709,38710,38711,38714,38715,38716,38717,38719,38720,38721,38722,38723,38724,38725,38726,38727,38728,38729,38730,38731,38732,38733,38734,38735,38736,38737,38740,38741,38743,38744,38746,38748,38749,38751,38755,38756,38758,38759,38760,38762,38763,38764,38765,38766,38767,38768,38769,38770,38773,38775,38776,38777,38778,38779,38781,38782,38783,38784,38785,38786,38787,38788,38790,38791,38792,38793,38794,38796,38798,38799,38800,38803,38805,38806,38807,38809,38810,38811,38812,38813,33217,33190,27428,27447,27449,27459,27462,27481,39121,39122,39123,39125,39129,39130,27571,24384,27586,35315,26000,40785,26003,26044,26054,26052,26051,26060,26062,26066,26070,28800,28828,28822,28829,28859,28864,28855,28843,28849,28904,28874,28944,28947,28950,28975,28977,29043,29020,29032,28997,29042,29002,29048,29050,29080,29107,29109,29096,29088,29152,29140,29159,29177,29213,29224,28780,28952,29030,29113,25150,25149,25155,25160,25161,31035,31040,31046,31049,31067,31068,31059,31066,31074,31063,31072,31087,31079,31098,31109,31114,31130,31143,31155,24529,24528,38814,38815,38817,38818,38820,38821,38822,38823,38824,38825,38826,38828,38830,38832,38833,38835,38837,38838,38839,38840,38841,38842,38843,38844,38845,38846,38847,38848,38849,38850,38851,38852,38853,38854,38855,38856,38857,38858,38859,38860,38861,38862,38863,38864,38865,38866,38867,38868,38869,38870,38871,38872,38873,38874,38875,38876,38877,38878,38879,38880,38881,38882,38883,38884,38885,38888,38894,38895,38896,38897,38898,38900,38903,38904,38905,38906,38907,38908,38909,38910,38911,38912,38913,38914,38915,38916,38917,38918,38919,38920,38921,38922,38923,38924,38925,38926,24636,24669,24666,24679,24641,24665,24675,24747,24838,24845,24925,25001,24989,25035,25041,25094,32896,32895,27795,27894,28156,30710,30712,30720,30729,30743,30744,30737,26027,30765,30748,30749,30777,30778,30779,30751,30780,30757,30764,30755,30761,30798,30829,30806,30807,30758,30800,30791,30796,30826,30875,30867,30874,30855,30876,30881,30883,30898,30905,30885,30932,30937,30921,30956,30962,30981,30964,30995,31012,31006,31028,40859,40697,40699,40700,30449,30468,30477,30457,30471,30472,30490,30498,30489,30509,30502,30517,30520,30544,30545,30535,30531,30554,30568,38927,38928,38929,38930,38931,38932,38933,38934,38935,38936,38937,38938,38939,38940,38941,38942,38943,38944,38945,38946,38947,38948,38949,38950,38951,38952,38953,38954,38955,38956,38957,38958,38959,38960,38961,38962,38963,38964,38965,38966,38967,38968,38969,38970,38971,38972,38973,38974,38975,38976,38977,38978,38979,38980,38981,38982,38983,38984,38985,38986,38987,38988,38989,38990,38991,38992,38993,38994,38995,38996,38997,38998,38999,39000,39001,39002,39003,39004,39005,39006,39007,39008,39009,39010,39011,39012,39013,39014,39015,39016,39017,39018,39019,39020,39021,39022,30562,30565,30591,30605,30589,30592,30604,30609,30623,30624,30640,30645,30653,30010,30016,30030,30027,30024,30043,30066,30073,30083,32600,32609,32607,35400,32616,32628,32625,32633,32641,32638,30413,30437,34866,38021,38022,38023,38027,38026,38028,38029,38031,38032,38036,38039,38037,38042,38043,38044,38051,38052,38059,38058,38061,38060,38063,38064,38066,38068,38070,38071,38072,38073,38074,38076,38077,38079,38084,38088,38089,38090,38091,38092,38093,38094,38096,38097,38098,38101,38102,38103,38105,38104,38107,38110,38111,38112,38114,38116,38117,38119,38120,38122,39023,39024,39025,39026,39027,39028,39051,39054,39058,39061,39065,39075,39080,39081,39082,39083,39084,39085,39086,39087,39088,39089,39090,39091,39092,39093,39094,39095,39096,39097,39098,39099,39100,39101,39102,39103,39104,39105,39106,39107,39108,39109,39110,39111,39112,39113,39114,39115,39116,39117,39119,39120,39124,39126,39127,39131,39132,39133,39136,39137,39138,39139,39140,39141,39142,39145,39146,39147,39148,39149,39150,39151,39152,39153,39154,39155,39156,39157,39158,39159,39160,39161,39162,39163,39164,39165,39166,39167,39168,39169,39170,39171,39172,39173,39174,39175,38121,38123,38126,38127,38131,38132,38133,38135,38137,38140,38141,38143,38147,38146,38150,38151,38153,38154,38157,38158,38159,38162,38163,38164,38165,38166,38168,38171,38173,38174,38175,38178,38186,38187,38185,38188,38193,38194,38196,38198,38199,38200,38204,38206,38207,38210,38197,38212,38213,38214,38217,38220,38222,38223,38226,38227,38228,38230,38231,38232,38233,38235,38238,38239,38237,38241,38242,38244,38245,38246,38247,38248,38249,38250,38251,38252,38255,38257,38258,38259,38202,30695,30700,38601,31189,31213,31203,31211,31238,23879,31235,31234,31262,31252,39176,39177,39178,39179,39180,39182,39183,39185,39186,39187,39188,39189,39190,39191,39192,39193,39194,39195,39196,39197,39198,39199,39200,39201,39202,39203,39204,39205,39206,39207,39208,39209,39210,39211,39212,39213,39215,39216,39217,39218,39219,39220,39221,39222,39223,39224,39225,39226,39227,39228,39229,39230,39231,39232,39233,39234,39235,39236,39237,39238,39239,39240,39241,39242,39243,39244,39245,39246,39247,39248,39249,39250,39251,39254,39255,39256,39257,39258,39259,39260,39261,39262,39263,39264,39265,39266,39268,39270,39283,39288,39289,39291,39294,39298,39299,39305,31289,31287,31313,40655,39333,31344,30344,30350,30355,30361,30372,29918,29920,29996,40480,40482,40488,40489,40490,40491,40492,40498,40497,40502,40504,40503,40505,40506,40510,40513,40514,40516,40518,40519,40520,40521,40523,40524,40526,40529,40533,40535,40538,40539,40540,40542,40547,40550,40551,40552,40553,40554,40555,40556,40561,40557,40563,30098,30100,30102,30112,30109,30124,30115,30131,30132,30136,30148,30129,30128,30147,30146,30166,30157,30179,30184,30182,30180,30187,30183,30211,30193,30204,30207,30224,30208,30213,30220,30231,30218,30245,30232,30229,30233,39308,39310,39322,39323,39324,39325,39326,39327,39328,39329,39330,39331,39332,39334,39335,39337,39338,39339,39340,39341,39342,39343,39344,39345,39346,39347,39348,39349,39350,39351,39352,39353,39354,39355,39356,39357,39358,39359,39360,39361,39362,39363,39364,39365,39366,39367,39368,39369,39370,39371,39372,39373,39374,39375,39376,39377,39378,39379,39380,39381,39382,39383,39384,39385,39386,39387,39388,39389,39390,39391,39392,39393,39394,39395,39396,39397,39398,39399,39400,39401,39402,39403,39404,39405,39406,39407,39408,39409,39410,39411,39412,39413,39414,39415,39416,39417,30235,30268,30242,30240,30272,30253,30256,30271,30261,30275,30270,30259,30285,30302,30292,30300,30294,30315,30319,32714,31462,31352,31353,31360,31366,31368,31381,31398,31392,31404,31400,31405,31411,34916,34921,34930,34941,34943,34946,34978,35014,34999,35004,35017,35042,35022,35043,35045,35057,35098,35068,35048,35070,35056,35105,35097,35091,35099,35082,35124,35115,35126,35137,35174,35195,30091,32997,30386,30388,30684,32786,32788,32790,32796,32800,32802,32805,32806,32807,32809,32808,32817,32779,32821,32835,32838,32845,32850,32873,32881,35203,39032,39040,39043,39418,39419,39420,39421,39422,39423,39424,39425,39426,39427,39428,39429,39430,39431,39432,39433,39434,39435,39436,39437,39438,39439,39440,39441,39442,39443,39444,39445,39446,39447,39448,39449,39450,39451,39452,39453,39454,39455,39456,39457,39458,39459,39460,39461,39462,39463,39464,39465,39466,39467,39468,39469,39470,39471,39472,39473,39474,39475,39476,39477,39478,39479,39480,39481,39482,39483,39484,39485,39486,39487,39488,39489,39490,39491,39492,39493,39494,39495,39496,39497,39498,39499,39500,39501,39502,39503,39504,39505,39506,39507,39508,39509,39510,39511,39512,39513,39049,39052,39053,39055,39060,39066,39067,39070,39071,39073,39074,39077,39078,34381,34388,34412,34414,34431,34426,34428,34427,34472,34445,34443,34476,34461,34471,34467,34474,34451,34473,34486,34500,34485,34510,34480,34490,34481,34479,34505,34511,34484,34537,34545,34546,34541,34547,34512,34579,34526,34548,34527,34520,34513,34563,34567,34552,34568,34570,34573,34569,34595,34619,34590,34597,34606,34586,34622,34632,34612,34609,34601,34615,34623,34690,34594,34685,34686,34683,34656,34672,34636,34670,34699,34643,34659,34684,34660,34649,34661,34707,34735,34728,34770,39514,39515,39516,39517,39518,39519,39520,39521,39522,39523,39524,39525,39526,39527,39528,39529,39530,39531,39538,39555,39561,39565,39566,39572,39573,39577,39590,39593,39594,39595,39596,39597,39598,39599,39602,39603,39604,39605,39609,39611,39613,39614,39615,39619,39620,39622,39623,39624,39625,39626,39629,39630,39631,39632,39634,39636,39637,39638,39639,39641,39642,39643,39644,39645,39646,39648,39650,39651,39652,39653,39655,39656,39657,39658,39660,39662,39664,39665,39666,39667,39668,39669,39670,39671,39672,39674,39676,39677,39678,39679,39680,39681,39682,39684,39685,39686,34758,34696,34693,34733,34711,34691,34731,34789,34732,34741,34739,34763,34771,34749,34769,34752,34762,34779,34794,34784,34798,34838,34835,34814,34826,34843,34849,34873,34876,32566,32578,32580,32581,33296,31482,31485,31496,31491,31492,31509,31498,31531,31503,31559,31544,31530,31513,31534,31537,31520,31525,31524,31539,31550,31518,31576,31578,31557,31605,31564,31581,31584,31598,31611,31586,31602,31601,31632,31654,31655,31672,31660,31645,31656,31621,31658,31644,31650,31659,31668,31697,31681,31692,31709,31706,31717,31718,31722,31756,31742,31740,31759,31766,31755,39687,39689,39690,39691,39692,39693,39694,39696,39697,39698,39700,39701,39702,39703,39704,39705,39706,39707,39708,39709,39710,39712,39713,39714,39716,39717,39718,39719,39720,39721,39722,39723,39724,39725,39726,39728,39729,39731,39732,39733,39734,39735,39736,39737,39738,39741,39742,39743,39744,39750,39754,39755,39756,39758,39760,39762,39763,39765,39766,39767,39768,39769,39770,39771,39772,39773,39774,39775,39776,39777,39778,39779,39780,39781,39782,39783,39784,39785,39786,39787,39788,39789,39790,39791,39792,39793,39794,39795,39796,39797,39798,39799,39800,39801,39802,39803,31775,31786,31782,31800,31809,31808,33278,33281,33282,33284,33260,34884,33313,33314,33315,33325,33327,33320,33323,33336,33339,33331,33332,33342,33348,33353,33355,33359,33370,33375,33384,34942,34949,34952,35032,35039,35166,32669,32671,32679,32687,32688,32690,31868,25929,31889,31901,31900,31902,31906,31922,31932,31933,31937,31943,31948,31949,31944,31941,31959,31976,33390,26280,32703,32718,32725,32741,32737,32742,32745,32750,32755,31992,32119,32166,32174,32327,32411,40632,40628,36211,36228,36244,36241,36273,36199,36205,35911,35913,37194,37200,37198,37199,37220,39804,39805,39806,39807,39808,39809,39810,39811,39812,39813,39814,39815,39816,39817,39818,39819,39820,39821,39822,39823,39824,39825,39826,39827,39828,39829,39830,39831,39832,39833,39834,39835,39836,39837,39838,39839,39840,39841,39842,39843,39844,39845,39846,39847,39848,39849,39850,39851,39852,39853,39854,39855,39856,39857,39858,39859,39860,39861,39862,39863,39864,39865,39866,39867,39868,39869,39870,39871,39872,39873,39874,39875,39876,39877,39878,39879,39880,39881,39882,39883,39884,39885,39886,39887,39888,39889,39890,39891,39892,39893,39894,39895,39896,39897,39898,39899,37218,37217,37232,37225,37231,37245,37246,37234,37236,37241,37260,37253,37264,37261,37265,37282,37283,37290,37293,37294,37295,37301,37300,37306,35925,40574,36280,36331,36357,36441,36457,36277,36287,36284,36282,36292,36310,36311,36314,36318,36302,36303,36315,36294,36332,36343,36344,36323,36345,36347,36324,36361,36349,36372,36381,36383,36396,36398,36387,36399,36410,36416,36409,36405,36413,36401,36425,36417,36418,36433,36434,36426,36464,36470,36476,36463,36468,36485,36495,36500,36496,36508,36510,35960,35970,35978,35973,35992,35988,26011,35286,35294,35290,35292,39900,39901,39902,39903,39904,39905,39906,39907,39908,39909,39910,39911,39912,39913,39914,39915,39916,39917,39918,39919,39920,39921,39922,39923,39924,39925,39926,39927,39928,39929,39930,39931,39932,39933,39934,39935,39936,39937,39938,39939,39940,39941,39942,39943,39944,39945,39946,39947,39948,39949,39950,39951,39952,39953,39954,39955,39956,39957,39958,39959,39960,39961,39962,39963,39964,39965,39966,39967,39968,39969,39970,39971,39972,39973,39974,39975,39976,39977,39978,39979,39980,39981,39982,39983,39984,39985,39986,39987,39988,39989,39990,39991,39992,39993,39994,39995,35301,35307,35311,35390,35622,38739,38633,38643,38639,38662,38657,38664,38671,38670,38698,38701,38704,38718,40832,40835,40837,40838,40839,40840,40841,40842,40844,40702,40715,40717,38585,38588,38589,38606,38610,30655,38624,37518,37550,37576,37694,37738,37834,37775,37950,37995,40063,40066,40069,40070,40071,40072,31267,40075,40078,40080,40081,40082,40084,40085,40090,40091,40094,40095,40096,40097,40098,40099,40101,40102,40103,40104,40105,40107,40109,40110,40112,40113,40114,40115,40116,40117,40118,40119,40122,40123,40124,40125,40132,40133,40134,40135,40138,40139,39996,39997,39998,39999,40000,40001,40002,40003,40004,40005,40006,40007,40008,40009,40010,40011,40012,40013,40014,40015,40016,40017,40018,40019,40020,40021,40022,40023,40024,40025,40026,40027,40028,40029,40030,40031,40032,40033,40034,40035,40036,40037,40038,40039,40040,40041,40042,40043,40044,40045,40046,40047,40048,40049,40050,40051,40052,40053,40054,40055,40056,40057,40058,40059,40061,40062,40064,40067,40068,40073,40074,40076,40079,40083,40086,40087,40088,40089,40093,40106,40108,40111,40121,40126,40127,40128,40129,40130,40136,40137,40145,40146,40154,40155,40160,40161,40140,40141,40142,40143,40144,40147,40148,40149,40151,40152,40153,40156,40157,40159,40162,38780,38789,38801,38802,38804,38831,38827,38819,38834,38836,39601,39600,39607,40536,39606,39610,39612,39617,39616,39621,39618,39627,39628,39633,39749,39747,39751,39753,39752,39757,39761,39144,39181,39214,39253,39252,39647,39649,39654,39663,39659,39675,39661,39673,39688,39695,39699,39711,39715,40637,40638,32315,40578,40583,40584,40587,40594,37846,40605,40607,40667,40668,40669,40672,40671,40674,40681,40679,40677,40682,40687,40738,40748,40751,40761,40759,40765,40766,40772,40163,40164,40165,40166,40167,40168,40169,40170,40171,40172,40173,40174,40175,40176,40177,40178,40179,40180,40181,40182,40183,40184,40185,40186,40187,40188,40189,40190,40191,40192,40193,40194,40195,40196,40197,40198,40199,40200,40201,40202,40203,40204,40205,40206,40207,40208,40209,40210,40211,40212,40213,40214,40215,40216,40217,40218,40219,40220,40221,40222,40223,40224,40225,40226,40227,40228,40229,40230,40231,40232,40233,40234,40235,40236,40237,40238,40239,40240,40241,40242,40243,40244,40245,40246,40247,40248,40249,40250,40251,40252,40253,40254,40255,40256,40257,40258,57908,57909,57910,57911,57912,57913,57914,57915,57916,57917,57918,57919,57920,57921,57922,57923,57924,57925,57926,57927,57928,57929,57930,57931,57932,57933,57934,57935,57936,57937,57938,57939,57940,57941,57942,57943,57944,57945,57946,57947,57948,57949,57950,57951,57952,57953,57954,57955,57956,57957,57958,57959,57960,57961,57962,57963,57964,57965,57966,57967,57968,57969,57970,57971,57972,57973,57974,57975,57976,57977,57978,57979,57980,57981,57982,57983,57984,57985,57986,57987,57988,57989,57990,57991,57992,57993,57994,57995,57996,57997,57998,57999,58000,58001,40259,40260,40261,40262,40263,40264,40265,40266,40267,40268,40269,40270,40271,40272,40273,40274,40275,40276,40277,40278,40279,40280,40281,40282,40283,40284,40285,40286,40287,40288,40289,40290,40291,40292,40293,40294,40295,40296,40297,40298,40299,40300,40301,40302,40303,40304,40305,40306,40307,40308,40309,40310,40311,40312,40313,40314,40315,40316,40317,40318,40319,40320,40321,40322,40323,40324,40325,40326,40327,40328,40329,40330,40331,40332,40333,40334,40335,40336,40337,40338,40339,40340,40341,40342,40343,40344,40345,40346,40347,40348,40349,40350,40351,40352,40353,40354,58002,58003,58004,58005,58006,58007,58008,58009,58010,58011,58012,58013,58014,58015,58016,58017,58018,58019,58020,58021,58022,58023,58024,58025,58026,58027,58028,58029,58030,58031,58032,58033,58034,58035,58036,58037,58038,58039,58040,58041,58042,58043,58044,58045,58046,58047,58048,58049,58050,58051,58052,58053,58054,58055,58056,58057,58058,58059,58060,58061,58062,58063,58064,58065,58066,58067,58068,58069,58070,58071,58072,58073,58074,58075,58076,58077,58078,58079,58080,58081,58082,58083,58084,58085,58086,58087,58088,58089,58090,58091,58092,58093,58094,58095,40355,40356,40357,40358,40359,40360,40361,40362,40363,40364,40365,40366,40367,40368,40369,40370,40371,40372,40373,40374,40375,40376,40377,40378,40379,40380,40381,40382,40383,40384,40385,40386,40387,40388,40389,40390,40391,40392,40393,40394,40395,40396,40397,40398,40399,40400,40401,40402,40403,40404,40405,40406,40407,40408,40409,40410,40411,40412,40413,40414,40415,40416,40417,40418,40419,40420,40421,40422,40423,40424,40425,40426,40427,40428,40429,40430,40431,40432,40433,40434,40435,40436,40437,40438,40439,40440,40441,40442,40443,40444,40445,40446,40447,40448,40449,40450,58096,58097,58098,58099,58100,58101,58102,58103,58104,58105,58106,58107,58108,58109,58110,58111,58112,58113,58114,58115,58116,58117,58118,58119,58120,58121,58122,58123,58124,58125,58126,58127,58128,58129,58130,58131,58132,58133,58134,58135,58136,58137,58138,58139,58140,58141,58142,58143,58144,58145,58146,58147,58148,58149,58150,58151,58152,58153,58154,58155,58156,58157,58158,58159,58160,58161,58162,58163,58164,58165,58166,58167,58168,58169,58170,58171,58172,58173,58174,58175,58176,58177,58178,58179,58180,58181,58182,58183,58184,58185,58186,58187,58188,58189,40451,40452,40453,40454,40455,40456,40457,40458,40459,40460,40461,40462,40463,40464,40465,40466,40467,40468,40469,40470,40471,40472,40473,40474,40475,40476,40477,40478,40484,40487,40494,40496,40500,40507,40508,40512,40525,40528,40530,40531,40532,40534,40537,40541,40543,40544,40545,40546,40549,40558,40559,40562,40564,40565,40566,40567,40568,40569,40570,40571,40572,40573,40576,40577,40579,40580,40581,40582,40585,40586,40588,40589,40590,40591,40592,40593,40596,40597,40598,40599,40600,40601,40602,40603,40604,40606,40608,40609,40610,40611,40612,40613,40615,40616,40617,40618,58190,58191,58192,58193,58194,58195,58196,58197,58198,58199,58200,58201,58202,58203,58204,58205,58206,58207,58208,58209,58210,58211,58212,58213,58214,58215,58216,58217,58218,58219,58220,58221,58222,58223,58224,58225,58226,58227,58228,58229,58230,58231,58232,58233,58234,58235,58236,58237,58238,58239,58240,58241,58242,58243,58244,58245,58246,58247,58248,58249,58250,58251,58252,58253,58254,58255,58256,58257,58258,58259,58260,58261,58262,58263,58264,58265,58266,58267,58268,58269,58270,58271,58272,58273,58274,58275,58276,58277,58278,58279,58280,58281,58282,58283,40619,40620,40621,40622,40623,40624,40625,40626,40627,40629,40630,40631,40633,40634,40636,40639,40640,40641,40642,40643,40645,40646,40647,40648,40650,40651,40652,40656,40658,40659,40661,40662,40663,40665,40666,40670,40673,40675,40676,40678,40680,40683,40684,40685,40686,40688,40689,40690,40691,40692,40693,40694,40695,40696,40698,40701,40703,40704,40705,40706,40707,40708,40709,40710,40711,40712,40713,40714,40716,40719,40721,40722,40724,40725,40726,40728,40730,40731,40732,40733,40734,40735,40737,40739,40740,40741,40742,40743,40744,40745,40746,40747,40749,40750,40752,40753,58284,58285,58286,58287,58288,58289,58290,58291,58292,58293,58294,58295,58296,58297,58298,58299,58300,58301,58302,58303,58304,58305,58306,58307,58308,58309,58310,58311,58312,58313,58314,58315,58316,58317,58318,58319,58320,58321,58322,58323,58324,58325,58326,58327,58328,58329,58330,58331,58332,58333,58334,58335,58336,58337,58338,58339,58340,58341,58342,58343,58344,58345,58346,58347,58348,58349,58350,58351,58352,58353,58354,58355,58356,58357,58358,58359,58360,58361,58362,58363,58364,58365,58366,58367,58368,58369,58370,58371,58372,58373,58374,58375,58376,58377,40754,40755,40756,40757,40758,40760,40762,40764,40767,40768,40769,40770,40771,40773,40774,40775,40776,40777,40778,40779,40780,40781,40782,40783,40786,40787,40788,40789,40790,40791,40792,40793,40794,40795,40796,40797,40798,40799,40800,40801,40802,40803,40804,40805,40806,40807,40808,40809,40810,40811,40812,40813,40814,40815,40816,40817,40818,40819,40820,40821,40822,40823,40824,40825,40826,40827,40828,40829,40830,40833,40834,40845,40846,40847,40848,40849,40850,40851,40852,40853,40854,40855,40856,40860,40861,40862,40865,40866,40867,40868,40869,63788,63865,63893,63975,63985,58378,58379,58380,58381,58382,58383,58384,58385,58386,58387,58388,58389,58390,58391,58392,58393,58394,58395,58396,58397,58398,58399,58400,58401,58402,58403,58404,58405,58406,58407,58408,58409,58410,58411,58412,58413,58414,58415,58416,58417,58418,58419,58420,58421,58422,58423,58424,58425,58426,58427,58428,58429,58430,58431,58432,58433,58434,58435,58436,58437,58438,58439,58440,58441,58442,58443,58444,58445,58446,58447,58448,58449,58450,58451,58452,58453,58454,58455,58456,58457,58458,58459,58460,58461,58462,58463,58464,58465,58466,58467,58468,58469,58470,58471,64012,64013,64014,64015,64017,64019,64020,64024,64031,64032,64033,64035,64036,64039,64040,64041,11905,59414,59415,59416,11908,13427,13383,11912,11915,59422,13726,13850,13838,11916,11927,14702,14616,59430,14799,14815,14963,14800,59435,59436,15182,15470,15584,11943,59441,59442,11946,16470,16735,11950,17207,11955,11958,11959,59451,17329,17324,11963,17373,17622,18017,17996,59459,18211,18217,18300,18317,11978,18759,18810,18813,18818,18819,18821,18822,18847,18843,18871,18870,59476,59477,19619,19615,19616,19617,19575,19618,19731,19732,19733,19734,19735,19736,19737,19886,59492,58472,58473,58474,58475,58476,58477,58478,58479,58480,58481,58482,58483,58484,58485,58486,58487,58488,58489,58490,58491,58492,58493,58494,58495,58496,58497,58498,58499,58500,58501,58502,58503,58504,58505,58506,58507,58508,58509,58510,58511,58512,58513,58514,58515,58516,58517,58518,58519,58520,58521,58522,58523,58524,58525,58526,58527,58528,58529,58530,58531,58532,58533,58534,58535,58536,58537,58538,58539,58540,58541,58542,58543,58544,58545,58546,58547,58548,58549,58550,58551,58552,58553,58554,58555,58556,58557,58558,58559,58560,58561,58562,58563,58564,58565],
  "gb18030-ranges":[[0,128],[36,165],[38,169],[45,178],[50,184],[81,216],[89,226],[95,235],[96,238],[100,244],[103,248],[104,251],[105,253],[109,258],[126,276],[133,284],[148,300],[172,325],[175,329],[179,334],[208,364],[306,463],[307,465],[308,467],[309,469],[310,471],[311,473],[312,475],[313,477],[341,506],[428,594],[443,610],[544,712],[545,716],[558,730],[741,930],[742,938],[749,962],[750,970],[805,1026],[819,1104],[820,1106],[7922,8209],[7924,8215],[7925,8218],[7927,8222],[7934,8231],[7943,8241],[7944,8244],[7945,8246],[7950,8252],[8062,8365],[8148,8452],[8149,8454],[8152,8458],[8164,8471],[8174,8482],[8236,8556],[8240,8570],[8262,8596],[8264,8602],[8374,8713],[8380,8720],[8381,8722],[8384,8726],[8388,8731],[8390,8737],[8392,8740],[8393,8742],[8394,8748],[8396,8751],[8401,8760],[8406,8766],[8416,8777],[8419,8781],[8424,8787],[8437,8802],[8439,8808],[8445,8816],[8482,8854],[8485,8858],[8496,8870],[8521,8896],[8603,8979],[8936,9322],[8946,9372],[9046,9548],[9050,9588],[9063,9616],[9066,9622],[9076,9634],[9092,9652],[9100,9662],[9108,9672],[9111,9676],[9113,9680],[9131,9702],[9162,9735],[9164,9738],[9218,9793],[9219,9795],[11329,11906],[11331,11909],[11334,11913],[11336,11917],[11346,11928],[11361,11944],[11363,11947],[11366,11951],[11370,11956],[11372,11960],[11375,11964],[11389,11979],[11682,12284],[11686,12292],[11687,12312],[11692,12319],[11694,12330],[11714,12351],[11716,12436],[11723,12447],[11725,12535],[11730,12543],[11736,12586],[11982,12842],[11989,12850],[12102,12964],[12336,13200],[12348,13215],[12350,13218],[12384,13253],[12393,13263],[12395,13267],[12397,13270],[12510,13384],[12553,13428],[12851,13727],[12962,13839],[12973,13851],[13738,14617],[13823,14703],[13919,14801],[13933,14816],[14080,14964],[14298,15183],[14585,15471],[14698,15585],[15583,16471],[15847,16736],[16318,17208],[16434,17325],[16438,17330],[16481,17374],[16729,17623],[17102,17997],[17122,18018],[17315,18212],[17320,18218],[17402,18301],[17418,18318],[17859,18760],[17909,18811],[17911,18814],[17915,18820],[17916,18823],[17936,18844],[17939,18848],[17961,18872],[18664,19576],[18703,19620],[18814,19738],[18962,19887],[19043,40870],[33469,59244],[33470,59336],[33471,59367],[33484,59413],[33485,59417],[33490,59423],[33497,59431],[33501,59437],[33505,59443],[33513,59452],[33520,59460],[33536,59478],[33550,59493],[37845,63789],[37921,63866],[37948,63894],[38029,63976],[38038,63986],[38064,64016],[38065,64018],[38066,64021],[38069,64025],[38075,64034],[38076,64037],[38078,64042],[39108,65074],[39109,65093],[39113,65107],[39114,65112],[39115,65127],[39116,65132],[39265,65375],[39394,65510],[189000,65536]],
  "jis0208":[12288,12289,12290,65292,65294,12539,65306,65307,65311,65281,12443,12444,180,65344,168,65342,65507,65343,12541,12542,12445,12446,12291,20189,12293,12294,12295,12540,8213,8208,65295,65340,65374,8741,65372,8230,8229,8216,8217,8220,8221,65288,65289,12308,12309,65339,65341,65371,65373,12296,12297,12298,12299,12300,12301,12302,12303,12304,12305,65291,65293,177,215,247,65309,8800,65308,65310,8806,8807,8734,8756,9794,9792,176,8242,8243,8451,65509,65284,65504,65505,65285,65283,65286,65290,65312,167,9734,9733,9675,9679,9678,9671,9670,9633,9632,9651,9650,9661,9660,8251,12306,8594,8592,8593,8595,12307,null,null,null,null,null,null,null,null,null,null,null,8712,8715,8838,8839,8834,8835,8746,8745,null,null,null,null,null,null,null,null,8743,8744,65506,8658,8660,8704,8707,null,null,null,null,null,null,null,null,null,null,null,8736,8869,8978,8706,8711,8801,8786,8810,8811,8730,8765,8733,8757,8747,8748,null,null,null,null,null,null,null,8491,8240,9839,9837,9834,8224,8225,182,null,null,null,null,9711,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,65296,65297,65298,65299,65300,65301,65302,65303,65304,65305,null,null,null,null,null,null,null,65313,65314,65315,65316,65317,65318,65319,65320,65321,65322,65323,65324,65325,65326,65327,65328,65329,65330,65331,65332,65333,65334,65335,65336,65337,65338,null,null,null,null,null,null,65345,65346,65347,65348,65349,65350,65351,65352,65353,65354,65355,65356,65357,65358,65359,65360,65361,65362,65363,65364,65365,65366,65367,65368,65369,65370,null,null,null,null,12353,12354,12355,12356,12357,12358,12359,12360,12361,12362,12363,12364,12365,12366,12367,12368,12369,12370,12371,12372,12373,12374,12375,12376,12377,12378,12379,12380,12381,12382,12383,12384,12385,12386,12387,12388,12389,12390,12391,12392,12393,12394,12395,12396,12397,12398,12399,12400,12401,12402,12403,12404,12405,12406,12407,12408,12409,12410,12411,12412,12413,12414,12415,12416,12417,12418,12419,12420,12421,12422,12423,12424,12425,12426,12427,12428,12429,12430,12431,12432,12433,12434,12435,null,null,null,null,null,null,null,null,null,null,null,12449,12450,12451,12452,12453,12454,12455,12456,12457,12458,12459,12460,12461,12462,12463,12464,12465,12466,12467,12468,12469,12470,12471,12472,12473,12474,12475,12476,12477,12478,12479,12480,12481,12482,12483,12484,12485,12486,12487,12488,12489,12490,12491,12492,12493,12494,12495,12496,12497,12498,12499,12500,12501,12502,12503,12504,12505,12506,12507,12508,12509,12510,12511,12512,12513,12514,12515,12516,12517,12518,12519,12520,12521,12522,12523,12524,12525,12526,12527,12528,12529,12530,12531,12532,12533,12534,null,null,null,null,null,null,null,null,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,931,932,933,934,935,936,937,null,null,null,null,null,null,null,null,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,963,964,965,966,967,968,969,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1040,1041,1042,1043,1044,1045,1025,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1072,1073,1074,1075,1076,1077,1105,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,null,null,null,null,null,null,null,null,null,null,null,null,null,9472,9474,9484,9488,9496,9492,9500,9516,9508,9524,9532,9473,9475,9487,9491,9499,9495,9507,9523,9515,9531,9547,9504,9519,9512,9527,9535,9501,9520,9509,9528,9538,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9312,9313,9314,9315,9316,9317,9318,9319,9320,9321,9322,9323,9324,9325,9326,9327,9328,9329,9330,9331,8544,8545,8546,8547,8548,8549,8550,8551,8552,8553,null,13129,13076,13090,13133,13080,13095,13059,13110,13137,13143,13069,13094,13091,13099,13130,13115,13212,13213,13214,13198,13199,13252,13217,null,null,null,null,null,null,null,null,13179,12317,12319,8470,13261,8481,12964,12965,12966,12967,12968,12849,12850,12857,13182,13181,13180,8786,8801,8747,8750,8721,8730,8869,8736,8735,8895,8757,8745,8746,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,20124,21782,23043,38463,21696,24859,25384,23030,36898,33909,33564,31312,24746,25569,28197,26093,33894,33446,39925,26771,22311,26017,25201,23451,22992,34427,39156,32098,32190,39822,25110,31903,34999,23433,24245,25353,26263,26696,38343,38797,26447,20197,20234,20301,20381,20553,22258,22839,22996,23041,23561,24799,24847,24944,26131,26885,28858,30031,30064,31227,32173,32239,32963,33806,34915,35586,36949,36986,21307,20117,20133,22495,32946,37057,30959,19968,22769,28322,36920,31282,33576,33419,39983,20801,21360,21693,21729,22240,23035,24341,39154,28139,32996,34093,38498,38512,38560,38907,21515,21491,23431,28879,32701,36802,38632,21359,40284,31418,19985,30867,33276,28198,22040,21764,27421,34074,39995,23013,21417,28006,29916,38287,22082,20113,36939,38642,33615,39180,21473,21942,23344,24433,26144,26355,26628,27704,27891,27945,29787,30408,31310,38964,33521,34907,35424,37613,28082,30123,30410,39365,24742,35585,36234,38322,27022,21421,20870,22290,22576,22852,23476,24310,24616,25513,25588,27839,28436,28814,28948,29017,29141,29503,32257,33398,33489,34199,36960,37467,40219,22633,26044,27738,29989,20985,22830,22885,24448,24540,25276,26106,27178,27431,27572,29579,32705,35158,40236,40206,40644,23713,27798,33659,20740,23627,25014,33222,26742,29281,20057,20474,21368,24681,28201,31311,38899,19979,21270,20206,20309,20285,20385,20339,21152,21487,22025,22799,23233,23478,23521,31185,26247,26524,26550,27468,27827,28779,29634,31117,31166,31292,31623,33457,33499,33540,33655,33775,33747,34662,35506,22057,36008,36838,36942,38686,34442,20420,23784,25105,29273,30011,33253,33469,34558,36032,38597,39187,39381,20171,20250,35299,22238,22602,22730,24315,24555,24618,24724,24674,25040,25106,25296,25913,39745,26214,26800,28023,28784,30028,30342,32117,33445,34809,38283,38542,35997,20977,21182,22806,21683,23475,23830,24936,27010,28079,30861,33995,34903,35442,37799,39608,28012,39336,34521,22435,26623,34510,37390,21123,22151,21508,24275,25313,25785,26684,26680,27579,29554,30906,31339,35226,35282,36203,36611,37101,38307,38548,38761,23398,23731,27005,38989,38990,25499,31520,27179,27263,26806,39949,28511,21106,21917,24688,25324,27963,28167,28369,33883,35088,36676,19988,39993,21494,26907,27194,38788,26666,20828,31427,33970,37340,37772,22107,40232,26658,33541,33841,31909,21000,33477,29926,20094,20355,20896,23506,21002,21208,21223,24059,21914,22570,23014,23436,23448,23515,24178,24185,24739,24863,24931,25022,25563,25954,26577,26707,26874,27454,27475,27735,28450,28567,28485,29872,29976,30435,30475,31487,31649,31777,32233,32566,32752,32925,33382,33694,35251,35532,36011,36996,37969,38291,38289,38306,38501,38867,39208,33304,20024,21547,23736,24012,29609,30284,30524,23721,32747,36107,38593,38929,38996,39000,20225,20238,21361,21916,22120,22522,22855,23305,23492,23696,24076,24190,24524,25582,26426,26071,26082,26399,26827,26820,27231,24112,27589,27671,27773,30079,31048,23395,31232,32000,24509,35215,35352,36020,36215,36556,36637,39138,39438,39740,20096,20605,20736,22931,23452,25135,25216,25836,27450,29344,30097,31047,32681,34811,35516,35696,25516,33738,38816,21513,21507,21931,26708,27224,35440,30759,26485,40653,21364,23458,33050,34384,36870,19992,20037,20167,20241,21450,21560,23470,24339,24613,25937,26429,27714,27762,27875,28792,29699,31350,31406,31496,32026,31998,32102,26087,29275,21435,23621,24040,25298,25312,25369,28192,34394,35377,36317,37624,28417,31142,39770,20136,20139,20140,20379,20384,20689,20807,31478,20849,20982,21332,21281,21375,21483,21932,22659,23777,24375,24394,24623,24656,24685,25375,25945,27211,27841,29378,29421,30703,33016,33029,33288,34126,37111,37857,38911,39255,39514,20208,20957,23597,26241,26989,23616,26354,26997,29577,26704,31873,20677,21220,22343,24062,37670,26020,27427,27453,29748,31105,31165,31563,32202,33465,33740,34943,35167,35641,36817,37329,21535,37504,20061,20534,21477,21306,29399,29590,30697,33510,36527,39366,39368,39378,20855,24858,34398,21936,31354,20598,23507,36935,38533,20018,27355,37351,23633,23624,25496,31391,27795,38772,36705,31402,29066,38536,31874,26647,32368,26705,37740,21234,21531,34219,35347,32676,36557,37089,21350,34952,31041,20418,20670,21009,20804,21843,22317,29674,22411,22865,24418,24452,24693,24950,24935,25001,25522,25658,25964,26223,26690,28179,30054,31293,31995,32076,32153,32331,32619,33550,33610,34509,35336,35427,35686,36605,38938,40335,33464,36814,39912,21127,25119,25731,28608,38553,26689,20625,27424,27770,28500,31348,32080,34880,35363,26376,20214,20537,20518,20581,20860,21048,21091,21927,22287,22533,23244,24314,25010,25080,25331,25458,26908,27177,29309,29356,29486,30740,30831,32121,30476,32937,35211,35609,36066,36562,36963,37749,38522,38997,39443,40568,20803,21407,21427,24187,24358,28187,28304,29572,29694,32067,33335,35328,35578,38480,20046,20491,21476,21628,22266,22993,23396,24049,24235,24359,25144,25925,26543,28246,29392,31946,34996,32929,32993,33776,34382,35463,36328,37431,38599,39015,40723,20116,20114,20237,21320,21577,21566,23087,24460,24481,24735,26791,27278,29786,30849,35486,35492,35703,37264,20062,39881,20132,20348,20399,20505,20502,20809,20844,21151,21177,21246,21402,21475,21521,21518,21897,22353,22434,22909,23380,23389,23439,24037,24039,24055,24184,24195,24218,24247,24344,24658,24908,25239,25304,25511,25915,26114,26179,26356,26477,26657,26775,27083,27743,27946,28009,28207,28317,30002,30343,30828,31295,31968,32005,32024,32094,32177,32789,32771,32943,32945,33108,33167,33322,33618,34892,34913,35611,36002,36092,37066,37237,37489,30783,37628,38308,38477,38917,39321,39640,40251,21083,21163,21495,21512,22741,25335,28640,35946,36703,40633,20811,21051,21578,22269,31296,37239,40288,40658,29508,28425,33136,29969,24573,24794,39592,29403,36796,27492,38915,20170,22256,22372,22718,23130,24680,25031,26127,26118,26681,26801,28151,30165,32058,33390,39746,20123,20304,21449,21766,23919,24038,24046,26619,27801,29811,30722,35408,37782,35039,22352,24231,25387,20661,20652,20877,26368,21705,22622,22971,23472,24425,25165,25505,26685,27507,28168,28797,37319,29312,30741,30758,31085,25998,32048,33756,35009,36617,38555,21092,22312,26448,32618,36001,20916,22338,38442,22586,27018,32948,21682,23822,22524,30869,40442,20316,21066,21643,25662,26152,26388,26613,31364,31574,32034,37679,26716,39853,31545,21273,20874,21047,23519,25334,25774,25830,26413,27578,34217,38609,30352,39894,25420,37638,39851,30399,26194,19977,20632,21442,23665,24808,25746,25955,26719,29158,29642,29987,31639,32386,34453,35715,36059,37240,39184,26028,26283,27531,20181,20180,20282,20351,21050,21496,21490,21987,22235,22763,22987,22985,23039,23376,23629,24066,24107,24535,24605,25351,25903,23388,26031,26045,26088,26525,27490,27515,27663,29509,31049,31169,31992,32025,32043,32930,33026,33267,35222,35422,35433,35430,35468,35566,36039,36060,38604,39164,27503,20107,20284,20365,20816,23383,23546,24904,25345,26178,27425,28363,27835,29246,29885,30164,30913,31034,32780,32819,33258,33940,36766,27728,40575,24335,35672,40235,31482,36600,23437,38635,19971,21489,22519,22833,23241,23460,24713,28287,28422,30142,36074,23455,34048,31712,20594,26612,33437,23649,34122,32286,33294,20889,23556,25448,36198,26012,29038,31038,32023,32773,35613,36554,36974,34503,37034,20511,21242,23610,26451,28796,29237,37196,37320,37675,33509,23490,24369,24825,20027,21462,23432,25163,26417,27530,29417,29664,31278,33131,36259,37202,39318,20754,21463,21610,23551,25480,27193,32172,38656,22234,21454,21608,23447,23601,24030,20462,24833,25342,27954,31168,31179,32066,32333,32722,33261,33311,33936,34886,35186,35728,36468,36655,36913,37195,37228,38598,37276,20160,20303,20805,21313,24467,25102,26580,27713,28171,29539,32294,37325,37507,21460,22809,23487,28113,31069,32302,31899,22654,29087,20986,34899,36848,20426,23803,26149,30636,31459,33308,39423,20934,24490,26092,26991,27529,28147,28310,28516,30462,32020,24033,36981,37255,38918,20966,21021,25152,26257,26329,28186,24246,32210,32626,26360,34223,34295,35576,21161,21465,22899,24207,24464,24661,37604,38500,20663,20767,21213,21280,21319,21484,21736,21830,21809,22039,22888,22974,23100,23477,23558,23567,23569,23578,24196,24202,24288,24432,25215,25220,25307,25484,25463,26119,26124,26157,26230,26494,26786,27167,27189,27836,28040,28169,28248,28988,28966,29031,30151,30465,30813,30977,31077,31216,31456,31505,31911,32057,32918,33750,33931,34121,34909,35059,35359,35388,35412,35443,35937,36062,37284,37478,37758,37912,38556,38808,19978,19976,19998,20055,20887,21104,22478,22580,22732,23330,24120,24773,25854,26465,26454,27972,29366,30067,31331,33976,35698,37304,37664,22065,22516,39166,25325,26893,27542,29165,32340,32887,33394,35302,39135,34645,36785,23611,20280,20449,20405,21767,23072,23517,23529,24515,24910,25391,26032,26187,26862,27035,28024,28145,30003,30137,30495,31070,31206,32051,33251,33455,34218,35242,35386,36523,36763,36914,37341,38663,20154,20161,20995,22645,22764,23563,29978,23613,33102,35338,36805,38499,38765,31525,35535,38920,37218,22259,21416,36887,21561,22402,24101,25512,27700,28810,30561,31883,32736,34928,36930,37204,37648,37656,38543,29790,39620,23815,23913,25968,26530,36264,38619,25454,26441,26905,33733,38935,38592,35070,28548,25722,23544,19990,28716,30045,26159,20932,21046,21218,22995,24449,24615,25104,25919,25972,26143,26228,26866,26646,27491,28165,29298,29983,30427,31934,32854,22768,35069,35199,35488,35475,35531,36893,37266,38738,38745,25993,31246,33030,38587,24109,24796,25114,26021,26132,26512,30707,31309,31821,32318,33034,36012,36196,36321,36447,30889,20999,25305,25509,25666,25240,35373,31363,31680,35500,38634,32118,33292,34633,20185,20808,21315,21344,23459,23554,23574,24029,25126,25159,25776,26643,26676,27849,27973,27927,26579,28508,29006,29053,26059,31359,31661,32218,32330,32680,33146,33307,33337,34214,35438,36046,36341,36984,36983,37549,37521,38275,39854,21069,21892,28472,28982,20840,31109,32341,33203,31950,22092,22609,23720,25514,26366,26365,26970,29401,30095,30094,30990,31062,31199,31895,32032,32068,34311,35380,38459,36961,40736,20711,21109,21452,21474,20489,21930,22766,22863,29245,23435,23652,21277,24803,24819,25436,25475,25407,25531,25805,26089,26361,24035,27085,27133,28437,29157,20105,30185,30456,31379,31967,32207,32156,32865,33609,33624,33900,33980,34299,35013,36208,36865,36973,37783,38684,39442,20687,22679,24974,33235,34101,36104,36896,20419,20596,21063,21363,24687,25417,26463,28204,36275,36895,20439,23646,36042,26063,32154,21330,34966,20854,25539,23384,23403,23562,25613,26449,36956,20182,22810,22826,27760,35409,21822,22549,22949,24816,25171,26561,33333,26965,38464,39364,39464,20307,22534,23550,32784,23729,24111,24453,24608,24907,25140,26367,27888,28382,32974,33151,33492,34955,36024,36864,36910,38538,40667,39899,20195,21488,22823,31532,37261,38988,40441,28381,28711,21331,21828,23429,25176,25246,25299,27810,28655,29730,35351,37944,28609,35582,33592,20967,34552,21482,21481,20294,36948,36784,22890,33073,24061,31466,36799,26842,35895,29432,40008,27197,35504,20025,21336,22022,22374,25285,25506,26086,27470,28129,28251,28845,30701,31471,31658,32187,32829,32966,34507,35477,37723,22243,22727,24382,26029,26262,27264,27573,30007,35527,20516,30693,22320,24347,24677,26234,27744,30196,31258,32622,33268,34584,36933,39347,31689,30044,31481,31569,33988,36880,31209,31378,33590,23265,30528,20013,20210,23449,24544,25277,26172,26609,27880,34411,34935,35387,37198,37619,39376,27159,28710,29482,33511,33879,36015,19969,20806,20939,21899,23541,24086,24115,24193,24340,24373,24427,24500,25074,25361,26274,26397,28526,29266,30010,30522,32884,33081,33144,34678,35519,35548,36229,36339,37530,38263,38914,40165,21189,25431,30452,26389,27784,29645,36035,37806,38515,27941,22684,26894,27084,36861,37786,30171,36890,22618,26626,25524,27131,20291,28460,26584,36795,34086,32180,37716,26943,28528,22378,22775,23340,32044,29226,21514,37347,40372,20141,20302,20572,20597,21059,35998,21576,22564,23450,24093,24213,24237,24311,24351,24716,25269,25402,25552,26799,27712,30855,31118,31243,32224,33351,35330,35558,36420,36883,37048,37165,37336,40718,27877,25688,25826,25973,28404,30340,31515,36969,37841,28346,21746,24505,25764,36685,36845,37444,20856,22635,22825,23637,24215,28155,32399,29980,36028,36578,39003,28857,20253,27583,28593,30000,38651,20814,21520,22581,22615,22956,23648,24466,26007,26460,28193,30331,33759,36077,36884,37117,37709,30757,30778,21162,24230,22303,22900,24594,20498,20826,20908,20941,20992,21776,22612,22616,22871,23445,23798,23947,24764,25237,25645,26481,26691,26812,26847,30423,28120,28271,28059,28783,29128,24403,30168,31095,31561,31572,31570,31958,32113,21040,33891,34153,34276,35342,35588,35910,36367,36867,36879,37913,38518,38957,39472,38360,20685,21205,21516,22530,23566,24999,25758,27934,30643,31461,33012,33796,36947,37509,23776,40199,21311,24471,24499,28060,29305,30563,31167,31716,27602,29420,35501,26627,27233,20984,31361,26932,23626,40182,33515,23493,37193,28702,22136,23663,24775,25958,27788,35930,36929,38931,21585,26311,37389,22856,37027,20869,20045,20970,34201,35598,28760,25466,37707,26978,39348,32260,30071,21335,26976,36575,38627,27741,20108,23612,24336,36841,21250,36049,32905,34425,24319,26085,20083,20837,22914,23615,38894,20219,22922,24525,35469,28641,31152,31074,23527,33905,29483,29105,24180,24565,25467,25754,29123,31896,20035,24316,20043,22492,22178,24745,28611,32013,33021,33075,33215,36786,35223,34468,24052,25226,25773,35207,26487,27874,27966,29750,30772,23110,32629,33453,39340,20467,24259,25309,25490,25943,26479,30403,29260,32972,32954,36649,37197,20493,22521,23186,26757,26995,29028,29437,36023,22770,36064,38506,36889,34687,31204,30695,33833,20271,21093,21338,25293,26575,27850,30333,31636,31893,33334,34180,36843,26333,28448,29190,32283,33707,39361,40614,20989,31665,30834,31672,32903,31560,27368,24161,32908,30033,30048,20843,37474,28300,30330,37271,39658,20240,32624,25244,31567,38309,40169,22138,22617,34532,38588,20276,21028,21322,21453,21467,24070,25644,26001,26495,27710,27726,29256,29359,29677,30036,32321,33324,34281,36009,31684,37318,29033,38930,39151,25405,26217,30058,30436,30928,34115,34542,21290,21329,21542,22915,24199,24444,24754,25161,25209,25259,26000,27604,27852,30130,30382,30865,31192,32203,32631,32933,34987,35513,36027,36991,38750,39131,27147,31800,20633,23614,24494,26503,27608,29749,30473,32654,40763,26570,31255,21305,30091,39661,24422,33181,33777,32920,24380,24517,30050,31558,36924,26727,23019,23195,32016,30334,35628,20469,24426,27161,27703,28418,29922,31080,34920,35413,35961,24287,25551,30149,31186,33495,37672,37618,33948,34541,39981,21697,24428,25996,27996,28693,36007,36051,38971,25935,29942,19981,20184,22496,22827,23142,23500,20904,24067,24220,24598,25206,25975,26023,26222,28014,29238,31526,33104,33178,33433,35676,36000,36070,36212,38428,38468,20398,25771,27494,33310,33889,34154,37096,23553,26963,39080,33914,34135,20239,21103,24489,24133,26381,31119,33145,35079,35206,28149,24343,25173,27832,20175,29289,39826,20998,21563,22132,22707,24996,25198,28954,22894,31881,31966,32027,38640,25991,32862,19993,20341,20853,22592,24163,24179,24330,26564,20006,34109,38281,38491,31859,38913,20731,22721,30294,30887,21029,30629,34065,31622,20559,22793,29255,31687,32232,36794,36820,36941,20415,21193,23081,24321,38829,20445,33303,37610,22275,25429,27497,29995,35036,36628,31298,21215,22675,24917,25098,26286,27597,31807,33769,20515,20472,21253,21574,22577,22857,23453,23792,23791,23849,24214,25265,25447,25918,26041,26379,27861,27873,28921,30770,32299,32990,33459,33804,34028,34562,35090,35370,35914,37030,37586,39165,40179,40300,20047,20129,20621,21078,22346,22952,24125,24536,24537,25151,26292,26395,26576,26834,20882,32033,32938,33192,35584,35980,36031,37502,38450,21536,38956,21271,20693,21340,22696,25778,26420,29287,30566,31302,37350,21187,27809,27526,22528,24140,22868,26412,32763,20961,30406,25705,30952,39764,40635,22475,22969,26151,26522,27598,21737,27097,24149,33180,26517,39850,26622,40018,26717,20134,20451,21448,25273,26411,27819,36804,20397,32365,40639,19975,24930,28288,28459,34067,21619,26410,39749,24051,31637,23724,23494,34588,28234,34001,31252,33032,22937,31885,27665,30496,21209,22818,28961,29279,30683,38695,40289,26891,23167,23064,20901,21517,21629,26126,30431,36855,37528,40180,23018,29277,28357,20813,26825,32191,32236,38754,40634,25720,27169,33538,22916,23391,27611,29467,30450,32178,32791,33945,20786,26408,40665,30446,26466,21247,39173,23588,25147,31870,36016,21839,24758,32011,38272,21249,20063,20918,22812,29242,32822,37326,24357,30690,21380,24441,32004,34220,35379,36493,38742,26611,34222,37971,24841,24840,27833,30290,35565,36664,21807,20305,20778,21191,21451,23461,24189,24736,24962,25558,26377,26586,28263,28044,29494,29495,30001,31056,35029,35480,36938,37009,37109,38596,34701,22805,20104,20313,19982,35465,36671,38928,20653,24188,22934,23481,24248,25562,25594,25793,26332,26954,27096,27915,28342,29076,29992,31407,32650,32768,33865,33993,35201,35617,36362,36965,38525,39178,24958,25233,27442,27779,28020,32716,32764,28096,32645,34746,35064,26469,33713,38972,38647,27931,32097,33853,37226,20081,21365,23888,27396,28651,34253,34349,35239,21033,21519,23653,26446,26792,29702,29827,30178,35023,35041,37324,38626,38520,24459,29575,31435,33870,25504,30053,21129,27969,28316,29705,30041,30827,31890,38534,31452,40845,20406,24942,26053,34396,20102,20142,20698,20001,20940,23534,26009,26753,28092,29471,30274,30637,31260,31975,33391,35538,36988,37327,38517,38936,21147,32209,20523,21400,26519,28107,29136,29747,33256,36650,38563,40023,40607,29792,22593,28057,32047,39006,20196,20278,20363,20919,21169,23994,24604,29618,31036,33491,37428,38583,38646,38666,40599,40802,26278,27508,21015,21155,28872,35010,24265,24651,24976,28451,29001,31806,32244,32879,34030,36899,37676,21570,39791,27347,28809,36034,36335,38706,21172,23105,24266,24324,26391,27004,27028,28010,28431,29282,29436,31725,32769,32894,34635,37070,20845,40595,31108,32907,37682,35542,20525,21644,35441,27498,36036,33031,24785,26528,40434,20121,20120,39952,35435,34241,34152,26880,28286,30871,33109,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,24332,19984,19989,20010,20017,20022,20028,20031,20034,20054,20056,20098,20101,35947,20106,33298,24333,20110,20126,20127,20128,20130,20144,20147,20150,20174,20173,20164,20166,20162,20183,20190,20205,20191,20215,20233,20314,20272,20315,20317,20311,20295,20342,20360,20367,20376,20347,20329,20336,20369,20335,20358,20374,20760,20436,20447,20430,20440,20443,20433,20442,20432,20452,20453,20506,20520,20500,20522,20517,20485,20252,20470,20513,20521,20524,20478,20463,20497,20486,20547,20551,26371,20565,20560,20552,20570,20566,20588,20600,20608,20634,20613,20660,20658,20681,20682,20659,20674,20694,20702,20709,20717,20707,20718,20729,20725,20745,20737,20738,20758,20757,20756,20762,20769,20794,20791,20796,20795,20799,20800,20818,20812,20820,20834,31480,20841,20842,20846,20864,20866,22232,20876,20873,20879,20881,20883,20885,20886,20900,20902,20898,20905,20906,20907,20915,20913,20914,20912,20917,20925,20933,20937,20955,20960,34389,20969,20973,20976,20981,20990,20996,21003,21012,21006,21031,21034,21038,21043,21049,21071,21060,21067,21068,21086,21076,21098,21108,21097,21107,21119,21117,21133,21140,21138,21105,21128,21137,36776,36775,21164,21165,21180,21173,21185,21197,21207,21214,21219,21222,39149,21216,21235,21237,21240,21241,21254,21256,30008,21261,21264,21263,21269,21274,21283,21295,21297,21299,21304,21312,21318,21317,19991,21321,21325,20950,21342,21353,21358,22808,21371,21367,21378,21398,21408,21414,21413,21422,21424,21430,21443,31762,38617,21471,26364,29166,21486,21480,21485,21498,21505,21565,21568,21548,21549,21564,21550,21558,21545,21533,21582,21647,21621,21646,21599,21617,21623,21616,21650,21627,21632,21622,21636,21648,21638,21703,21666,21688,21669,21676,21700,21704,21672,21675,21698,21668,21694,21692,21720,21733,21734,21775,21780,21757,21742,21741,21754,21730,21817,21824,21859,21836,21806,21852,21829,21846,21847,21816,21811,21853,21913,21888,21679,21898,21919,21883,21886,21912,21918,21934,21884,21891,21929,21895,21928,21978,21957,21983,21956,21980,21988,21972,22036,22007,22038,22014,22013,22043,22009,22094,22096,29151,22068,22070,22066,22072,22123,22116,22063,22124,22122,22150,22144,22154,22176,22164,22159,22181,22190,22198,22196,22210,22204,22209,22211,22208,22216,22222,22225,22227,22231,22254,22265,22272,22271,22276,22281,22280,22283,22285,22291,22296,22294,21959,22300,22310,22327,22328,22350,22331,22336,22351,22377,22464,22408,22369,22399,22409,22419,22432,22451,22436,22442,22448,22467,22470,22484,22482,22483,22538,22486,22499,22539,22553,22557,22642,22561,22626,22603,22640,27584,22610,22589,22649,22661,22713,22687,22699,22714,22750,22715,22712,22702,22725,22739,22737,22743,22745,22744,22757,22748,22756,22751,22767,22778,22777,22779,22780,22781,22786,22794,22800,22811,26790,22821,22828,22829,22834,22840,22846,31442,22869,22864,22862,22874,22872,22882,22880,22887,22892,22889,22904,22913,22941,20318,20395,22947,22962,22982,23016,23004,22925,23001,23002,23077,23071,23057,23068,23049,23066,23104,23148,23113,23093,23094,23138,23146,23194,23228,23230,23243,23234,23229,23267,23255,23270,23273,23254,23290,23291,23308,23307,23318,23346,23248,23338,23350,23358,23363,23365,23360,23377,23381,23386,23387,23397,23401,23408,23411,23413,23416,25992,23418,23424,23427,23462,23480,23491,23495,23497,23508,23504,23524,23526,23522,23518,23525,23531,23536,23542,23539,23557,23559,23560,23565,23571,23584,23586,23592,23608,23609,23617,23622,23630,23635,23632,23631,23409,23660,23662,20066,23670,23673,23692,23697,23700,22939,23723,23739,23734,23740,23735,23749,23742,23751,23769,23785,23805,23802,23789,23948,23786,23819,23829,23831,23900,23839,23835,23825,23828,23842,23834,23833,23832,23884,23890,23886,23883,23916,23923,23926,23943,23940,23938,23970,23965,23980,23982,23997,23952,23991,23996,24009,24013,24019,24018,24022,24027,24043,24050,24053,24075,24090,24089,24081,24091,24118,24119,24132,24131,24128,24142,24151,24148,24159,24162,24164,24135,24181,24182,24186,40636,24191,24224,24257,24258,24264,24272,24271,24278,24291,24285,24282,24283,24290,24289,24296,24297,24300,24305,24307,24304,24308,24312,24318,24323,24329,24413,24412,24331,24337,24342,24361,24365,24376,24385,24392,24396,24398,24367,24401,24406,24407,24409,24417,24429,24435,24439,24451,24450,24447,24458,24456,24465,24455,24478,24473,24472,24480,24488,24493,24508,24534,24571,24548,24568,24561,24541,24755,24575,24609,24672,24601,24592,24617,24590,24625,24603,24597,24619,24614,24591,24634,24666,24641,24682,24695,24671,24650,24646,24653,24675,24643,24676,24642,24684,24683,24665,24705,24717,24807,24707,24730,24708,24731,24726,24727,24722,24743,24715,24801,24760,24800,24787,24756,24560,24765,24774,24757,24792,24909,24853,24838,24822,24823,24832,24820,24826,24835,24865,24827,24817,24845,24846,24903,24894,24872,24871,24906,24895,24892,24876,24884,24893,24898,24900,24947,24951,24920,24921,24922,24939,24948,24943,24933,24945,24927,24925,24915,24949,24985,24982,24967,25004,24980,24986,24970,24977,25003,25006,25036,25034,25033,25079,25032,25027,25030,25018,25035,32633,25037,25062,25059,25078,25082,25076,25087,25085,25084,25086,25088,25096,25097,25101,25100,25108,25115,25118,25121,25130,25134,25136,25138,25139,25153,25166,25182,25187,25179,25184,25192,25212,25218,25225,25214,25234,25235,25238,25300,25219,25236,25303,25297,25275,25295,25343,25286,25812,25288,25308,25292,25290,25282,25287,25243,25289,25356,25326,25329,25383,25346,25352,25327,25333,25424,25406,25421,25628,25423,25494,25486,25472,25515,25462,25507,25487,25481,25503,25525,25451,25449,25534,25577,25536,25542,25571,25545,25554,25590,25540,25622,25652,25606,25619,25638,25654,25885,25623,25640,25615,25703,25711,25718,25678,25898,25749,25747,25765,25769,25736,25788,25818,25810,25797,25799,25787,25816,25794,25841,25831,33289,25824,25825,25260,25827,25839,25900,25846,25844,25842,25850,25856,25853,25880,25884,25861,25892,25891,25899,25908,25909,25911,25910,25912,30027,25928,25942,25941,25933,25944,25950,25949,25970,25976,25986,25987,35722,26011,26015,26027,26039,26051,26054,26049,26052,26060,26066,26075,26073,26080,26081,26097,26482,26122,26115,26107,26483,26165,26166,26164,26140,26191,26180,26185,26177,26206,26205,26212,26215,26216,26207,26210,26224,26243,26248,26254,26249,26244,26264,26269,26305,26297,26313,26302,26300,26308,26296,26326,26330,26336,26175,26342,26345,26352,26357,26359,26383,26390,26398,26406,26407,38712,26414,26431,26422,26433,26424,26423,26438,26462,26464,26457,26467,26468,26505,26480,26537,26492,26474,26508,26507,26534,26529,26501,26551,26607,26548,26604,26547,26601,26552,26596,26590,26589,26594,26606,26553,26574,26566,26599,27292,26654,26694,26665,26688,26701,26674,26702,26803,26667,26713,26723,26743,26751,26783,26767,26797,26772,26781,26779,26755,27310,26809,26740,26805,26784,26810,26895,26765,26750,26881,26826,26888,26840,26914,26918,26849,26892,26829,26836,26855,26837,26934,26898,26884,26839,26851,26917,26873,26848,26863,26920,26922,26906,26915,26913,26822,27001,26999,26972,27000,26987,26964,27006,26990,26937,26996,26941,26969,26928,26977,26974,26973,27009,26986,27058,27054,27088,27071,27073,27091,27070,27086,23528,27082,27101,27067,27075,27047,27182,27025,27040,27036,27029,27060,27102,27112,27138,27163,27135,27402,27129,27122,27111,27141,27057,27166,27117,27156,27115,27146,27154,27329,27171,27155,27204,27148,27250,27190,27256,27207,27234,27225,27238,27208,27192,27170,27280,27277,27296,27268,27298,27299,27287,34327,27323,27331,27330,27320,27315,27308,27358,27345,27359,27306,27354,27370,27387,27397,34326,27386,27410,27414,39729,27423,27448,27447,30428,27449,39150,27463,27459,27465,27472,27481,27476,27483,27487,27489,27512,27513,27519,27520,27524,27523,27533,27544,27541,27550,27556,27562,27563,27567,27570,27569,27571,27575,27580,27590,27595,27603,27615,27628,27627,27635,27631,40638,27656,27667,27668,27675,27684,27683,27742,27733,27746,27754,27778,27789,27802,27777,27803,27774,27752,27763,27794,27792,27844,27889,27859,27837,27863,27845,27869,27822,27825,27838,27834,27867,27887,27865,27882,27935,34893,27958,27947,27965,27960,27929,27957,27955,27922,27916,28003,28051,28004,27994,28025,27993,28046,28053,28644,28037,28153,28181,28170,28085,28103,28134,28088,28102,28140,28126,28108,28136,28114,28101,28154,28121,28132,28117,28138,28142,28205,28270,28206,28185,28274,28255,28222,28195,28267,28203,28278,28237,28191,28227,28218,28238,28196,28415,28189,28216,28290,28330,28312,28361,28343,28371,28349,28335,28356,28338,28372,28373,28303,28325,28354,28319,28481,28433,28748,28396,28408,28414,28479,28402,28465,28399,28466,28364,28478,28435,28407,28550,28538,28536,28545,28544,28527,28507,28659,28525,28546,28540,28504,28558,28561,28610,28518,28595,28579,28577,28580,28601,28614,28586,28639,28629,28652,28628,28632,28657,28654,28635,28681,28683,28666,28689,28673,28687,28670,28699,28698,28532,28701,28696,28703,28720,28734,28722,28753,28771,28825,28818,28847,28913,28844,28856,28851,28846,28895,28875,28893,28889,28937,28925,28956,28953,29029,29013,29064,29030,29026,29004,29014,29036,29071,29179,29060,29077,29096,29100,29143,29113,29118,29138,29129,29140,29134,29152,29164,29159,29173,29180,29177,29183,29197,29200,29211,29224,29229,29228,29232,29234,29243,29244,29247,29248,29254,29259,29272,29300,29310,29314,29313,29319,29330,29334,29346,29351,29369,29362,29379,29382,29380,29390,29394,29410,29408,29409,29433,29431,20495,29463,29450,29468,29462,29469,29492,29487,29481,29477,29502,29518,29519,40664,29527,29546,29544,29552,29560,29557,29563,29562,29640,29619,29646,29627,29632,29669,29678,29662,29858,29701,29807,29733,29688,29746,29754,29781,29759,29791,29785,29761,29788,29801,29808,29795,29802,29814,29822,29835,29854,29863,29898,29903,29908,29681,29920,29923,29927,29929,29934,29938,29936,29937,29944,29943,29956,29955,29957,29964,29966,29965,29973,29971,29982,29990,29996,30012,30020,30029,30026,30025,30043,30022,30042,30057,30052,30055,30059,30061,30072,30070,30086,30087,30068,30090,30089,30082,30100,30106,30109,30117,30115,30146,30131,30147,30133,30141,30136,30140,30129,30157,30154,30162,30169,30179,30174,30206,30207,30204,30209,30192,30202,30194,30195,30219,30221,30217,30239,30247,30240,30241,30242,30244,30260,30256,30267,30279,30280,30278,30300,30296,30305,30306,30312,30313,30314,30311,30316,30320,30322,30326,30328,30332,30336,30339,30344,30347,30350,30358,30355,30361,30362,30384,30388,30392,30393,30394,30402,30413,30422,30418,30430,30433,30437,30439,30442,34351,30459,30472,30471,30468,30505,30500,30494,30501,30502,30491,30519,30520,30535,30554,30568,30571,30555,30565,30591,30590,30585,30606,30603,30609,30624,30622,30640,30646,30649,30655,30652,30653,30651,30663,30669,30679,30682,30684,30691,30702,30716,30732,30738,31014,30752,31018,30789,30862,30836,30854,30844,30874,30860,30883,30901,30890,30895,30929,30918,30923,30932,30910,30908,30917,30922,30956,30951,30938,30973,30964,30983,30994,30993,31001,31020,31019,31040,31072,31063,31071,31066,31061,31059,31098,31103,31114,31133,31143,40779,31146,31150,31155,31161,31162,31177,31189,31207,31212,31201,31203,31240,31245,31256,31257,31264,31263,31104,31281,31291,31294,31287,31299,31319,31305,31329,31330,31337,40861,31344,31353,31357,31368,31383,31381,31384,31382,31401,31432,31408,31414,31429,31428,31423,36995,31431,31434,31437,31439,31445,31443,31449,31450,31453,31457,31458,31462,31469,31472,31490,31503,31498,31494,31539,31512,31513,31518,31541,31528,31542,31568,31610,31492,31565,31499,31564,31557,31605,31589,31604,31591,31600,31601,31596,31598,31645,31640,31647,31629,31644,31642,31627,31634,31631,31581,31641,31691,31681,31692,31695,31668,31686,31709,31721,31761,31764,31718,31717,31840,31744,31751,31763,31731,31735,31767,31757,31734,31779,31783,31786,31775,31799,31787,31805,31820,31811,31828,31823,31808,31824,31832,31839,31844,31830,31845,31852,31861,31875,31888,31908,31917,31906,31915,31905,31912,31923,31922,31921,31918,31929,31933,31936,31941,31938,31960,31954,31964,31970,39739,31983,31986,31988,31990,31994,32006,32002,32028,32021,32010,32069,32075,32046,32050,32063,32053,32070,32115,32086,32078,32114,32104,32110,32079,32099,32147,32137,32091,32143,32125,32155,32186,32174,32163,32181,32199,32189,32171,32317,32162,32175,32220,32184,32159,32176,32216,32221,32228,32222,32251,32242,32225,32261,32266,32291,32289,32274,32305,32287,32265,32267,32290,32326,32358,32315,32309,32313,32323,32311,32306,32314,32359,32349,32342,32350,32345,32346,32377,32362,32361,32380,32379,32387,32213,32381,36782,32383,32392,32393,32396,32402,32400,32403,32404,32406,32398,32411,32412,32568,32570,32581,32588,32589,32590,32592,32593,32597,32596,32600,32607,32608,32616,32617,32615,32632,32642,32646,32643,32648,32647,32652,32660,32670,32669,32666,32675,32687,32690,32697,32686,32694,32696,35697,32709,32710,32714,32725,32724,32737,32742,32745,32755,32761,39132,32774,32772,32779,32786,32792,32793,32796,32801,32808,32831,32827,32842,32838,32850,32856,32858,32863,32866,32872,32883,32882,32880,32886,32889,32893,32895,32900,32902,32901,32923,32915,32922,32941,20880,32940,32987,32997,32985,32989,32964,32986,32982,33033,33007,33009,33051,33065,33059,33071,33099,38539,33094,33086,33107,33105,33020,33137,33134,33125,33126,33140,33155,33160,33162,33152,33154,33184,33173,33188,33187,33119,33171,33193,33200,33205,33214,33208,33213,33216,33218,33210,33225,33229,33233,33241,33240,33224,33242,33247,33248,33255,33274,33275,33278,33281,33282,33285,33287,33290,33293,33296,33302,33321,33323,33336,33331,33344,33369,33368,33373,33370,33375,33380,33378,33384,33386,33387,33326,33393,33399,33400,33406,33421,33426,33451,33439,33467,33452,33505,33507,33503,33490,33524,33523,33530,33683,33539,33531,33529,33502,33542,33500,33545,33497,33589,33588,33558,33586,33585,33600,33593,33616,33605,33583,33579,33559,33560,33669,33690,33706,33695,33698,33686,33571,33678,33671,33674,33660,33717,33651,33653,33696,33673,33704,33780,33811,33771,33742,33789,33795,33752,33803,33729,33783,33799,33760,33778,33805,33826,33824,33725,33848,34054,33787,33901,33834,33852,34138,33924,33911,33899,33965,33902,33922,33897,33862,33836,33903,33913,33845,33994,33890,33977,33983,33951,34009,33997,33979,34010,34000,33985,33990,34006,33953,34081,34047,34036,34071,34072,34092,34079,34069,34068,34044,34112,34147,34136,34120,34113,34306,34123,34133,34176,34212,34184,34193,34186,34216,34157,34196,34203,34282,34183,34204,34167,34174,34192,34249,34234,34255,34233,34256,34261,34269,34277,34268,34297,34314,34323,34315,34302,34298,34310,34338,34330,34352,34367,34381,20053,34388,34399,34407,34417,34451,34467,34473,34474,34443,34444,34486,34479,34500,34502,34480,34505,34851,34475,34516,34526,34537,34540,34527,34523,34543,34578,34566,34568,34560,34563,34555,34577,34569,34573,34553,34570,34612,34623,34615,34619,34597,34601,34586,34656,34655,34680,34636,34638,34676,34647,34664,34670,34649,34643,34659,34666,34821,34722,34719,34690,34735,34763,34749,34752,34768,38614,34731,34756,34739,34759,34758,34747,34799,34802,34784,34831,34829,34814,34806,34807,34830,34770,34833,34838,34837,34850,34849,34865,34870,34873,34855,34875,34884,34882,34898,34905,34910,34914,34923,34945,34942,34974,34933,34941,34997,34930,34946,34967,34962,34990,34969,34978,34957,34980,34992,35007,34993,35011,35012,35028,35032,35033,35037,35065,35074,35068,35060,35048,35058,35076,35084,35082,35091,35139,35102,35109,35114,35115,35137,35140,35131,35126,35128,35148,35101,35168,35166,35174,35172,35181,35178,35183,35188,35191,35198,35203,35208,35210,35219,35224,35233,35241,35238,35244,35247,35250,35258,35261,35263,35264,35290,35292,35293,35303,35316,35320,35331,35350,35344,35340,35355,35357,35365,35382,35393,35419,35410,35398,35400,35452,35437,35436,35426,35461,35458,35460,35496,35489,35473,35493,35494,35482,35491,35524,35533,35522,35546,35563,35571,35559,35556,35569,35604,35552,35554,35575,35550,35547,35596,35591,35610,35553,35606,35600,35607,35616,35635,38827,35622,35627,35646,35624,35649,35660,35663,35662,35657,35670,35675,35674,35691,35679,35692,35695,35700,35709,35712,35724,35726,35730,35731,35734,35737,35738,35898,35905,35903,35912,35916,35918,35920,35925,35938,35948,35960,35962,35970,35977,35973,35978,35981,35982,35988,35964,35992,25117,36013,36010,36029,36018,36019,36014,36022,36040,36033,36068,36067,36058,36093,36090,36091,36100,36101,36106,36103,36111,36109,36112,40782,36115,36045,36116,36118,36199,36205,36209,36211,36225,36249,36290,36286,36282,36303,36314,36310,36300,36315,36299,36330,36331,36319,36323,36348,36360,36361,36351,36381,36382,36368,36383,36418,36405,36400,36404,36426,36423,36425,36428,36432,36424,36441,36452,36448,36394,36451,36437,36470,36466,36476,36481,36487,36485,36484,36491,36490,36499,36497,36500,36505,36522,36513,36524,36528,36550,36529,36542,36549,36552,36555,36571,36579,36604,36603,36587,36606,36618,36613,36629,36626,36633,36627,36636,36639,36635,36620,36646,36659,36667,36665,36677,36674,36670,36684,36681,36678,36686,36695,36700,36706,36707,36708,36764,36767,36771,36781,36783,36791,36826,36837,36834,36842,36847,36999,36852,36869,36857,36858,36881,36885,36897,36877,36894,36886,36875,36903,36918,36917,36921,36856,36943,36944,36945,36946,36878,36937,36926,36950,36952,36958,36968,36975,36982,38568,36978,36994,36989,36993,36992,37002,37001,37007,37032,37039,37041,37045,37090,37092,25160,37083,37122,37138,37145,37170,37168,37194,37206,37208,37219,37221,37225,37235,37234,37259,37257,37250,37282,37291,37295,37290,37301,37300,37306,37312,37313,37321,37323,37328,37334,37343,37345,37339,37372,37365,37366,37406,37375,37396,37420,37397,37393,37470,37463,37445,37449,37476,37448,37525,37439,37451,37456,37532,37526,37523,37531,37466,37583,37561,37559,37609,37647,37626,37700,37678,37657,37666,37658,37667,37690,37685,37691,37724,37728,37756,37742,37718,37808,37804,37805,37780,37817,37846,37847,37864,37861,37848,37827,37853,37840,37832,37860,37914,37908,37907,37891,37895,37904,37942,37931,37941,37921,37946,37953,37970,37956,37979,37984,37986,37982,37994,37417,38000,38005,38007,38013,37978,38012,38014,38017,38015,38274,38279,38282,38292,38294,38296,38297,38304,38312,38311,38317,38332,38331,38329,38334,38346,28662,38339,38349,38348,38357,38356,38358,38364,38369,38373,38370,38433,38440,38446,38447,38466,38476,38479,38475,38519,38492,38494,38493,38495,38502,38514,38508,38541,38552,38549,38551,38570,38567,38577,38578,38576,38580,38582,38584,38585,38606,38603,38601,38605,35149,38620,38669,38613,38649,38660,38662,38664,38675,38670,38673,38671,38678,38681,38692,38698,38704,38713,38717,38718,38724,38726,38728,38722,38729,38748,38752,38756,38758,38760,21202,38763,38769,38777,38789,38780,38785,38778,38790,38795,38799,38800,38812,38824,38822,38819,38835,38836,38851,38854,38856,38859,38876,38893,40783,38898,31455,38902,38901,38927,38924,38968,38948,38945,38967,38973,38982,38991,38987,39019,39023,39024,39025,39028,39027,39082,39087,39089,39094,39108,39107,39110,39145,39147,39171,39177,39186,39188,39192,39201,39197,39198,39204,39200,39212,39214,39229,39230,39234,39241,39237,39248,39243,39249,39250,39244,39253,39319,39320,39333,39341,39342,39356,39391,39387,39389,39384,39377,39405,39406,39409,39410,39419,39416,39425,39439,39429,39394,39449,39467,39479,39493,39490,39488,39491,39486,39509,39501,39515,39511,39519,39522,39525,39524,39529,39531,39530,39597,39600,39612,39616,39631,39633,39635,39636,39646,39647,39650,39651,39654,39663,39659,39662,39668,39665,39671,39675,39686,39704,39706,39711,39714,39715,39717,39719,39720,39721,39722,39726,39727,39730,39748,39747,39759,39757,39758,39761,39768,39796,39827,39811,39825,39830,39831,39839,39840,39848,39860,39872,39882,39865,39878,39887,39889,39890,39907,39906,39908,39892,39905,39994,39922,39921,39920,39957,39956,39945,39955,39948,39942,39944,39954,39946,39940,39982,39963,39973,39972,39969,39984,40007,39986,40006,39998,40026,40032,40039,40054,40056,40167,40172,40176,40201,40200,40171,40195,40198,40234,40230,40367,40227,40223,40260,40213,40210,40257,40255,40254,40262,40264,40285,40286,40292,40273,40272,40281,40306,40329,40327,40363,40303,40314,40346,40356,40361,40370,40388,40385,40379,40376,40378,40390,40399,40386,40409,40403,40440,40422,40429,40431,40445,40474,40475,40478,40565,40569,40573,40577,40584,40587,40588,40594,40597,40593,40605,40613,40617,40632,40618,40621,38753,40652,40654,40655,40656,40660,40668,40670,40669,40672,40677,40680,40687,40692,40694,40695,40697,40699,40700,40701,40711,40712,30391,40725,40737,40748,40766,40778,40786,40788,40803,40799,40800,40801,40806,40807,40812,40810,40823,40818,40822,40853,40860,40864,22575,27079,36953,29796,20956,29081,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,32394,35100,37704,37512,34012,20425,28859,26161,26824,37625,26363,24389,20008,20193,20220,20224,20227,20281,20310,20370,20362,20378,20372,20429,20544,20514,20479,20510,20550,20592,20546,20628,20724,20696,20810,20836,20893,20926,20972,21013,21148,21158,21184,21211,21248,21255,21284,21362,21395,21426,21469,64014,21660,21642,21673,21759,21894,22361,22373,22444,22472,22471,64015,64016,22686,22706,22795,22867,22875,22877,22883,22948,22970,23382,23488,29999,23512,23532,23582,23718,23738,23797,23847,23891,64017,23874,23917,23992,23993,24016,24353,24372,24423,24503,24542,24669,24709,24714,24798,24789,24864,24818,24849,24887,24880,24984,25107,25254,25589,25696,25757,25806,25934,26112,26133,26171,26121,26158,26142,26148,26213,26199,26201,64018,26227,26265,26272,26290,26303,26362,26382,63785,26470,26555,26706,26560,26625,26692,26831,64019,26984,64020,27032,27106,27184,27243,27206,27251,27262,27362,27364,27606,27711,27740,27782,27759,27866,27908,28039,28015,28054,28076,28111,28152,28146,28156,28217,28252,28199,28220,28351,28552,28597,28661,28677,28679,28712,28805,28843,28943,28932,29020,28998,28999,64021,29121,29182,29361,29374,29476,64022,29559,29629,29641,29654,29667,29650,29703,29685,29734,29738,29737,29742,29794,29833,29855,29953,30063,30338,30364,30366,30363,30374,64023,30534,21167,30753,30798,30820,30842,31024,64024,64025,64026,31124,64027,31131,31441,31463,64028,31467,31646,64029,32072,32092,32183,32160,32214,32338,32583,32673,64030,33537,33634,33663,33735,33782,33864,33972,34131,34137,34155,64031,34224,64032,64033,34823,35061,35346,35383,35449,35495,35518,35551,64034,35574,35667,35711,36080,36084,36114,36214,64035,36559,64036,64037,36967,37086,64038,37141,37159,37338,37335,37342,37357,37358,37348,37349,37382,37392,37386,37434,37440,37436,37454,37465,37457,37433,37479,37543,37495,37496,37607,37591,37593,37584,64039,37589,37600,37587,37669,37665,37627,64040,37662,37631,37661,37634,37744,37719,37796,37830,37854,37880,37937,37957,37960,38290,63964,64041,38557,38575,38707,38715,38723,38733,38735,38737,38741,38999,39013,64042,64043,39207,64044,39326,39502,39641,39644,39797,39794,39823,39857,39867,39936,40304,40299,64045,40473,40657,null,null,8560,8561,8562,8563,8564,8565,8566,8567,8568,8569,65506,65508,65287,65282,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,8560,8561,8562,8563,8564,8565,8566,8567,8568,8569,8544,8545,8546,8547,8548,8549,8550,8551,8552,8553,65506,65508,65287,65282,12849,8470,8481,8757,32394,35100,37704,37512,34012,20425,28859,26161,26824,37625,26363,24389,20008,20193,20220,20224,20227,20281,20310,20370,20362,20378,20372,20429,20544,20514,20479,20510,20550,20592,20546,20628,20724,20696,20810,20836,20893,20926,20972,21013,21148,21158,21184,21211,21248,21255,21284,21362,21395,21426,21469,64014,21660,21642,21673,21759,21894,22361,22373,22444,22472,22471,64015,64016,22686,22706,22795,22867,22875,22877,22883,22948,22970,23382,23488,29999,23512,23532,23582,23718,23738,23797,23847,23891,64017,23874,23917,23992,23993,24016,24353,24372,24423,24503,24542,24669,24709,24714,24798,24789,24864,24818,24849,24887,24880,24984,25107,25254,25589,25696,25757,25806,25934,26112,26133,26171,26121,26158,26142,26148,26213,26199,26201,64018,26227,26265,26272,26290,26303,26362,26382,63785,26470,26555,26706,26560,26625,26692,26831,64019,26984,64020,27032,27106,27184,27243,27206,27251,27262,27362,27364,27606,27711,27740,27782,27759,27866,27908,28039,28015,28054,28076,28111,28152,28146,28156,28217,28252,28199,28220,28351,28552,28597,28661,28677,28679,28712,28805,28843,28943,28932,29020,28998,28999,64021,29121,29182,29361,29374,29476,64022,29559,29629,29641,29654,29667,29650,29703,29685,29734,29738,29737,29742,29794,29833,29855,29953,30063,30338,30364,30366,30363,30374,64023,30534,21167,30753,30798,30820,30842,31024,64024,64025,64026,31124,64027,31131,31441,31463,64028,31467,31646,64029,32072,32092,32183,32160,32214,32338,32583,32673,64030,33537,33634,33663,33735,33782,33864,33972,34131,34137,34155,64031,34224,64032,64033,34823,35061,35346,35383,35449,35495,35518,35551,64034,35574,35667,35711,36080,36084,36114,36214,64035,36559,64036,64037,36967,37086,64038,37141,37159,37338,37335,37342,37357,37358,37348,37349,37382,37392,37386,37434,37440,37436,37454,37465,37457,37433,37479,37543,37495,37496,37607,37591,37593,37584,64039,37589,37600,37587,37669,37665,37627,64040,37662,37631,37661,37634,37744,37719,37796,37830,37854,37880,37937,37957,37960,38290,63964,64041,38557,38575,38707,38715,38723,38733,38735,38737,38741,38999,39013,64042,64043,39207,64044,39326,39502,39641,39644,39797,39794,39823,39857,39867,39936,40304,40299,64045,40473,40657,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  "jis0212":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,728,711,184,729,733,175,731,730,65374,900,901,null,null,null,null,null,null,null,null,161,166,191,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,186,170,169,174,8482,164,8470,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,902,904,905,906,938,null,908,null,910,939,null,911,null,null,null,null,940,941,942,943,970,912,972,962,973,971,944,974,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1038,1039,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1118,1119,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,198,272,null,294,null,306,null,321,319,null,330,216,338,null,358,222,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,230,273,240,295,305,307,312,322,320,329,331,248,339,223,359,254,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,193,192,196,194,258,461,256,260,197,195,262,264,268,199,266,270,201,200,203,202,282,278,274,280,null,284,286,290,288,292,205,204,207,206,463,304,298,302,296,308,310,313,317,315,323,327,325,209,211,210,214,212,465,336,332,213,340,344,342,346,348,352,350,356,354,218,217,220,219,364,467,368,362,370,366,360,471,475,473,469,372,221,376,374,377,381,379,null,null,null,null,null,null,null,225,224,228,226,259,462,257,261,229,227,263,265,269,231,267,271,233,232,235,234,283,279,275,281,501,285,287,null,289,293,237,236,239,238,464,null,299,303,297,309,311,314,318,316,324,328,326,241,243,242,246,244,466,337,333,245,341,345,343,347,349,353,351,357,355,250,249,252,251,365,468,369,363,371,367,361,472,476,474,470,373,253,255,375,378,382,380,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,19970,19972,19973,19980,19986,19999,20003,20004,20008,20011,20014,20015,20016,20021,20032,20033,20036,20039,20049,20058,20060,20067,20072,20073,20084,20085,20089,20095,20109,20118,20119,20125,20143,20153,20163,20176,20186,20187,20192,20193,20194,20200,20207,20209,20211,20213,20221,20222,20223,20224,20226,20227,20232,20235,20236,20242,20245,20246,20247,20249,20270,20273,20320,20275,20277,20279,20281,20283,20286,20288,20290,20296,20297,20299,20300,20306,20308,20310,20312,20319,20323,20330,20332,20334,20337,20343,20344,20345,20346,20349,20350,20353,20354,20356,20357,20361,20362,20364,20366,20368,20370,20371,20372,20375,20377,20378,20382,20383,20402,20407,20409,20411,20412,20413,20414,20416,20417,20421,20422,20424,20425,20427,20428,20429,20431,20434,20444,20448,20450,20464,20466,20476,20477,20479,20480,20481,20484,20487,20490,20492,20494,20496,20499,20503,20504,20507,20508,20509,20510,20514,20519,20526,20528,20530,20531,20533,20544,20545,20546,20549,20550,20554,20556,20558,20561,20562,20563,20567,20569,20575,20576,20578,20579,20582,20583,20586,20589,20592,20593,20539,20609,20611,20612,20614,20618,20622,20623,20624,20626,20627,20628,20630,20635,20636,20638,20639,20640,20641,20642,20650,20655,20656,20665,20666,20669,20672,20675,20676,20679,20684,20686,20688,20691,20692,20696,20700,20701,20703,20706,20708,20710,20712,20713,20719,20721,20726,20730,20734,20739,20742,20743,20744,20747,20748,20749,20750,20722,20752,20759,20761,20763,20764,20765,20766,20771,20775,20776,20780,20781,20783,20785,20787,20788,20789,20792,20793,20802,20810,20815,20819,20821,20823,20824,20831,20836,20838,20862,20867,20868,20875,20878,20888,20893,20897,20899,20909,20920,20922,20924,20926,20927,20930,20936,20943,20945,20946,20947,20949,20952,20958,20962,20965,20974,20978,20979,20980,20983,20993,20994,20997,21010,21011,21013,21014,21016,21026,21032,21041,21042,21045,21052,21061,21065,21077,21079,21080,21082,21084,21087,21088,21089,21094,21102,21111,21112,21113,21120,21122,21125,21130,21132,21139,21141,21142,21143,21144,21146,21148,21156,21157,21158,21159,21167,21168,21174,21175,21176,21178,21179,21181,21184,21188,21190,21192,21196,21199,21201,21204,21206,21211,21212,21217,21221,21224,21225,21226,21228,21232,21233,21236,21238,21239,21248,21251,21258,21259,21260,21265,21267,21272,21275,21276,21278,21279,21285,21287,21288,21289,21291,21292,21293,21296,21298,21301,21308,21309,21310,21314,21324,21323,21337,21339,21345,21347,21349,21356,21357,21362,21369,21374,21379,21383,21384,21390,21395,21396,21401,21405,21409,21412,21418,21419,21423,21426,21428,21429,21431,21432,21434,21437,21440,21445,21455,21458,21459,21461,21466,21469,21470,21472,21478,21479,21493,21506,21523,21530,21537,21543,21544,21546,21551,21553,21556,21557,21571,21572,21575,21581,21583,21598,21602,21604,21606,21607,21609,21611,21613,21614,21620,21631,21633,21635,21637,21640,21641,21645,21649,21653,21654,21660,21663,21665,21670,21671,21673,21674,21677,21678,21681,21687,21689,21690,21691,21695,21702,21706,21709,21710,21728,21738,21740,21743,21750,21756,21758,21759,21760,21761,21765,21768,21769,21772,21773,21774,21781,21802,21803,21810,21813,21814,21819,21820,21821,21825,21831,21833,21834,21837,21840,21841,21848,21850,21851,21854,21856,21857,21860,21862,21887,21889,21890,21894,21896,21902,21903,21905,21906,21907,21908,21911,21923,21924,21933,21938,21951,21953,21955,21958,21961,21963,21964,21966,21969,21970,21971,21975,21976,21979,21982,21986,21993,22006,22015,22021,22024,22026,22029,22030,22031,22032,22033,22034,22041,22060,22064,22067,22069,22071,22073,22075,22076,22077,22079,22080,22081,22083,22084,22086,22089,22091,22093,22095,22100,22110,22112,22113,22114,22115,22118,22121,22125,22127,22129,22130,22133,22148,22149,22152,22155,22156,22165,22169,22170,22173,22174,22175,22182,22183,22184,22185,22187,22188,22189,22193,22195,22199,22206,22213,22217,22218,22219,22223,22224,22220,22221,22233,22236,22237,22239,22241,22244,22245,22246,22247,22248,22257,22251,22253,22262,22263,22273,22274,22279,22282,22284,22289,22293,22298,22299,22301,22304,22306,22307,22308,22309,22313,22314,22316,22318,22319,22323,22324,22333,22334,22335,22341,22342,22348,22349,22354,22370,22373,22375,22376,22379,22381,22382,22383,22384,22385,22387,22388,22389,22391,22393,22394,22395,22396,22398,22401,22403,22412,22420,22423,22425,22426,22428,22429,22430,22431,22433,22421,22439,22440,22441,22444,22456,22461,22471,22472,22476,22479,22485,22493,22494,22500,22502,22503,22505,22509,22512,22517,22518,22520,22525,22526,22527,22531,22532,22536,22537,22497,22540,22541,22555,22558,22559,22560,22566,22567,22573,22578,22585,22591,22601,22604,22605,22607,22608,22613,22623,22625,22628,22631,22632,22648,22652,22655,22656,22657,22663,22664,22665,22666,22668,22669,22671,22672,22676,22678,22685,22688,22689,22690,22694,22697,22705,22706,22724,22716,22722,22728,22733,22734,22736,22738,22740,22742,22746,22749,22753,22754,22761,22771,22789,22790,22795,22796,22802,22803,22804,34369,22813,22817,22819,22820,22824,22831,22832,22835,22837,22838,22847,22851,22854,22866,22867,22873,22875,22877,22878,22879,22881,22883,22891,22893,22895,22898,22901,22902,22905,22907,22908,22923,22924,22926,22930,22933,22935,22943,22948,22951,22957,22958,22959,22960,22963,22967,22970,22972,22977,22979,22980,22984,22986,22989,22994,23005,23006,23007,23011,23012,23015,23022,23023,23025,23026,23028,23031,23040,23044,23052,23053,23054,23058,23059,23070,23075,23076,23079,23080,23082,23085,23088,23108,23109,23111,23112,23116,23120,23125,23134,23139,23141,23143,23149,23159,23162,23163,23166,23179,23184,23187,23190,23193,23196,23198,23199,23200,23202,23207,23212,23217,23218,23219,23221,23224,23226,23227,23231,23236,23238,23240,23247,23258,23260,23264,23269,23274,23278,23285,23286,23293,23296,23297,23304,23319,23348,23321,23323,23325,23329,23333,23341,23352,23361,23371,23372,23378,23382,23390,23400,23406,23407,23420,23421,23422,23423,23425,23428,23430,23434,23438,23440,23441,23443,23444,23446,23464,23465,23468,23469,23471,23473,23474,23479,23482,23484,23488,23489,23501,23503,23510,23511,23512,23513,23514,23520,23535,23537,23540,23549,23564,23575,23582,23583,23587,23590,23593,23595,23596,23598,23600,23602,23605,23606,23641,23642,23644,23650,23651,23655,23656,23657,23661,23664,23668,23669,23674,23675,23676,23677,23687,23688,23690,23695,23698,23709,23711,23712,23714,23715,23718,23722,23730,23732,23733,23738,23753,23755,23762,23773,23767,23790,23793,23794,23796,23809,23814,23821,23826,23851,23843,23844,23846,23847,23857,23860,23865,23869,23871,23874,23875,23878,23880,23893,23889,23897,23882,23903,23904,23905,23906,23908,23914,23917,23920,23929,23930,23934,23935,23937,23939,23944,23946,23954,23955,23956,23957,23961,23963,23967,23968,23975,23979,23984,23988,23992,23993,24003,24007,24011,24016,24014,24024,24025,24032,24036,24041,24056,24057,24064,24071,24077,24082,24084,24085,24088,24095,24096,24110,24104,24114,24117,24126,24139,24144,24137,24145,24150,24152,24155,24156,24158,24168,24170,24171,24172,24173,24174,24176,24192,24203,24206,24226,24228,24229,24232,24234,24236,24241,24243,24253,24254,24255,24262,24268,24267,24270,24273,24274,24276,24277,24284,24286,24293,24299,24322,24326,24327,24328,24334,24345,24348,24349,24353,24354,24355,24356,24360,24363,24364,24366,24368,24372,24374,24379,24381,24383,24384,24388,24389,24391,24397,24400,24404,24408,24411,24416,24419,24420,24423,24431,24434,24436,24437,24440,24442,24445,24446,24457,24461,24463,24470,24476,24477,24482,24487,24491,24484,24492,24495,24496,24497,24504,24516,24519,24520,24521,24523,24528,24529,24530,24531,24532,24542,24545,24546,24552,24553,24554,24556,24557,24558,24559,24562,24563,24566,24570,24572,24583,24586,24589,24595,24596,24599,24600,24602,24607,24612,24621,24627,24629,24640,24647,24648,24649,24652,24657,24660,24662,24663,24669,24673,24679,24689,24702,24703,24706,24710,24712,24714,24718,24721,24723,24725,24728,24733,24734,24738,24740,24741,24744,24752,24753,24759,24763,24766,24770,24772,24776,24777,24778,24779,24782,24783,24788,24789,24793,24795,24797,24798,24802,24805,24818,24821,24824,24828,24829,24834,24839,24842,24844,24848,24849,24850,24851,24852,24854,24855,24857,24860,24862,24866,24874,24875,24880,24881,24885,24886,24887,24889,24897,24901,24902,24905,24926,24928,24940,24946,24952,24955,24956,24959,24960,24961,24963,24964,24971,24973,24978,24979,24983,24984,24988,24989,24991,24992,24997,25000,25002,25005,25016,25017,25020,25024,25025,25026,25038,25039,25045,25052,25053,25054,25055,25057,25058,25063,25065,25061,25068,25069,25071,25089,25091,25092,25095,25107,25109,25116,25120,25122,25123,25127,25129,25131,25145,25149,25154,25155,25156,25158,25164,25168,25169,25170,25172,25174,25178,25180,25188,25197,25199,25203,25210,25213,25229,25230,25231,25232,25254,25256,25267,25270,25271,25274,25278,25279,25284,25294,25301,25302,25306,25322,25330,25332,25340,25341,25347,25348,25354,25355,25357,25360,25363,25366,25368,25385,25386,25389,25397,25398,25401,25404,25409,25410,25411,25412,25414,25418,25419,25422,25426,25427,25428,25432,25435,25445,25446,25452,25453,25457,25460,25461,25464,25468,25469,25471,25474,25476,25479,25482,25488,25492,25493,25497,25498,25502,25508,25510,25517,25518,25519,25533,25537,25541,25544,25550,25553,25555,25556,25557,25564,25568,25573,25578,25580,25586,25587,25589,25592,25593,25609,25610,25616,25618,25620,25624,25630,25632,25634,25636,25637,25641,25642,25647,25648,25653,25661,25663,25675,25679,25681,25682,25683,25684,25690,25691,25692,25693,25695,25696,25697,25699,25709,25715,25716,25723,25725,25733,25735,25743,25744,25745,25752,25753,25755,25757,25759,25761,25763,25766,25768,25772,25779,25789,25790,25791,25796,25801,25802,25803,25804,25806,25808,25809,25813,25815,25828,25829,25833,25834,25837,25840,25845,25847,25851,25855,25857,25860,25864,25865,25866,25871,25875,25876,25878,25881,25883,25886,25887,25890,25894,25897,25902,25905,25914,25916,25917,25923,25927,25929,25936,25938,25940,25951,25952,25959,25963,25978,25981,25985,25989,25994,26002,26005,26008,26013,26016,26019,26022,26030,26034,26035,26036,26047,26050,26056,26057,26062,26064,26068,26070,26072,26079,26096,26098,26100,26101,26105,26110,26111,26112,26116,26120,26121,26125,26129,26130,26133,26134,26141,26142,26145,26146,26147,26148,26150,26153,26154,26155,26156,26158,26160,26161,26163,26169,26167,26176,26181,26182,26186,26188,26193,26190,26199,26200,26201,26203,26204,26208,26209,26363,26218,26219,26220,26238,26227,26229,26239,26231,26232,26233,26235,26240,26236,26251,26252,26253,26256,26258,26265,26266,26267,26268,26271,26272,26276,26285,26289,26290,26293,26299,26303,26304,26306,26307,26312,26316,26318,26319,26324,26331,26335,26344,26347,26348,26350,26362,26373,26375,26382,26387,26393,26396,26400,26402,26419,26430,26437,26439,26440,26444,26452,26453,26461,26470,26476,26478,26484,26486,26491,26497,26500,26510,26511,26513,26515,26518,26520,26521,26523,26544,26545,26546,26549,26555,26556,26557,26617,26560,26562,26563,26565,26568,26569,26578,26583,26585,26588,26593,26598,26608,26610,26614,26615,26706,26644,26649,26653,26655,26664,26663,26668,26669,26671,26672,26673,26675,26683,26687,26692,26693,26698,26700,26709,26711,26712,26715,26731,26734,26735,26736,26737,26738,26741,26745,26746,26747,26748,26754,26756,26758,26760,26774,26776,26778,26780,26785,26787,26789,26793,26794,26798,26802,26811,26821,26824,26828,26831,26832,26833,26835,26838,26841,26844,26845,26853,26856,26858,26859,26860,26861,26864,26865,26869,26870,26875,26876,26877,26886,26889,26890,26896,26897,26899,26902,26903,26929,26931,26933,26936,26939,26946,26949,26953,26958,26967,26971,26979,26980,26981,26982,26984,26985,26988,26992,26993,26994,27002,27003,27007,27008,27021,27026,27030,27032,27041,27045,27046,27048,27051,27053,27055,27063,27064,27066,27068,27077,27080,27089,27094,27095,27106,27109,27118,27119,27121,27123,27125,27134,27136,27137,27139,27151,27153,27157,27162,27165,27168,27172,27176,27184,27186,27188,27191,27195,27198,27199,27205,27206,27209,27210,27214,27216,27217,27218,27221,27222,27227,27236,27239,27242,27249,27251,27262,27265,27267,27270,27271,27273,27275,27281,27291,27293,27294,27295,27301,27307,27311,27312,27313,27316,27325,27326,27327,27334,27337,27336,27340,27344,27348,27349,27350,27356,27357,27364,27367,27372,27376,27377,27378,27388,27389,27394,27395,27398,27399,27401,27407,27408,27409,27415,27419,27422,27428,27432,27435,27436,27439,27445,27446,27451,27455,27462,27466,27469,27474,27478,27480,27485,27488,27495,27499,27502,27504,27509,27517,27518,27522,27525,27543,27547,27551,27552,27554,27555,27560,27561,27564,27565,27566,27568,27576,27577,27581,27582,27587,27588,27593,27596,27606,27610,27617,27619,27622,27623,27630,27633,27639,27641,27647,27650,27652,27653,27657,27661,27662,27664,27666,27673,27679,27686,27687,27688,27692,27694,27699,27701,27702,27706,27707,27711,27722,27723,27725,27727,27730,27732,27737,27739,27740,27755,27757,27759,27764,27766,27768,27769,27771,27781,27782,27783,27785,27796,27797,27799,27800,27804,27807,27824,27826,27828,27842,27846,27853,27855,27856,27857,27858,27860,27862,27866,27868,27872,27879,27881,27883,27884,27886,27890,27892,27908,27911,27914,27918,27919,27921,27923,27930,27942,27943,27944,27751,27950,27951,27953,27961,27964,27967,27991,27998,27999,28001,28005,28007,28015,28016,28028,28034,28039,28049,28050,28052,28054,28055,28056,28074,28076,28084,28087,28089,28093,28095,28100,28104,28106,28110,28111,28118,28123,28125,28127,28128,28130,28133,28137,28143,28144,28148,28150,28156,28160,28164,28190,28194,28199,28210,28214,28217,28219,28220,28228,28229,28232,28233,28235,28239,28241,28242,28243,28244,28247,28252,28253,28254,28258,28259,28264,28275,28283,28285,28301,28307,28313,28320,28327,28333,28334,28337,28339,28347,28351,28352,28353,28355,28359,28360,28362,28365,28366,28367,28395,28397,28398,28409,28411,28413,28420,28424,28426,28428,28429,28438,28440,28442,28443,28454,28457,28458,28463,28464,28467,28470,28475,28476,28461,28495,28497,28498,28499,28503,28505,28506,28509,28510,28513,28514,28520,28524,28541,28542,28547,28551,28552,28555,28556,28557,28560,28562,28563,28564,28566,28570,28575,28576,28581,28582,28583,28584,28590,28591,28592,28597,28598,28604,28613,28615,28616,28618,28634,28638,28648,28649,28656,28661,28665,28668,28669,28672,28677,28678,28679,28685,28695,28704,28707,28719,28724,28727,28729,28732,28739,28740,28744,28745,28746,28747,28756,28757,28765,28766,28750,28772,28773,28780,28782,28789,28790,28798,28801,28805,28806,28820,28821,28822,28823,28824,28827,28836,28843,28848,28849,28852,28855,28874,28881,28883,28884,28885,28886,28888,28892,28900,28922,28931,28932,28933,28934,28935,28939,28940,28943,28958,28960,28971,28973,28975,28976,28977,28984,28993,28997,28998,28999,29002,29003,29008,29010,29015,29018,29020,29022,29024,29032,29049,29056,29061,29063,29068,29074,29082,29083,29088,29090,29103,29104,29106,29107,29114,29119,29120,29121,29124,29131,29132,29139,29142,29145,29146,29148,29176,29182,29184,29191,29192,29193,29203,29207,29210,29213,29215,29220,29227,29231,29236,29240,29241,29249,29250,29251,29253,29262,29263,29264,29267,29269,29270,29274,29276,29278,29280,29283,29288,29291,29294,29295,29297,29303,29304,29307,29308,29311,29316,29321,29325,29326,29331,29339,29352,29357,29358,29361,29364,29374,29377,29383,29385,29388,29397,29398,29400,29407,29413,29427,29428,29434,29435,29438,29442,29444,29445,29447,29451,29453,29458,29459,29464,29465,29470,29474,29476,29479,29480,29484,29489,29490,29493,29498,29499,29501,29507,29517,29520,29522,29526,29528,29533,29534,29535,29536,29542,29543,29545,29547,29548,29550,29551,29553,29559,29561,29564,29568,29569,29571,29573,29574,29582,29584,29587,29589,29591,29592,29596,29598,29599,29600,29602,29605,29606,29610,29611,29613,29621,29623,29625,29628,29629,29631,29637,29638,29641,29643,29644,29647,29650,29651,29654,29657,29661,29665,29667,29670,29671,29673,29684,29685,29687,29689,29690,29691,29693,29695,29696,29697,29700,29703,29706,29713,29722,29723,29732,29734,29736,29737,29738,29739,29740,29741,29742,29743,29744,29745,29753,29760,29763,29764,29766,29767,29771,29773,29777,29778,29783,29789,29794,29798,29799,29800,29803,29805,29806,29809,29810,29824,29825,29829,29830,29831,29833,29839,29840,29841,29842,29848,29849,29850,29852,29855,29856,29857,29859,29862,29864,29865,29866,29867,29870,29871,29873,29874,29877,29881,29883,29887,29896,29897,29900,29904,29907,29912,29914,29915,29918,29919,29924,29928,29930,29931,29935,29940,29946,29947,29948,29951,29958,29970,29974,29975,29984,29985,29988,29991,29993,29994,29999,30006,30009,30013,30014,30015,30016,30019,30023,30024,30030,30032,30034,30039,30046,30047,30049,30063,30065,30073,30074,30075,30076,30077,30078,30081,30085,30096,30098,30099,30101,30105,30108,30114,30116,30132,30138,30143,30144,30145,30148,30150,30156,30158,30159,30167,30172,30175,30176,30177,30180,30183,30188,30190,30191,30193,30201,30208,30210,30211,30212,30215,30216,30218,30220,30223,30226,30227,30229,30230,30233,30235,30236,30237,30238,30243,30245,30246,30249,30253,30258,30259,30261,30264,30265,30266,30268,30282,30272,30273,30275,30276,30277,30281,30283,30293,30297,30303,30308,30309,30317,30318,30319,30321,30324,30337,30341,30348,30349,30357,30363,30364,30365,30367,30368,30370,30371,30372,30373,30374,30375,30376,30378,30381,30397,30401,30405,30409,30411,30412,30414,30420,30425,30432,30438,30440,30444,30448,30449,30454,30457,30460,30464,30470,30474,30478,30482,30484,30485,30487,30489,30490,30492,30498,30504,30509,30510,30511,30516,30517,30518,30521,30525,30526,30530,30533,30534,30538,30541,30542,30543,30546,30550,30551,30556,30558,30559,30560,30562,30564,30567,30570,30572,30576,30578,30579,30580,30586,30589,30592,30596,30604,30605,30612,30613,30614,30618,30623,30626,30631,30634,30638,30639,30641,30645,30654,30659,30665,30673,30674,30677,30681,30686,30687,30688,30692,30694,30698,30700,30704,30705,30708,30712,30715,30725,30726,30729,30733,30734,30737,30749,30753,30754,30755,30765,30766,30768,30773,30775,30787,30788,30791,30792,30796,30798,30802,30812,30814,30816,30817,30819,30820,30824,30826,30830,30842,30846,30858,30863,30868,30872,30881,30877,30878,30879,30884,30888,30892,30893,30896,30897,30898,30899,30907,30909,30911,30919,30920,30921,30924,30926,30930,30931,30933,30934,30948,30939,30943,30944,30945,30950,30954,30962,30963,30976,30966,30967,30970,30971,30975,30982,30988,30992,31002,31004,31006,31007,31008,31013,31015,31017,31021,31025,31028,31029,31035,31037,31039,31044,31045,31046,31050,31051,31055,31057,31060,31064,31067,31068,31079,31081,31083,31090,31097,31099,31100,31102,31115,31116,31121,31123,31124,31125,31126,31128,31131,31132,31137,31144,31145,31147,31151,31153,31156,31160,31163,31170,31172,31175,31176,31178,31183,31188,31190,31194,31197,31198,31200,31202,31205,31210,31211,31213,31217,31224,31228,31234,31235,31239,31241,31242,31244,31249,31253,31259,31262,31265,31271,31275,31277,31279,31280,31284,31285,31288,31289,31290,31300,31301,31303,31304,31308,31317,31318,31321,31324,31325,31327,31328,31333,31335,31338,31341,31349,31352,31358,31360,31362,31365,31366,31370,31371,31376,31377,31380,31390,31392,31395,31404,31411,31413,31417,31419,31420,31430,31433,31436,31438,31441,31451,31464,31465,31467,31468,31473,31476,31483,31485,31486,31495,31508,31519,31523,31527,31529,31530,31531,31533,31534,31535,31536,31537,31540,31549,31551,31552,31553,31559,31566,31573,31584,31588,31590,31593,31594,31597,31599,31602,31603,31607,31620,31625,31630,31632,31633,31638,31643,31646,31648,31653,31660,31663,31664,31666,31669,31670,31674,31675,31676,31677,31682,31685,31688,31690,31700,31702,31703,31705,31706,31707,31720,31722,31730,31732,31733,31736,31737,31738,31740,31742,31745,31746,31747,31748,31750,31753,31755,31756,31758,31759,31769,31771,31776,31781,31782,31784,31788,31793,31795,31796,31798,31801,31802,31814,31818,31829,31825,31826,31827,31833,31834,31835,31836,31837,31838,31841,31843,31847,31849,31853,31854,31856,31858,31865,31868,31869,31878,31879,31887,31892,31902,31904,31910,31920,31926,31927,31930,31931,31932,31935,31940,31943,31944,31945,31949,31951,31955,31956,31957,31959,31961,31962,31965,31974,31977,31979,31989,32003,32007,32008,32009,32015,32017,32018,32019,32022,32029,32030,32035,32038,32042,32045,32049,32060,32061,32062,32064,32065,32071,32072,32077,32081,32083,32087,32089,32090,32092,32093,32101,32103,32106,32112,32120,32122,32123,32127,32129,32130,32131,32133,32134,32136,32139,32140,32141,32145,32150,32151,32157,32158,32166,32167,32170,32179,32182,32183,32185,32194,32195,32196,32197,32198,32204,32205,32206,32215,32217,32256,32226,32229,32230,32234,32235,32237,32241,32245,32246,32249,32250,32264,32272,32273,32277,32279,32284,32285,32288,32295,32296,32300,32301,32303,32307,32310,32319,32324,32325,32327,32334,32336,32338,32344,32351,32353,32354,32357,32363,32366,32367,32371,32376,32382,32385,32390,32391,32394,32397,32401,32405,32408,32410,32413,32414,32572,32571,32573,32574,32575,32579,32580,32583,32591,32594,32595,32603,32604,32605,32609,32611,32612,32613,32614,32621,32625,32637,32638,32639,32640,32651,32653,32655,32656,32657,32662,32663,32668,32673,32674,32678,32682,32685,32692,32700,32703,32704,32707,32712,32718,32719,32731,32735,32739,32741,32744,32748,32750,32751,32754,32762,32765,32766,32767,32775,32776,32778,32781,32782,32783,32785,32787,32788,32790,32797,32798,32799,32800,32804,32806,32812,32814,32816,32820,32821,32823,32825,32826,32828,32830,32832,32836,32864,32868,32870,32877,32881,32885,32897,32904,32910,32924,32926,32934,32935,32939,32952,32953,32968,32973,32975,32978,32980,32981,32983,32984,32992,33005,33006,33008,33010,33011,33014,33017,33018,33022,33027,33035,33046,33047,33048,33052,33054,33056,33060,33063,33068,33072,33077,33082,33084,33093,33095,33098,33100,33106,33111,33120,33121,33127,33128,33129,33133,33135,33143,33153,33168,33156,33157,33158,33163,33166,33174,33176,33179,33182,33186,33198,33202,33204,33211,33227,33219,33221,33226,33230,33231,33237,33239,33243,33245,33246,33249,33252,33259,33260,33264,33265,33266,33269,33270,33272,33273,33277,33279,33280,33283,33295,33299,33300,33305,33306,33309,33313,33314,33320,33330,33332,33338,33347,33348,33349,33350,33355,33358,33359,33361,33366,33372,33376,33379,33383,33389,33396,33403,33405,33407,33408,33409,33411,33412,33415,33417,33418,33422,33425,33428,33430,33432,33434,33435,33440,33441,33443,33444,33447,33448,33449,33450,33454,33456,33458,33460,33463,33466,33468,33470,33471,33478,33488,33493,33498,33504,33506,33508,33512,33514,33517,33519,33526,33527,33533,33534,33536,33537,33543,33544,33546,33547,33620,33563,33565,33566,33567,33569,33570,33580,33581,33582,33584,33587,33591,33594,33596,33597,33602,33603,33604,33607,33613,33614,33617,33621,33622,33623,33648,33656,33661,33663,33664,33666,33668,33670,33677,33682,33684,33685,33688,33689,33691,33692,33693,33702,33703,33705,33708,33726,33727,33728,33735,33737,33743,33744,33745,33748,33757,33619,33768,33770,33782,33784,33785,33788,33793,33798,33802,33807,33809,33813,33817,33709,33839,33849,33861,33863,33864,33866,33869,33871,33873,33874,33878,33880,33881,33882,33884,33888,33892,33893,33895,33898,33904,33907,33908,33910,33912,33916,33917,33921,33925,33938,33939,33941,33950,33958,33960,33961,33962,33967,33969,33972,33978,33981,33982,33984,33986,33991,33992,33996,33999,34003,34012,34023,34026,34031,34032,34033,34034,34039,34098,34042,34043,34045,34050,34051,34055,34060,34062,34064,34076,34078,34082,34083,34084,34085,34087,34090,34091,34095,34099,34100,34102,34111,34118,34127,34128,34129,34130,34131,34134,34137,34140,34141,34142,34143,34144,34145,34146,34148,34155,34159,34169,34170,34171,34173,34175,34177,34181,34182,34185,34187,34188,34191,34195,34200,34205,34207,34208,34210,34213,34215,34228,34230,34231,34232,34236,34237,34238,34239,34242,34247,34250,34251,34254,34221,34264,34266,34271,34272,34278,34280,34285,34291,34294,34300,34303,34304,34308,34309,34317,34318,34320,34321,34322,34328,34329,34331,34334,34337,34343,34345,34358,34360,34362,34364,34365,34368,34370,34374,34386,34387,34390,34391,34392,34393,34397,34400,34401,34402,34403,34404,34409,34412,34415,34421,34422,34423,34426,34445,34449,34454,34456,34458,34460,34465,34470,34471,34472,34477,34481,34483,34484,34485,34487,34488,34489,34495,34496,34497,34499,34501,34513,34514,34517,34519,34522,34524,34528,34531,34533,34535,34440,34554,34556,34557,34564,34565,34567,34571,34574,34575,34576,34579,34580,34585,34590,34591,34593,34595,34600,34606,34607,34609,34610,34617,34618,34620,34621,34622,34624,34627,34629,34637,34648,34653,34657,34660,34661,34671,34673,34674,34683,34691,34692,34693,34694,34695,34696,34697,34699,34700,34704,34707,34709,34711,34712,34713,34718,34720,34723,34727,34732,34733,34734,34737,34741,34750,34751,34753,34760,34761,34762,34766,34773,34774,34777,34778,34780,34783,34786,34787,34788,34794,34795,34797,34801,34803,34808,34810,34815,34817,34819,34822,34825,34826,34827,34832,34841,34834,34835,34836,34840,34842,34843,34844,34846,34847,34856,34861,34862,34864,34866,34869,34874,34876,34881,34883,34885,34888,34889,34890,34891,34894,34897,34901,34902,34904,34906,34908,34911,34912,34916,34921,34929,34937,34939,34944,34968,34970,34971,34972,34975,34976,34984,34986,35002,35005,35006,35008,35018,35019,35020,35021,35022,35025,35026,35027,35035,35038,35047,35055,35056,35057,35061,35063,35073,35078,35085,35086,35087,35093,35094,35096,35097,35098,35100,35104,35110,35111,35112,35120,35121,35122,35125,35129,35130,35134,35136,35138,35141,35142,35145,35151,35154,35159,35162,35163,35164,35169,35170,35171,35179,35182,35184,35187,35189,35194,35195,35196,35197,35209,35213,35216,35220,35221,35227,35228,35231,35232,35237,35248,35252,35253,35254,35255,35260,35284,35285,35286,35287,35288,35301,35305,35307,35309,35313,35315,35318,35321,35325,35327,35332,35333,35335,35343,35345,35346,35348,35349,35358,35360,35362,35364,35366,35371,35372,35375,35381,35383,35389,35390,35392,35395,35397,35399,35401,35405,35406,35411,35414,35415,35416,35420,35421,35425,35429,35431,35445,35446,35447,35449,35450,35451,35454,35455,35456,35459,35462,35467,35471,35472,35474,35478,35479,35481,35487,35495,35497,35502,35503,35507,35510,35511,35515,35518,35523,35526,35528,35529,35530,35537,35539,35540,35541,35543,35549,35551,35564,35568,35572,35573,35574,35580,35583,35589,35590,35595,35601,35612,35614,35615,35594,35629,35632,35639,35644,35650,35651,35652,35653,35654,35656,35666,35667,35668,35673,35661,35678,35683,35693,35702,35704,35705,35708,35710,35713,35716,35717,35723,35725,35727,35732,35733,35740,35742,35743,35896,35897,35901,35902,35909,35911,35913,35915,35919,35921,35923,35924,35927,35928,35931,35933,35929,35939,35940,35942,35944,35945,35949,35955,35957,35958,35963,35966,35974,35975,35979,35984,35986,35987,35993,35995,35996,36004,36025,36026,36037,36038,36041,36043,36047,36054,36053,36057,36061,36065,36072,36076,36079,36080,36082,36085,36087,36088,36094,36095,36097,36099,36105,36114,36119,36123,36197,36201,36204,36206,36223,36226,36228,36232,36237,36240,36241,36245,36254,36255,36256,36262,36267,36268,36271,36274,36277,36279,36281,36283,36288,36293,36294,36295,36296,36298,36302,36305,36308,36309,36311,36313,36324,36325,36327,36332,36336,36284,36337,36338,36340,36349,36353,36356,36357,36358,36363,36369,36372,36374,36384,36385,36386,36387,36390,36391,36401,36403,36406,36407,36408,36409,36413,36416,36417,36427,36429,36430,36431,36436,36443,36444,36445,36446,36449,36450,36457,36460,36461,36463,36464,36465,36473,36474,36475,36482,36483,36489,36496,36498,36501,36506,36507,36509,36510,36514,36519,36521,36525,36526,36531,36533,36538,36539,36544,36545,36547,36548,36551,36559,36561,36564,36572,36584,36590,36592,36593,36599,36601,36602,36589,36608,36610,36615,36616,36623,36624,36630,36631,36632,36638,36640,36641,36643,36645,36647,36648,36652,36653,36654,36660,36661,36662,36663,36666,36672,36673,36675,36679,36687,36689,36690,36691,36692,36693,36696,36701,36702,36709,36765,36768,36769,36772,36773,36774,36789,36790,36792,36798,36800,36801,36806,36810,36811,36813,36816,36818,36819,36821,36832,36835,36836,36840,36846,36849,36853,36854,36859,36862,36866,36868,36872,36876,36888,36891,36904,36905,36911,36906,36908,36909,36915,36916,36919,36927,36931,36932,36940,36955,36957,36962,36966,36967,36972,36976,36980,36985,36997,37000,37003,37004,37006,37008,37013,37015,37016,37017,37019,37024,37025,37026,37029,37040,37042,37043,37044,37046,37053,37068,37054,37059,37060,37061,37063,37064,37077,37079,37080,37081,37084,37085,37087,37093,37074,37110,37099,37103,37104,37108,37118,37119,37120,37124,37125,37126,37128,37133,37136,37140,37142,37143,37144,37146,37148,37150,37152,37157,37154,37155,37159,37161,37166,37167,37169,37172,37174,37175,37177,37178,37180,37181,37187,37191,37192,37199,37203,37207,37209,37210,37211,37217,37220,37223,37229,37236,37241,37242,37243,37249,37251,37253,37254,37258,37262,37265,37267,37268,37269,37272,37278,37281,37286,37288,37292,37293,37294,37296,37297,37298,37299,37302,37307,37308,37309,37311,37314,37315,37317,37331,37332,37335,37337,37338,37342,37348,37349,37353,37354,37356,37357,37358,37359,37360,37361,37367,37369,37371,37373,37376,37377,37380,37381,37382,37383,37385,37386,37388,37392,37394,37395,37398,37400,37404,37405,37411,37412,37413,37414,37416,37422,37423,37424,37427,37429,37430,37432,37433,37434,37436,37438,37440,37442,37443,37446,37447,37450,37453,37454,37455,37457,37464,37465,37468,37469,37472,37473,37477,37479,37480,37481,37486,37487,37488,37493,37494,37495,37496,37497,37499,37500,37501,37503,37512,37513,37514,37517,37518,37522,37527,37529,37535,37536,37540,37541,37543,37544,37547,37551,37554,37558,37560,37562,37563,37564,37565,37567,37568,37569,37570,37571,37573,37574,37575,37576,37579,37580,37581,37582,37584,37587,37589,37591,37592,37593,37596,37597,37599,37600,37601,37603,37605,37607,37608,37612,37614,37616,37625,37627,37631,37632,37634,37640,37645,37649,37652,37653,37660,37661,37662,37663,37665,37668,37669,37671,37673,37674,37683,37684,37686,37687,37703,37704,37705,37712,37713,37714,37717,37719,37720,37722,37726,37732,37733,37735,37737,37738,37741,37743,37744,37745,37747,37748,37750,37754,37757,37759,37760,37761,37762,37768,37770,37771,37773,37775,37778,37781,37784,37787,37790,37793,37795,37796,37798,37800,37803,37812,37813,37814,37818,37801,37825,37828,37829,37830,37831,37833,37834,37835,37836,37837,37843,37849,37852,37854,37855,37858,37862,37863,37881,37879,37880,37882,37883,37885,37889,37890,37892,37896,37897,37901,37902,37903,37909,37910,37911,37919,37934,37935,37937,37938,37939,37940,37947,37951,37949,37955,37957,37960,37962,37964,37973,37977,37980,37983,37985,37987,37992,37995,37997,37998,37999,38001,38002,38020,38019,38264,38265,38270,38276,38280,38284,38285,38286,38301,38302,38303,38305,38310,38313,38315,38316,38324,38326,38330,38333,38335,38342,38344,38345,38347,38352,38353,38354,38355,38361,38362,38365,38366,38367,38368,38372,38374,38429,38430,38434,38436,38437,38438,38444,38449,38451,38455,38456,38457,38458,38460,38461,38465,38482,38484,38486,38487,38488,38497,38510,38516,38523,38524,38526,38527,38529,38530,38531,38532,38537,38545,38550,38554,38557,38559,38564,38565,38566,38569,38574,38575,38579,38586,38602,38610,23986,38616,38618,38621,38622,38623,38633,38639,38641,38650,38658,38659,38661,38665,38682,38683,38685,38689,38690,38691,38696,38705,38707,38721,38723,38730,38734,38735,38741,38743,38744,38746,38747,38755,38759,38762,38766,38771,38774,38775,38776,38779,38781,38783,38784,38793,38805,38806,38807,38809,38810,38814,38815,38818,38828,38830,38833,38834,38837,38838,38840,38841,38842,38844,38846,38847,38849,38852,38853,38855,38857,38858,38860,38861,38862,38864,38865,38868,38871,38872,38873,38877,38878,38880,38875,38881,38884,38895,38897,38900,38903,38904,38906,38919,38922,38937,38925,38926,38932,38934,38940,38942,38944,38947,38950,38955,38958,38959,38960,38962,38963,38965,38949,38974,38980,38983,38986,38993,38994,38995,38998,38999,39001,39002,39010,39011,39013,39014,39018,39020,39083,39085,39086,39088,39092,39095,39096,39098,39099,39103,39106,39109,39112,39116,39137,39139,39141,39142,39143,39146,39155,39158,39170,39175,39176,39185,39189,39190,39191,39194,39195,39196,39199,39202,39206,39207,39211,39217,39218,39219,39220,39221,39225,39226,39227,39228,39232,39233,39238,39239,39240,39245,39246,39252,39256,39257,39259,39260,39262,39263,39264,39323,39325,39327,39334,39344,39345,39346,39349,39353,39354,39357,39359,39363,39369,39379,39380,39385,39386,39388,39390,39399,39402,39403,39404,39408,39412,39413,39417,39421,39422,39426,39427,39428,39435,39436,39440,39441,39446,39454,39456,39458,39459,39460,39463,39469,39470,39475,39477,39478,39480,39495,39489,39492,39498,39499,39500,39502,39505,39508,39510,39517,39594,39596,39598,39599,39602,39604,39605,39606,39609,39611,39614,39615,39617,39619,39622,39624,39630,39632,39634,39637,39638,39639,39643,39644,39648,39652,39653,39655,39657,39660,39666,39667,39669,39673,39674,39677,39679,39680,39681,39682,39683,39684,39685,39688,39689,39691,39692,39693,39694,39696,39698,39702,39705,39707,39708,39712,39718,39723,39725,39731,39732,39733,39735,39737,39738,39741,39752,39755,39756,39765,39766,39767,39771,39774,39777,39779,39781,39782,39784,39786,39787,39788,39789,39790,39795,39797,39799,39800,39801,39807,39808,39812,39813,39814,39815,39817,39818,39819,39821,39823,39824,39828,39834,39837,39838,39846,39847,39849,39852,39856,39857,39858,39863,39864,39867,39868,39870,39871,39873,39879,39880,39886,39888,39895,39896,39901,39903,39909,39911,39914,39915,39919,39923,39927,39928,39929,39930,39933,39935,39936,39938,39947,39951,39953,39958,39960,39961,39962,39964,39966,39970,39971,39974,39975,39976,39977,39978,39985,39989,39990,39991,39997,40001,40003,40004,40005,40009,40010,40014,40015,40016,40019,40020,40022,40024,40027,40029,40030,40031,40035,40041,40042,40028,40043,40040,40046,40048,40050,40053,40055,40059,40166,40178,40183,40185,40203,40194,40209,40215,40216,40220,40221,40222,40239,40240,40242,40243,40244,40250,40252,40261,40253,40258,40259,40263,40266,40275,40276,40287,40291,40290,40293,40297,40298,40299,40304,40310,40311,40315,40316,40318,40323,40324,40326,40330,40333,40334,40338,40339,40341,40342,40343,40344,40353,40362,40364,40366,40369,40373,40377,40380,40383,40387,40391,40393,40394,40404,40405,40406,40407,40410,40414,40415,40416,40421,40423,40425,40427,40430,40432,40435,40436,40446,40458,40450,40455,40462,40464,40465,40466,40469,40470,40473,40476,40477,40570,40571,40572,40576,40578,40579,40580,40581,40583,40590,40591,40598,40600,40603,40606,40612,40616,40620,40622,40623,40624,40627,40628,40629,40646,40648,40651,40661,40671,40676,40679,40684,40685,40686,40688,40689,40690,40693,40696,40703,40706,40707,40713,40719,40720,40721,40722,40724,40726,40727,40729,40730,40731,40735,40738,40742,40746,40747,40751,40753,40754,40756,40759,40761,40762,40764,40765,40767,40769,40771,40772,40773,40774,40775,40787,40789,40790,40791,40792,40794,40797,40798,40808,40809,40813,40814,40815,40816,40817,40819,40821,40826,40829,40847,40848,40849,40850,40852,40854,40855,40862,40865,40866,40867,40869,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  "ibm866":[1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,9617,9618,9619,9474,9508,9569,9570,9558,9557,9571,9553,9559,9565,9564,9563,9488,9492,9524,9516,9500,9472,9532,9566,9567,9562,9556,9577,9574,9568,9552,9580,9575,9576,9572,9573,9561,9560,9554,9555,9579,9578,9496,9484,9608,9604,9612,9616,9600,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,1025,1105,1028,1108,1031,1111,1038,1118,176,8729,183,8730,8470,164,9632,160],
  "iso-8859-2":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,260,728,321,164,317,346,167,168,352,350,356,377,173,381,379,176,261,731,322,180,318,347,711,184,353,351,357,378,733,382,380,340,193,194,258,196,313,262,199,268,201,280,203,282,205,206,270,272,323,327,211,212,336,214,215,344,366,218,368,220,221,354,223,341,225,226,259,228,314,263,231,269,233,281,235,283,237,238,271,273,324,328,243,244,337,246,247,345,367,250,369,252,253,355,729],
  "iso-8859-3":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,294,728,163,164,null,292,167,168,304,350,286,308,173,null,379,176,295,178,179,180,181,293,183,184,305,351,287,309,189,null,380,192,193,194,null,196,266,264,199,200,201,202,203,204,205,206,207,null,209,210,211,212,288,214,215,284,217,218,219,220,364,348,223,224,225,226,null,228,267,265,231,232,233,234,235,236,237,238,239,null,241,242,243,244,289,246,247,285,249,250,251,252,365,349,729],
  "iso-8859-4":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,260,312,342,164,296,315,167,168,352,274,290,358,173,381,175,176,261,731,343,180,297,316,711,184,353,275,291,359,330,382,331,256,193,194,195,196,197,198,302,268,201,280,203,278,205,206,298,272,325,332,310,212,213,214,215,216,370,218,219,220,360,362,223,257,225,226,227,228,229,230,303,269,233,281,235,279,237,238,299,273,326,333,311,244,245,246,247,248,371,250,251,252,361,363,729],
  "iso-8859-5":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,173,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,8470,1105,1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,167,1118,1119],
  "iso-8859-6":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,null,null,null,164,null,null,null,null,null,null,null,1548,173,null,null,null,null,null,null,null,null,null,null,null,null,null,1563,null,null,null,1567,null,1569,1570,1571,1572,1573,1574,1575,1576,1577,1578,1579,1580,1581,1582,1583,1584,1585,1586,1587,1588,1589,1590,1591,1592,1593,1594,null,null,null,null,null,1600,1601,1602,1603,1604,1605,1606,1607,1608,1609,1610,1611,1612,1613,1614,1615,1616,1617,1618,null,null,null,null,null,null,null,null,null,null,null,null,null],
  "iso-8859-7":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,8216,8217,163,8364,8367,166,167,168,169,890,171,172,173,null,8213,176,177,178,179,900,901,902,183,904,905,906,187,908,189,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,null,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,null],
  "iso-8859-8":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,null,162,163,164,165,166,167,168,169,215,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,247,187,188,189,190,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,8215,1488,1489,1490,1491,1492,1493,1494,1495,1496,1497,1498,1499,1500,1501,1502,1503,1504,1505,1506,1507,1508,1509,1510,1511,1512,1513,1514,null,null,8206,8207,null],
  "iso-8859-10":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,260,274,290,298,296,310,167,315,272,352,358,381,173,362,330,176,261,275,291,299,297,311,183,316,273,353,359,382,8213,363,331,256,193,194,195,196,197,198,302,268,201,280,203,278,205,206,207,208,325,332,211,212,213,214,360,216,370,218,219,220,221,222,223,257,225,226,227,228,229,230,303,269,233,281,235,279,237,238,239,240,326,333,243,244,245,246,361,248,371,250,251,252,253,254,312],
  "iso-8859-13":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,8221,162,163,164,8222,166,167,216,169,342,171,172,173,174,198,176,177,178,179,8220,181,182,183,248,185,343,187,188,189,190,230,260,302,256,262,196,197,280,274,268,201,377,278,290,310,298,315,352,323,325,211,332,213,214,215,370,321,346,362,220,379,381,223,261,303,257,263,228,229,281,275,269,233,378,279,291,311,299,316,353,324,326,243,333,245,246,247,371,322,347,363,252,380,382,8217],
  "iso-8859-14":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,7682,7683,163,266,267,7690,167,7808,169,7810,7691,7922,173,174,376,7710,7711,288,289,7744,7745,182,7766,7809,7767,7811,7776,7923,7812,7813,7777,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,372,209,210,211,212,213,214,7786,216,217,218,219,220,221,374,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,373,241,242,243,244,245,246,7787,248,249,250,251,252,253,375,255],
  "iso-8859-15":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,8364,165,352,167,353,169,170,171,172,173,174,175,176,177,178,179,381,181,182,183,382,185,186,187,338,339,376,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255],
  "iso-8859-16":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,260,261,321,8364,8222,352,167,353,169,536,171,377,173,378,379,176,177,268,322,381,8221,182,183,382,269,537,187,338,339,376,380,192,193,194,258,196,262,198,199,200,201,202,203,204,205,206,207,272,323,210,211,212,336,214,346,368,217,218,219,220,280,538,223,224,225,226,259,228,263,230,231,232,233,234,235,236,237,238,239,273,324,242,243,244,337,246,347,369,249,250,251,252,281,539,255],
  "koi8-r":[9472,9474,9484,9488,9492,9496,9500,9508,9516,9524,9532,9600,9604,9608,9612,9616,9617,9618,9619,8992,9632,8729,8730,8776,8804,8805,160,8993,176,178,183,247,9552,9553,9554,1105,9555,9556,9557,9558,9559,9560,9561,9562,9563,9564,9565,9566,9567,9568,9569,1025,9570,9571,9572,9573,9574,9575,9576,9577,9578,9579,9580,169,1102,1072,1073,1094,1076,1077,1092,1075,1093,1080,1081,1082,1083,1084,1085,1086,1087,1103,1088,1089,1090,1091,1078,1074,1100,1099,1079,1096,1101,1097,1095,1098,1070,1040,1041,1062,1044,1045,1060,1043,1061,1048,1049,1050,1051,1052,1053,1054,1055,1071,1056,1057,1058,1059,1046,1042,1068,1067,1047,1064,1069,1065,1063,1066],
  "koi8-u":[9472,9474,9484,9488,9492,9496,9500,9508,9516,9524,9532,9600,9604,9608,9612,9616,9617,9618,9619,8992,9632,8729,8730,8776,8804,8805,160,8993,176,178,183,247,9552,9553,9554,1105,1108,9556,1110,1111,9559,9560,9561,9562,9563,1169,1118,9566,9567,9568,9569,1025,1028,9571,1030,1031,9574,9575,9576,9577,9578,1168,1038,169,1102,1072,1073,1094,1076,1077,1092,1075,1093,1080,1081,1082,1083,1084,1085,1086,1087,1103,1088,1089,1090,1091,1078,1074,1100,1099,1079,1096,1101,1097,1095,1098,1070,1040,1041,1062,1044,1045,1060,1043,1061,1048,1049,1050,1051,1052,1053,1054,1055,1071,1056,1057,1058,1059,1046,1042,1068,1067,1047,1064,1069,1065,1063,1066],
  "macintosh":[196,197,199,201,209,214,220,225,224,226,228,227,229,231,233,232,234,235,237,236,238,239,241,243,242,244,246,245,250,249,251,252,8224,176,162,163,167,8226,182,223,174,169,8482,180,168,8800,198,216,8734,177,8804,8805,165,181,8706,8721,8719,960,8747,170,186,937,230,248,191,161,172,8730,402,8776,8710,171,187,8230,160,192,195,213,338,339,8211,8212,8220,8221,8216,8217,247,9674,255,376,8260,8364,8249,8250,64257,64258,8225,183,8218,8222,8240,194,202,193,203,200,205,206,207,204,211,212,63743,210,218,219,217,305,710,732,175,728,729,730,184,733,731,711],
  "windows-874":[8364,129,130,131,132,8230,134,135,136,137,138,139,140,141,142,143,144,8216,8217,8220,8221,8226,8211,8212,152,153,154,155,156,157,158,159,160,3585,3586,3587,3588,3589,3590,3591,3592,3593,3594,3595,3596,3597,3598,3599,3600,3601,3602,3603,3604,3605,3606,3607,3608,3609,3610,3611,3612,3613,3614,3615,3616,3617,3618,3619,3620,3621,3622,3623,3624,3625,3626,3627,3628,3629,3630,3631,3632,3633,3634,3635,3636,3637,3638,3639,3640,3641,3642,null,null,null,null,3647,3648,3649,3650,3651,3652,3653,3654,3655,3656,3657,3658,3659,3660,3661,3662,3663,3664,3665,3666,3667,3668,3669,3670,3671,3672,3673,3674,3675,null,null,null,null],
  "windows-1250":[8364,129,8218,131,8222,8230,8224,8225,136,8240,352,8249,346,356,381,377,144,8216,8217,8220,8221,8226,8211,8212,152,8482,353,8250,347,357,382,378,160,711,728,321,164,260,166,167,168,169,350,171,172,173,174,379,176,177,731,322,180,181,182,183,184,261,351,187,317,733,318,380,340,193,194,258,196,313,262,199,268,201,280,203,282,205,206,270,272,323,327,211,212,336,214,215,344,366,218,368,220,221,354,223,341,225,226,259,228,314,263,231,269,233,281,235,283,237,238,271,273,324,328,243,244,337,246,247,345,367,250,369,252,253,355,729],
  "windows-1251":[1026,1027,8218,1107,8222,8230,8224,8225,8364,8240,1033,8249,1034,1036,1035,1039,1106,8216,8217,8220,8221,8226,8211,8212,152,8482,1113,8250,1114,1116,1115,1119,160,1038,1118,1032,164,1168,166,167,1025,169,1028,171,172,173,174,1031,176,177,1030,1110,1169,181,182,183,1105,8470,1108,187,1112,1029,1109,1111,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103],
  "windows-1252":[8364,129,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,141,381,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,157,382,376,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255],
  "windows-1253":[8364,129,8218,402,8222,8230,8224,8225,136,8240,138,8249,140,141,142,143,144,8216,8217,8220,8221,8226,8211,8212,152,8482,154,8250,156,157,158,159,160,901,902,163,164,165,166,167,168,169,null,171,172,173,174,8213,176,177,178,179,900,181,182,183,904,905,906,187,908,189,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,null,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,null],
  "windows-1254":[8364,129,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,141,142,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,157,158,376,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,286,209,210,211,212,213,214,215,216,217,218,219,220,304,350,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,287,241,242,243,244,245,246,247,248,249,250,251,252,305,351,255],
  "windows-1255":[8364,129,8218,402,8222,8230,8224,8225,710,8240,138,8249,140,141,142,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,154,8250,156,157,158,159,160,161,162,163,8362,165,166,167,168,169,215,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,247,187,188,189,190,191,1456,1457,1458,1459,1460,1461,1462,1463,1464,1465,1466,1467,1468,1469,1470,1471,1472,1473,1474,1475,1520,1521,1522,1523,1524,null,null,null,null,null,null,null,1488,1489,1490,1491,1492,1493,1494,1495,1496,1497,1498,1499,1500,1501,1502,1503,1504,1505,1506,1507,1508,1509,1510,1511,1512,1513,1514,null,null,8206,8207,null],
  "windows-1256":[8364,1662,8218,402,8222,8230,8224,8225,710,8240,1657,8249,338,1670,1688,1672,1711,8216,8217,8220,8221,8226,8211,8212,1705,8482,1681,8250,339,8204,8205,1722,160,1548,162,163,164,165,166,167,168,169,1726,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,1563,187,188,189,190,1567,1729,1569,1570,1571,1572,1573,1574,1575,1576,1577,1578,1579,1580,1581,1582,1583,1584,1585,1586,1587,1588,1589,1590,215,1591,1592,1593,1594,1600,1601,1602,1603,224,1604,226,1605,1606,1607,1608,231,232,233,234,235,1609,1610,238,239,1611,1612,1613,1614,244,1615,1616,247,1617,249,1618,251,252,8206,8207,1746],
  "windows-1257":[8364,129,8218,131,8222,8230,8224,8225,136,8240,138,8249,140,168,711,184,144,8216,8217,8220,8221,8226,8211,8212,152,8482,154,8250,156,175,731,159,160,null,162,163,164,null,166,167,216,169,342,171,172,173,174,198,176,177,178,179,180,181,182,183,248,185,343,187,188,189,190,230,260,302,256,262,196,197,280,274,268,201,377,278,290,310,298,315,352,323,325,211,332,213,214,215,370,321,346,362,220,379,381,223,261,303,257,263,228,229,281,275,269,233,378,279,291,311,299,316,353,324,326,243,333,245,246,247,371,322,347,363,252,380,382,729],
  "windows-1258":[8364,129,8218,402,8222,8230,8224,8225,710,8240,138,8249,338,141,142,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,154,8250,339,157,158,376,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,258,196,197,198,199,200,201,202,203,768,205,206,207,272,209,777,211,212,416,214,215,216,217,218,219,220,431,771,223,224,225,226,259,228,229,230,231,232,233,234,235,769,237,238,239,273,241,803,243,244,417,246,247,248,249,250,251,252,432,8363,255],
  "x-mac-cyrillic":[1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,8224,176,1168,163,167,8226,182,1030,174,169,8482,1026,1106,8800,1027,1107,8734,177,8804,8805,1110,181,1169,1032,1028,1108,1031,1111,1033,1113,1034,1114,1112,1029,172,8730,402,8776,8710,171,187,8230,160,1035,1115,1036,1116,1109,8211,8212,8220,8221,8216,8217,247,8222,1038,1118,1039,1119,8470,1025,1105,1103,1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,8364]
};

// For strict environments where `this` inside the global scope
// is `undefined`, take a pure object instead
}(this || {}));
},{}],21:[function(require,module,exports){
// This is free and unencumbered software released into the public domain.
// See LICENSE.md for more information.

/**
 * @fileoverview Global |this| required for resolving indexes in node.
 * @suppress {globalThis}
 */
(function(global) {
  'use strict';

  // If we're in node require encoding-indexes and attach it to the global.
  if (typeof module !== "undefined" && module.exports &&
    !global["encoding-indexes"]) {
    global["encoding-indexes"] =
      require("./encoding-indexes.js")["encoding-indexes"];
  }

  //
  // Utilities
  //

  /**
   * @param {number} a The number to test.
   * @param {number} min The minimum value in the range, inclusive.
   * @param {number} max The maximum value in the range, inclusive.
   * @return {boolean} True if a >= min and a <= max.
   */
  function inRange(a, min, max) {
    return min <= a && a <= max;
  }

  /**
   * @param {!Array.<*>} array The array to check.
   * @param {*} item The item to look for in the array.
   * @return {boolean} True if the item appears in the array.
   */
  function includes(array, item) {
    return array.indexOf(item) !== -1;
  }

  var floor = Math.floor;

  /**
   * @param {*} o
   * @return {Object}
   */
  function ToDictionary(o) {
    if (o === undefined) return {};
    if (o === Object(o)) return o;
    throw TypeError('Could not convert argument to dictionary');
  }

  /**
   * @param {string} string Input string of UTF-16 code units.
   * @return {!Array.<number>} Code points.
   */
  function stringToCodePoints(string) {
    // https://heycam.github.io/webidl/#dfn-obtain-unicode

    // 1. Let S be the DOMString value.
    var s = String(string);

    // 2. Let n be the length of S.
    var n = s.length;

    // 3. Initialize i to 0.
    var i = 0;

    // 4. Initialize U to be an empty sequence of Unicode characters.
    var u = [];

    // 5. While i < n:
    while (i < n) {

      // 1. Let c be the code unit in S at index i.
      var c = s.charCodeAt(i);

      // 2. Depending on the value of c:

      // c < 0xD800 or c > 0xDFFF
      if (c < 0xD800 || c > 0xDFFF) {
        // Append to U the Unicode character with code point c.
        u.push(c);
      }

      // 0xDC00 ≤ c ≤ 0xDFFF
      else if (0xDC00 <= c && c <= 0xDFFF) {
        // Append to U a U+FFFD REPLACEMENT CHARACTER.
        u.push(0xFFFD);
      }

      // 0xD800 ≤ c ≤ 0xDBFF
      else if (0xD800 <= c && c <= 0xDBFF) {
        // 1. If i = n−1, then append to U a U+FFFD REPLACEMENT
        // CHARACTER.
        if (i === n - 1) {
          u.push(0xFFFD);
        }
        // 2. Otherwise, i < n−1:
        else {
          // 1. Let d be the code unit in S at index i+1.
          var d = s.charCodeAt(i + 1);

          // 2. If 0xDC00 ≤ d ≤ 0xDFFF, then:
          if (0xDC00 <= d && d <= 0xDFFF) {
            // 1. Let a be c & 0x3FF.
            var a = c & 0x3FF;

            // 2. Let b be d & 0x3FF.
            var b = d & 0x3FF;

            // 3. Append to U the Unicode character with code point
            // 2^16+2^10*a+b.
            u.push(0x10000 + (a << 10) + b);

            // 4. Set i to i+1.
            i += 1;
          }

          // 3. Otherwise, d < 0xDC00 or d > 0xDFFF. Append to U a
          // U+FFFD REPLACEMENT CHARACTER.
          else  {
            u.push(0xFFFD);
          }
        }
      }

      // 3. Set i to i+1.
      i += 1;
    }

    // 6. Return U.
    return u;
  }

  /**
   * @param {!Array.<number>} code_points Array of code points.
   * @return {string} string String of UTF-16 code units.
   */
  function codePointsToString(code_points) {
    var s = '';
    for (var i = 0; i < code_points.length; ++i) {
      var cp = code_points[i];
      if (cp <= 0xFFFF) {
        s += String.fromCharCode(cp);
      } else {
        cp -= 0x10000;
        s += String.fromCharCode((cp >> 10) + 0xD800,
                                 (cp & 0x3FF) + 0xDC00);
      }
    }
    return s;
  }


  //
  // Implementation of Encoding specification
  // https://encoding.spec.whatwg.org/
  //

  //
  // 4. Terminology
  //

  /**
   * An ASCII byte is a byte in the range 0x00 to 0x7F, inclusive.
   * @param {number} a The number to test.
   * @return {boolean} True if a is in the range 0x00 to 0x7F, inclusive.
   */
  function isASCIIByte(a) {
    return 0x00 <= a && a <= 0x7F;
  }

  /**
   * An ASCII code point is a code point in the range U+0000 to
   * U+007F, inclusive.
   */
  var isASCIICodePoint = isASCIIByte;


  /**
   * End-of-stream is a special token that signifies no more tokens
   * are in the stream.
   * @const
   */ var end_of_stream = -1;

  /**
   * A stream represents an ordered sequence of tokens.
   *
   * @constructor
   * @param {!(Array.<number>|Uint8Array)} tokens Array of tokens that provide
   * the stream.
   */
  function Stream(tokens) {
    /** @type {!Array.<number>} */
    this.tokens = [].slice.call(tokens);
    // Reversed as push/pop is more efficient than shift/unshift.
    this.tokens.reverse();
  }

  Stream.prototype = {
    /**
     * @return {boolean} True if end-of-stream has been hit.
     */
    endOfStream: function() {
      return !this.tokens.length;
    },

    /**
     * When a token is read from a stream, the first token in the
     * stream must be returned and subsequently removed, and
     * end-of-stream must be returned otherwise.
     *
     * @return {number} Get the next token from the stream, or
     * end_of_stream.
     */
     read: function() {
      if (!this.tokens.length)
        return end_of_stream;
       return this.tokens.pop();
     },

    /**
     * When one or more tokens are prepended to a stream, those tokens
     * must be inserted, in given order, before the first token in the
     * stream.
     *
     * @param {(number|!Array.<number>)} token The token(s) to prepend to the
     * stream.
     */
    prepend: function(token) {
      if (Array.isArray(token)) {
        var tokens = /**@type {!Array.<number>}*/(token);
        while (tokens.length)
          this.tokens.push(tokens.pop());
      } else {
        this.tokens.push(token);
      }
    },

    /**
     * When one or more tokens are pushed to a stream, those tokens
     * must be inserted, in given order, after the last token in the
     * stream.
     *
     * @param {(number|!Array.<number>)} token The tokens(s) to push to the
     * stream.
     */
    push: function(token) {
      if (Array.isArray(token)) {
        var tokens = /**@type {!Array.<number>}*/(token);
        while (tokens.length)
          this.tokens.unshift(tokens.shift());
      } else {
        this.tokens.unshift(token);
      }
    }
  };

  //
  // 5. Encodings
  //

  // 5.1 Encoders and decoders

  /** @const */
  var finished = -1;

  /**
   * @param {boolean} fatal If true, decoding errors raise an exception.
   * @param {number=} opt_code_point Override the standard fallback code point.
   * @return {number} The code point to insert on a decoding error.
   */
  function decoderError(fatal, opt_code_point) {
    if (fatal)
      throw TypeError('Decoder error');
    return opt_code_point || 0xFFFD;
  }

  /**
   * @param {number} code_point The code point that could not be encoded.
   * @return {number} Always throws, no value is actually returned.
   */
  function encoderError(code_point) {
    throw TypeError('The code point ' + code_point + ' could not be encoded.');
  }

  /** @interface */
  function Decoder() {}
  Decoder.prototype = {
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point, or |finished|.
     */
    handler: function(stream, bite) {}
  };

  /** @interface */
  function Encoder() {}
  Encoder.prototype = {
    /**
     * @param {Stream} stream The stream of code points being encoded.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit, or |finished|.
     */
    handler: function(stream, code_point) {}
  };

  // 5.2 Names and labels

  // TODO: Define @typedef for Encoding: {name:string,labels:Array.<string>}
  // https://github.com/google/closure-compiler/issues/247

  /**
   * @param {string} label The encoding label.
   * @return {?{name:string,labels:Array.<string>}}
   */
  function getEncoding(label) {
    // 1. Remove any leading and trailing ASCII whitespace from label.
    label = String(label).trim().toLowerCase();

    // 2. If label is an ASCII case-insensitive match for any of the
    // labels listed in the table below, return the corresponding
    // encoding, and failure otherwise.
    if (Object.prototype.hasOwnProperty.call(label_to_encoding, label)) {
      return label_to_encoding[label];
    }
    return null;
  }

  /**
   * Encodings table: https://encoding.spec.whatwg.org/encodings.json
   * @const
   * @type {!Array.<{
   *          heading: string,
   *          encodings: Array.<{name:string,labels:Array.<string>}>
   *        }>}
   */
  var encodings = [
    {
      "encodings": [
        {
          "labels": [
            "unicode-1-1-utf-8",
            "utf-8",
            "utf8"
          ],
          "name": "UTF-8"
        }
      ],
      "heading": "The Encoding"
    },
    {
      "encodings": [
        {
          "labels": [
            "866",
            "cp866",
            "csibm866",
            "ibm866"
          ],
          "name": "IBM866"
        },
        {
          "labels": [
            "csisolatin2",
            "iso-8859-2",
            "iso-ir-101",
            "iso8859-2",
            "iso88592",
            "iso_8859-2",
            "iso_8859-2:1987",
            "l2",
            "latin2"
          ],
          "name": "ISO-8859-2"
        },
        {
          "labels": [
            "csisolatin3",
            "iso-8859-3",
            "iso-ir-109",
            "iso8859-3",
            "iso88593",
            "iso_8859-3",
            "iso_8859-3:1988",
            "l3",
            "latin3"
          ],
          "name": "ISO-8859-3"
        },
        {
          "labels": [
            "csisolatin4",
            "iso-8859-4",
            "iso-ir-110",
            "iso8859-4",
            "iso88594",
            "iso_8859-4",
            "iso_8859-4:1988",
            "l4",
            "latin4"
          ],
          "name": "ISO-8859-4"
        },
        {
          "labels": [
            "csisolatincyrillic",
            "cyrillic",
            "iso-8859-5",
            "iso-ir-144",
            "iso8859-5",
            "iso88595",
            "iso_8859-5",
            "iso_8859-5:1988"
          ],
          "name": "ISO-8859-5"
        },
        {
          "labels": [
            "arabic",
            "asmo-708",
            "csiso88596e",
            "csiso88596i",
            "csisolatinarabic",
            "ecma-114",
            "iso-8859-6",
            "iso-8859-6-e",
            "iso-8859-6-i",
            "iso-ir-127",
            "iso8859-6",
            "iso88596",
            "iso_8859-6",
            "iso_8859-6:1987"
          ],
          "name": "ISO-8859-6"
        },
        {
          "labels": [
            "csisolatingreek",
            "ecma-118",
            "elot_928",
            "greek",
            "greek8",
            "iso-8859-7",
            "iso-ir-126",
            "iso8859-7",
            "iso88597",
            "iso_8859-7",
            "iso_8859-7:1987",
            "sun_eu_greek"
          ],
          "name": "ISO-8859-7"
        },
        {
          "labels": [
            "csiso88598e",
            "csisolatinhebrew",
            "hebrew",
            "iso-8859-8",
            "iso-8859-8-e",
            "iso-ir-138",
            "iso8859-8",
            "iso88598",
            "iso_8859-8",
            "iso_8859-8:1988",
            "visual"
          ],
          "name": "ISO-8859-8"
        },
        {
          "labels": [
            "csiso88598i",
            "iso-8859-8-i",
            "logical"
          ],
          "name": "ISO-8859-8-I"
        },
        {
          "labels": [
            "csisolatin6",
            "iso-8859-10",
            "iso-ir-157",
            "iso8859-10",
            "iso885910",
            "l6",
            "latin6"
          ],
          "name": "ISO-8859-10"
        },
        {
          "labels": [
            "iso-8859-13",
            "iso8859-13",
            "iso885913"
          ],
          "name": "ISO-8859-13"
        },
        {
          "labels": [
            "iso-8859-14",
            "iso8859-14",
            "iso885914"
          ],
          "name": "ISO-8859-14"
        },
        {
          "labels": [
            "csisolatin9",
            "iso-8859-15",
            "iso8859-15",
            "iso885915",
            "iso_8859-15",
            "l9"
          ],
          "name": "ISO-8859-15"
        },
        {
          "labels": [
            "iso-8859-16"
          ],
          "name": "ISO-8859-16"
        },
        {
          "labels": [
            "cskoi8r",
            "koi",
            "koi8",
            "koi8-r",
            "koi8_r"
          ],
          "name": "KOI8-R"
        },
        {
          "labels": [
            "koi8-ru",
            "koi8-u"
          ],
          "name": "KOI8-U"
        },
        {
          "labels": [
            "csmacintosh",
            "mac",
            "macintosh",
            "x-mac-roman"
          ],
          "name": "macintosh"
        },
        {
          "labels": [
            "dos-874",
            "iso-8859-11",
            "iso8859-11",
            "iso885911",
            "tis-620",
            "windows-874"
          ],
          "name": "windows-874"
        },
        {
          "labels": [
            "cp1250",
            "windows-1250",
            "x-cp1250"
          ],
          "name": "windows-1250"
        },
        {
          "labels": [
            "cp1251",
            "windows-1251",
            "x-cp1251"
          ],
          "name": "windows-1251"
        },
        {
          "labels": [
            "ansi_x3.4-1968",
            "ascii",
            "cp1252",
            "cp819",
            "csisolatin1",
            "ibm819",
            "iso-8859-1",
            "iso-ir-100",
            "iso8859-1",
            "iso88591",
            "iso_8859-1",
            "iso_8859-1:1987",
            "l1",
            "latin1",
            "us-ascii",
            "windows-1252",
            "x-cp1252"
          ],
          "name": "windows-1252"
        },
        {
          "labels": [
            "cp1253",
            "windows-1253",
            "x-cp1253"
          ],
          "name": "windows-1253"
        },
        {
          "labels": [
            "cp1254",
            "csisolatin5",
            "iso-8859-9",
            "iso-ir-148",
            "iso8859-9",
            "iso88599",
            "iso_8859-9",
            "iso_8859-9:1989",
            "l5",
            "latin5",
            "windows-1254",
            "x-cp1254"
          ],
          "name": "windows-1254"
        },
        {
          "labels": [
            "cp1255",
            "windows-1255",
            "x-cp1255"
          ],
          "name": "windows-1255"
        },
        {
          "labels": [
            "cp1256",
            "windows-1256",
            "x-cp1256"
          ],
          "name": "windows-1256"
        },
        {
          "labels": [
            "cp1257",
            "windows-1257",
            "x-cp1257"
          ],
          "name": "windows-1257"
        },
        {
          "labels": [
            "cp1258",
            "windows-1258",
            "x-cp1258"
          ],
          "name": "windows-1258"
        },
        {
          "labels": [
            "x-mac-cyrillic",
            "x-mac-ukrainian"
          ],
          "name": "x-mac-cyrillic"
        }
      ],
      "heading": "Legacy single-byte encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "chinese",
            "csgb2312",
            "csiso58gb231280",
            "gb2312",
            "gb_2312",
            "gb_2312-80",
            "gbk",
            "iso-ir-58",
            "x-gbk"
          ],
          "name": "GBK"
        },
        {
          "labels": [
            "gb18030"
          ],
          "name": "gb18030"
        }
      ],
      "heading": "Legacy multi-byte Chinese (simplified) encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "big5",
            "big5-hkscs",
            "cn-big5",
            "csbig5",
            "x-x-big5"
          ],
          "name": "Big5"
        }
      ],
      "heading": "Legacy multi-byte Chinese (traditional) encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "cseucpkdfmtjapanese",
            "euc-jp",
            "x-euc-jp"
          ],
          "name": "EUC-JP"
        },
        {
          "labels": [
            "csiso2022jp",
            "iso-2022-jp"
          ],
          "name": "ISO-2022-JP"
        },
        {
          "labels": [
            "csshiftjis",
            "ms932",
            "ms_kanji",
            "shift-jis",
            "shift_jis",
            "sjis",
            "windows-31j",
            "x-sjis"
          ],
          "name": "Shift_JIS"
        }
      ],
      "heading": "Legacy multi-byte Japanese encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "cseuckr",
            "csksc56011987",
            "euc-kr",
            "iso-ir-149",
            "korean",
            "ks_c_5601-1987",
            "ks_c_5601-1989",
            "ksc5601",
            "ksc_5601",
            "windows-949"
          ],
          "name": "EUC-KR"
        }
      ],
      "heading": "Legacy multi-byte Korean encodings"
    },
    {
      "encodings": [
        {
          "labels": [
            "csiso2022kr",
            "hz-gb-2312",
            "iso-2022-cn",
            "iso-2022-cn-ext",
            "iso-2022-kr"
          ],
          "name": "replacement"
        },
        {
          "labels": [
            "utf-16be"
          ],
          "name": "UTF-16BE"
        },
        {
          "labels": [
            "utf-16",
            "utf-16le"
          ],
          "name": "UTF-16LE"
        },
        {
          "labels": [
            "x-user-defined"
          ],
          "name": "x-user-defined"
        }
      ],
      "heading": "Legacy miscellaneous encodings"
    }
  ];

  // Label to encoding registry.
  /** @type {Object.<string,{name:string,labels:Array.<string>}>} */
  var label_to_encoding = {};
  encodings.forEach(function(category) {
    category.encodings.forEach(function(encoding) {
      encoding.labels.forEach(function(label) {
        label_to_encoding[label] = encoding;
      });
    });
  });

  // Registry of of encoder/decoder factories, by encoding name.
  /** @type {Object.<string, function({fatal:boolean}): Encoder>} */
  var encoders = {};
  /** @type {Object.<string, function({fatal:boolean}): Decoder>} */
  var decoders = {};

  //
  // 6. Indexes
  //

  /**
   * @param {number} pointer The |pointer| to search for.
   * @param {(!Array.<?number>|undefined)} index The |index| to search within.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in |index|.
   */
  function indexCodePointFor(pointer, index) {
    if (!index) return null;
    return index[pointer] || null;
  }

  /**
   * @param {number} code_point The |code point| to search for.
   * @param {!Array.<?number>} index The |index| to search within.
   * @return {?number} The first pointer corresponding to |code point| in
   *     |index|, or null if |code point| is not in |index|.
   */
  function indexPointerFor(code_point, index) {
    var pointer = index.indexOf(code_point);
    return pointer === -1 ? null : pointer;
  }

  /**
   * @param {string} name Name of the index.
   * @return {(!Array.<number>|!Array.<Array.<number>>)}
   *  */
  function index(name) {
    if (!('encoding-indexes' in global)) {
      throw Error("Indexes missing." +
                  " Did you forget to include encoding-indexes.js first?");
    }
    return global['encoding-indexes'][name];
  }

  /**
   * @param {number} pointer The |pointer| to search for in the gb18030 index.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in the gb18030 index.
   */
  function indexGB18030RangesCodePointFor(pointer) {
    // 1. If pointer is greater than 39419 and less than 189000, or
    // pointer is greater than 1237575, return null.
    if ((pointer > 39419 && pointer < 189000) || (pointer > 1237575))
      return null;

    // 2. If pointer is 7457, return code point U+E7C7.
    if (pointer === 7457) return 0xE7C7;

    // 3. Let offset be the last pointer in index gb18030 ranges that
    // is equal to or less than pointer and let code point offset be
    // its corresponding code point.
    var offset = 0;
    var code_point_offset = 0;
    var idx = index('gb18030-ranges');
    var i;
    for (i = 0; i < idx.length; ++i) {
      /** @type {!Array.<number>} */
      var entry = idx[i];
      if (entry[0] <= pointer) {
        offset = entry[0];
        code_point_offset = entry[1];
      } else {
        break;
      }
    }

    // 4. Return a code point whose value is code point offset +
    // pointer − offset.
    return code_point_offset + pointer - offset;
  }

  /**
   * @param {number} code_point The |code point| to locate in the gb18030 index.
   * @return {number} The first pointer corresponding to |code point| in the
   *     gb18030 index.
   */
  function indexGB18030RangesPointerFor(code_point) {
    // 1. If code point is U+E7C7, return pointer 7457.
    if (code_point === 0xE7C7) return 7457;

    // 2. Let offset be the last code point in index gb18030 ranges
    // that is equal to or less than code point and let pointer offset
    // be its corresponding pointer.
    var offset = 0;
    var pointer_offset = 0;
    var idx = index('gb18030-ranges');
    var i;
    for (i = 0; i < idx.length; ++i) {
      /** @type {!Array.<number>} */
      var entry = idx[i];
      if (entry[1] <= code_point) {
        offset = entry[1];
        pointer_offset = entry[0];
      } else {
        break;
      }
    }

    // 3. Return a pointer whose value is pointer offset + code point
    // − offset.
    return pointer_offset + code_point - offset;
  }

  /**
   * @param {number} code_point The |code_point| to search for in the Shift_JIS
   *     index.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in the Shift_JIS index.
   */
  function indexShiftJISPointerFor(code_point) {
    // 1. Let index be index jis0208 excluding all entries whose
    // pointer is in the range 8272 to 8835, inclusive.
    shift_jis_index = shift_jis_index ||
      index('jis0208').map(function(code_point, pointer) {
        return inRange(pointer, 8272, 8835) ? null : code_point;
      });
    var index_ = shift_jis_index;

    // 2. Return the index pointer for code point in index.
    return index_.indexOf(code_point);
  }
  var shift_jis_index;

  /**
   * @param {number} code_point The |code_point| to search for in the big5
   *     index.
   * @return {?number} The code point corresponding to |pointer| in |index|,
   *     or null if |code point| is not in the big5 index.
   */
  function indexBig5PointerFor(code_point) {
    // 1. Let index be index Big5 excluding all entries whose pointer
    big5_index_no_hkscs = big5_index_no_hkscs ||
      index('big5').map(function(code_point, pointer) {
        return (pointer < (0xA1 - 0x81) * 157) ? null : code_point;
      });
    var index_ = big5_index_no_hkscs;

    // 2. If code point is U+2550, U+255E, U+2561, U+256A, U+5341, or
    // U+5345, return the last pointer corresponding to code point in
    // index.
    if (code_point === 0x2550 || code_point === 0x255E ||
        code_point === 0x2561 || code_point === 0x256A ||
        code_point === 0x5341 || code_point === 0x5345) {
      return index_.lastIndexOf(code_point);
    }

    // 3. Return the index pointer for code point in index.
    return indexPointerFor(code_point, index_);
  }
  var big5_index_no_hkscs;

  //
  // 8. API
  //

  /** @const */ var DEFAULT_ENCODING = 'utf-8';

  // 8.1 Interface TextDecoder

  /**
   * @constructor
   * @param {string=} label The label of the encoding;
   *     defaults to 'utf-8'.
   * @param {Object=} options
   */
  function TextDecoder(label, options) {
    // Web IDL conventions
    if (!(this instanceof TextDecoder))
      throw TypeError('Called as a function. Did you forget \'new\'?');
    label = label !== undefined ? String(label) : DEFAULT_ENCODING;
    options = ToDictionary(options);

    // A TextDecoder object has an associated encoding, decoder,
    // stream, ignore BOM flag (initially unset), BOM seen flag
    // (initially unset), error mode (initially replacement), and do
    // not flush flag (initially unset).

    /** @private */
    this._encoding = null;
    /** @private @type {?Decoder} */
    this._decoder = null;
    /** @private @type {boolean} */
    this._ignoreBOM = false;
    /** @private @type {boolean} */
    this._BOMseen = false;
    /** @private @type {string} */
    this._error_mode = 'replacement';
    /** @private @type {boolean} */
    this._do_not_flush = false;


    // 1. Let encoding be the result of getting an encoding from
    // label.
    var encoding = getEncoding(label);

    // 2. If encoding is failure or replacement, throw a RangeError.
    if (encoding === null || encoding.name === 'replacement')
      throw RangeError('Unknown encoding: ' + label);
    if (!decoders[encoding.name]) {
      throw Error('Decoder not present.' +
                  ' Did you forget to include encoding-indexes.js first?');
    }

    // 3. Let dec be a new TextDecoder object.
    var dec = this;

    // 4. Set dec's encoding to encoding.
    dec._encoding = encoding;

    // 5. If options's fatal member is true, set dec's error mode to
    // fatal.
    if (Boolean(options['fatal']))
      dec._error_mode = 'fatal';

    // 6. If options's ignoreBOM member is true, set dec's ignore BOM
    // flag.
    if (Boolean(options['ignoreBOM']))
      dec._ignoreBOM = true;

    // For pre-ES5 runtimes:
    if (!Object.defineProperty) {
      this.encoding = dec._encoding.name.toLowerCase();
      this.fatal = dec._error_mode === 'fatal';
      this.ignoreBOM = dec._ignoreBOM;
    }

    // 7. Return dec.
    return dec;
  }

  if (Object.defineProperty) {
    // The encoding attribute's getter must return encoding's name.
    Object.defineProperty(TextDecoder.prototype, 'encoding', {
      /** @this {TextDecoder} */
      get: function() { return this._encoding.name.toLowerCase(); }
    });

    // The fatal attribute's getter must return true if error mode
    // is fatal, and false otherwise.
    Object.defineProperty(TextDecoder.prototype, 'fatal', {
      /** @this {TextDecoder} */
      get: function() { return this._error_mode === 'fatal'; }
    });

    // The ignoreBOM attribute's getter must return true if ignore
    // BOM flag is set, and false otherwise.
    Object.defineProperty(TextDecoder.prototype, 'ignoreBOM', {
      /** @this {TextDecoder} */
      get: function() { return this._ignoreBOM; }
    });
  }

  /**
   * @param {BufferSource=} input The buffer of bytes to decode.
   * @param {Object=} options
   * @return {string} The decoded string.
   */
  TextDecoder.prototype.decode = function decode(input, options) {
    var bytes;
    if (typeof input === 'object' && input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input);
    } else if (typeof input === 'object' && 'buffer' in input &&
               input.buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(input.buffer,
                             input.byteOffset,
                             input.byteLength);
    } else {
      bytes = new Uint8Array(0);
    }

    options = ToDictionary(options);

    // 1. If the do not flush flag is unset, set decoder to a new
    // encoding's decoder, set stream to a new stream, and unset the
    // BOM seen flag.
    if (!this._do_not_flush) {
      this._decoder = decoders[this._encoding.name]({
        fatal: this._error_mode === 'fatal'});
      this._BOMseen = false;
    }

    // 2. If options's stream is true, set the do not flush flag, and
    // unset the do not flush flag otherwise.
    this._do_not_flush = Boolean(options['stream']);

    // 3. If input is given, push a copy of input to stream.
    // TODO: Align with spec algorithm - maintain stream on instance.
    var input_stream = new Stream(bytes);

    // 4. Let output be a new stream.
    var output = [];

    /** @type {?(number|!Array.<number>)} */
    var result;

    // 5. While true:
    while (true) {
      // 1. Let token be the result of reading from stream.
      var token = input_stream.read();

      // 2. If token is end-of-stream and the do not flush flag is
      // set, return output, serialized.
      // TODO: Align with spec algorithm.
      if (token === end_of_stream)
        break;

      // 3. Otherwise, run these subsubsteps:

      // 1. Let result be the result of processing token for decoder,
      // stream, output, and error mode.
      result = this._decoder.handler(input_stream, token);

      // 2. If result is finished, return output, serialized.
      if (result === finished)
        break;

      if (result !== null) {
        if (Array.isArray(result))
          output.push.apply(output, /**@type {!Array.<number>}*/(result));
        else
          output.push(result);
      }

      // 3. Otherwise, if result is error, throw a TypeError.
      // (Thrown in handler)

      // 4. Otherwise, do nothing.
    }
    // TODO: Align with spec algorithm.
    if (!this._do_not_flush) {
      do {
        result = this._decoder.handler(input_stream, input_stream.read());
        if (result === finished)
          break;
        if (result === null)
          continue;
        if (Array.isArray(result))
          output.push.apply(output, /**@type {!Array.<number>}*/(result));
        else
          output.push(result);
      } while (!input_stream.endOfStream());
      this._decoder = null;
    }

    // A TextDecoder object also has an associated serialize stream
    // algorithm...
    /**
     * @param {!Array.<number>} stream
     * @return {string}
     * @this {TextDecoder}
     */
    function serializeStream(stream) {
      // 1. Let token be the result of reading from stream.
      // (Done in-place on array, rather than as a stream)

      // 2. If encoding is UTF-8, UTF-16BE, or UTF-16LE, and ignore
      // BOM flag and BOM seen flag are unset, run these subsubsteps:
      if (includes(['UTF-8', 'UTF-16LE', 'UTF-16BE'], this._encoding.name) &&
          !this._ignoreBOM && !this._BOMseen) {
        if (stream.length > 0 && stream[0] === 0xFEFF) {
          // 1. If token is U+FEFF, set BOM seen flag.
          this._BOMseen = true;
          stream.shift();
        } else if (stream.length > 0) {
          // 2. Otherwise, if token is not end-of-stream, set BOM seen
          // flag and append token to stream.
          this._BOMseen = true;
        } else {
          // 3. Otherwise, if token is not end-of-stream, append token
          // to output.
          // (no-op)
        }
      }
      // 4. Otherwise, return output.
      return codePointsToString(stream);
    }

    return serializeStream.call(this, output);
  };

  // 8.2 Interface TextEncoder

  /**
   * @constructor
   * @param {string=} label The label of the encoding. NONSTANDARD.
   * @param {Object=} options NONSTANDARD.
   */
  function TextEncoder(label, options) {
    // Web IDL conventions
    if (!(this instanceof TextEncoder))
      throw TypeError('Called as a function. Did you forget \'new\'?');
    options = ToDictionary(options);

    // A TextEncoder object has an associated encoding and encoder.

    /** @private */
    this._encoding = null;
    /** @private @type {?Encoder} */
    this._encoder = null;

    // Non-standard
    /** @private @type {boolean} */
    this._do_not_flush = false;
    /** @private @type {string} */
    this._fatal = Boolean(options['fatal']) ? 'fatal' : 'replacement';

    // 1. Let enc be a new TextEncoder object.
    var enc = this;

    // 2. Set enc's encoding to UTF-8's encoder.
    if (Boolean(options['NONSTANDARD_allowLegacyEncoding'])) {
      // NONSTANDARD behavior.
      label = label !== undefined ? String(label) : DEFAULT_ENCODING;
      var encoding = getEncoding(label);
      if (encoding === null || encoding.name === 'replacement')
        throw RangeError('Unknown encoding: ' + label);
      if (!encoders[encoding.name]) {
        throw Error('Encoder not present.' +
                    ' Did you forget to include encoding-indexes.js first?');
      }
      enc._encoding = encoding;
    } else {
      // Standard behavior.
      enc._encoding = getEncoding('utf-8');

      if (label !== undefined && 'console' in global) {
        console.warn('TextEncoder constructor called with encoding label, '
                     + 'which is ignored.');
      }
    }

    // For pre-ES5 runtimes:
    if (!Object.defineProperty)
      this.encoding = enc._encoding.name.toLowerCase();

    // 3. Return enc.
    return enc;
  }

  if (Object.defineProperty) {
    // The encoding attribute's getter must return encoding's name.
    Object.defineProperty(TextEncoder.prototype, 'encoding', {
      /** @this {TextEncoder} */
      get: function() { return this._encoding.name.toLowerCase(); }
    });
  }

  /**
   * @param {string=} opt_string The string to encode.
   * @param {Object=} options
   * @return {!Uint8Array} Encoded bytes, as a Uint8Array.
   */
  TextEncoder.prototype.encode = function encode(opt_string, options) {
    opt_string = opt_string === undefined ? '' : String(opt_string);
    options = ToDictionary(options);

    // NOTE: This option is nonstandard. None of the encodings
    // permitted for encoding (i.e. UTF-8, UTF-16) are stateful when
    // the input is a USVString so streaming is not necessary.
    if (!this._do_not_flush)
      this._encoder = encoders[this._encoding.name]({
        fatal: this._fatal === 'fatal'});
    this._do_not_flush = Boolean(options['stream']);

    // 1. Convert input to a stream.
    var input = new Stream(stringToCodePoints(opt_string));

    // 2. Let output be a new stream
    var output = [];

    /** @type {?(number|!Array.<number>)} */
    var result;
    // 3. While true, run these substeps:
    while (true) {
      // 1. Let token be the result of reading from input.
      var token = input.read();
      if (token === end_of_stream)
        break;
      // 2. Let result be the result of processing token for encoder,
      // input, output.
      result = this._encoder.handler(input, token);
      if (result === finished)
        break;
      if (Array.isArray(result))
        output.push.apply(output, /**@type {!Array.<number>}*/(result));
      else
        output.push(result);
    }
    // TODO: Align with spec algorithm.
    if (!this._do_not_flush) {
      while (true) {
        result = this._encoder.handler(input, input.read());
        if (result === finished)
          break;
        if (Array.isArray(result))
          output.push.apply(output, /**@type {!Array.<number>}*/(result));
        else
          output.push(result);
      }
      this._encoder = null;
    }
    // 3. If result is finished, convert output into a byte sequence,
    // and then return a Uint8Array object wrapping an ArrayBuffer
    // containing output.
    return new Uint8Array(output);
  };


  //
  // 9. The encoding
  //

  // 9.1 utf-8

  // 9.1.1 utf-8 decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function UTF8Decoder(options) {
    var fatal = options.fatal;

    // utf-8's decoder's has an associated utf-8 code point, utf-8
    // bytes seen, and utf-8 bytes needed (all initially 0), a utf-8
    // lower boundary (initially 0x80), and a utf-8 upper boundary
    // (initially 0xBF).
    var /** @type {number} */ utf8_code_point = 0,
        /** @type {number} */ utf8_bytes_seen = 0,
        /** @type {number} */ utf8_bytes_needed = 0,
        /** @type {number} */ utf8_lower_boundary = 0x80,
        /** @type {number} */ utf8_upper_boundary = 0xBF;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and utf-8 bytes needed is not 0,
      // set utf-8 bytes needed to 0 and return error.
      if (bite === end_of_stream && utf8_bytes_needed !== 0) {
        utf8_bytes_needed = 0;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream, return finished.
      if (bite === end_of_stream)
        return finished;

      // 3. If utf-8 bytes needed is 0, based on byte:
      if (utf8_bytes_needed === 0) {

        // 0x00 to 0x7F
        if (inRange(bite, 0x00, 0x7F)) {
          // Return a code point whose value is byte.
          return bite;
        }

        // 0xC2 to 0xDF
        else if (inRange(bite, 0xC2, 0xDF)) {
          // 1. Set utf-8 bytes needed to 1.
          utf8_bytes_needed = 1;

          // 2. Set UTF-8 code point to byte & 0x1F.
          utf8_code_point = bite & 0x1F;
        }

        // 0xE0 to 0xEF
        else if (inRange(bite, 0xE0, 0xEF)) {
          // 1. If byte is 0xE0, set utf-8 lower boundary to 0xA0.
          if (bite === 0xE0)
            utf8_lower_boundary = 0xA0;
          // 2. If byte is 0xED, set utf-8 upper boundary to 0x9F.
          if (bite === 0xED)
            utf8_upper_boundary = 0x9F;
          // 3. Set utf-8 bytes needed to 2.
          utf8_bytes_needed = 2;
          // 4. Set UTF-8 code point to byte & 0xF.
          utf8_code_point = bite & 0xF;
        }

        // 0xF0 to 0xF4
        else if (inRange(bite, 0xF0, 0xF4)) {
          // 1. If byte is 0xF0, set utf-8 lower boundary to 0x90.
          if (bite === 0xF0)
            utf8_lower_boundary = 0x90;
          // 2. If byte is 0xF4, set utf-8 upper boundary to 0x8F.
          if (bite === 0xF4)
            utf8_upper_boundary = 0x8F;
          // 3. Set utf-8 bytes needed to 3.
          utf8_bytes_needed = 3;
          // 4. Set UTF-8 code point to byte & 0x7.
          utf8_code_point = bite & 0x7;
        }

        // Otherwise
        else {
          // Return error.
          return decoderError(fatal);
        }

        // Return continue.
        return null;
      }

      // 4. If byte is not in the range utf-8 lower boundary to utf-8
      // upper boundary, inclusive, run these substeps:
      if (!inRange(bite, utf8_lower_boundary, utf8_upper_boundary)) {

        // 1. Set utf-8 code point, utf-8 bytes needed, and utf-8
        // bytes seen to 0, set utf-8 lower boundary to 0x80, and set
        // utf-8 upper boundary to 0xBF.
        utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
        utf8_lower_boundary = 0x80;
        utf8_upper_boundary = 0xBF;

        // 2. Prepend byte to stream.
        stream.prepend(bite);

        // 3. Return error.
        return decoderError(fatal);
      }

      // 5. Set utf-8 lower boundary to 0x80 and utf-8 upper boundary
      // to 0xBF.
      utf8_lower_boundary = 0x80;
      utf8_upper_boundary = 0xBF;

      // 6. Set UTF-8 code point to (UTF-8 code point << 6) | (byte &
      // 0x3F)
      utf8_code_point = (utf8_code_point << 6) | (bite & 0x3F);

      // 7. Increase utf-8 bytes seen by one.
      utf8_bytes_seen += 1;

      // 8. If utf-8 bytes seen is not equal to utf-8 bytes needed,
      // continue.
      if (utf8_bytes_seen !== utf8_bytes_needed)
        return null;

      // 9. Let code point be utf-8 code point.
      var code_point = utf8_code_point;

      // 10. Set utf-8 code point, utf-8 bytes needed, and utf-8 bytes
      // seen to 0.
      utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;

      // 11. Return a code point whose value is code point.
      return code_point;
    };
  }

  // 9.1.2 utf-8 encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function UTF8Encoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. Set count and offset based on the range code point is in:
      var count, offset;
      // U+0080 to U+07FF, inclusive:
      if (inRange(code_point, 0x0080, 0x07FF)) {
        // 1 and 0xC0
        count = 1;
        offset = 0xC0;
      }
      // U+0800 to U+FFFF, inclusive:
      else if (inRange(code_point, 0x0800, 0xFFFF)) {
        // 2 and 0xE0
        count = 2;
        offset = 0xE0;
      }
      // U+10000 to U+10FFFF, inclusive:
      else if (inRange(code_point, 0x10000, 0x10FFFF)) {
        // 3 and 0xF0
        count = 3;
        offset = 0xF0;
      }

      // 4. Let bytes be a byte sequence whose first byte is (code
      // point >> (6 × count)) + offset.
      var bytes = [(code_point >> (6 * count)) + offset];

      // 5. Run these substeps while count is greater than 0:
      while (count > 0) {

        // 1. Set temp to code point >> (6 × (count − 1)).
        var temp = code_point >> (6 * (count - 1));

        // 2. Append to bytes 0x80 | (temp & 0x3F).
        bytes.push(0x80 | (temp & 0x3F));

        // 3. Decrease count by one.
        count -= 1;
      }

      // 6. Return bytes bytes, in order.
      return bytes;
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['UTF-8'] = function(options) {
    return new UTF8Encoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['UTF-8'] = function(options) {
    return new UTF8Decoder(options);
  };

  //
  // 10. Legacy single-byte encodings
  //

  // 10.1 single-byte decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {!Array.<number>} index The encoding index.
   * @param {{fatal: boolean}} options
   */
  function SingleByteDecoder(index, options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream, return finished.
      if (bite === end_of_stream)
        return finished;

      // 2. If byte is an ASCII byte, return a code point whose value
      // is byte.
      if (isASCIIByte(bite))
        return bite;

      // 3. Let code point be the index code point for byte − 0x80 in
      // index single-byte.
      var code_point = index[bite - 0x80];

      // 4. If code point is null, return error.
      if (code_point === null)
        return decoderError(fatal);

      // 5. Return a code point whose value is code point.
      return code_point;
    };
  }

  // 10.2 single-byte encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {!Array.<?number>} index The encoding index.
   * @param {{fatal: boolean}} options
   */
  function SingleByteEncoder(index, options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. Let pointer be the index pointer for code point in index
      // single-byte.
      var pointer = indexPointerFor(code_point, index);

      // 4. If pointer is null, return error with code point.
      if (pointer === null)
        encoderError(code_point);

      // 5. Return a byte whose value is pointer + 0x80.
      return pointer + 0x80;
    };
  }

  (function() {
    if (!('encoding-indexes' in global))
      return;
    encodings.forEach(function(category) {
      if (category.heading !== 'Legacy single-byte encodings')
        return;
      category.encodings.forEach(function(encoding) {
        var name = encoding.name;
        var idx = index(name.toLowerCase());
        /** @param {{fatal: boolean}} options */
        decoders[name] = function(options) {
          return new SingleByteDecoder(idx, options);
        };
        /** @param {{fatal: boolean}} options */
        encoders[name] = function(options) {
          return new SingleByteEncoder(idx, options);
        };
      });
    });
  }());

  //
  // 11. Legacy multi-byte Chinese (simplified) encodings
  //

  // 11.1 gbk

  // 11.1.1 gbk decoder
  // gbk's decoder is gb18030's decoder.
  /** @param {{fatal: boolean}} options */
  decoders['GBK'] = function(options) {
    return new GB18030Decoder(options);
  };

  // 11.1.2 gbk encoder
  // gbk's encoder is gb18030's encoder with its gbk flag set.
  /** @param {{fatal: boolean}} options */
  encoders['GBK'] = function(options) {
    return new GB18030Encoder(options, true);
  };

  // 11.2 gb18030

  // 11.2.1 gb18030 decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function GB18030Decoder(options) {
    var fatal = options.fatal;
    // gb18030's decoder has an associated gb18030 first, gb18030
    // second, and gb18030 third (all initially 0x00).
    var /** @type {number} */ gb18030_first = 0x00,
        /** @type {number} */ gb18030_second = 0x00,
        /** @type {number} */ gb18030_third = 0x00;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and gb18030 first, gb18030
      // second, and gb18030 third are 0x00, return finished.
      if (bite === end_of_stream && gb18030_first === 0x00 &&
          gb18030_second === 0x00 && gb18030_third === 0x00) {
        return finished;
      }
      // 2. If byte is end-of-stream, and gb18030 first, gb18030
      // second, or gb18030 third is not 0x00, set gb18030 first,
      // gb18030 second, and gb18030 third to 0x00, and return error.
      if (bite === end_of_stream &&
          (gb18030_first !== 0x00 || gb18030_second !== 0x00 ||
           gb18030_third !== 0x00)) {
        gb18030_first = 0x00;
        gb18030_second = 0x00;
        gb18030_third = 0x00;
        decoderError(fatal);
      }
      var code_point;
      // 3. If gb18030 third is not 0x00, run these substeps:
      if (gb18030_third !== 0x00) {
        // 1. Let code point be null.
        code_point = null;
        // 2. If byte is in the range 0x30 to 0x39, inclusive, set
        // code point to the index gb18030 ranges code point for
        // (((gb18030 first − 0x81) × 10 + gb18030 second − 0x30) ×
        // 126 + gb18030 third − 0x81) × 10 + byte − 0x30.
        if (inRange(bite, 0x30, 0x39)) {
          code_point = indexGB18030RangesCodePointFor(
              (((gb18030_first - 0x81) * 10 + gb18030_second - 0x30) * 126 +
               gb18030_third - 0x81) * 10 + bite - 0x30);
        }

        // 3. Let buffer be a byte sequence consisting of gb18030
        // second, gb18030 third, and byte, in order.
        var buffer = [gb18030_second, gb18030_third, bite];

        // 4. Set gb18030 first, gb18030 second, and gb18030 third to
        // 0x00.
        gb18030_first = 0x00;
        gb18030_second = 0x00;
        gb18030_third = 0x00;

        // 5. If code point is null, prepend buffer to stream and
        // return error.
        if (code_point === null) {
          stream.prepend(buffer);
          return decoderError(fatal);
        }

        // 6. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If gb18030 second is not 0x00, run these substeps:
      if (gb18030_second !== 0x00) {

        // 1. If byte is in the range 0x81 to 0xFE, inclusive, set
        // gb18030 third to byte and return continue.
        if (inRange(bite, 0x81, 0xFE)) {
          gb18030_third = bite;
          return null;
        }

        // 2. Prepend gb18030 second followed by byte to stream, set
        // gb18030 first and gb18030 second to 0x00, and return error.
        stream.prepend([gb18030_second, bite]);
        gb18030_first = 0x00;
        gb18030_second = 0x00;
        return decoderError(fatal);
      }

      // 5. If gb18030 first is not 0x00, run these substeps:
      if (gb18030_first !== 0x00) {

        // 1. If byte is in the range 0x30 to 0x39, inclusive, set
        // gb18030 second to byte and return continue.
        if (inRange(bite, 0x30, 0x39)) {
          gb18030_second = bite;
          return null;
        }

        // 2. Let lead be gb18030 first, let pointer be null, and set
        // gb18030 first to 0x00.
        var lead = gb18030_first;
        var pointer = null;
        gb18030_first = 0x00;

        // 3. Let offset be 0x40 if byte is less than 0x7F and 0x41
        // otherwise.
        var offset = bite < 0x7F ? 0x40 : 0x41;

        // 4. If byte is in the range 0x40 to 0x7E, inclusive, or 0x80
        // to 0xFE, inclusive, set pointer to (lead − 0x81) × 190 +
        // (byte − offset).
        if (inRange(bite, 0x40, 0x7E) || inRange(bite, 0x80, 0xFE))
          pointer = (lead - 0x81) * 190 + (bite - offset);

        // 5. Let code point be null if pointer is null and the index
        // code point for pointer in index gb18030 otherwise.
        code_point = pointer === null ? null :
            indexCodePointFor(pointer, index('gb18030'));

        // 6. If code point is null and byte is an ASCII byte, prepend
        // byte to stream.
        if (code_point === null && isASCIIByte(bite))
          stream.prepend(bite);

        // 7. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 8. Return a code point whose value is code point.
        return code_point;
      }

      // 6. If byte is an ASCII byte, return a code point whose value
      // is byte.
      if (isASCIIByte(bite))
        return bite;

      // 7. If byte is 0x80, return code point U+20AC.
      if (bite === 0x80)
        return 0x20AC;

      // 8. If byte is in the range 0x81 to 0xFE, inclusive, set
      // gb18030 first to byte and return continue.
      if (inRange(bite, 0x81, 0xFE)) {
        gb18030_first = bite;
        return null;
      }

      // 9. Return error.
      return decoderError(fatal);
    };
  }

  // 11.2.2 gb18030 encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   * @param {boolean=} gbk_flag
   */
  function GB18030Encoder(options, gbk_flag) {
    var fatal = options.fatal;
    // gb18030's decoder has an associated gbk flag (initially unset).
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. If code point is U+E5E5, return error with code point.
      if (code_point === 0xE5E5)
        return encoderError(code_point);

      // 4. If the gbk flag is set and code point is U+20AC, return
      // byte 0x80.
      if (gbk_flag && code_point === 0x20AC)
        return 0x80;

      // 5. Let pointer be the index pointer for code point in index
      // gb18030.
      var pointer = indexPointerFor(code_point, index('gb18030'));

      // 6. If pointer is not null, run these substeps:
      if (pointer !== null) {

        // 1. Let lead be floor(pointer / 190) + 0x81.
        var lead = floor(pointer / 190) + 0x81;

        // 2. Let trail be pointer % 190.
        var trail = pointer % 190;

        // 3. Let offset be 0x40 if trail is less than 0x3F and 0x41 otherwise.
        var offset = trail < 0x3F ? 0x40 : 0x41;

        // 4. Return two bytes whose values are lead and trail + offset.
        return [lead, trail + offset];
      }

      // 7. If gbk flag is set, return error with code point.
      if (gbk_flag)
        return encoderError(code_point);

      // 8. Set pointer to the index gb18030 ranges pointer for code
      // point.
      pointer = indexGB18030RangesPointerFor(code_point);

      // 9. Let byte1 be floor(pointer / 10 / 126 / 10).
      var byte1 = floor(pointer / 10 / 126 / 10);

      // 10. Set pointer to pointer − byte1 × 10 × 126 × 10.
      pointer = pointer - byte1 * 10 * 126 * 10;

      // 11. Let byte2 be floor(pointer / 10 / 126).
      var byte2 = floor(pointer / 10 / 126);

      // 12. Set pointer to pointer − byte2 × 10 × 126.
      pointer = pointer - byte2 * 10 * 126;

      // 13. Let byte3 be floor(pointer / 10).
      var byte3 = floor(pointer / 10);

      // 14. Let byte4 be pointer − byte3 × 10.
      var byte4 = pointer - byte3 * 10;

      // 15. Return four bytes whose values are byte1 + 0x81, byte2 +
      // 0x30, byte3 + 0x81, byte4 + 0x30.
      return [byte1 + 0x81,
              byte2 + 0x30,
              byte3 + 0x81,
              byte4 + 0x30];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['gb18030'] = function(options) {
    return new GB18030Encoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['gb18030'] = function(options) {
    return new GB18030Decoder(options);
  };


  //
  // 12. Legacy multi-byte Chinese (traditional) encodings
  //

  // 12.1 Big5

  // 12.1.1 Big5 decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function Big5Decoder(options) {
    var fatal = options.fatal;
    // Big5's decoder has an associated Big5 lead (initially 0x00).
    var /** @type {number} */ Big5_lead = 0x00;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and Big5 lead is not 0x00, set
      // Big5 lead to 0x00 and return error.
      if (bite === end_of_stream && Big5_lead !== 0x00) {
        Big5_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and Big5 lead is 0x00, return
      // finished.
      if (bite === end_of_stream && Big5_lead === 0x00)
        return finished;

      // 3. If Big5 lead is not 0x00, let lead be Big5 lead, let
      // pointer be null, set Big5 lead to 0x00, and then run these
      // substeps:
      if (Big5_lead !== 0x00) {
        var lead = Big5_lead;
        var pointer = null;
        Big5_lead = 0x00;

        // 1. Let offset be 0x40 if byte is less than 0x7F and 0x62
        // otherwise.
        var offset = bite < 0x7F ? 0x40 : 0x62;

        // 2. If byte is in the range 0x40 to 0x7E, inclusive, or 0xA1
        // to 0xFE, inclusive, set pointer to (lead − 0x81) × 157 +
        // (byte − offset).
        if (inRange(bite, 0x40, 0x7E) || inRange(bite, 0xA1, 0xFE))
          pointer = (lead - 0x81) * 157 + (bite - offset);

        // 3. If there is a row in the table below whose first column
        // is pointer, return the two code points listed in its second
        // column
        // Pointer | Code points
        // --------+--------------
        // 1133    | U+00CA U+0304
        // 1135    | U+00CA U+030C
        // 1164    | U+00EA U+0304
        // 1166    | U+00EA U+030C
        switch (pointer) {
          case 1133: return [0x00CA, 0x0304];
          case 1135: return [0x00CA, 0x030C];
          case 1164: return [0x00EA, 0x0304];
          case 1166: return [0x00EA, 0x030C];
        }

        // 4. Let code point be null if pointer is null and the index
        // code point for pointer in index Big5 otherwise.
        var code_point = (pointer === null) ? null :
            indexCodePointFor(pointer, index('big5'));

        // 5. If code point is null and byte is an ASCII byte, prepend
        // byte to stream.
        if (code_point === null && isASCIIByte(bite))
          stream.prepend(bite);

        // 6. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 7. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If byte is an ASCII byte, return a code point whose value
      // is byte.
      if (isASCIIByte(bite))
        return bite;

      // 5. If byte is in the range 0x81 to 0xFE, inclusive, set Big5
      // lead to byte and return continue.
      if (inRange(bite, 0x81, 0xFE)) {
        Big5_lead = bite;
        return null;
      }

      // 6. Return error.
      return decoderError(fatal);
    };
  }

  // 12.1.2 Big5 encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function Big5Encoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. Let pointer be the index Big5 pointer for code point.
      var pointer = indexBig5PointerFor(code_point);

      // 4. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 5. Let lead be floor(pointer / 157) + 0x81.
      var lead = floor(pointer / 157) + 0x81;

      // 6. If lead is less than 0xA1, return error with code point.
      if (lead < 0xA1)
        return encoderError(code_point);

      // 7. Let trail be pointer % 157.
      var trail = pointer % 157;

      // 8. Let offset be 0x40 if trail is less than 0x3F and 0x62
      // otherwise.
      var offset = trail < 0x3F ? 0x40 : 0x62;

      // Return two bytes whose values are lead and trail + offset.
      return [lead, trail + offset];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['Big5'] = function(options) {
    return new Big5Encoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['Big5'] = function(options) {
    return new Big5Decoder(options);
  };


  //
  // 13. Legacy multi-byte Japanese encodings
  //

  // 13.1 euc-jp

  // 13.1.1 euc-jp decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function EUCJPDecoder(options) {
    var fatal = options.fatal;

    // euc-jp's decoder has an associated euc-jp jis0212 flag
    // (initially unset) and euc-jp lead (initially 0x00).
    var /** @type {boolean} */ eucjp_jis0212_flag = false,
        /** @type {number} */ eucjp_lead = 0x00;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and euc-jp lead is not 0x00, set
      // euc-jp lead to 0x00, and return error.
      if (bite === end_of_stream && eucjp_lead !== 0x00) {
        eucjp_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and euc-jp lead is 0x00, return
      // finished.
      if (bite === end_of_stream && eucjp_lead === 0x00)
        return finished;

      // 3. If euc-jp lead is 0x8E and byte is in the range 0xA1 to
      // 0xDF, inclusive, set euc-jp lead to 0x00 and return a code
      // point whose value is 0xFF61 − 0xA1 + byte.
      if (eucjp_lead === 0x8E && inRange(bite, 0xA1, 0xDF)) {
        eucjp_lead = 0x00;
        return 0xFF61 - 0xA1 + bite;
      }

      // 4. If euc-jp lead is 0x8F and byte is in the range 0xA1 to
      // 0xFE, inclusive, set the euc-jp jis0212 flag, set euc-jp lead
      // to byte, and return continue.
      if (eucjp_lead === 0x8F && inRange(bite, 0xA1, 0xFE)) {
        eucjp_jis0212_flag = true;
        eucjp_lead = bite;
        return null;
      }

      // 5. If euc-jp lead is not 0x00, let lead be euc-jp lead, set
      // euc-jp lead to 0x00, and run these substeps:
      if (eucjp_lead !== 0x00) {
        var lead = eucjp_lead;
        eucjp_lead = 0x00;

        // 1. Let code point be null.
        var code_point = null;

        // 2. If lead and byte are both in the range 0xA1 to 0xFE,
        // inclusive, set code point to the index code point for (lead
        // − 0xA1) × 94 + byte − 0xA1 in index jis0208 if the euc-jp
        // jis0212 flag is unset and in index jis0212 otherwise.
        if (inRange(lead, 0xA1, 0xFE) && inRange(bite, 0xA1, 0xFE)) {
          code_point = indexCodePointFor(
            (lead - 0xA1) * 94 + (bite - 0xA1),
            index(!eucjp_jis0212_flag ? 'jis0208' : 'jis0212'));
        }

        // 3. Unset the euc-jp jis0212 flag.
        eucjp_jis0212_flag = false;

        // 4. If byte is not in the range 0xA1 to 0xFE, inclusive,
        // prepend byte to stream.
        if (!inRange(bite, 0xA1, 0xFE))
          stream.prepend(bite);

        // 5. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 6. Return a code point whose value is code point.
        return code_point;
      }

      // 6. If byte is an ASCII byte, return a code point whose value
      // is byte.
      if (isASCIIByte(bite))
        return bite;

      // 7. If byte is 0x8E, 0x8F, or in the range 0xA1 to 0xFE,
      // inclusive, set euc-jp lead to byte and return continue.
      if (bite === 0x8E || bite === 0x8F || inRange(bite, 0xA1, 0xFE)) {
        eucjp_lead = bite;
        return null;
      }

      // 8. Return error.
      return decoderError(fatal);
    };
  }

  // 13.1.2 euc-jp encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function EUCJPEncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. If code point is U+00A5, return byte 0x5C.
      if (code_point === 0x00A5)
        return 0x5C;

      // 4. If code point is U+203E, return byte 0x7E.
      if (code_point === 0x203E)
        return 0x7E;

      // 5. If code point is in the range U+FF61 to U+FF9F, inclusive,
      // return two bytes whose values are 0x8E and code point −
      // 0xFF61 + 0xA1.
      if (inRange(code_point, 0xFF61, 0xFF9F))
        return [0x8E, code_point - 0xFF61 + 0xA1];

      // 6. If code point is U+2212, set it to U+FF0D.
      if (code_point === 0x2212)
        code_point = 0xFF0D;

      // 7. Let pointer be the index pointer for code point in index
      // jis0208.
      var pointer = indexPointerFor(code_point, index('jis0208'));

      // 8. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 9. Let lead be floor(pointer / 94) + 0xA1.
      var lead = floor(pointer / 94) + 0xA1;

      // 10. Let trail be pointer % 94 + 0xA1.
      var trail = pointer % 94 + 0xA1;

      // 11. Return two bytes whose values are lead and trail.
      return [lead, trail];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['EUC-JP'] = function(options) {
    return new EUCJPEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['EUC-JP'] = function(options) {
    return new EUCJPDecoder(options);
  };

  // 13.2 iso-2022-jp

  // 13.2.1 iso-2022-jp decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function ISO2022JPDecoder(options) {
    var fatal = options.fatal;
    /** @enum */
    var states = {
      ASCII: 0,
      Roman: 1,
      Katakana: 2,
      LeadByte: 3,
      TrailByte: 4,
      EscapeStart: 5,
      Escape: 6
    };
    // iso-2022-jp's decoder has an associated iso-2022-jp decoder
    // state (initially ASCII), iso-2022-jp decoder output state
    // (initially ASCII), iso-2022-jp lead (initially 0x00), and
    // iso-2022-jp output flag (initially unset).
    var /** @type {number} */ iso2022jp_decoder_state = states.ASCII,
        /** @type {number} */ iso2022jp_decoder_output_state = states.ASCII,
        /** @type {number} */ iso2022jp_lead = 0x00,
        /** @type {boolean} */ iso2022jp_output_flag = false;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // switching on iso-2022-jp decoder state:
      switch (iso2022jp_decoder_state) {
      default:
      case states.ASCII:
        // ASCII
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x00 to 0x7F, excluding 0x0E, 0x0F, and 0x1B
        if (inRange(bite, 0x00, 0x7F) && bite !== 0x0E
            && bite !== 0x0F && bite !== 0x1B) {
          // Unset the iso-2022-jp output flag and return a code point
          // whose value is byte.
          iso2022jp_output_flag = false;
          return bite;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.Roman:
        // Roman
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x5C
        if (bite === 0x5C) {
          // Unset the iso-2022-jp output flag and return code point
          // U+00A5.
          iso2022jp_output_flag = false;
          return 0x00A5;
        }

        // 0x7E
        if (bite === 0x7E) {
          // Unset the iso-2022-jp output flag and return code point
          // U+203E.
          iso2022jp_output_flag = false;
          return 0x203E;
        }

        // 0x00 to 0x7F, excluding 0x0E, 0x0F, 0x1B, 0x5C, and 0x7E
        if (inRange(bite, 0x00, 0x7F) && bite !== 0x0E && bite !== 0x0F
            && bite !== 0x1B && bite !== 0x5C && bite !== 0x7E) {
          // Unset the iso-2022-jp output flag and return a code point
          // whose value is byte.
          iso2022jp_output_flag = false;
          return bite;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.Katakana:
        // Katakana
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x21 to 0x5F
        if (inRange(bite, 0x21, 0x5F)) {
          // Unset the iso-2022-jp output flag and return a code point
          // whose value is 0xFF61 − 0x21 + byte.
          iso2022jp_output_flag = false;
          return 0xFF61 - 0x21 + bite;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.LeadByte:
        // Lead byte
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return null;
        }

        // 0x21 to 0x7E
        if (inRange(bite, 0x21, 0x7E)) {
          // Unset the iso-2022-jp output flag, set iso-2022-jp lead
          // to byte, iso-2022-jp decoder state to trail byte, and
          // return continue.
          iso2022jp_output_flag = false;
          iso2022jp_lead = bite;
          iso2022jp_decoder_state = states.TrailByte;
          return null;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Return finished.
          return finished;
        }

        // Otherwise
        // Unset the iso-2022-jp output flag and return error.
        iso2022jp_output_flag = false;
        return decoderError(fatal);

      case states.TrailByte:
        // Trail byte
        // Based on byte:

        // 0x1B
        if (bite === 0x1B) {
          // Set iso-2022-jp decoder state to escape start and return
          // continue.
          iso2022jp_decoder_state = states.EscapeStart;
          return decoderError(fatal);
        }

        // 0x21 to 0x7E
        if (inRange(bite, 0x21, 0x7E)) {
          // 1. Set the iso-2022-jp decoder state to lead byte.
          iso2022jp_decoder_state = states.LeadByte;

          // 2. Let pointer be (iso-2022-jp lead − 0x21) × 94 + byte − 0x21.
          var pointer = (iso2022jp_lead - 0x21) * 94 + bite - 0x21;

          // 3. Let code point be the index code point for pointer in
          // index jis0208.
          var code_point = indexCodePointFor(pointer, index('jis0208'));

          // 4. If code point is null, return error.
          if (code_point === null)
            return decoderError(fatal);

          // 5. Return a code point whose value is code point.
          return code_point;
        }

        // end-of-stream
        if (bite === end_of_stream) {
          // Set the iso-2022-jp decoder state to lead byte, prepend
          // byte to stream, and return error.
          iso2022jp_decoder_state = states.LeadByte;
          stream.prepend(bite);
          return decoderError(fatal);
        }

        // Otherwise
        // Set iso-2022-jp decoder state to lead byte and return
        // error.
        iso2022jp_decoder_state = states.LeadByte;
        return decoderError(fatal);

      case states.EscapeStart:
        // Escape start

        // 1. If byte is either 0x24 or 0x28, set iso-2022-jp lead to
        // byte, iso-2022-jp decoder state to escape, and return
        // continue.
        if (bite === 0x24 || bite === 0x28) {
          iso2022jp_lead = bite;
          iso2022jp_decoder_state = states.Escape;
          return null;
        }

        // 2. Prepend byte to stream.
        stream.prepend(bite);

        // 3. Unset the iso-2022-jp output flag, set iso-2022-jp
        // decoder state to iso-2022-jp decoder output state, and
        // return error.
        iso2022jp_output_flag = false;
        iso2022jp_decoder_state = iso2022jp_decoder_output_state;
        return decoderError(fatal);

      case states.Escape:
        // Escape

        // 1. Let lead be iso-2022-jp lead and set iso-2022-jp lead to
        // 0x00.
        var lead = iso2022jp_lead;
        iso2022jp_lead = 0x00;

        // 2. Let state be null.
        var state = null;

        // 3. If lead is 0x28 and byte is 0x42, set state to ASCII.
        if (lead === 0x28 && bite === 0x42)
          state = states.ASCII;

        // 4. If lead is 0x28 and byte is 0x4A, set state to Roman.
        if (lead === 0x28 && bite === 0x4A)
          state = states.Roman;

        // 5. If lead is 0x28 and byte is 0x49, set state to Katakana.
        if (lead === 0x28 && bite === 0x49)
          state = states.Katakana;

        // 6. If lead is 0x24 and byte is either 0x40 or 0x42, set
        // state to lead byte.
        if (lead === 0x24 && (bite === 0x40 || bite === 0x42))
          state = states.LeadByte;

        // 7. If state is non-null, run these substeps:
        if (state !== null) {
          // 1. Set iso-2022-jp decoder state and iso-2022-jp decoder
          // output state to states.
          iso2022jp_decoder_state = iso2022jp_decoder_state = state;

          // 2. Let output flag be the iso-2022-jp output flag.
          var output_flag = iso2022jp_output_flag;

          // 3. Set the iso-2022-jp output flag.
          iso2022jp_output_flag = true;

          // 4. Return continue, if output flag is unset, and error
          // otherwise.
          return !output_flag ? null : decoderError(fatal);
        }

        // 8. Prepend lead and byte to stream.
        stream.prepend([lead, bite]);

        // 9. Unset the iso-2022-jp output flag, set iso-2022-jp
        // decoder state to iso-2022-jp decoder output state and
        // return error.
        iso2022jp_output_flag = false;
        iso2022jp_decoder_state = iso2022jp_decoder_output_state;
        return decoderError(fatal);
      }
    };
  }

  // 13.2.2 iso-2022-jp encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function ISO2022JPEncoder(options) {
    var fatal = options.fatal;
    // iso-2022-jp's encoder has an associated iso-2022-jp encoder
    // state which is one of ASCII, Roman, and jis0208 (initially
    // ASCII).
    /** @enum */
    var states = {
      ASCII: 0,
      Roman: 1,
      jis0208: 2
    };
    var /** @type {number} */ iso2022jp_state = states.ASCII;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream and iso-2022-jp encoder
      // state is not ASCII, prepend code point to stream, set
      // iso-2022-jp encoder state to ASCII, and return three bytes
      // 0x1B 0x28 0x42.
      if (code_point === end_of_stream &&
          iso2022jp_state !== states.ASCII) {
        stream.prepend(code_point);
        iso2022jp_state = states.ASCII;
        return [0x1B, 0x28, 0x42];
      }

      // 2. If code point is end-of-stream and iso-2022-jp encoder
      // state is ASCII, return finished.
      if (code_point === end_of_stream && iso2022jp_state === states.ASCII)
        return finished;

      // 3. If ISO-2022-JP encoder state is ASCII or Roman, and code
      // point is U+000E, U+000F, or U+001B, return error with U+FFFD.
      if ((iso2022jp_state === states.ASCII ||
           iso2022jp_state === states.Roman) &&
          (code_point === 0x000E || code_point === 0x000F ||
           code_point === 0x001B)) {
        return encoderError(0xFFFD);
      }

      // 4. If iso-2022-jp encoder state is ASCII and code point is an
      // ASCII code point, return a byte whose value is code point.
      if (iso2022jp_state === states.ASCII &&
          isASCIICodePoint(code_point))
        return code_point;

      // 5. If iso-2022-jp encoder state is Roman and code point is an
      // ASCII code point, excluding U+005C and U+007E, or is U+00A5
      // or U+203E, run these substeps:
      if (iso2022jp_state === states.Roman &&
          ((isASCIICodePoint(code_point) &&
           code_point !== 0x005C && code_point !== 0x007E) ||
          (code_point == 0x00A5 || code_point == 0x203E))) {

        // 1. If code point is an ASCII code point, return a byte
        // whose value is code point.
        if (isASCIICodePoint(code_point))
          return code_point;

        // 2. If code point is U+00A5, return byte 0x5C.
        if (code_point === 0x00A5)
          return 0x5C;

        // 3. If code point is U+203E, return byte 0x7E.
        if (code_point === 0x203E)
          return 0x7E;
      }

      // 6. If code point is an ASCII code point, and iso-2022-jp
      // encoder state is not ASCII, prepend code point to stream, set
      // iso-2022-jp encoder state to ASCII, and return three bytes
      // 0x1B 0x28 0x42.
      if (isASCIICodePoint(code_point) &&
          iso2022jp_state !== states.ASCII) {
        stream.prepend(code_point);
        iso2022jp_state = states.ASCII;
        return [0x1B, 0x28, 0x42];
      }

      // 7. If code point is either U+00A5 or U+203E, and iso-2022-jp
      // encoder state is not Roman, prepend code point to stream, set
      // iso-2022-jp encoder state to Roman, and return three bytes
      // 0x1B 0x28 0x4A.
      if ((code_point === 0x00A5 || code_point === 0x203E) &&
          iso2022jp_state !== states.Roman) {
        stream.prepend(code_point);
        iso2022jp_state = states.Roman;
        return [0x1B, 0x28, 0x4A];
      }

      // 8. If code point is U+2212, set it to U+FF0D.
      if (code_point === 0x2212)
        code_point = 0xFF0D;

      // 9. Let pointer be the index pointer for code point in index
      // jis0208.
      var pointer = indexPointerFor(code_point, index('jis0208'));

      // 10. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 11. If iso-2022-jp encoder state is not jis0208, prepend code
      // point to stream, set iso-2022-jp encoder state to jis0208,
      // and return three bytes 0x1B 0x24 0x42.
      if (iso2022jp_state !== states.jis0208) {
        stream.prepend(code_point);
        iso2022jp_state = states.jis0208;
        return [0x1B, 0x24, 0x42];
      }

      // 12. Let lead be floor(pointer / 94) + 0x21.
      var lead = floor(pointer / 94) + 0x21;

      // 13. Let trail be pointer % 94 + 0x21.
      var trail = pointer % 94 + 0x21;

      // 14. Return two bytes whose values are lead and trail.
      return [lead, trail];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['ISO-2022-JP'] = function(options) {
    return new ISO2022JPEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['ISO-2022-JP'] = function(options) {
    return new ISO2022JPDecoder(options);
  };

  // 13.3 Shift_JIS

  // 13.3.1 Shift_JIS decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function ShiftJISDecoder(options) {
    var fatal = options.fatal;
    // Shift_JIS's decoder has an associated Shift_JIS lead (initially
    // 0x00).
    var /** @type {number} */ Shift_JIS_lead = 0x00;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and Shift_JIS lead is not 0x00,
      // set Shift_JIS lead to 0x00 and return error.
      if (bite === end_of_stream && Shift_JIS_lead !== 0x00) {
        Shift_JIS_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and Shift_JIS lead is 0x00,
      // return finished.
      if (bite === end_of_stream && Shift_JIS_lead === 0x00)
        return finished;

      // 3. If Shift_JIS lead is not 0x00, let lead be Shift_JIS lead,
      // let pointer be null, set Shift_JIS lead to 0x00, and then run
      // these substeps:
      if (Shift_JIS_lead !== 0x00) {
        var lead = Shift_JIS_lead;
        var pointer = null;
        Shift_JIS_lead = 0x00;

        // 1. Let offset be 0x40, if byte is less than 0x7F, and 0x41
        // otherwise.
        var offset = (bite < 0x7F) ? 0x40 : 0x41;

        // 2. Let lead offset be 0x81, if lead is less than 0xA0, and
        // 0xC1 otherwise.
        var lead_offset = (lead < 0xA0) ? 0x81 : 0xC1;

        // 3. If byte is in the range 0x40 to 0x7E, inclusive, or 0x80
        // to 0xFC, inclusive, set pointer to (lead − lead offset) ×
        // 188 + byte − offset.
        if (inRange(bite, 0x40, 0x7E) || inRange(bite, 0x80, 0xFC))
          pointer = (lead - lead_offset) * 188 + bite - offset;

        // 4. If pointer is in the range 8836 to 10715, inclusive,
        // return a code point whose value is 0xE000 − 8836 + pointer.
        if (inRange(pointer, 8836, 10715))
          return 0xE000 - 8836 + pointer;

        // 5. Let code point be null, if pointer is null, and the
        // index code point for pointer in index jis0208 otherwise.
        var code_point = (pointer === null) ? null :
              indexCodePointFor(pointer, index('jis0208'));

        // 6. If code point is null and byte is an ASCII byte, prepend
        // byte to stream.
        if (code_point === null && isASCIIByte(bite))
          stream.prepend(bite);

        // 7. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 8. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If byte is an ASCII byte or 0x80, return a code point
      // whose value is byte.
      if (isASCIIByte(bite) || bite === 0x80)
        return bite;

      // 5. If byte is in the range 0xA1 to 0xDF, inclusive, return a
      // code point whose value is 0xFF61 − 0xA1 + byte.
      if (inRange(bite, 0xA1, 0xDF))
        return 0xFF61 - 0xA1 + bite;

      // 6. If byte is in the range 0x81 to 0x9F, inclusive, or 0xE0
      // to 0xFC, inclusive, set Shift_JIS lead to byte and return
      // continue.
      if (inRange(bite, 0x81, 0x9F) || inRange(bite, 0xE0, 0xFC)) {
        Shift_JIS_lead = bite;
        return null;
      }

      // 7. Return error.
      return decoderError(fatal);
    };
  }

  // 13.3.2 Shift_JIS encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function ShiftJISEncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point or U+0080, return a
      // byte whose value is code point.
      if (isASCIICodePoint(code_point) || code_point === 0x0080)
        return code_point;

      // 3. If code point is U+00A5, return byte 0x5C.
      if (code_point === 0x00A5)
        return 0x5C;

      // 4. If code point is U+203E, return byte 0x7E.
      if (code_point === 0x203E)
        return 0x7E;

      // 5. If code point is in the range U+FF61 to U+FF9F, inclusive,
      // return a byte whose value is code point − 0xFF61 + 0xA1.
      if (inRange(code_point, 0xFF61, 0xFF9F))
        return code_point - 0xFF61 + 0xA1;

      // 6. If code point is U+2212, set it to U+FF0D.
      if (code_point === 0x2212)
        code_point = 0xFF0D;

      // 7. Let pointer be the index Shift_JIS pointer for code point.
      var pointer = indexShiftJISPointerFor(code_point);

      // 8. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 9. Let lead be floor(pointer / 188).
      var lead = floor(pointer / 188);

      // 10. Let lead offset be 0x81, if lead is less than 0x1F, and
      // 0xC1 otherwise.
      var lead_offset = (lead < 0x1F) ? 0x81 : 0xC1;

      // 11. Let trail be pointer % 188.
      var trail = pointer % 188;

      // 12. Let offset be 0x40, if trail is less than 0x3F, and 0x41
      // otherwise.
      var offset = (trail < 0x3F) ? 0x40 : 0x41;

      // 13. Return two bytes whose values are lead + lead offset and
      // trail + offset.
      return [lead + lead_offset, trail + offset];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['Shift_JIS'] = function(options) {
    return new ShiftJISEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['Shift_JIS'] = function(options) {
    return new ShiftJISDecoder(options);
  };

  //
  // 14. Legacy multi-byte Korean encodings
  //

  // 14.1 euc-kr

  // 14.1.1 euc-kr decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function EUCKRDecoder(options) {
    var fatal = options.fatal;

    // euc-kr's decoder has an associated euc-kr lead (initially 0x00).
    var /** @type {number} */ euckr_lead = 0x00;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and euc-kr lead is not 0x00, set
      // euc-kr lead to 0x00 and return error.
      if (bite === end_of_stream && euckr_lead !== 0) {
        euckr_lead = 0x00;
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and euc-kr lead is 0x00, return
      // finished.
      if (bite === end_of_stream && euckr_lead === 0)
        return finished;

      // 3. If euc-kr lead is not 0x00, let lead be euc-kr lead, let
      // pointer be null, set euc-kr lead to 0x00, and then run these
      // substeps:
      if (euckr_lead !== 0x00) {
        var lead = euckr_lead;
        var pointer = null;
        euckr_lead = 0x00;

        // 1. If byte is in the range 0x41 to 0xFE, inclusive, set
        // pointer to (lead − 0x81) × 190 + (byte − 0x41).
        if (inRange(bite, 0x41, 0xFE))
          pointer = (lead - 0x81) * 190 + (bite - 0x41);

        // 2. Let code point be null, if pointer is null, and the
        // index code point for pointer in index euc-kr otherwise.
        var code_point = (pointer === null)
              ? null : indexCodePointFor(pointer, index('euc-kr'));

        // 3. If code point is null and byte is an ASCII byte, prepend
        // byte to stream.
        if (pointer === null && isASCIIByte(bite))
          stream.prepend(bite);

        // 4. If code point is null, return error.
        if (code_point === null)
          return decoderError(fatal);

        // 5. Return a code point whose value is code point.
        return code_point;
      }

      // 4. If byte is an ASCII byte, return a code point whose value
      // is byte.
      if (isASCIIByte(bite))
        return bite;

      // 5. If byte is in the range 0x81 to 0xFE, inclusive, set
      // euc-kr lead to byte and return continue.
      if (inRange(bite, 0x81, 0xFE)) {
        euckr_lead = bite;
        return null;
      }

      // 6. Return error.
      return decoderError(fatal);
    };
  }

  // 14.1.2 euc-kr encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function EUCKREncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. Let pointer be the index pointer for code point in index
      // euc-kr.
      var pointer = indexPointerFor(code_point, index('euc-kr'));

      // 4. If pointer is null, return error with code point.
      if (pointer === null)
        return encoderError(code_point);

      // 5. Let lead be floor(pointer / 190) + 0x81.
      var lead = floor(pointer / 190) + 0x81;

      // 6. Let trail be pointer % 190 + 0x41.
      var trail = (pointer % 190) + 0x41;

      // 7. Return two bytes whose values are lead and trail.
      return [lead, trail];
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['EUC-KR'] = function(options) {
    return new EUCKREncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['EUC-KR'] = function(options) {
    return new EUCKRDecoder(options);
  };


  //
  // 15. Legacy miscellaneous encodings
  //

  // 15.1 replacement

  // Not needed - API throws RangeError

  // 15.2 Common infrastructure for utf-16be and utf-16le

  /**
   * @param {number} code_unit
   * @param {boolean} utf16be
   * @return {!Array.<number>} bytes
   */
  function convertCodeUnitToBytes(code_unit, utf16be) {
    // 1. Let byte1 be code unit >> 8.
    var byte1 = code_unit >> 8;

    // 2. Let byte2 be code unit & 0x00FF.
    var byte2 = code_unit & 0x00FF;

    // 3. Then return the bytes in order:
        // utf-16be flag is set: byte1, then byte2.
    if (utf16be)
      return [byte1, byte2];
    // utf-16be flag is unset: byte2, then byte1.
    return [byte2, byte1];
  }

  // 15.2.1 shared utf-16 decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {boolean} utf16_be True if big-endian, false if little-endian.
   * @param {{fatal: boolean}} options
   */
  function UTF16Decoder(utf16_be, options) {
    var fatal = options.fatal;
    var /** @type {?number} */ utf16_lead_byte = null,
        /** @type {?number} */ utf16_lead_surrogate = null;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream and either utf-16 lead byte or
      // utf-16 lead surrogate is not null, set utf-16 lead byte and
      // utf-16 lead surrogate to null, and return error.
      if (bite === end_of_stream && (utf16_lead_byte !== null ||
                                utf16_lead_surrogate !== null)) {
        return decoderError(fatal);
      }

      // 2. If byte is end-of-stream and utf-16 lead byte and utf-16
      // lead surrogate are null, return finished.
      if (bite === end_of_stream && utf16_lead_byte === null &&
          utf16_lead_surrogate === null) {
        return finished;
      }

      // 3. If utf-16 lead byte is null, set utf-16 lead byte to byte
      // and return continue.
      if (utf16_lead_byte === null) {
        utf16_lead_byte = bite;
        return null;
      }

      // 4. Let code unit be the result of:
      var code_unit;
      if (utf16_be) {
        // utf-16be decoder flag is set
        //   (utf-16 lead byte << 8) + byte.
        code_unit = (utf16_lead_byte << 8) + bite;
      } else {
        // utf-16be decoder flag is unset
        //   (byte << 8) + utf-16 lead byte.
        code_unit = (bite << 8) + utf16_lead_byte;
      }
      // Then set utf-16 lead byte to null.
      utf16_lead_byte = null;

      // 5. If utf-16 lead surrogate is not null, let lead surrogate
      // be utf-16 lead surrogate, set utf-16 lead surrogate to null,
      // and then run these substeps:
      if (utf16_lead_surrogate !== null) {
        var lead_surrogate = utf16_lead_surrogate;
        utf16_lead_surrogate = null;

        // 1. If code unit is in the range U+DC00 to U+DFFF,
        // inclusive, return a code point whose value is 0x10000 +
        // ((lead surrogate − 0xD800) << 10) + (code unit − 0xDC00).
        if (inRange(code_unit, 0xDC00, 0xDFFF)) {
          return 0x10000 + (lead_surrogate - 0xD800) * 0x400 +
              (code_unit - 0xDC00);
        }

        // 2. Prepend the sequence resulting of converting code unit
        // to bytes using utf-16be decoder flag to stream and return
        // error.
        stream.prepend(convertCodeUnitToBytes(code_unit, utf16_be));
        return decoderError(fatal);
      }

      // 6. If code unit is in the range U+D800 to U+DBFF, inclusive,
      // set utf-16 lead surrogate to code unit and return continue.
      if (inRange(code_unit, 0xD800, 0xDBFF)) {
        utf16_lead_surrogate = code_unit;
        return null;
      }

      // 7. If code unit is in the range U+DC00 to U+DFFF, inclusive,
      // return error.
      if (inRange(code_unit, 0xDC00, 0xDFFF))
        return decoderError(fatal);

      // 8. Return code point code unit.
      return code_unit;
    };
  }

  // 15.2.2 shared utf-16 encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {boolean} utf16_be True if big-endian, false if little-endian.
   * @param {{fatal: boolean}} options
   */
  function UTF16Encoder(utf16_be, options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1. If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is in the range U+0000 to U+FFFF, inclusive,
      // return the sequence resulting of converting code point to
      // bytes using utf-16be encoder flag.
      if (inRange(code_point, 0x0000, 0xFFFF))
        return convertCodeUnitToBytes(code_point, utf16_be);

      // 3. Let lead be ((code point − 0x10000) >> 10) + 0xD800,
      // converted to bytes using utf-16be encoder flag.
      var lead = convertCodeUnitToBytes(
        ((code_point - 0x10000) >> 10) + 0xD800, utf16_be);

      // 4. Let trail be ((code point − 0x10000) & 0x3FF) + 0xDC00,
      // converted to bytes using utf-16be encoder flag.
      var trail = convertCodeUnitToBytes(
        ((code_point - 0x10000) & 0x3FF) + 0xDC00, utf16_be);

      // 5. Return a byte sequence of lead followed by trail.
      return lead.concat(trail);
    };
  }

  // 15.3 utf-16be
  // 15.3.1 utf-16be decoder
  /** @param {{fatal: boolean}} options */
  encoders['UTF-16BE'] = function(options) {
    return new UTF16Encoder(true, options);
  };
  // 15.3.2 utf-16be encoder
  /** @param {{fatal: boolean}} options */
  decoders['UTF-16BE'] = function(options) {
    return new UTF16Decoder(true, options);
  };

  // 15.4 utf-16le
  // 15.4.1 utf-16le decoder
  /** @param {{fatal: boolean}} options */
  encoders['UTF-16LE'] = function(options) {
    return new UTF16Encoder(false, options);
  };
  // 15.4.2 utf-16le encoder
  /** @param {{fatal: boolean}} options */
  decoders['UTF-16LE'] = function(options) {
    return new UTF16Decoder(false, options);
  };

  // 15.5 x-user-defined

  // 15.5.1 x-user-defined decoder
  /**
   * @constructor
   * @implements {Decoder}
   * @param {{fatal: boolean}} options
   */
  function XUserDefinedDecoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function(stream, bite) {
      // 1. If byte is end-of-stream, return finished.
      if (bite === end_of_stream)
        return finished;

      // 2. If byte is an ASCII byte, return a code point whose value
      // is byte.
      if (isASCIIByte(bite))
        return bite;

      // 3. Return a code point whose value is 0xF780 + byte − 0x80.
      return 0xF780 + bite - 0x80;
    };
  }

  // 15.5.2 x-user-defined encoder
  /**
   * @constructor
   * @implements {Encoder}
   * @param {{fatal: boolean}} options
   */
  function XUserDefinedEncoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function(stream, code_point) {
      // 1.If code point is end-of-stream, return finished.
      if (code_point === end_of_stream)
        return finished;

      // 2. If code point is an ASCII code point, return a byte whose
      // value is code point.
      if (isASCIICodePoint(code_point))
        return code_point;

      // 3. If code point is in the range U+F780 to U+F7FF, inclusive,
      // return a byte whose value is code point − 0xF780 + 0x80.
      if (inRange(code_point, 0xF780, 0xF7FF))
        return code_point - 0xF780 + 0x80;

      // 4. Return error with code point.
      return encoderError(code_point);
    };
  }

  /** @param {{fatal: boolean}} options */
  encoders['x-user-defined'] = function(options) {
    return new XUserDefinedEncoder(options);
  };
  /** @param {{fatal: boolean}} options */
  decoders['x-user-defined'] = function(options) {
    return new XUserDefinedDecoder(options);
  };

  if (!global['TextEncoder'])
    global['TextEncoder'] = TextEncoder;
  if (!global['TextDecoder'])
    global['TextDecoder'] = TextDecoder;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      TextEncoder: global['TextEncoder'],
      TextDecoder: global['TextDecoder'],
      EncodingIndexes: global["encoding-indexes"]
    };
  }

// For strict environments where `this` inside the global scope
// is `undefined`, take a pure object instead
}(this || {}));
},{"./encoding-indexes.js":20}]},{},[12])(12)
});