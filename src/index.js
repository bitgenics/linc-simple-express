const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const {NodeVM} = require('vm2');
const Storage = require('./storage');

const includedLibs = ['follow-redirects', 'faye-websocket', 'xmlhttprequest'];

function createVM(settings) {
    settings = settings || {};

    const vmOpts = {
        sandbox: {
            fetch: fetch.default,
            Headers: fetch.Headers,
            Request: fetch.Request,
            Response: fetch.Response,
            FetchError: fetch.FetchError,
            RENDER_ENV: 'server',
            localStorage: new Storage(),
            sessionStorage: new Storage(),
            addEventListener: () => {},
            window: {},
        },
        require: {
            external: false,
            builtin: ['assert', 'buffer', 'crypto', 'dgram', 'dns', 'events', 'http', 'https', 'path', 'punycode', 'net', 'querystring', 'stream', 'string_decoder', 'tls', 'tty', 'url', 'util', 'zlib' ],
            mock: {
                'fs': {
                    readFile: (file, options, callback) => {
                        if(typeof options === 'function') {
                            callback = options;
                        }
                        callback('Filesystem operations are not permitted in the Linc sandbox');
                    },
                    readFileSync: () => {
                        throw 'Filesystem operations are not permitted in the Linc sandbox';
                    },
                    writeFile: (file, data, options, callback) => {
                        if(typeof options === 'function') {
                            callback = options;
                        }
                        callback('Filesystem operations are not permitted in the Linc sandbox');
                    },
                    writeFileSync: () => {
                        throw 'Filesystem operations are not permitted in the Linc sandbox';  
                    }
                }
            },
            context: 'sandbox'
        }
    };

    includedLibs.forEach((lib) => {
        vmOpts.require.mock[lib] = require(lib);
    });

    //Copy settings into sandbox
    Object.keys(settings).forEach((key) => vmOpts.sandbox[key] = settings[key]);
    //Copy sandbox globals into sandbox window.
    Object.keys(vmOpts.sandbox).forEach((key) => vmOpts.sandbox.window[key] = vmOpts.sandbox[key]);
    return new NodeVM(vmOpts);
}

function createRender(renderer_path, settings) {
    const createRendererStart = process.hrtime();
    if (!renderer_path) {
        throw new TypeError('renderer_path required')
    }

    if (typeof renderer_path !== 'string') {
        throw new TypeError('renderer_path must be a string')
    }

    const vm = createVM(settings);

    const renderer = fs.readFileSync(renderer_path);
    const render = vm.run(`${renderer}`);
    const createRendererEnd = process.hrtime(createRendererStart);
    console.log("CreateRenderer: %ds %dms", createRendererEnd[0], createRendererEnd[1]/1000000);

    return function(req, res, next) {
        render.renderGet(req, res, settings);
    }
}

module.exports = createRender;
module.exports.createVM = createVM;
module.exports.includedLibs = includedLibs;