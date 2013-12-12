var url         = require("url");
var uuid        = require("node-uuid");
var Db          = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var Cache       = require("mem-cache");
var Join        = require("join");

module.exports = Connector = function(configuration) {

    if (!configuration  || Array.isArray(configuration) ||  typeof configuration !== 'object') throw new Error("'configuration' argument is invalid.");

    var self    = this;
    var config  = just(configuration || {}, "url", "timeout", "username", "password");

    // Validate configuration
    if (!config.url   || typeof(config.url)!=="string") throw new Error("'url' property is missing or invalid.");
    config.url = url.parse(config.url);

    if (config.url.protocol !== "mongodb:") throw new Error("'url' protocol is invalid.");
    if (config.username) {
        if (typeof config.username !== "string") throw new Error("'username' must be a non empty string.");
        if (!config.password || typeof config.password !== "string") throw new Error("'password' is missing or invalid.");
        config.url.auth = config.username + ":" + config.password;
    }
    
    // Set defaults
    config.timeout = config.timeout || (15 * 60 * 1000);

    if (typeof config.timeout !== 'number' || config.timeout < 100) throw new Error("'timeout' property must be a number equal or greater than 100.");

    Object.defineProperty(this, "config", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: config
    });

    var cacheAuth   = new Cache({ timeout: config.timeout }); // Mongodb's clients by auth token
    var cacheCs     = new Cache({ timeout: config.timeout }); // auth tokens by connectio string

    var getItem = function (options, cb) {

        if (options.auth) {
            var item = cacheAuth.get(options.auth);
            if (item) return cb(null, item);
        }

        self.authenticate(options, function (err, data) {
            if (err) return cb(err);
            cb (null, cacheAuth.get(data.auth));            
        });
    }

    this.authenticate = function (credentials, cb) {

        if (!credentials || typeof credentials !== 'object') return cb(new Error("'credentials' argument must be an object instance."));
        if (credentials.username && typeof credentials.username !== 'string') return cb(new Error("'username' property is invalid."));

        var username = credentials.username || config.username;
        var password = credentials.password || config.password;
        var cs = null;

        if (username) {
            if (!password || typeof password !== 'string') return cb(new Error("The 'password' is missing or invalid."));
            var csUrl = clone(config.url);
            csUrl.auth = username + ":" + password;
            cs = url.format(csUrl);
        } else {
            cs = url.format(config.url);
        }
        
        var data = { 
            auth: cacheCs.get(cs) || uuid.v4(), 
            username: username
        };

        if (cacheAuth.get(data.auth)) return cb(null, data);

        MongoClient.connect(cs, function (err, db) {
            if (err) return cb(err);
            
            var item = {
                db      : db,
                username: username,
                password: password
            };
            
            cacheAuth.set(data.auth, item);
            cacheCs.set(cs, data.auth);
            cb(null, data);
        });
    };

    this.close = function (cb) {

        var count = 0;
        var join = new Join();
        
        cacheAuth.keys.forEach(function (auth) {
            var item = cacheAuth[auth];
            if (item && item.db) {
                count++;
                item.db.close(join.add());
            }
        })

        cacheAuth.clean();
        cacheCs.clean();

        return (count === 0) ? cb() : join.when(function() { cb(); });
    };

    this.command = function (options, cb) {

        if (!options || Array.isArray(options) || typeof options !== 'object') return cb(new Error("'options' argument is missing or invalid."));
        if (options.selector === undefined || options.selector === null) return cb(new Error("'selector' argument is missing."));

        getItem(options, function (err, item) {
            
            if (err)    return cb(err);
            if (!item)  return cb(new Error("The server was not found or athentication failed."));

            try {
                item.db.command(options.selector, options.options, cb);
            } catch (err) {
                cb(err);
            }
        });
    };
};

// Returns a new copy of an object or value
var clone =  function(source) {

    // is source null or a value type?
    if (source === null || typeof source !== 'object') return source;

    // returns a copy of an array
    if (source instanceof Array)    return source.map(clone);

    // returns a copy of a date
    if (source instanceof Date)     return new Date(source.getTime());

    // returns a copy of an object
    var result = {};
    Object.keys(source).map(function(prop) { result[prop] = clone(source[prop]); });
    return result;
};


// Returns a new copy of source, containing the properties passed as arguments only. 
var just = function (source) {
    var result = {};
    Array.prototype.slice.call(arguments, 1)
        .forEach(function (prop) {
            var val = source[prop];
            if (val !== undefined) result[prop] = clone(val);
        });
    return result; 
};
