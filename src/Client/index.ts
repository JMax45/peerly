import WebSocket from 'ws';
import events from '../SignalingServer/events';
import dgram from 'dgram';
import * as stun from 'webrtc-stun';
import { XorMappedAddressPayload } from 'webrtc-stun/lib/attribute/xor-mapped-address';
import TypedEmitter from 'typed-emitter';
import EventEmitter from 'events';
import ip from 'ip';
import Controller from './Controller';
import Ping from './controllers/ping';

interface Peer {
	address: string;
	port: number;
	family: string;
}

interface MessageEvents {
	message: (message: Buffer, rinfo: dgram.RemoteInfo) => void;
	connection: (peer: Peer) => void;
}

interface Config {
	serverList: string[];
}

class Client extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
	peer?: Peer;
	socket: dgram.Socket;
	private ws: WebSocket;
	private controllers: Controller[];
	constructor(config: Config) {
		super();
		this.socket = dgram.createSocket({ type: 'udp4' });
		const randomServer =
			config.serverList[Math.floor(Math.random() * config.serverList.length)];
		this.ws = new WebSocket(randomServer);
		this.controllers = [];
		this.registerController(new Ping(this, {}));
	}
	private getPeerInfo(id: string): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const stunData = await this.sendStunRequest();
			const data = {
				event: events.CONNECT_TO_PEER,
				id,
				...stunData,
			};
			this.ws.on('open', () => this.ws.send(JSON.stringify(data)));
			this.ws.on('message', async (data) => {
				try {
					const parsed = JSON.parse(data.toString());
					if (parsed.event === events.CONNECT_TO_PEER) {
						const { address, port, family } = parsed;
						this.peer = { address, port, family };
						if (address === stunData.address) {
							this.ws.send(
								JSON.stringify({
									event: events.UPDATE_PEER_ADDRESS,
									id,
									address: ip.address(),
								})
							);
						} else {
							resolve();
						}
					} else if (parsed.event === events.UPDATE_PEER_ADDRESS) {
						if (!this.peer) return;
						this.peer.address = parsed.address;
						resolve();
					}
				} catch (err) {}
			});
		});
	}
	async connect(id: string) {
		await this.getPeerInfo(id);
		this.socket.on('message', (msg, rinfo) => {
			try {
				const parsed = JSON.parse(msg.toString());
				if (this.controllers.map((e) => e.event).includes(parsed.event)) return;
				this.emit('message', msg, rinfo);
			} catch (err) {
				this.emit('message', msg, rinfo);
			}
		});
		if (this.peer) {
			await new Ping(this, {}).send();
			this.emit('connection', this.peer);
		}
		return;
	}
	send(data: string | Buffer) {
		if (!this.peer || !this.socket) throw 'Peer/socket not connected';
		this.socket.send(data, this.peer.port, this.peer.address);
	}
	sendToServer(data: string | Buffer) {
		this.ws.send(data);
	}
	sendStunRequest(): Promise<XorMappedAddressPayload> {
		return new Promise((resolve, reject) => {
			const tid = stun.generateTransactionId();
			this.socket.on('message', (msg) => {
				const res = stun.createBlank();
				if (res.loadBuffer(msg)) {
					if (
						res.isBindingResponseSuccess({
							transactionId: tid,
							fingerprint: true,
						})
					) {
						const attr = res.getXorMappedAddressAttribute();
						if (attr) resolve(attr);
						else reject();
					} else reject();
				}
			});
			const req = stun.createBindingRequest(tid).setFingerprintAttribute();
			this.socket.send(req.toBuffer(), 19302, 'stun.l.google.com');
		});
	}
	close() {
		this.socket.close();
		this.ws.close();
	}
	registerController(controller: Controller) {
		this.controllers.push(controller);
		controller.register();
	}
}
export default Client;
