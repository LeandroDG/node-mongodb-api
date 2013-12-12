var url         = require("url");
var assert      = require("assert");
var Db          = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var Connector   = require("../index.js");
var sinon       = require("sinon");

describe("index.js", function() {

    var cs = "mongodb://localhost/testing";
    var config;
    var connector;

    beforeEach(function () {
        // reset
        connector = null;
        config = { url: cs };
    });
    
    afterEach(function (done) {
        // release connector
        if (!connector) return done();
        connector.close(done);
    });

    it ("mongodb service must be available", function (done) {
        MongoClient.connect(cs, function (err, db) {
            assert.ok(!err);
            assert.ok(db instanceof Db);
            db.dropDatabase(function (err) {
                assert.ok(!err);
                db.close(done);
            });
        });
    });

    describe("constructor", function() {

        describe ("url", function() {
            it ("Should fail if 'url' property was not set or has a non string value.", function() {
                [{}, { url: null }, { url: "" }, { url: 100 }, { url: true }, { url: [] }]
                    .forEach(function (config) {
                        try {
                            new Connector(config);
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal("'url' property is missing or invalid.", e.message);
                        }
                    });
            });

            it ("Should fail if 'url' property has invalid protocol.", function() {
                try {
                    new Connector({ url: "http://localhost" });
                } catch (e) {
                    assert.ok(e instanceof Error);
                    assert.equal("'url' protocol is invalid.", e.message);
                }
            });

            it ("should be able to create an instance with a valid url", function() {
                var connector = new Connector({ url: "mongodb://foo" });
                assert.equal("mongodb://foo", url.format(connector.config.url));
            });
        });

        describe ("username & password", function() {
            it ("Should fail if 'username' property has invalid value.", function() {
                [{}, [], 100, true]
                    .forEach(function (value) {
                        try {
                            new Connector({ url: "mongodb://localhost", username: value });
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal("'username' must be a non empty string.", e.message);
                        }
                    });
            });

            it ("Should fail if 'password' is missing or invalid.", function() {
                [null, {}, [], 100, true]
                    .forEach(function (value) {
                        try {
                            new Connector({ url: "mongodb://localhost", username: "foo", password: value });
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal("'password' is missing or invalid.", e.message);
                        }
                    });
            });

            it ("Should set url's auth info.", function() {
                var connector = new Connector({ url: "mongodb://localhost", username: "foo", password: "bar" });
                assert.equal(url.format(connector.config.url), "mongodb://foo:bar@localhost");
            });

            it ("Should override url's auth info.", function() {
                var connector = new Connector({ url: "mongodb://x:y@localhost", username: "foo", password: "bar" });
                assert.equal(url.format(connector.config.url), "mongodb://foo:bar@localhost");
            });
        });

        describe ("timeout", function() {

            it ("Should fail if timeout is not a number or smaller than 100.", function() {            
                ["foo", [], {}, true, 99]
                    .forEach(function (value) {
                        try {
                            new Connector({ url: "mongodb://foo", timeout: value });
                            assert.fail();                
                        } catch (e) {
                            assert.ok(e instanceof Error);
                            assert.equal(e.message, "'timeout' property must be a number equal or greater than 100.");
                        }
                    });
            });

            it ("Should set default value of timeout.", function() {
                var connector = new Connector({ url: "mongodb://foo" });
                assert.equal((15 * 60 * 1000), connector.config.timeout);
            });

            it ("Should override timeout.", function() {
                var connector = new Connector({ url: "mongodb://foo", timeout: 100 });
                assert.equal(100, connector.config.timeout);
            });
        });

        it ("Should fail if config argument is not an object", function() {            
            ["foo", [], 100, true]
                .forEach(function (config) {
                    try {
                        new Connector(config);
                        assert.fail();
                    } catch (e) {
                        assert.ok(e instanceof Error);
                        assert.equal("'configuration' argument is invalid.", e.message);
                    }
                });
        });

        it ("Should be able to create an instance.", function() {
            var connector = new Connector(config);
            assert.ok(connector instanceof Connector);
        });
    });

    describe("authenticate", function() {

        this.timeout(5000);

        it("should fail if 'credentials' argument is missing or invalid.", function () {

            connector = new Connector(config);

            ["invalid", true, 100, null, function(){}]
                .forEach(function (credentials) {
                    connector.authenticate(credentials, function (err, data) {
                        assert.ok(!data);
                        assert.ok(err instanceof Error);
                        assert.equal(err.message, "'credentials' argument must be an object instance.")
                    });
                });
        });        

        describe("On secured DB", function () {

            before(function (done) {
                // adds users to db
                MongoClient.connect(cs, function (err, db) {
                    assert.ok(!err);
                    db.addUser("foo", "bar", function (err) {
                        assert.ok(!err);
                        db.addUser("alfa", "beta", function (err) {
                            assert.ok(!err);
                            db.close(done);
                        });
                    });
                });
            });
        
            after(function (done) {
                // removes users from db
                var csUrl = url.parse(cs);
                csUrl.auth = "foo:bar";
                MongoClient.connect(url.format(csUrl), function (err, db) {
                    assert.ok(!err);
                    db.removeUser("foo", function (err) {
                        assert.ok(!err);
                        db.removeUser("alfa", function (err) {
                            assert.ok(!err);
                            db.close(done);
                        });
                    });
                });
            });

            it("should fail if 'username' property is invalid.", function () {
                        
                connector = new Connector(config);

                [true, 100, function(){}]
                    .forEach(function (value) {
                        connector.authenticate({ username: value }, function (err, data) {
                            assert.ok(!data);
                            assert.ok(err instanceof Error);
                            assert.equal(err.message, "'username' property is invalid.");
                        });
                    });
            });

            it ("Should fail if 'password' is missing or invalid.", function () {
                [null, {}, [], 100, true]
                    .forEach(function (value) {
                        connector = new Connector(config);
                        connector.authenticate({ username: "foo", password: value }, function (err, data) {
                            assert.ok(!data);
                            assert.ok(err instanceof Error);
                            assert.equal(err.message, "The 'password' is missing or invalid.");
                        });
                    });
            });

            it ("should return an error on invalid 'username'.", function (done) {
                connector = new Connector(config);
                connector.authenticate({ username: "invalid", password:"bar" }, function (err, data) {
                    assert.ok(!data);
                    assert.ok(err instanceof Error);
                    assert.equal(err.message, "auth fails");
                    done();
                });
            });

            it ("should return an error on invalid 'password'.", function (done) {
                connector = new Connector(config);
                connector.authenticate({ username: "foo", password:"invalid" }, function (err, data) {
                    assert.ok(!data);
                    assert.ok(err instanceof Error);
                    assert.equal(err.message, "auth fails");
                    done();
                });
            });

            it ("should connect using configured 'username' && 'password'.", function (done) {
                connector = new Connector(config);
                connector.authenticate({ username: "foo", password:"bar" }, function (err, data) {
                    assert.ok(!err);
                    assert.ok(data);
                    assert.ok(typeof data.auth === 'string');
                    assert.ok(data.auth.length > 0);
                    done();
                });
            });

            it ("Second connection should be retrived from cache.", function (done) {
                connector = new Connector(config);
                connector.authenticate({ username: "foo", password:"bar" }, function (err, data) {
                    assert.ok(!err);
                    var auth = data.auth;
                    connector.authenticate({ username: "foo", password:"bar" }, function (err, data) {
                        assert.ok(!err);
                        assert.ok(data);
                        assert.equal(data.auth, auth);
                        done();
                    });
                });
            });

            it ("Second connection should be retrived from cache and fail if password is wrong.", function (done) {
                connector = new Connector(config);
                connector.authenticate({ username: "foo", password:"bar" }, function (err, data) {
                    assert.ok(!err);
                    connector.authenticate({ username: "foo", password:"wrong" }, function (err, data) {
                        assert.ok(!data);
                        assert.ok(err instanceof Error);
                        assert.equal(err.message, "auth fails");
                        done();
                    });
                });
            });

            it ("Connection of a different user should return a different 'auth' token.", function (done) {
                connector = new Connector(config);
                connector.authenticate({ username: "foo", password:"bar" }, function (err, data) {
                    assert.ok(!err);
                    var auth = data.auth;
                    connector.authenticate({ username: "alfa", password:"beta" }, function (err, data) {
                        assert.ok(!err);
                        assert.ok(data);
                        assert.ok(data.auth);
                        assert.notEqual(data.auth, auth);
                        done();
                    });
                });
            });
        });

        describe("On unsecured DB", function () {
            
            it ("should connect without credentials.", function (done) {
                connector = new Connector(config);
                connector.authenticate({}, function (err, data) {
                    assert.ok(!err);
                    assert.ok(data);
                    assert.ok(typeof data.auth === 'string');
                    assert.ok(data.auth.length > 0);
                    done();
                });
            });

            it ("Second connection should be retrived from cache.", function (done) {
                connector = new Connector(config);
                connector.authenticate({}, function (err, data) {
                    assert.ok(!err);
                    var auth = data.auth;
                    connector.authenticate({}, function (err, data) {
                        assert.ok(!err);
                        assert.ok(data);
                        assert.equal(data.auth, auth);
                        done();
                    });
                });
            });
        });
    });

    describe("authentication and method invocation sequence on secured DB", function () {

        before(function (done) {
            // adds users to db
            MongoClient.connect(cs, function (err, db) {
                assert.ok(!err);
                db.addUser("foo", "bar", function (err) {
                    assert.ok(!err);
                    db.close(done);
                });
            });
        });
    
        after(function (done) {
            // removes users from db
            var csUrl = url.parse(cs);
            csUrl.auth = "foo:bar";
            MongoClient.connect(url.format(csUrl), function (err, db) {
                assert.ok(!err);
                db.removeUser("foo", function (err) {
                    assert.ok(!err);
                    db.close(done);
                });
            });
        });

        it("With credentials configured, we can execute commands without auth token nor credentials", function (done) {

            config.username = "foo";
            config.password = "bar";
            connector = new Connector(config);
            connector.command({ selector: { ping: 1 } }, function (err, data) {
                assert.ok(!err);
                assert.ok(data);
                done();
            });
        });

        it ("when method is invoked with credentials, the method 'authenticate' will be invoked", function (done) {

            connector = new Connector(config);

            var spyAuth = sinon.spy(connector, "authenticate");
            connector.command({ selector: { ping: 1 }, username: "foo", password: "bar" }, function (err, data) {
                assert.ok(!err);
                assert.ok(data);
                assert.ok(spyAuth.called);
                done();
            });
        });

        it ("when method is invoked with an auth token, the method 'authenticate' will not be invoked", function (done) {

            connector = new Connector(config);
            connector.authenticate({ username: "foo", password: "bar" }, function (err, data) {
    
                var spyAuth = sinon.spy(connector, "authenticate");
                connector.command({ selector: { ping: 1 }, auth: data.auth }, function (err, data) {
                    assert.ok(!err);
                    assert.ok(data);
                    assert.ok(!spyAuth.called);
                    done();
                });
            });
        });
    });

    describe("command", function() {

        this.timeout(5000);

        var connector;

        before(function () {
            // create connector
            connector = new Connector({ url: cs });
        });
        
        after(function (done) {
            // release connector
            if (!connector) return done();
            connector.close(done);
            connector = null;
        });

        it ("should fail if options is not an object instance.", function () {
            ["foo", [], 100, true, null]
                .forEach(function (options) {
                    connector.command(options, function (err, data) {
                        assert.ok(!data);
                        assert.ok(err instanceof Error);
                        assert.equal(err.message, "'options' argument is missing or invalid.");
                    });
                });
        });

        it ("should fail if 'selector' property is missing.", function (done) {
            connector.command({}, function (err, data) {
                assert.ok(!data);
                assert.ok(err instanceof Error);
                assert.equal(err.message, "'selector' argument is missing.");
                done();
            });
        });

        it ("should run ok.", function (done){
            connector.command({ selector: { ping: 1 } }, function (err, data) {
                assert.ok(!err);
                assert.ok(data);
                done();
            });
        });
    });
});
