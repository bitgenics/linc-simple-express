const templ = require('marko').load(require.resolve('./index.marko'));

const template = (render_results, assets, settings, callback) => {
    render_results.assets = assets;
    render_results.head = render_results.head || {};
    render_results.settings = settings;
    templ.renderToString(render_results, (err, output) => {
        callback(err, {statusCode: render_results.statusCode, body: output});
    });
};

module.exports = template;