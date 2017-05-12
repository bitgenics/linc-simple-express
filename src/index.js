const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch').default;
const {NodeVM} = require('vm2');
const MockBrowser = require('mock-browser').mocks.MockBrowser;
const Storage = require('./storage');

function createRender(renderer_path, settings) {
    const createRendererStart = process.hrtime();
    if (!renderer_path) {
        throw new TypeError('renderer_path required')
    }

    if (typeof renderer_path !== 'string') {
        throw new TypeError('renderer_path must be a string')
    }

    settings = settings || {};

    const vmOpts = {
        sandbox: {
            fetch: fetch,
            localStorage: new Storage(),
            sessionStorage: new Storage(),
            window: {}
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
    if(settings.LINC_SSR_BROWSER_MOCK) {
        vmOpts.sandbox.window = MockBrowser.createWindow();
        vmOpts.sandbox.document = MockBrowser.createDocument();
    }
    //Copy settings into sandbox
    Object.keys(settings).forEach((key) => vmOpts.sandbox[key] = settings[key]);
    //Copy sandbox globals into sandbox window.
    Object.keys(vmOpts.sandbox).forEach((key) => vmOpts.sandbox.window[key] = vmOpts.sandbox[key]);
    const vm = new NodeVM(vmOpts);

    const renderer = fs.readFileSync(renderer_path);
    const render = vm.run(`${renderer}`);
    const createRendererEnd = process.hrtime(createRendererStart);
    console.log("CreateRenderer: %ds %dms", createRendererEnd[0], createRendererEnd[1]/1000000);

    return function(req, res, next) {
        render.renderGet(req, res, settings);
    }
}

module.exports = createRender;