promise.js
==========
Async promise library implementing the [CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A) proposal.

API
==========
Creating a new promise
----------
    var promise = new Promise();
    
Registering callbacks
----------
    // Register all callbacks at once
    promise.then( callbackFn, errorFn, progressFn );
	
	// Register callbacks individually
	promise.whenDone( callbackFn );
	promise.ifFail( errorFn );
	promise.onUpdate( progressFn );
	
	// Multiple callbacks may be registered on a single promise
	promise.then( callbackFn ).whenDone( otherCallbackFn );

Resolution after async call
-----------
    // If async returns without error, call resolve
    promise.resolve();

    // If async returns with an error, call reject
    promise.reject();

    // If async returns a progress update, call updateProgress
    promise.updateProgress();
	
Bundling
-------------
    // Chain promises together.
    // Calls callbackFn when each individual promise has been resolved
    // Calls errorFn if any one promise is rejected
    Promise.when( promise1, promise2, promise3 ).then( callbackFn, errorFn );
	
Example
============
    /**
	 * Some async ajax request
	 * @returns Promise
	 */
    function myAsyncOperation() {
	  var promise = new Promise();
	  
	  // jQuery AJAX
      $.ajax({
	    url: 'ajax/test.html',
		success: function(data) {
		  promise.resolve(data);
		},
		error: function(jqXHR, statusTxt, err) {
		  promise.reject(statusTxt, err);
		}
      });
	  
	  return promise;
	};
	
	/**
	 * Append data to result
	 */
	function resolveAppendFn(data) {
	  $('.result').append(data);
	};
	
	/**
	 * Write data to the console
	 */
	function resolveLogFn(data) {
	  console.log(data);
	}
	
	/**
	 * Alert user of an error
	 */
	function rejectFn(statusTxt, err) {
	  alert( ['Operation error: ', statusTxt, err.toString() ].join('') );
	}
	
	var promise,
	    promises = [];

    // Fire off the async op
	promise	= myAsyncOperation();
	
	// Register callbacks
	promise.then( resolveAppendFn, rejectFn );
	promise.whenDone( resolveLogFn );
	
	// Fire off multiple requests and wait for all to return
	promises.push(myAsyncOperation());
	promises.push(myAsyncOperation());
	promises.push(myAsyncOperation());
	
	// 'when' accepts an array or several individual promises
	Promise.when( promises ).then( resolveLogFn, rejectFn );

License
===========
MIT License