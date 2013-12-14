var url         = require("url");
var uuid        = require("node-uuid");
var winston     = require("winston");
var Db          = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var Cursor      = require('mongodb').Cursor;
var Cache       = require("mem-cache");
var Join        = require("join");
var dbMethods   = require("./lib/dbMethods");
var colMethods  = require("./lib/collectionMethods");

var level = process.argv.indexOf("--level");
level = ((level > -1) ? process.argv[level + 1] : null) || "info"; 

winston.clear();
winston.add(winston.transports.Console, { colorize: true, level: level });

module.exports = Connector = function(configuration) {

    winston.info("MongoDB: Constructor. Start");
    winston.debug("MongoDB: Constructor configuration: ", configuration);

    if (!configuration  || Array.isArray(configuration) ||  typeof configuration !== 'object') throw new Error("'configuration' argument is invalid.");

    var self    = this;
    var config  = just(configuration || {}, "url", "timeout", "username", "password", "methodTimeout");

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
    config.methodTimeout = config.methodTimeout || (15 * 60 * 1000);

    if (typeof config.timeout !== 'number' || config.timeout < 100) throw new Error("'timeout' property must be a number equal or greater than 100.");
    if (typeof config.methodTimeout !== 'number' || config.methodTimeout < 100) throw new Error("'methodTimeout' property must be a number equal or greater than 100.");

    Object.defineProperty(this, "config", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: config
    });

    var cacheAuth   = new Cache({ timeout: config.timeout });               // Mongodb's clients by auth token
    var cacheCs     = new Cache({ timeout: config.timeout });               // auth tokens by connectio string
    var cacheMethod = new Cache({ timeout: config.methodTimeout });   // cache for lookupMethod  
 
    cacheAuth.on("expired", function (item) {
        winston.info("MongoDB: connection expired. " + item.auth);
        if (item.db) db.close();
    });

    cacheMethod.on("expired", function (item) {
        winston.info("MongoDB: method expired. " + item.key);
        delete self[item.key];
    });

    var getItem = function (options, cb) {

        winston.verbose("MongoDB: getItem.")
        winston.debug("  options:", options);

        if (options.auth) {
            var item = cacheAuth.get(options.auth);
            winston.verbose("MongoDB: getItem. Found at cacheAuth? " + !!item)
            if (item) return cb(null, item);
        }

        self.authenticate(options, function (err, data) {
            if (err) return cb(err);
            var item = cacheAuth.get(data.auth);
            winston.verbose("MongoDB: getItem. Found at cacheAuth? " + !!item)
            if (item) return cb(null, item);
            winston.debug("MongoDB: Should not reach this point!");
            cb(new Error("Authentication succeed but client was not created."));
        });
    }

    var createMethod = function(name, metadata, invoke) {

        winston.verbose("MongoDB: createMethod.");
        winston.debug("  name:", name);
        winston.debug("  metadata:", metadata);

        if (!metadata) return null;

        var argNames  = Object.keys(metadata.args);
        var required    = argNames.filter(function (name) { return metadata.args[name]; });

        winston.debug("  argNames:", argNames);
        winston.debug("  required:", required);

        return function (options, cb) {


            winston.info ("MongoDB: Invoking. method " + name);
            winston.debug("  options:", options);

            // Validates options arg
            if (!options || Array.isArray(options) || typeof options !== 'object') return cb(new Error("'options' argument is missing or invalid."));

            // Validates options's properties
            var missingProps = required
                .filter(function (arg) {
                    var value = options[arg];
                    return value === undefined || value === null;
                });

            if (missingProps.length > 0) return cb(new Error("The following properties are missing: " + missingProps.join(", ") + "."));

            // Get connection
            getItem(options, function (err, item) {
                
                if (err)    return cb(err);
                if (!item)  return cb(new Error("The server was not found or authentication failed."));

                try {

                    // creates method's arguments array from options
                    var argsArray = argNames
                        .map(function (arg) { return options[arg]; })
                        .filter(function (value) { return value !== undefined; });

                    // adds callback as last method argument
                    argsArray.push(function (err, result) {
                        if (!err && result instanceof Cursor) return result.toArray(cb);
                        cb(err, result);
                    });

                    invoke(item, argsArray);

                } catch (err) {
                    cb(err);
                }
            });
        };
    };

     // For each method metadata, it adds a new public method to the instance
    this.lookupMethod = function (name, cb) {

        winston.info ("MongoDB: lookupMethod");
        winston.debug("  name:", name);

        // Must be an string that does not ends with dot
        if (!name || typeof name !== 'string') return cb(new Error("'name' argument is missing or invalid."));

        var segments = name.split(".");
        if (segments[0] !== "db") return cb(new Error("'name' argument is missing or invalid."));

        // db method or collection method?
        if (segments.length === 1) {

            // the method's name is missing
            return cb(new Error("'name' argument is missing or invalid."));

        } else if (segments.filter(function (name) { return name.length > 0; }).length !== segments.length) {

            // there is a least an empty string segment              
            return cb(new Error("'name' argument is missing or invalid."));
        }

        // Get mongoDB's method name 
        var methodName = segments.pop();

        // Is a db method or a collection method?
        var method;
        if (segments.length === 1) {

            // it is a db method
            winston.verbose("MongoDB: creating a DB's method.");
            method = createMethod(methodName, dbMethods[methodName], function (item, argsArray) {

                winston.debug("MongoDB: Invoking db." + methodName, argsArray);
                item.db[methodName].apply(item.db, argsArray);
            });

        } else {

            // it is a collection method
            var colName = segments.slice(1).join(".");
            winston.verbose("MongoDB: creating a Collection's method.");
            winston.verbose("  collectionName: " + colName);

            method = createMethod(methodName, colMethods[methodName], function (item, argsArray) {
            
                winston.debug('MongoDB: Invoking db.collection("' + colName + '").' + methodName, argsArray);
                var col = item.db.collection(colName);
                col[methodName].apply(col, argsArray);    
            });
        }

        // store for futures invocations
        winston.verbose("MongoDB: Was method found? " + !!method);

        if (method) {
            cacheMethod.set(name, null);
            self[name] = method;
        }

        // returns method
        cb (null, method);
    };

    this.authenticate = function (credentials, cb) {

        winston.info("MongoDB: authenticate");
        winston.debug("  credentials: ", credentials);

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
        
        winston.debug ("  cs:", cs);

        var data = { 
            auth: cacheCs.get(cs) || uuid.v4(), 
            username: username
        };

        winston.debug ("  data:", data);

        if (cacheAuth.get(data.auth)) {
            winston.info("MongoDB: auth was found at cacheAuth");
            return cb(null, data);
        };

        winston.verbose("MongoDB: auth token was found at caheAuth. Creating a new connection.");
    
        MongoClient.connect(cs, function (err, db) {
    
            if (err) {
                winston.verbose("MongoDB: connection creation failed.", err);
                return cb(err);
            }

            winston.verbose("MongoDB: connection created!");
            var item = {
                db      : db,
                username: username,
                password: password
            };
            
            winston.debug("  Adding item to cache.", data.auth);
            cacheAuth.set(data.auth, item);
            cacheCs.set(cs, data.auth);
            cb(null, data);
        });
    };

    this.close = function (cb) {

        winston.info("MongoDB: close");

        var count = 0;
        var join = new Join();
        
        cacheAuth.keys.forEach(function (auth) {
            var item = cacheAuth[auth];
            if (item && item.db) {
                count++;
                winston.verbose("MongoDB: closing " + auth);
                item.db.close(join.add());
            }
        })

        cacheAuth.clean();
        cacheCs.clean();

        return (count === 0) ? cb() : join.when(function() { cb(); });
    };

    winston.info("MongoDB: Constructor. End.");
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
