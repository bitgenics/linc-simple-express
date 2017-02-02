const path = require('path');
const {NodeVM} = require('vm2');
const template = require('./template');

function createRender(renderer_path, options) {
    if (!renderer_path) {
        throw new TypeError('renderer_path required')
    }

    if (typeof renderer_path !== 'string') {
        throw new TypeError('renderer_path must be a string')
    }

    // copy options object
    const opts = Object.create(options || null)

    opts.rendererPath = path.resolve(renderer_path)
    opts.rendererFilename = opts.rendererFilename || 'server-render.js';
    opts.assetsManifestName = opts.assetsManifestName || 'asset-manifest.json';
    opts.renderer = path.resolve(opts.rendererPath, opts.rendererFilename);
    opts.assets = path.resolve(opts.rendererPath, opts.assetsManifestName);

    const vm = new NodeVM({
        sandbox: {},
        require: {
            external: true,
            root: opts.rendererPath
        },
    });

    const render = vm.run("module.exports = require('" + opts.renderer + "')");
    const assets = require(opts.assets);

    return function(req, res, next) {
        render(req.url, (err, result) => {
            template(result, assets, (err, results) => {
                res.status(results.statusCode).send(results.body);
            });
        });
    }
}

module.exports = createRender;