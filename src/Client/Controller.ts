import { Client } from '..';
import makeid from '../utils/makeid';

class Controller {
	client: Client;
	payload: any;
	event: string;
	requests: string[];
	constructor(client: Client, event: string, payload: any) {
		this.client = client;
		this.payload = payload;
		this.event = event;
		this.requests = [];
	}
	send(timeout: number = 8000): Promise<any> {
		return new Promise((resolve, reject) => {
			let status = false;
			let intervalStart = Date.now();
			const timeoutInterval = setInterval(() => {
				if (Date.now() - intervalStart > timeout) {
					clearInterval(timeoutInterval);
					if (!status) return reject('Request timeout');
				}
			}, 50);
			const listener = (message: Buffer) => {
				try {
					const parsed = JSON.parse(message.toString());
					if (parsed.event !== this.event) return;
					if (parsed.isResponse) {
						this.client.removeListener('message', listener);
						status = true;
						return resolve(parsed);
					}
				} catch (err) {}
			};
			this.client.socket.on('message', listener);
			this.client.send(
				JSON.stringify({
					id: makeid(32),
					event: this.event,
					...this.payload,
				})
			);
		});
	}
	logRequest(id: string) {
		if (this.requests.length > 32) this.requests.shift();
		this.requests.push(id);
	}
	requestExists(id: string) {
		return this.requests.includes(id);
	}
	register() {
		const listener = async (message: Buffer) => {
			try {
				const parsed = JSON.parse(message.toString());
				if (parsed.event !== this.event || this.requestExists(parsed.id))
					return;
				this.logRequest(parsed.id);
				this.client.send(
					JSON.stringify({
						id: parsed.id,
						event: this.event,
						isResponse: true,
						...(await this.res(parsed)),
					})
				);
			} catch (err) {}
		};
		this.client.socket.on('message', listener);
	}
	res(_message: any): Promise<any> {
		return new Promise((resolve) => resolve({}));
	}
}

export default Controller;
