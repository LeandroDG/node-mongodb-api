# MongoDb client for Nodejs
This node module provides a set of methods to authenticate against MongoDb's services and execute commands.
The module was created as part of [KidoZen](http://www.kidozen.com) project, as a connector for its Enterprise API feature.

This module is based on module [mongodb](https://github.com/mongodb/node-mongodb-native).

## Installation

Use npm to install the module:

```
> npm install mongodb-api
```

## Runing tests

Use npm to run the set of tests

```
> npm test
```

## API

Due to the asynchrounous nature of Nodejs, this module uses callbacks in requests. All callbacks have 2 arguments: `err` and `data`.

```
function callback (err, data) {
    // err contains an Error class instance, if any
    // data contains the resulting data
} 
``` 

### Constructor

The module exports a Class and its constructor requires a configuration object with following properties

* url: Required string. [Connection string URI format](http://docs.mongodb.org/manual/reference/connection-string/)
* timeout: Optional integer for the session timeout in milleseconds. Default 15 minutes.  
* username: Optional MongoDb's user name.
* password: Optional user's password

```
var Mongo = require("mongodb-api");
var mongo = new Mongo({ url: "mongodb://localhost/test", timeout: 5*60*1000 }); // Timeout of 5 minutes
```

### Methods

#### authenticate(credentials, callback)

This method should be used for authenticate user's credentials. A successed authentication will return an object intance containing the `auth` property. The value of this property is the athentication token that could be required by other methods.

**Parameters:**
* `credentials`: A required object instance containing authentication's parameters:
    * `username`: A string with a MongoDB's user name.
    * `password`: A string containing the user's password. 
* `callback`: A required function for callback.


```
mongo.authenticate({ username:"foo", password: "bar" }, function(err, result) {
    if (err) return console.error(err);
    console.log(result.auth);
});
```

#### lookupMethod(name, callback)

Use this method to get a Function object. The Function object represents the function to execute on MongoDB.
This method adds dinamically the returned Function to the connector's instance.  

The methods's names have the same sintax that the MongoDb's console, for instance:
* "db.collectionNames": Represents the 'collectionName' method on current Db.
* "db.drop": Represents the 'drop' method on current Db.
* "db.customer.find": Represents the 'find' method on collection 'customer'.
* "db.orders.pending.insert": Represents the 'insert' method on collection 'orders.pending'.

**Parameters:**

* `name`: A required string. Name of the method. Sintax: "db.[collection.]method"
* `callback`: A required function for callback. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the Function object or null if the a method with that name does not exist.

```
// looks for the db's collectionNames method.
mongo.lookupMethod("db.collectionNames", function(err, method) {
    if (err) return console.error(err);    

    method(function(err, names) {        console.log ("Collection names:", names);
    });

    // Invokes same method again. It was added dinamically to the instance by the lookupMethod
    mongo["db.collectionNames"](function(err, names) {
        console.log ("Collection names (again):", names);
    });
});
```


## List of available MongoDb methods.
All there methods have the same signature, their have two arguments: options and callback.

options must be an object instance containig all parameters for the method.
callback must be a function.


### Methods for a db instance
* [addUser](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#addUser) (`{ usr: ..., pwd: ...[, options: ...] }`, `callback`)
* [collectionNames](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#collectionNames) (`{ [collectionName: ...][, options: ...] }`, `callback`)
* [command](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#command) (`{ selector: ...[, options: ...] }`, `callback`)
* [createCollection](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#createCollection) (`{ collectionName: ...[, options: ...] }`, `callback`)
* [createIndex](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#createIndex) (`{ collectionName: ..., fieldOrSpec: ...[, options: ...] }`, `callback`)
* [dropCollection](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#dropCollection) (`{ collectionName: ... }`, `callback`)
* [dropDatabase](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#dropDatabase) (`{  }`, `callback`)
* [dropIndex](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#dropIndex) (`{ collectionName: ..., name: ...[, options: ...] }`, `callback`)
* [ensureIndex](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#ensureIndex) (`{ collectionName: ..., fieldOrSpec: ...[, options: ...] }`, `callback`)
* [lastError](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#lastError) (`{ [options: ...] }`, `callback`)
* [previousErrors](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#previousErrors) (`{ [options: ...] }`, `callback`)
* [removeUser](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#removeUser) (`{ usr: ...[, options: ...] }`, `callback`)
* [renameCollection](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#renameCollection) (`{ fromCollection: ..., toCollectionName: ...[, options: ...] }`, `callback`)
* [resetErrorHistory](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#resetErrorHistory) (`{ [options: ...] }`, `callback`)

### Methods for a collection instance
* [aggregate](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#aggregate) (`{ array: ...[, options: ...] }`, `callback`)
* [count](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#count) (`{ [query: ...][, options: ...] }`, `callback`)
* [createIndex](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#createIndex) (`{ fieldOrSpec: ...[, options: ...] }`, `callback`)
* [distinct](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#distinct) (`{ key: ...[, query: ...][, options: ...] }`, `callback`)
* [drop](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#drop) (`{  }`, `callback`)
* [dropAllIndexes](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#dropAllIndexes) (`{ [options: ...] }`, `callback`)
* [dropIndex](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#dropIndex) (`{ name: ...[, options: ...] }`, `callback`)
* [ensureIndex](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#ensureIndex) (`{ fieldOrSpec: ...[, options: ...] }`, `callback`)
* [find](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#find) (`{ query: ...[, options: ...] }`, `callback`)
* [findAndModify](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#findAndModify) (`{ query: ..., sort: ..., doc: ...[, options: ...] }`, `callback`)
* [findAndRemove](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#findAndRemove) (`{ query: ..., sort: ...[, options: ...] }`, `callback`)
* [findOne](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#findOne) (`{ query: ...[, options: ...] }`, `callback`)
* [geoHaystackSearch](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#geoHaystackSearch) (`{ x: ..., y: ...[, options: ...] }`, `callback`)
* [geoNear](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#geoNear) (`{ x: ..., y: ...[, options: ...] }`, `callback`)
* [group](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#group) (`{ keys: ..., condition: ..., initial: ..., reduce: ..., finalize: ..., command: ...[, options: ...] }`, `callback`)
* [indexExists](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#indexExists) (`{ indexNames: ... }`, `callback`)
* [indexInformation](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#indexInformation) (`{ [options: ...] }`, `callback`)
* [indexes](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#indexes) (`{  }`, `callback`)
* [insert](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#insert) (`{ docs: ...[, options: ...] }`, `callback`)
* [isCapped](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#isCapped) (`{  }`, `callback`)
* [mapReduce](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#mapReduce) (`{ map: ..., reduce: ...[, options: ...] }`, `callback`)
* [options](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#options) (`{  }`, `callback`)
* [remove](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#remove) (`{ [selector: ...][, options: ...] }`, `callback`)
* [rename](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#rename) (`{ newName: ...[, options: ...] }`, `callback`)
* [save](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#save) (`{ doc: ...[, options: ...] }`, `callback`)
* [stats](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#stats) (`{ [options: ...] }`, `callback`)
* [update](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#update) (`{ selector: ..., doc: ...[, options: ...] }`, `callback`)
