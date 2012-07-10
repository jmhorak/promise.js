promise
==========
Async promise library

Usage
==========
    var promise = new Promise();
    
    // Register callbacks for when the result of the async operation is known
    promise.then( resolveCallback, rejectCallback, progressCallback )

    // Call on success
    promise.resolve();

    // Call on failure
    promise.reject();

    // Call to update progress
    promise.updateProgress();

    // Chain promises together.
    // Resolve when all are resolved
    // Reject if any one is rejected
    Promise.when( promise1, promise2, promise3 ).then( ... );