import { Client } from '../src';
import Ping from '../src/Client/controllers/ping';
import getServerList from '../src/SignalingServer/getServerList';
import makeid from '../src/utils/makeid';

describe('test Client', () => {
	it('create 2 clients and try to communicate', () => {
		const randomMessage = makeid(64);
		return new Promise(async (resolve) => {
			const serverList = await getServerList();
			const randomId = makeid(64);

			const client1 = new Client({ serverList });
			const client2 = new Client({ serverList });

			client1.on('connection', async () => {
				const ping = new Ping(client1, { message: randomMessage });
				const res = await ping.send();
				client1.close();
				client2.close();
				resolve(res);
			});

			client1.connect(randomId);
			client2.connect(randomId);
		}).then((res: any) => {
			expect(res.isResponse).toBe(true);
		});
	});
	it('try message event', () => {
		const randomMessage = makeid(64);
		return new Promise(async (resolve, reject) => {
			const serverList = await getServerList();
			const randomId = makeid(64);

			const client1 = new Client({ serverList });
			const client2 = new Client({ serverList });

			client1.on('connection', async () => client1.send(randomMessage));
			client2.on('message', (message) => {
				client1.close();
				client2.close();
				resolve(message.toString());
			});

			client1.connect(randomId);
			client2.connect(randomId);
		}).then((res: any) => {
			expect(res).toBe(randomMessage);
		});
	});
});
