module.exports = function() {

    return {
        command: {
            args: {
                selector: true,
                options : false
            }
        },
        collectionNames: {
            args: {
                collectionName: false,
                options: false
            }
        },
        addUser: {
            args: {
                usr: true,
                pwd: true,
                options : false
            }
        },
        removeUser: {
            args: {
                usr: true,
                options : false
            }
        },
        createCollection: {
            args: {
                collectionName : true,
                options: false
            },
            after: function(context, cb) {
                if (context.result) context.result = {
                    name: context.result.collectionName
                };
                cb();
            }
        },
        dropCollection: {
            args: {
                collectionName : true
            }
        },
        renameCollection: {
            args: {
                fromCollection : true,
                toCollection : true,
                options: false
            },
            after: function(context, cb) {
                if (context.result) context.result = {
                    name: context.result.collectionName
                };
                cb();
            }
        },
        lastError: {
            args: {
                options: false
            }
        },
        previousErrors: {
            args: {
                options: false
            }
        },
        resetErrorHistory: {
            args: {
                options: false
            }
        },
        createIndex: {
            args: {
                collectionName: true,
                fieldOrSpec: true,
                options: false
            }
        },
        ensureIndex: {
            args: {
                collectionName: true,
                fieldOrSpec: true,
                options: false
            }
        },
        dropIndex: {
            args: {
                collectionName: true,
                name: true,
                options: false
            }
        },
        dropDatabase: {
            args: {
            }
        }
    };
}();


