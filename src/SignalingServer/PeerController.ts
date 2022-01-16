import { XorMappedAddressPayload } from 'webrtc-stun/lib/attribute/xor-mapped-address';
import { WebSocket } from 'ws';

interface Peer extends XorMappedAddressPayload {
	client_id: string;
	id: string;
	ws: WebSocket;
}

class PeerController {
	peers: Peer[];
	constructor() {
		this.peers = [];
	}
	async addPeer(
		id: string,
		peer: XorMappedAddressPayload,
		ws: WebSocket,
		client_id: string
	) {
		if (this.filterPeers(id).length === 2) {
			return ws.close();
		}
		if (this.filterPeers(id).length > 2) {
			this.wipePeers(id);
		}
		this.peers.push({ id, ...peer, ws, client_id });
		if (this.filterPeers(id).length === 2) {
			this.connectPeers(id);
		}
	}
	wipePeers(id: string) {
		this.peers = this.peers.filter((e) => e.id !== id);
	}
	filterPeers(id: string) {
		return this.peers.filter((e) => e.id === id);
	}
	connectPeers(id: string) {
		const filteredPeers = this.filterPeers(id);
		if (filteredPeers.length > 2) throw 'Too many peers';
		for (let i = 0; i < filteredPeers.length; i++) {
			const peerClone: any = { ...filteredPeers[1] };
			delete peerClone.ws;
			filteredPeers[0].ws.send(JSON.stringify(peerClone));
			filteredPeers.reverse();
		}
	}
}

export default PeerController;
