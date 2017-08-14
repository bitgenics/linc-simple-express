/* eslint-disable no-throw-literal,no-return-assign,no-param-reassign,import/no-dynamic-require,global-require */
const fetch = require('node-fetch');
const { NodeVM, VMScript } = require('vm2');
const Storage = require('./storage');

const includedLibs = ['follow-redirects', 'faye-websocket', 'xmlhttprequest'];

/**
 * Create options for the VM
 * @param settings
 */
const createOptions = (settings) => {
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
            // eslint-disable-next-line max-len
            builtin: ['assert', 'buffer', 'crypto', 'dgram', 'dns', 'events', 'http', 'https', 'path', 'punycode', 'net', 'querystring', 'stream', 'string_decoder', 'tls', 'tty', 'url', 'util', 'zlib'],
            mock: {
                fs: {
                    readFile: (file, options, callback) => {
                        if (typeof options === 'function') {
                            callback = options;
                        }
                        callback('Filesystem operations are not permitted in the Linc sandbox');
                    },
                    readFileSync: () => {
                        throw 'Filesystem operations are not permitted in the Linc sandbox';
                    },
                    writeFile: (file, data, options, callback) => {
                        if (typeof options === 'function') {
                            callback = options;
                        }
                        callback('Filesystem operations are not permitted in the Linc sandbox');
                    },
                    writeFileSync: () => {
                        throw 'Filesystem operations are not permitted in the Linc sandbox';
                    },
                },
            },
            context: 'sandbox',
        },
    };

    includedLibs.forEach((lib) => {
        vmOpts.require.mock[lib] = require(lib);
    });

    // Copy settings into sandbox
    Object.assign(vmOpts.sandbox, settings || {});
    // Copy sandbox globals into sandbox window.
    Object.assign(vmOpts.sandbox.window, vmOpts.sandbox);
    return vmOpts;
};

/**
 * Create a reuseable renderer
 * @param renderer
 * @param settings
 * @returns {*}
 */
const createReuseableRenderer = (renderer, settings) => {
    const script = new VMScript(renderer);
    const vmOpts = createOptions(settings);
    const vm = new NodeVM(vmOpts);
    return vm.run(script);
};

module.exports.createReuseableRenderer = createReuseableRenderer;
module.exports.includedLibs = includedLibs;
