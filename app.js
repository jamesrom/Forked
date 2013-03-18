var express = require('express');
var http = require('http');
var fs = require('fs');
var app = express();

app.use(express.favicon(__dirname + '/static/favicon.ico'));

app.get('/:height?', function(req, res) {
	console.log(new Date().toUTCString() + ': request: /' + (req.params.height ? req.params.height : ''));
	var page;
	var info = {};

	function buildPage() {
		if (!info.count || !page) {
			return;
		}

		if (info.count > 0) {
			page = page.replace(/\{YESNO\}/g, info.count > 1 ? '<h1 class="yes">YES</h1>' : '<h1 class="no">NO</h1>');
			page = page.replace(/\{BLOCK_DESC\}/g, info.count != 1 ? info.count + " blocks" : "Only one block");
			page = page.replace(/\{HEIGHT\}/g, info.height);
			res.send(page);
		}
		else {
			page = page.replace(/\{YESNO\}/g, '<h1>WAT</h1>');
			page = page.replace(/\{BLOCK_DESC\}/g, 'Error: Zero blocks');
			page = page.replace(/\{HEIGHT\}/g, info.height);
			res.send(page);
		}
	}

	fs.readFile(__dirname + '/static/index.html', 'utf8', function (err, data) {
		if (err) {
			res.send("Error");
			return;
		}

		page = data;
		// just incase fs is slower than http for some reason
		buildPage();
	});

	// handle height parameter
	if (req.params.height) {
		info.height = parseInt(req.params.height);
		if (!isNaN(info.height)) {
			blocksAtHeight(info.height, function(count) {
				info.count = count;
				buildPage();
			});
			return;
		}
	}

	latestHeight(function(height) {
		info.height = height;
		blocksAtHeight(height, function(count) {
			info.count = count;
			buildPage();
		});
	});
});

function latestHeight(callback) {
	var url = 'http://blockchain.info/latestblock';
	http.get(url, function(res) {
		accumulate(res, function(body) {
			var height;
			try {
				height = JSON.parse(body).height;
			}
			catch(ex) {
				height = -1;
			}
			callback(height);
		});
	});
}

function blocksAtHeight(height, callback) {
	var url = 'http://blockchain.info/block-height/' + height + '?format=json';
	http.get(url, function(res) {
		accumulate(res, function(body) {
			var count;
			try {
				count = JSON.parse(body).blocks.length;
			}
			catch(ex) {
				count = -1;
			}
			callback(count);
		});
	});
}

function accumulate(response, callback) {
	var body = '';
	response.on('data', function(chunk) {
		body += chunk;
	});
	response.on('end', function() {
		callback(body);
	});
}

app.use(express.static(__dirname + '/static'));
app.listen(80);
console.log('listening on port 80');