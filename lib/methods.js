module.exports = function() {

    return {
        command: {
            args: {
                selector: true,
                options : false
            },
            invoke: function(db, options, cb) {
                db.command(options.selector, options.options, cb);
            },
        },
        collectionNames: {
            args: {
                collectionName: false,
                options: false
            },
            invoke: function(db, options, cb) {
                db.command(options.collectionName, options.options, cb);
            }
        },
        addUser: {
            args: {
                username: true,
                password: true,
                options : false
            },
            invoke: function(db, options, cb) {
                db.addUser(options.username, options.password, options.options, cb);
            }
        },
        removeUser: {
            args: {
                username: true,
                options : false
            },
            invoke: function(db, options, cb) {
                db.removeUser(options.username, options.options, cb);
            }
        },
        createCollection: {
            args: {
                collectionName : true,
                option: false
            },
            invoke: function(db, options, cb) {
                db.createCollection(options.collectionName, options.options, cb);
            }
        },
        dropCollection: {
            args: {
                collectionName : true
            },
            invoke: function(db, options, cb) {
                db.dropCollection(options.collectionName, cb);
            }
        },
        renameCollection: {
            args: {
                fromCollection : true,
                toCollectionName : true,
                options: false
            },
            invoke: function(db, options, cb) {
                db.dropCollection(options.fromCollection, options.toCollection, options.options, cb);
            }
        },
        lastError: {
            args: {
                options: false
            },
            invoke: function(db, options, cb) {
                db.lastError(options.fromCollection, options.options, cb);
            }
        },
        previousErrors: {
            args: {
                options: false
            },
            invoke: function(db, options, cb) {
                db.previousErrors(options.fromCollection, options.options, cb);
            }
        },
        resetErrorHistory: {
            args: {
                options: false
            },
            invoke: function(db, options, cb) {
                db.resetErrorHistory(options.fromCollection, options.options, cb);
            }
        },
        createIndex: {
            args: {
                collectionName: true,
                fieldOrSpec: true,
                options: false
            },
            invoke: function(db, options, cb) {
                db.createIndex(options.collectionName, options.fieldOrSpec, options.options, cb);
            }
        },
        ensureIndex: {
            args: {
                collectionName: true,
                fieldOrSpec: true,
                options: false
            },
            invoke: function(db, options, cb) {
                db.ensureIndex(options.collectionName, options.fieldOrSpec, options.options, cb);
            }
        },
        dropIndex: {
            args: {
                collectionName: true,
                name: true,
                options: false
            },
            invoke: function(db, options, cb) {
                db.dropIndex(options.collectionName, options.name, cb);
            }
        },
        dropDatabase: {
            args: {
            },
            invoke: function(db, options, cb) {
                db.dropDatabase(cb);
            }
        }
    };
}();


