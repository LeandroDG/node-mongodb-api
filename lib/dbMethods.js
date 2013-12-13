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
                username: true,
                password: true,
                options : false
            }
        },
        removeUser: {
            args: {
                username: true,
                options : false
            }
        },
        createCollection: {
            args: {
                collectionName : true,
                options: false
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
                toCollectionName : true,
                options: false
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


