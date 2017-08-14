class Storage {
    constructor() {
        this.db = {};
    }

    get length() {
        return Object.keys(this.db).length;
    }

    key(n) {
        return this.db[Object.keys(this.db)[n]];
    }

    getItem(key) {
        return this.db[key];
    }

    setItem(key, value) {
        this.db[key] = value;
    }

    removeItem(key) {
        delete this.db[key];
    }

    clear() {
        this.db = {};
    }
}

module.exports = Storage;
