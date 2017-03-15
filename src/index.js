require('isomorphic-fetch');
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
    opts.settingsVariable = opts.settingsVariable || 'settings';
    opts.settings = opts.settings || {};

    const vmOpts = {
        sandbox: {
            fetch: global.fetch,
        },
        require: {
            external: true,
            builtin: ['path'],
            root: opts.rendererPath,
            context: 'sandbox'
        }
    }
    vmOpts.sandbox[opts.settingsVariable] = opts.settings;
    const vm = new NodeVM(vmOpts);

    const render = vm.run("global.window = global; module.exports = require('" + opts.renderer + "')");
    const assets = require(opts.assets);

    return function(req, res, next) {
        render.renderGet(req, res, { variable: opts.settingsVariable, settings: opts.settings });
    }
}

module.exports = createRender;