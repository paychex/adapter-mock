# @paychex/adapter-mock

A data adapter that returns mock Responses based on conditions matching Requests. This package
is intended for use with [@paychex/core](https://github.com/paychex/core) data pipelines.

## Installation

```bash
npm install @paychex/adapter-mock
```

## Usage

```js
import {
  proxy,
  fetch,
  setAdapter,
  createRequest,
} from '~/path/to/datalayer';

// --- the code below can be removed when real endpoints exist --- //

import {
  delay,
  success,
  failure,
  mock,
} from '@paychex/adapter-mock';

const otherwise = () => true;
const item = { id: 123, key: 'value' };
const items = [item];

setAdapter('mock-endpoint', mock([
  [ { path: '/items' },      delay(20, success(items)) ],
  [ { path: '/items/123' },  delay(50, success(item)) ],
  [ otherwise,               failure(404) ];
]));

proxy.use({
  adapter: 'mock-endpoint',
  match: {
    base: 'my-endpoint'
  }
});

// --- the code below stays the same --- //

proxy.use({
  protocol: 'https',
  host: process.env.MY_ENDPOINT_HOST,
  match: {
    base: 'my-endpoint',
  }
});

const operation = {
  method: 'GET',
  path: '/items',
  base: 'my-endpoint',
};

export async function loadItems() {
  const request = createRequest(operation);
  const response = await fetch(request);
  return response.data; // [ { id: 123, key: 'value' } ]
}
```
