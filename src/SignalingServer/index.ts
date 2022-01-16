import { Server, ServerOptions } from 'ws';
import makeid from '../utils/makeid';
import events from './events';
import PeerController from './PeerController';

class SignalingServer {
	wss: Server;
	peers: PeerController;
	constructor(options?: ServerOptions) {
		this.wss = new Server(options);
		this.peers = new PeerController();

		this.wss.on('connection', (ws) => {
			const CLIENT_ID = makeid(64);
			ws.on('message', (data) => {
				try {
					const parsed = JSON.parse(data.toString());
					if (parsed.event === events.CONNECT_TO_PEER) {
						this.peers.addPeer(parsed.id, parsed, ws, CLIENT_ID);
					} else {
						const filteredPeers = this.peers.filterPeers(parsed.id);
						if (filteredPeers.length < 2) return;
						const otherPeer = filteredPeers.find(
							(e) => e.client_id !== CLIENT_ID
						);
						if (!otherPeer) return;
						otherPeer.ws.send(data.toString());
					}
				} catch (err) {
					ws.close();
				}
			});
			ws.on('close', () => {
				this.peers.peers = this.peers.peers.filter(
					(e) => e.client_id !== CLIENT_ID
				);
			});
			ws.send('Connected');
		});
	}
}

export default SignalingServer;
