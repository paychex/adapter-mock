/**
 * ## Importing
 *
 * ### esm
 *
 * ```js
 * import * as Mock from '@paychex/adapter-mock';
 * import { delay, success, failure, mock } from '@paychex/adapter-mock';
 * ```
 *
 * ### cjs
 *
 * ```js
 * const Mock = require('@paychex/adapter-mock');
 * const { delay, success, failure, mock } = require('@paychex/adapter-mock');
 * ```
 *
 * ### amd
 *
 * ```js
 * define(['@paychex/adapter-mock'], function(Mock) { ... });
 * define(['@paychex/adapter-mock'], function({ delay, success, failure, mock }) { ... });
 * ```
 *
 * ```js
 * require(['@paychex/adapter-mock'], function(Mock) { ... });
 * require(['@paychex/adapter-mock'], function({ delay, success, failure, mock }) { ... });
 * ```
 *
 * ### iife
 *
 * ```js
 * const Mock = window['@paychex/adapter-mock'];
 * const { delay, success, failure, mock } = window['@paychex/adapter-mock'];
 * ```
 *
 * ## Usage
 *
 * ```js
 * import {
 *   proxy,
 *   fetch,
 *   setAdapter,
 *   createRequest,
 * } from '~/path/to/datalayer';
 *
 * // --- the code below can be removed when real endpoints exist --- //
 *
 * import {
 *   delay,
 *   success,
 *   failure,
 *   mock,
 * } from '@paychex/adapter-mock';
 *
 * const otherwise = () => true;
 * const item = { id: 123, key: 'value' };
 * const items = [item];
 *
 * setAdapter('mock-endpoint', mock([
 *   [ { path: '/items' },      delay(20, success(items)) ],
 *   [ { path: '/items/123' },  delay(50, success(item)) ],
 *   [ otherwise,               failure(404) ];
 * ]));
 *
 * proxy.use({
 *   adapter: 'mock-endpoint',
 *   match: {
 *     base: 'my-endpoint'
 *   }
 * });
 *
 * // --- the code below stays the same --- //
 *
 * proxy.use({
 *   protocol: 'https',
 *   host: process.env.MY_ENDPOINT_HOST,
 *   match: {
 *     base: 'my-endpoint',
 *   }
 * });
 *
 * const operation = {
 *   method: 'GET',
 *   path: '/items',
 *   base: 'my-endpoint',
 * };
 *
 * export async function loadItems() {
 *   const request = createRequest(operation);
 *   const response = await fetch(request);
 *   return response.data; // [ { id: 123, key: 'value' } ]
 * }
 * ```
 *
 * @module main
 */

import {
    cond,
    constant,
    iteratee,
    isFunction,
    defaultsDeep,
    CondPair,
} from 'lodash';

import type { Response, Adapter } from '@paychex/core/types/data';

export type { Adapter };

export interface ResponseFactory {
    (): Promise<Response>
}

export type ConditionResult = Response | Promise<Response> | ResponseFactory;
export type MockRule = [any, any];

const DEFAULT_RESPONSE: Response = Object.freeze({
    meta: {
        headers: {},
        messages: [],
        error: false,
        cached: false,
        timeout: false,
    },
    data: null,
    status: 0,
    statusText: 'Unknown',
});

function resolver(factory: Response): ResponseFactory;
function resolver(factory: Promise<Response>): ResponseFactory;
function resolver(factory: ResponseFactory): ResponseFactory;

function resolver(factory: any): ResponseFactory {
    if (!isFunction(factory))
        factory = constant(factory);
    return () => Promise.resolve().then(factory);
}

function asConditionPair([condition, factory]: MockRule): CondPair<any, Promise<Response>> {
    return [
        iteratee(condition),
        resolver(factory),
    ];
}

/**
 * A data adapter that returns mock Responses based on conditions matching Requests.
 *
 * @param rules The rules specifying which mock Responses should be returned
 * based on which conditions match incoming Requests.
 * @returns The adapter to register with a data pipeline.
 * @example
 * ```js
 * const otherwise = () => true;
 * const item = { id: 123, key: 'value' };
 * const items = [item];
 *
 * dataLayer.setAdapter('mock-endpoint', mock([
 *   [ { path: '/items' }, delay(20, success(items)) ],
 *   [ ['path', '/items/123'], delay(50, success(item)) ],
 *   [ otherwise, failure(404) ];
 * ]));
 *
 * proxy.use({
 *   adapter: 'mock-endpoint',
 *   match: {
 *     base: 'my-endpoint'
 *   }
 * });
 * ```
 */
export function mock(rules: MockRule[]): Adapter {
    return cond(rules.map(asConditionPair));
}

/**
 * Returns a successful Response (status 200) with the optional specified payload.
 *
 * @param data Optional value to return in the Response data.
 * @returns A Response object that indicates a successful data call.
 * @example
 * ```js
 * const payload = [];
 * const adapter = mock([
 *   [{ path: '/items' }, success(payload)],
 *   [{ path: '/not-found' }, failure(404)],
 * ]);
 * ```
 */
export function success(data: any = null): Response {
    return defaultsDeep({
        data,
        status: 200,
        statusText: 'OK',
    }, DEFAULT_RESPONSE);
}

/**
 * Creates a failure Response instance with the specified failure HTTP status code
 * and optional data payload.
 *
 * @param status The HTTP status code to use.
 * @param data Optional value to return in the Response data.
 * @returns {Response} A Response object that indicates a failed data call.
 * @example
 * const otherwise = () => true;
 * const payload = { id: 123, key: 'value' };
 * const adapter = mock([
 *   [{ path: '/items/123' }, success(payload)],
 *   [otherwise, failure(404)],
 * ]);
 */
export function failure(status: number, data: any = null): Response {
    return defaultsDeep({
        data,
        status,
        statusText: 'Error',
        meta: { error: true },
    }, DEFAULT_RESPONSE);
}

/**
 * Waits the specified number of milliseconds before returning the mock Response.
 *
 * @param ms The number of milliseconds to wait before resolving.
 * @param response The mock Response to resolve with.
 * @example
 * ```js
 * const adapter = mock([
 *   [{ method: 'GET', path: '/' }, delay(200, success({ ... }))],
 *   [{ method: 'GET', path: '/timeout' }, delay(60000, failure(0))],
 *   [{ method: 'GET', path: '/not-found' }, delay(100, failure(404))],
 * ]);
 * ```
 */
export function delay(ms: number = 0, response: Response = success()) {
    return () => new Promise((resolve) => {
        setTimeout(resolve, ms, response);
    });
}