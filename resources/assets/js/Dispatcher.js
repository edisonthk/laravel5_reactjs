'use strict';

class Dispatcher {

    constructor() {

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
    register(callback){
        var id = this._prefix + this._lastID++;
        this._callbacks[id] = callback;
        return id;
    }

    /**
     * Removes a callback based on its token.
     */
    unregister(id) {
        delete this._callbacks[id];
    }


    /**
     * Is this Dispatcher currently dispatching.
     */
    isDispatching() {
        return this._isDispatching;
    }

    /**
     * Call the callback stored with the given id. Also do some internal
     * bookkeeping.
     *
     * @internal
     */
    _invokeCallback(id) {
        this._isPending[id] = true;
        this._callbacks[id](this._pendingPayload);
        this._isHandled[id] = true;
    }

      /**
       * Set up bookkeeping needed when dispatching.
       *
       * @internal
       */
    _startDispatching(payload) {
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
    _stopDispatching() {
        delete this._pendingPayload;
        this._isDispatching = false;
    }


      /**
       * Dispatches a payload to all registered callbacks.
       */
    dispatch(payload) {

        
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
}

export default new Dispatcher();