"use strict";
(self["webpackChunkfortunecookie"] = self["webpackChunkfortunecookie"] || []).push([[1],{

/***/ 121:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AlchemyProvider": () => (/* binding */ AlchemyProvider)
/* harmony export */ });
/* harmony import */ var _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _ethersproject_networks__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(137);
/* harmony import */ var _ethersproject_providers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(122);
/* harmony import */ var _ethersproject_web__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(124);
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_0__);











/** Maximum size of a batch on the rpc provider. */
const DEFAULT_MAX_REQUEST_BATCH_SIZE = 100;
/** Timeout interval before the pending batch is sent. */
const DEFAULT_REQUEST_BATCH_DELAY_MS = 10;
/**
 * Internal class to enqueue requests and automatically send/process batches.
 *
 * The underlying batching mechanism is loosely based on ethers.js's
 * `JsonRpcBatchProvider`.
 *
 * @internal
 */
class RequestBatcher {
    constructor(sendBatchFn, maxBatchSize = DEFAULT_MAX_REQUEST_BATCH_SIZE) {
        this.sendBatchFn = sendBatchFn;
        this.maxBatchSize = maxBatchSize;
        /**
         * Array of enqueued requests along with the constructed promise handlers for
         * each request.
         */
        this.pendingBatch = [];
    }
    /**
     * Enqueues the provided request. The batch is immediately sent if the maximum
     * batch size is reached. Otherwise, the request is enqueued onto a batch that
     * is sent after 10ms.
     *
     * Returns a promise that resolves with the result of the request.
     */
    enqueueRequest(request) {
        return (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__._)(this, void 0, void 0, function* () {
            const inflightRequest = {
                request,
                resolve: undefined,
                reject: undefined
            };
            const promise = new Promise((resolve, reject) => {
                inflightRequest.resolve = resolve;
                inflightRequest.reject = reject;
            });
            this.pendingBatch.push(inflightRequest);
            if (this.pendingBatch.length === this.maxBatchSize) {
                // Send batch immediately if we are at the maximum batch size.
                void this.sendBatchRequest();
            }
            else if (!this.pendingBatchTimer) {
                // Schedule batch for next event loop + short duration
                this.pendingBatchTimer = setTimeout(() => this.sendBatchRequest(), DEFAULT_REQUEST_BATCH_DELAY_MS);
            }
            return promise;
        });
    }
    /**
     * Sends the currently queued batches and resets the batch and timer. Processes
     * the batched response results back to the original promises.
     */
    sendBatchRequest() {
        return (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__._)(this, void 0, void 0, function* () {
            // Get the current batch and clear it, so new requests
            // go into the next batch
            const batch = this.pendingBatch;
            this.pendingBatch = [];
            if (this.pendingBatchTimer) {
                clearTimeout(this.pendingBatchTimer);
                this.pendingBatchTimer = undefined;
            }
            // Get the request as an array of requests
            const request = batch.map(inflight => inflight.request);
            return this.sendBatchFn(request).then(result => {
                // For each result, feed it to the correct Promise, depending
                // on whether it was a success or error
                batch.forEach((inflightRequest, index) => {
                    const payload = result[index];
                    if (payload.error) {
                        const error = new Error(payload.error.message);
                        error.code = payload.error.code;
                        error.data = payload.error.data;
                        inflightRequest.reject(error);
                    }
                    else {
                        inflightRequest.resolve(payload.result);
                    }
                });
            }, error => {
                batch.forEach(inflightRequest => {
                    inflightRequest.reject(error);
                });
            });
        });
    }
}

/**
 * SDK's custom implementation of ethers.js's 'AlchemyProvider'.
 *
 * Do not call this constructor directly. Instead, instantiate an instance of
 * {@link Alchemy} and call {@link Alchemy.config.getProvider()}.
 *
 * @public
 */
