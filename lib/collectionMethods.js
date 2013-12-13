module.exports = function() {

    return {
        insert: {
            args: {
                docs: true,
                options: false
            }
        },
        remove : {
            args: {
                selector: false,
                options: false
            }
        },
        rename: {
            args: {
                newName: true,
                options: false
            }
        },
        save: {
            args: {
                doc: true,
                options: false
            }
        },
        update: {
            args: {
                selector: true,
                doc: true,
                options: false
            }
        },
        distinct: {
            args: {
                key: true,
                query: false,
                options: false
            }
        },
        count: {
            args: {
                query: false,
                options: false
            }
        },
        drop: {
            args: {
            }
        },
        findAndModify: {
            args: {
                query: true,
                sort: true,
                doc: true,
                options: false
            }
        },
        findAndRemove: {
            args: {
                query: true,
                sort: true,
                options: false
            }
        },
        find: {
            args: {
                query: true,
                options: false
            }
        },
        findOne: {
            args: {
                query: true,
                options: false
            }
        },
        createIndex: {
            args: {
                fieldOrSpec: true,
                options: false
            }
        },
        ensureIndex: {
            args: {
                fieldOrSpec: true,
                options: false
            }
        },
        indexInformation: {
            args: {
                options: false
            }
        },
        dropIndex: {
            args: {
                name: true,
                options: false
            }
        },
        dropAllIndexes: {
            args: {
                options: false
            }
        },
        mapReduce: {
            args: {
                map: true,
                reduce: true,
                options: false
            }
        },
        group: {
            args: {
                keys: true,
                condition: true,
                initial: true,
                reduce: true,
                finalize: true,
                command: true,
                options: false
            }
        },
        options: {
            args: {
            }
        },
        isCapped: {
            args: {
            }
        },
        indexExists: {
            args: {
                indexNames: true
            }
        },
        geoNear: {
            args: {
                x: true,
                y: true,
                options: false
            }
        },
        geoHaystackSearch: {
            args: {
                x: true,
                y: true,
                options: false
            }
        },
        indexes: {
            args: {
            }
        },
        aggregate: {
            args: {
                array: true,
                options: false
            }
        },
        stats: {
            args: {
                options: false
            }
        }
    };
}();


