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
            addEventListener: () => {},
            removeEventListener: () => {},
            window: {},
            performance: {
                now: () => 0
            }
        },
        require: {
            external: false,
            builtin: ['assert', 'buffer', 'crypto', 'http', 'https', 'net', 'path', 'querystring', 'stream', 'tty', 'util', 'url', 'zlib'],
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
                }
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
 * Get script based on renderer source code
 * @param src
 */
const getRendererScript = (src) => new VMScript(src);

/**
 * Create new renderer in VM using script
 * @param script
 * @param settings
 * @returns {*}
 */
const createRenderer = (script, settings) => {
    const vmOpts = createOptions(settings);
    const vm = new NodeVM(vmOpts);
    return vm.run(script);
};

/**
 * Create a reuseable renderer from source
 * @param src
 * @param settings
 * @returns {*}
 */
const createReuseableRenderer = (src, settings) => {
    const script = getRendererScript(src);
    return createRenderer(script, settings);
};

module.exports = {
    createRenderer,
    createReuseableRenderer,
    getRendererScript,
    includedLibs
};
