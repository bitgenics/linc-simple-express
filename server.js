require('isomorphic-fetch');
const express = require('express');
const template = require('./template');

app = express();
app.use('/_assets', express.static('dist/client/static/_assets'));

app.get('*', (req, res) => {
	console.log(`URL: ${req.url}`)
	template(req.url, (err, results) => {
		res.status(results.statusCode).send(results.body);
	});
});

app.listen(3000);