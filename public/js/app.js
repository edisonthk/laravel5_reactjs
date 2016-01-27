(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

// prefix of api url
var ApiPrefix = '/api',
    PostConst = {

    LOAD_ALL: 'POST_LOAD_ALL',
    CREATE: 'POST_CREATE'
};

exports.ApiPrefix = ApiPrefix;
exports.PostConst = PostConst;

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dispatcher = function () {
    function Dispatcher() {
        _classCallCheck(this, Dispatcher);

        this._callbacks = {};
        this._isDispatching = false;
        this._isHandled = {};
        this._actionFired = {};
        this._isPending = {};
        this._lastID = 1;
        this._prefix = 'ID_';
    }

    /**
     * Registers a callback to be invoked with every dispatched payload. Returns
     * a token that can be used with `waitFor()`.
     */

    _createClass(Dispatcher, [{
        key: 'register',
        value: function register(callback) {
            var id = this._prefix + this._lastID++;
            this._callbacks[id] = callback;
            return id;
        }

        /**
         * Removes a callback based on its token.
         */

    }, {
        key: 'unregister',
        value: function unregister(id) {
            delete this._callbacks[id];
        }

        /**
         * Is this Dispatcher currently dispatching.
         */

    }, {
        key: 'isDispatching',
        value: function isDispatching() {
            return this._isDispatching;
        }

        /**
         * Call the callback stored with the given id. Also do some internal
         * bookkeeping.
         *
         * @internal
         */

    }, {
        key: '_invokeCallback',
        value: function _invokeCallback(id) {
            this._isPending[id] = true;
            this._callbacks[id](this._pendingPayload);
            this._isHandled[id] = true;
        }

        /**
         * Set up bookkeeping needed when dispatching.
         *
         * @internal
         */

    }, {
        key: '_startDispatching',
        value: function _startDispatching(payload) {
            for (var id in this._callbacks) {
                this._isPending[id] = false;
                this._isHandled[id] = false;
            }
            this._pendingPayload = payload;
            this._isDispatching = true;
        }

        /**
         * Clear bookkeeping used for dispatching.
         *
         * @internal
         */

    }, {
        key: '_stopDispatching',
        value: function _stopDispatching() {
            delete this._pendingPayload;
            this._isDispatching = false;
        }

        /**
         * Dispatches a payload to all registered callbacks.
         */

    }, {
        key: 'dispatch',
        value: function dispatch(payload) {

            this._startDispatching(payload);
            try {
                for (var id in this._callbacks) {
                    if (this._isPending[id]) {
                        continue;
                    }
                    this._invokeCallback(id);
                }
            } finally {
                this._stopDispatching();
            }
        }
    }]);

    return Dispatcher;
}();

exports.default = new Dispatcher();

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Post = require("./components/Post");

var _Post2 = _interopRequireDefault(_Post);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var IndexRoute = ReactRouter.IndexRoute;
var BrowserHistory = ReactRouter.browserHistory;

var routesMap = React.createElement(
    Router,
    { history: BrowserHistory },
    React.createElement(Route, { path: "/", component: _Post2.default })
);

exports.default = routesMap;

},{"./components/Post":7}],5:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Constant = require("../Constant");

var _Dispatcher = require("../Dispatcher");

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PostAction = function () {
    function PostAction() {
        _classCallCheck(this, PostAction);
    }

    _createClass(PostAction, [{
        key: "loadAll",
        value: function loadAll() {

            _Dispatcher2.default.dispatch({
                type: _Constant.PostConst.LOAD_ALL
            });
        }
    }, {
        key: "create",
        value: function create(name, title) {
            _Dispatcher2.default.dispatch({
                type: _Constant.PostConst.CREATE,
                name: name,
                title: title
            });
        }
    }]);

    return PostAction;
}();

exports.default = new PostAction();

},{"../Constant":2,"../Dispatcher":3}],6:[function(require,module,exports){
'use strict';

var _Route = require('./Route');

var _Route2 = _interopRequireDefault(_Route);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (typeof __SERVER === 'undefined') {
    ReactDOM.render(_Route2.default, document.getElementById("main"));
}

},{"./Route":4}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _PostStore = require("../stores/PostStore");

var _PostStore2 = _interopRequireDefault(_PostStore);

var _PostAction = require("../actions/PostAction");

var _PostAction2 = _interopRequireDefault(_PostAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Post = function (_React$Component) {
    _inherits(Post, _React$Component);

    function Post() {
        _classCallCheck(this, Post);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Post).call(this));

        _this.state = {
            posts: []
        };
        _this._onChange = _this._onChange.bind(_this);
        return _this;
    }

    _createClass(Post, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            _PostStore2.default.addChangeListener(this._onChange);

            // if there is updated in data, _onChange will be fired and data will be updated
            _PostStore2.default.loadAll();
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            this.ws.close();
            _PostStore2.default.removeChangeListener(this._onChange);
        }
    }, {
        key: "_onChange",
        value: function _onChange() {
            this.setState({
                posts: _PostStore2.default.getAll()
            });
        }
    }, {
        key: "_nameOnChange",
        value: function _nameOnChange(e) {
            this.setState({
                name: e.target.value
            });
        }
    }, {
        key: "_titleOnChange",
        value: function _titleOnChange(e) {
            this.setState({
                title: e.target.value
            });
        }
    }, {
        key: "_onSubmit",
        value: function _onSubmit(e) {
            e.preventDefault();

            var name = this.state.name;
            var title = this.state.title;

            this.setState({ name: "", title: "" });

            _PostAction2.default.create(name, title);
        }
    }, {
        key: "render",
        value: function render() {

            var list = [];
            for (var i = 0; i < this.state.posts.length; i++) {
                var post = this.state.posts[i];

                list.push(React.createElement(
                    "li",
                    { key: i },
                    post.title,
                    " ",
                    React.createElement(
                        "small",
                        null,
                        "by ",
                        post.name
                    )
                ));
            }

            return React.createElement(
                "div",
                null,
                React.createElement(
                    "p",
                    null,
                    "Comment page"
                ),
                React.createElement(
                    "ul",
                    null,
                    list
                ),
                React.createElement(
                    "form",
                    { onSubmit: this._onSubmit.bind(this) },
                    React.createElement("input", { value: this.state.name, onChange: this._nameOnChange.bind(this), placeholder: "name" }),
                    React.createElement("input", { value: this.state.title, onChange: this._titleOnChange.bind(this), placeholder: "title" }),
                    React.createElement("input", { type: "submit", value: "送信" })
                )
            );
        }
    }]);

    return Post;
}(React.Component);

