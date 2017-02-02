require('isomorphic-fetch');
const templ = require('marko').load(require.resolve('./index.marko'));

const template = (render_results, assets, callback) => {
    render_results.assets = assets;
    render_results.head = render_results.head || {}
    templ.renderToString(render_results, (err, output) => {
        callback(err, {statusCode: render_results.statusCode, body: output})
    })
};

module.exports = template;