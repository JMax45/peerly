import { Client } from '../src';
import getServerList from '../src/SignalingServer/getServerList';
import Ping from '../src/Client/controllers/ping';

(async () => {
	const client = new Client({
		serverList: await getServerList(),
	});

	client.on('message', (message) => {
		console.log(message.toString());
	});

	client.on('connection', () => {
		console.log('connected');
		setInterval(async () => {
			const ping = new Ping(client, {});
			const res = await ping.send();
			console.log('response', res);
		}, 1000);
	});

	client.connect('ping').catch((err) => {
		console.log('error during connection', err);
		process.exit(1);
	});
})();
