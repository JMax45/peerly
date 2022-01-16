import { Client } from '../..';
import Controller from '../Controller';

class Ping extends Controller {
	constructor(client: Client, payload: any) {
		super(client, 'PING', payload);
	}
	res(): Promise<any> {
		return new Promise((resolve, reject) => {
			resolve({});
		});
	}
}

export default Ping;
