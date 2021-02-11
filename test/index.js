import expect from 'expect';

import { mock, success, failure, delay } from '../index.js';

describe('mock adapter', () => {

    describe('mock', () => {

        it('uses function conditions', async () => {
            const adapter = mock([
                [(obj) => 'key' in obj, success(true)],
                [(obj) => !('key' in obj), success(false)],
            ]);
            expect(await adapter({})).toMatchObject({ data: false });
            expect(await adapter({ key: 123 })).toMatchObject({ data: true });
        });

        it('uses object conditions', async () => {
            const adapter = mock([
                [{ key: 123 }, success(true)],
                [{ key: 456 }, success(false)],
            ]);
            expect(await adapter({ key: 123 })).toMatchObject({ data: true });
            expect(await adapter({ key: 456 })).toMatchObject({ data: false });
        });

        it('uses property conditions', async () => {
            const adapter = mock([
                ['yes', success(true)],
                ['no', success(false)],
            ]);
            expect(await adapter({ yes: true })).toMatchObject({ data: true });
            expect(await adapter({ no: true })).toMatchObject({ data: false });
        });

        it('uses array conditions', async () => {
            const adapter = mock([
                [['key', 123], success(true)],
                [['key', 456], success(false)],
            ]);
            expect(await adapter({ key: 123 })).toMatchObject({ data: true });
            expect(await adapter({ key: 456 })).toMatchObject({ data: false });
        });

        it('accepts direct Response', async () => {
            const payload = { key: 'value' };
            const adapter = mock([[() => true, payload]]);
            expect(await adapter({})).toMatchObject(payload);
        });

        it('accepts function Response', async () => {
            const adapter = mock([[{}, delay(20, failure(404))]]);
            const response = await adapter({});
            expect(response).toEqual(expect.objectContaining({
                status: 404,
                data: null,
                statusText: 'Error',
                meta: expect.objectContaining({
                    error: true,
                }),
            }));
        });

    });

    describe('success', () => {

        it('returns null as default data', () => {
            expect(success()).toEqual(expect.objectContaining({
                status: 200,
                data: null,
            }));
        });

        it('returns specified data object', () => {
            const payload = Object.create(null);
            expect(success(payload).data).toBe(payload);
        });

    });

    describe('failure', () => {

        it('uses specified status code', () => {
            expect(failure(15)).toEqual(expect.objectContaining({
                status: 15,
                data: null,
                statusText: 'Error',
                meta: expect.objectContaining({
                    error: true,
                }),
            }));
        });

        it('uses provided data', () => {
            const payload = Object.create(null);
            expect(failure(0, payload).data).toBe(payload);
        });

    });

    describe('delay', () => {

        it('waits the specified ms before resolving', async () => {
            const ms = 20;
            const fn = delay(ms);
            const start = Date.now();
            await fn();
            expect(Date.now()).not.toBeLessThan(start + ms);
        });

        it('defaults to a generic success response', async () => {
            const response = await delay()();
            expect(response).toEqual(expect.objectContaining({
                data: null,
                status: 200,
            }));
        });

        it('uses the provided response', async () => {
            const payload = failure(404);
            const response = await delay(0, payload)();
            expect(response).toMatchObject(payload);
        });

    });

});
