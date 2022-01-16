# Peerly

Peerly allows you to build peer to peer applications with Node.js. It uses [UDP hole punching](https://en.wikipedia.org/wiki/UDP_hole_punching) to connect two peers together.

# Installation

```bash
npm install peerly
```

# Usage

```js
import { Client } from 'peerly';

const client = new Client({
	serverList: ['https://link-to-signaling-server'],
});

client.connect('UNIQUE-ID');
```

Read full documentation here https://jmax45.gitbook.io/peerly/

# License

Distributed under the MIT License. See `LICENSE` for more information.
