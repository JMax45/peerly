import axios from 'axios';

const getServerList = async (): Promise<string[]> => {
	const res = await axios({
		method: 'get',
		url: 'https://www.jz-software.com/config/?key=peerly',
		headers: {},
	});
	return res.data.split(',');
};

export default getServerList;
