/**
 * @global
 * @class
 * @hideconstructor
 * @extends Array
 */
export class MockRule extends Array {

    /**
     * Lodash iteratee to use; if it returns a truthy value, the associated
     * Response will be returned.
     *
     * @type {function|object|string[]}
     */
    [0] = null

    /**
     * The Response to return if the associated iteratee returns a truthy value.
     *
     * @type {Response}
     */
    [1] = null

}