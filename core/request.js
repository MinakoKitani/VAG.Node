const axios = require('axios');
const request = require('request');
const fs = require('fs');

function params2url(params) {
	let query = '?';
	for (const key in params) {
		query = query + `${key}=${params[key]}&`;
	}
	if (query.endsWith('&')) {
		query = query.substring(0, -1);
	}
	return query;
}

function get(url, params) {
  return new Promise(function (resolve, reject) {
		const query = params2url(params);
    return axios.get(`${url}${query}`).then(res => {
			resolve(res.data)
		}).catch(err => {
			reject(err)
		});
  });
}

// 截图时将zlm返回的图片缓存写入本地文件夹中，文件名自定义
// async function pipe(url, params, path, name) {
// 	await axios({
// 		method: 'get',
// 		url,
// 		params,
// 		responseType: 'stream'
// 	}).then(function (res) {
// 		if (!fs.existsSync(path)) {
// 			fs.mkdirSync(path);
// 		}
// 		res.data.pipe(fs.createWriteStream(path + name));
// 	});
// }

function pipe (url, params, path, name) {
	return new Promise(function (resolve, reject) {
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
		const query = params2url(params);
		request(url + query, function (error, response) {
			if (!error && response.statusCode == 200) {
					let stream = fs.createWriteStream(`${path}/${name}`);
					request(url + query).pipe(stream).on("close", function (err) {
							resolve({ code: 0, path: `${path}/${name}`, msg: "success"});
					});
			} else {
					if (error) {
							reject(error);
					} else {
							reject(new Error("下载失败，返回状态码不是200，状态码：" + response.statusCode));
					}
			}
	  });
	})
}

module.exports = { get: get, pipe: pipe };