exports.default = Post;

},{"../actions/PostAction":5,"../stores/PostStore":9}],8:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _events = require("events");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CHANGE_EVENT = "change";

var BaseStore = function (_EventEmitter) {
    _inherits(BaseStore, _EventEmitter);

    function BaseStore() {
        _classCallCheck(this, BaseStore);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(BaseStore).call(this));
    }

    _createClass(BaseStore, [{
        key: "emitChange",
        value: function emitChange() {
            this.emit(CHANGE_EVENT);
        }

        /**
         * @param {function} callback
         */

    }, {
        key: "addChangeListener",
        value: function addChangeListener(callback) {
            this.on(CHANGE_EVENT, callback);
        }

        /**
         * @param {function} callback
         */

    }, {
        key: "removeChangeListener",
        value: function removeChangeListener(callback) {
            this.removeListener(CHANGE_EVENT, callback);
        }
    }, {
        key: "ajax",
        value: function ajax(method, path, cb, data) {

            var xhr = null;
            try {
                xhr = new XMLHttpRequest();
            } catch (e) {
                try {
                    xhr = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    console.log("tinyxhr: XMLHttpRequest not supported");
                    return null;
                }
            }

            xhr.open(method.toUpperCase(), path);
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;

                var res = JSON.parse(xhr.responseText);
                var error = false;
                if (xhr.status !== 200) {
                    error = true;
                }
                cb(error, res, xhr.status);
            };

            var getParams = function getParams(data, url) {
                var arr = [],
                    str;
                for (var name in data) {
                    if (Array.isArray(data[name])) {
                        var arrayData = data[name];
                        for (var i = 0; i < arrayData.length; i++) {
                            arr.push(name + "[]" + '=' + encodeURIComponent(arrayData[i]));
                        }
                    } else {
                        arr.push(name + '=' + encodeURIComponent(data[name]));
                    }
                }
                str = arr.join('&');
                if (str != '') {
                    return url ? url.indexOf('?') < 0 ? '?' + str : '&' + str : str;
                }
                return '';
            };

            var formData = null;
            if ((typeof data === "undefined" ? "undefined" : _typeof(data)) === 'object') {

                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                formData = getParams(data);
            }

            xhr.send(formData);
        }
    }]);

    return BaseStore;
}(_events.EventEmitter);

exports.default = BaseStore;

},{"events":1}],9:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Constant = require("../Constant");

var _Dispatcher = require("../Dispatcher");

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

var _BaseStore2 = require("./BaseStore");

var _BaseStore3 = _interopRequireDefault(_BaseStore2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PostStore = function (_BaseStore) {
    _inherits(PostStore, _BaseStore);

    /**
     * constructor
     */

    function PostStore() {
        _classCallCheck(this, PostStore);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PostStore).call(this));

        _this.data = [];

        _this.dispatchToken = _Dispatcher2.default.register(function (action) {
            switch (action.type) {
                case _Constant.PostConst.LOAD_ALL:
                    _this.loadAll();
                    break;
                case _Constant.PostConst.CREATE:
                    _this.create(action.name, action.title);
                    break;
            }
        });
        return _this;
    }

    _createClass(PostStore, [{
        key: "loadAll",
        value: function loadAll() {
            var _this2 = this;

            this.ajax("get", _Constant.ApiPrefix + "/post", function (error, data) {
                _this2.data = data;
                _this2.emitChange();
            });
        }
    }, {
        key: "create",
        value: function create(name, title) {
            var _this3 = this;

            var formData = {
                name: name,
                title: title
            };

            this.ajax("post", _Constant.ApiPrefix + "/post", function (error, post) {
                _this3.data.push(post);
                _this3.emitChange();
            }, formData);
        }
    }, {
        key: "getAll",
        value: function getAll() {
            return this.data;
        }
    }]);

    return PostStore;
}(_BaseStore3.default);

exports.default = new PostStore();

},{"../Constant":2,"../Dispatcher":3,"./BaseStore":8}]},{},[6]);

//# sourceMappingURL=app.js.map
