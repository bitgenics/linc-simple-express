const express = require('express');
const ssr = require('../../src/index.js');

app = express();
app.use('/_assets', express.static('../render_files/_assets'));
app.use('/', ssr('../render_files'))

app.listen(3000, (err) => {
	if(err) {
		console.log(err);
	} else {
		console.log('Listing on port: 3000');
	}
});