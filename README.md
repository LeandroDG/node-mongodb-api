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
All public methods has the same signature, their have two arguments: `options` and `callback`.
* `options` must be an object instance containig all parameters for the method.
* `callback` must be a function.

#### authenticate(options, callback)

This method should be used for authenticate user's credentials. A successed authentication will return an object intance containing the `auth` property. The value of this property is the athentication token that could be required by other methods.

**Parameters:**
* `options`: A required object instance containing authentication's parameters:
    * `username`: A string with a MongoDB's user name.
    * `password`: A string containing the user's password. 
* `callback`: A required function for callback.


```
mongo.authenticate({ username:"foo", password: "bar" }, function(err, result) {
    if (err) return console.error(err);
    console.log(result.auth);
});
```

#### command(options, callback)

Use this method to invoke a command. [MongoDB doc](http://mongodb.github.io/node-mongodb-native/api-generated/db.html#command)

**Parameters:**

* `options`: A required object instance with the following properties:
    * `auth`        : Optional. A string containing the authentication token
    * `username`    : Optional. A string containing MongoDb user name
    * `password`    : Optional. A string containing user's password
    * `selector`    : Required. Object instance describing the command hash to send to the server 
    * `options`     : Optional. Object instance with additional options for the command.

```
var options = {
    auth: "...",
    selector: { ping: 1 }
};
mongo.command(options, function(err, result) {
    if (err) return console.error(err);
    console.log(result);
});
```