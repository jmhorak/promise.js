/**
 * Author: Jeff Horak
 * Date: 5/31/12
 *
 * Async Promise module
 */

var Promise = (function() {

   function _resolvePromise() {
    // Move to resolved state
    this.state = 'resolved';

    if (typeof this.resolveCallback === 'function') {
      this.resolveCallback.apply(null, this._arguments);
    }

    // If no callback supplied, just eat the resolve
  }

  function _rejectPromise() {
    // Move to failed state
    this.state = 'rejected';

    if (typeof this.failCallback === 'function') {
      this.failCallback.apply(null, this._arguments);
    }

    // If no callback supplied, just eat the failure
  }

  // Build the Promise class

  /**
   * Promise class - calls resolve or fail callback when an async operation is completed
   * @constructor
   */
  var Promise = function() {
    this._arguments = null;
    this.state = 'unfulfilled';
    this.resolveCallback = null;
    this.failCallback = null;
  };

  /**
   * Initialize the promise with a resolve and fail callback
   * @param resolveCallback {function} - Callback used when results are returned normally
   * @param failCallback {function} Optional - Callback used when the async operation has an error
   * @param progressCallback {function} Optional - Callback used to update progress of an async operation
   */
  Promise.prototype.then = function(resolveCallback, failCallback, progressCallback) {
    this.resolveCallback = resolveCallback;
    this.failCallback = failCallback;
    this.progressCallback = progressCallback;

    if (this.state === 'resolved') {
      // Already resolved, call the resolve callback
      _resolvePromise.call(this);

    } else if (this.state === 'rejected') {
      // Already rejected, call the reject callback
      _rejectPromise.call(this);
    }

    return this;
  };

  /**
   * Resolve a promise, moves to the resolved state and then passes any arguments to supplied callback
   */
  Promise.prototype.resolve = function() {

    if (this.state !== 'unfulfilled') {
      throw new Error('Cannot resolve a promise unless it is unfulfilled');
    }
    this._arguments = Array.prototype.slice.call(arguments, 0);

    _resolvePromise.call(this);
  };

  /**
   * Reject a promise, there was an error during the operation, call the fail callback
   */
  Promise.prototype.reject = function() {

    if (this.state !== 'unfulfilled') {
      throw new Error('Cannot reject a promise unless it is unfulfilled');
    }
    this._arguments = Array.prototype.slice.call(arguments, 0);

    _rejectPromise.call(this);
  };

  /**
   * Update progress on a promise, a status update is available
   */
  Promise.prototype.updateProgress = function() {

    if (this.state !== 'unfulfilled') {
      throw new Error('Cannot update progress of a promise unless it is unfulfilled');
    }

    if (typeof this.progressCallback === 'function') {
      this.progressCallback.apply(null, arguments);
    }

    // If no callback supplied, just eat the progress update
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
