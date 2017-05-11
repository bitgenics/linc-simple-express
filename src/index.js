const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch').default;
const {NodeVM} = require('vm2');
const Storage = require('./storage');

function createRender(renderer_path, options) {
    const createRendererStart = process.hrtime();
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
    opts.renderer = path.resolve(opts.rendererPath, opts.rendererFilename);
    opts.settingsVariable = opts.settingsVariable || 'settings';
    opts.settings = opts.settings || {};

    const vmOpts = {
        sandbox: {
            fetch: fetch,
            localStorage: new Storage(),
            sessionStorage: new Storage()
        },
        require: {
            external: false,
            builtin: ['http', 'https', 'url', 'assert', 'stream', 'tty', 'util', 'path', 'crypto', 'zlib', 'buffer'],
            mock: {
                'follow-redirects': require('follow-redirects')
            },
            context: 'sandbox'
        }
    };
    vmOpts.sandbox[opts.settingsVariable] = opts.settings;
    vmOpts.sandbox.window = vmOpts.sandbox;
    const vm = new NodeVM(vmOpts);

    const renderer = fs.readFileSync(opts.renderer);
    const render = vm.run(`${renderer}`);
    const createRendererEnd = process.hrtime(createRendererStart);
    console.log("CreateRenderer: %ds %dms", createRendererEnd[0], createRendererEnd[1]/1000000);

    return function(req, res, next) {
        const start = process.hrtime();
        req.timings = { start }
        res.on('finish', () => {
            const end = process.hrtime(start);
            console.log("Request timing: %ds %dms", end[0], end[1]/1000000);
            console.log(req.timings);
        });
        render.renderGet(req, res, { variable: opts.settingsVariable, settings: opts.settings });

    }
}

module.exports = createRender;