class AlchemyProvider extends _ethersproject_providers__WEBPACK_IMPORTED_MODULE_2__.JsonRpcProvider {
    /** @internal */
    constructor(config) {
        // Normalize the API Key to a string.
        const apiKey = AlchemyProvider.getApiKey(config.apiKey);
        // Generate our own connection info with the correct endpoint URLs.
        const alchemyNetwork = AlchemyProvider.getAlchemyNetwork(config.network);
        const connection = AlchemyProvider.getAlchemyConnectionInfo(alchemyNetwork, apiKey, 'http');
        // If a hardcoded url was specified in the config, use that instead of the
        // provided apiKey or network.
        if (config.url !== undefined) {
            connection.url = config.url;
        }
        connection.throttleLimit = config.maxRetries;
        // Normalize the Alchemy named network input to the network names used by
        // ethers. This allows the parent super constructor in JsonRpcProvider to
        // correctly set the network.
        const ethersNetwork = _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.E[alchemyNetwork];
        super(connection, ethersNetwork);
        this.apiKey = config.apiKey;
        this.maxRetries = config.maxRetries;
        this.batchRequests = config.batchRequests;
        // TODO: support individual headers when calling batch
        const batcherConnection = Object.assign(Object.assign({}, this.connection), { headers: Object.assign(Object.assign({}, this.connection.headers), { 'Alchemy-Ethers-Sdk-Method': 'batchSend' }) });
        const sendBatchFn = (requests) => {
            return (0,_ethersproject_web__WEBPACK_IMPORTED_MODULE_3__.fetchJson)(batcherConnection, JSON.stringify(requests));
        };
        this.batcher = new RequestBatcher(sendBatchFn);
    }
    /**
     * Overrides the `UrlJsonRpcProvider.getApiKey` method as implemented by
     * ethers.js. Returns the API key for an Alchemy provider.
     *
     * @internal
     * @override
     */
    static getApiKey(apiKey) {
        if (apiKey == null) {
            return _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.D;
        }
        if (apiKey && typeof apiKey !== 'string') {
            throw new Error(`Invalid apiKey '${apiKey}' provided. apiKey must be a string.`);
        }
        return apiKey;
    }
    /**
     * Overrides the `BaseProvider.getNetwork` method as implemented by ethers.js.
     *
     * This override allows the SDK to set the provider's network to values not
     * yet supported by ethers.js.
     *
     * @internal
     * @override
     */
    static getNetwork(network) {
        if (typeof network === 'string' && network in _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.C) {
            return _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.C[network];
        }
        // Call the standard ethers.js getNetwork method for other networks.
        return (0,_ethersproject_networks__WEBPACK_IMPORTED_MODULE_4__.getNetwork)(network);
    }
    /**
     * Converts the `Networkish` input to the network enum used by Alchemy.
     *
     * @internal
     */
    static getAlchemyNetwork(network) {
        if (network === undefined) {
            return _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.a;
        }
        if (typeof network === 'number') {
            throw new Error(`Invalid network '${network}' provided. Network must be a string.`);
        }
        // Guaranteed that `typeof network === 'string`.
        const isValidNetwork = Object.values(_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.N).includes(network);
        if (!isValidNetwork) {
            throw new Error(`Invalid network '${network}' provided. Network must be one of: ` +
                `${Object.values(_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.N).join(', ')}.`);
        }
        return network;
    }
    /**
     * Returns a {@link ConnectionInfo} object compatible with ethers that contains
     * the correct URLs for Alchemy.
     *
     * @internal
     */
    static getAlchemyConnectionInfo(network, apiKey, type) {
        const url = type === 'http'
            ? (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.g)(network, apiKey)
            : (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.b)(network, apiKey);
        return {
            headers: _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.I
                ? {
                    'Alchemy-Ethers-Sdk-Version': _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.V
                }
                : {
                    'Alchemy-Ethers-Sdk-Version': _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.V,
                    'Accept-Encoding': 'gzip'
                },
            allowGzip: true,
            url
        };
    }
    /**
     * Overrides the method in ethers.js's `StaticJsonRpcProvider` class. This
     * method is called when calling methods on the parent class `BaseProvider`.
     *
     * @override
     */
    detectNetwork() {
        const _super = Object.create(null, {
            detectNetwork: { get: () => super.detectNetwork }
        });
        return (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__._)(this, void 0, void 0, function* () {
            let network = this.network;
            if (network == null) {
                network = yield _super.detectNetwork.call(this);
                if (!network) {
                    throw new Error('No network detected');
                }
            }
            return network;
        });
    }
    _startPending() {
        (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.l)('WARNING: Alchemy Provider does not support pending filters');
    }
    /**
     * Overrides the ether's `isCommunityResource()` method. Returns true if the
     * current api key is the default key.
     *
     * @override
     */
    isCommunityResource() {
        return this.apiKey === _index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.D;
    }
    /**
     * Overrides the base {@link JsonRpcProvider.send} method to implement custom
     * logic for sending requests to Alchemy.
     *
     * @param method The method name to use for the request.
     * @param params The parameters to use for the request.
     * @override
     * @public
     */
    // TODO: Add headers for `perform()` override.
    send(method, params) {
        return this._send(method, params, 'send');
    }
    /**
     * DO NOT MODIFY.
     *
     * Original code copied over from ether.js's `JsonRpcProvider.send()`.
     *
     * This method is copied over directly in order to implement custom headers
     *
     * @internal
     */
    _send(method, params, methodName, forceBatch = false) {
        const request = {
            method,
            params,
            id: this._nextId++,
            jsonrpc: '2.0'
        };
        // START MODIFIED CODE
        const connection = Object.assign({}, this.connection);
        connection.headers['Alchemy-Ethers-Sdk-Method'] = methodName;
        if (this.batchRequests || forceBatch) {
            return this.batcher.enqueueRequest(request);
        }
        // END MODIFIED CODE
        this.emit('debug', {
            action: 'request',
            request: (0,_index_00b85f9f_js__WEBPACK_IMPORTED_MODULE_1__.d)(request),
            provider: this
        });
        // We can expand this in the future to any call, but for now these
        // are the biggest wins and do not require any serializing parameters.
        const cache = ['eth_chainId', 'eth_blockNumber'].indexOf(method) >= 0;
        if (cache && this._cache[method]) {
            return this._cache[method];
        }
        const result = (0,_ethersproject_web__WEBPACK_IMPORTED_MODULE_3__.fetchJson)(this.connection, JSON.stringify(request), getResult).then(result => {
            this.emit('debug', {
                action: 'response',
                request,
                response: result,
                provider: this
            });
            return result;
        }, error => {
            this.emit('debug', {
                action: 'response',
                error,
                request,
                provider: this
            });
            throw error;
        });
        // Cache the fetch, but clear it on the next event loop
        if (cache) {
            this._cache[method] = result;
            setTimeout(() => {
                // @ts-ignore - This is done by ethers.
                this._cache[method] = null;
            }, 0);
        }
        return result;
    }
}
/**
 * DO NOT MODIFY.
 *
 * Original code copied over from ether.js's
 * `@ethersproject/web/src.ts/index.ts`. Used to support
 * {@link AlchemyProvider._send}, which is also copied over.
 */
function getResult(payload) {
    if (payload.error) {
        const error = new Error(payload.error.message);
        error.code = payload.error.code;
        error.data = payload.error.data;
        throw error;
    }
    return payload.result;
}


//# sourceMappingURL=alchemy-provider-49464307.js.map


/***/ })

}]);