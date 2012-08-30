/**
 * Author: Jeff Horak (@jmhorak)
 * Date: 5/31/12
 * MIT License
 *
 * Async Promise module
 */

var Promise = (function() {

  var _resolved = 'resolved',
      _rejected = 'rejected',
      _unfulfilled = 'unfulfilled';

  /**
   * Determines if a given object is a function
   *
   * @param fn - Object in question
   * @return {*} - True if instanceof a function, false otherwise
   * @private
   */
  function _isAFunction(fn) {
      return fn && fn instanceof Function;
  }

  /**
   * Executes all the registered callbacks in the given list
   * @param list - List of registered callbacks
   * @private
   */
  function _execCallbacks(list, args) {
    var len = list.length,
        fnArgs = args || this._arguments,
        fn;

    // Loop through all the defined resolve callbacks
    while (len--) {
      fn = list[len];
      if (_isAFunction(fn)) {
        fn.apply(null, fnArgs);
      }
    }
  }

  /**
   * Reset all of the callback arrays
   * @private
   */
  function _clearCallbacks() {
    // Free any registered callbacks
    this.resolveCallbacks = [];
    this.rejectCallbacks = [];
    this.progressCallbacks = [];
  }

  /**
   * Resolve a promise
   * @private
   */
  function _resolvePromise() {
    // Move to resolved state
    this.state = _resolved;

    // Run all the defined resolve callbacks
    _execCallbacks.call(this, this.resolveCallbacks);

    // Clear all the callbacks - we don't want to re-invoke these if another listener is added
    _clearCallbacks.call(this);
  }

  /**
   * Reject a promise
   * @private
   */
  function _rejectPromise() {
    // Move to failed state
    this.state = _rejected;

    // Run all the defined reject callbacks
    _execCallbacks.call(this, this.rejectCallbacks);

    // Clear all the callbacks - we don't want to re-invoke these if another listener is added
    _clearCallbacks.call(this);
  }

  /**
   * Register a new resolve callback
   * @param fn - The callback function to register
   * @private
   */
  function _addResolveCallback(fn) {

    // Ignore if not a function or this promise has already been rejected
    if (_isAFunction(fn) && this.state !== _rejected) {

      // Push onto resolve fn list
      this.resolveCallbacks.push(fn);

      if (this.state === 'resolved') {
        // Already resolved, call the resolve callback
        _resolvePromise.call(this);
      }
    }
  }

  /**
   * Register a new reject callback
   * @param fn - The callback function to register
   * @private
   */
  function _addRejectCallback(fn) {

    // Ignore if not a function or this promise has already been resolved
    if (_isAFunction(fn) && this.state !== _resolved) {
      // Push onto reject fn list
      this.rejectCallbacks.push(fn);

      if (this.state === 'rejected') {
        // Already rejected, call the reject callback
        _rejectPromise.call(this);
      }
    }
  }

  /**
   * Register a new progress callback
   * @param fn
   * @private
   */
  function _addProgressCallback(fn) {
    if (_isAFunction(fn) && this.state === _unfulfilled) {
      this.progressCallbacks.push(fn);
    }
  }

  // Build the Promise class

  /**
   * Promise class - calls resolve or fail callback when an async operation is completed
   * @constructor
   */
  var Promise = function() {
    this._arguments = null;
    this.state = _unfulfilled;
    this.resolveCallbacks = [];
    this.rejectCallbacks = [];
    this.progressCallbacks = [];
  };

  /**
   * Initialize the promise with a resolve and fail callback
   * @param resolveCallback {function} - Callback used when results are returned normally
   * @param failCallback {function} Optional - Callback used when the async operation has an error
   * @param progressCallback {function} Optional - Callback used to update progress of an async operation
   * @return {*}
   */
  Promise.prototype.then = function(resolveCallback, failCallback, progressCallback) {

    // Register callbacks
    _addResolveCallback.call(this, resolveCallback);
    _addRejectCallback.call(this, failCallback);
    _addProgressCallback.call(this, progressCallback);

    return this;
  };

  /**
   * Adds a single resolve callback
   * @param resolveCallback
   * @return {*}
   */
  Promise.prototype.whenDone = function(resolveCallback) {
    return this.then(resolveCallback, null, null);
  };

  /**
   * Adds a single reject callback
   * @param failCallback
   * @return {*}
   */
  Promise.prototype.ifFail = function(failCallback) {
    return this.then(null, failCallback, null);
  };

  /**
   * Adds a single progress callback
   * @param progressCallback
   * @return {*}
   */
  Promise.prototype.onUpdate = function(progressCallback) {
    return this.then(null, null, progressCallback);
  };

  /**
   * Resolve a promise, moves to the resolved state and then passes any arguments to supplied callback
   */
  Promise.prototype.resolve = function() {

    if (this.state !== _unfulfilled) {
      throw new Error('Cannot resolve a promise unless it is unfulfilled');
    }
    // Save the arguments, if new callbacks are registered they will be immediately invoked with these arguments
    this._arguments = Array.prototype.slice.call(arguments, 0);

    _resolvePromise.call(this);
  };

  /**
   * Reject a promise, there was an error during the operation, call the fail callback
   */
  Promise.prototype.reject = function() {

    if (this.state !== _unfulfilled) {
      throw new Error('Cannot reject a promise unless it is unfulfilled');
    }
    // Save the arguments, if new callbacks are registered they will be immediately invoked with these arguments
    this._arguments = Array.prototype.slice.call(arguments, 0);

    _rejectPromise.call(this);
  };

  /**
   * Update progress on a promise, a status update is available
   */
  Promise.prototype.updateProgress = function() {

    if (this.state !== _unfulfilled) {
      throw new Error('Cannot update progress of a promise unless it is unfulfilled');
    }

    // Send update to all defined progress callbacks
    _execCallbacks.call(this, this.progressCallbacks, arguments);
  };

  /**
   * Static function allowing chaining of promises
   *
   * @return {Promise} - Returns a promise which is used to synchronize between the supplied promises
   */
  Promise.when = function() {
    var slice = Array.prototype.slice,
        args = slice.call(arguments, 0),
        promises = [],
        promiseWhen = new Promise(),
        resolveArgs = null;

    // Normalize if an array of promises was passed in
    if (args[0] && Object.prototype.toString.call(args[0]) === '[object Array]') {
      args = args[0];
    }

    // Replace the 'then' function with a new one
    promiseWhen.then = function(resolve, fail) {

      function resolved() {
        // An individual promise was resolved, check if there are other outstanding promises
        var i = 0,
            len = promises.length,
            isNotResolved = false,
            results = [];

        for (; i < len && !isNotResolved; i++) {
          isNotResolved = promises[i].state !== 'resolved';
        }

        if (!isNotResolved) {
          // Everything is resolved - pass all the results back
          resolve.apply(null, resolveArgs);
        }
      }

      // Filter out anything that's not a Promise
      args.forEach(function(item) {

        if (item instanceof Promise) {

          // Replace the 'resolve' function with a new one
          item.resolve = function() {
            // Find this promise in our array
            var idx = promises.indexOf(this),
                instanceArgs = slice.call(arguments, 0);

            if (idx < 0) {
              throw new Error('Could not find promise');
            } else {
              // Insert the arguments in the array (this keeps the arguments "in order")
              resolveArgs[idx] = instanceArgs;
            }

            // Call to the prototype method
            Promise.prototype.resolve.apply(this, arguments);
          };

          // Set the resolve and fail callbacks
          item.then(resolved, fail);

          // Push onto the promises array
          promises.push(item);
        }
      });

      // If there are no promises, call resolve immediately
      if (promises.length === 0) {
        resolve();
      } else {
        // There are some promises to coordinate, initialize the resolved arguments array
        resolveArgs = new Array(promises.length);
      }

      return this;
    };

    return promiseWhen;
  };

  return Promise;

})();

if (typeof window === 'undefined') {
  // Common JS module, export the Promise class
  exports.Promise = Promise;
}
