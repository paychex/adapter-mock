# @paychex/adapter-mock

A data adapter that returns mock Responses based on conditions matching Requests. This package
is intended for use with [@paychex/core](https://github.com/paychex/core) data pipelines.

## Installation

```bash
npm install @paychex/adapter-mock
```

## Importing

### esm

```js
import * as Mock from '@paychex/adapter-mock';
import { delay, success, failure, mock } from '@paychex/adapter-mock';
```

### cjs

```js
const Mock = require('@paychex/adapter-mock');
const { delay, success, failure, mock } = require('@paychex/adapter-mock');
```

### amd

```js
define(['@paychex/adapter-mock'], function(Mock) { ... });
define(['@paychex/adapter-mock'], function({ delay, success, failure, mock }) { ... });
```

```js
require(['@paychex/adapter-mock'], function(Mock) { ... });
require(['@paychex/adapter-mock'], function({ delay, success, failure, mock }) { ... });
```

### iife

```js
const Mock = window['@paychex/adapter-mock'];
const { delay, success, failure, mock } = window['@paychex/adapter-mock'];
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
