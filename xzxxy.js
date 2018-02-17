const databaseClient = require('mongodb').MongoClient;
const authenticationClient = require('mongodb').MongoClient;
const Express = require('express');
const Assert = require('assert');
const Aplication = Express();
var AuthenticationRouter = Express.Router();
var DatabaseRouter = Express.Router();
const Parser = require('body-parser');

const Keyword = process.env.KEYWORD;
var CalculatedKeyWord;
const ListenPort = process.env.PORT || 3000;
// DBPATH set in enviroment variables
const AuthenticationDatabasePath = process.env.MONGODB_PATH_AUTH;
// collections : users, admins, allowedhashes
const DatabasePath = process.env.MONGODB_PATH_DB;
// collections - for every class there's one

Aplication.use(Parser.urlencoded({
    extended: true
}));
Aplication.use(Parser.json());

// AUTH ROUTER
AuthenticationRouter.get('/WriteKeyword', (req, res, next) => {
    console.log('This session has the keyword set to : ' + CalculatedKeyWord);
    res.send('Wrote the keyword to server console!');
});
AuthenticationRouter.post('/Hash', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        Assert.ifError(err);
        var collection = client.collection('allowedhashes');
        if(req.body.KEYWORD == CalculatedKeyWord)
        {
            collection.insert({hash:req.body.ASSHASH}, (err,data) => {
                res.send('Successfully added the hash to database!');
            });
        }
        else
        {
            res.send('Could not add the hash to database!');
        }
        client.close();
    });
});
AuthenticationRouter.post('/FirstStep', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        Assert.ifError(err);
        var collection = client.collection('allowedhashes');
        console.log(req.body);
        collection.find({},{_id:0}).toArray((err,data) => {
            Assert.ifError(err);
            var y = false;
            console.log(data);
            for(var i = 0; i < data.length; i++)
            {
                if(data[i].hash == req.body.ASSHASH)
                {
                    y = true;
                }
            }
            if(y)
            {
                var ucollection = client.collection('users');
                var acollection = client.collection('admins');
                var exists = false;
                var type = "";
                ucollection.find({},{_id:0}).toArray((err,users) => {
                    Assert.ifError(err);
                    if(users != undefined)
                    {
                        console.log(users);
                        for(var i = 0; i < users.length; i++)
                        {
                            if(users[i].user == req.body.APPHASH)
                            {
                                exists = true;
                                type = "user";
                            }   
                        }
                    }
                });
                acollection.find({},{_id:0}).toArray((err,users) => {
                    Assert.ifError(err);
                    if(users != undefined)
                    {
                        console.log(users);
                        for(var i = 0; i < users.length; i++)
                        {
                            if(users[i].user == req.body.APPHASH)
                            {
                                exists = true;
                                type = "admin";
                            }  
                        }
                    }
                });
                if(exists)
                {
                    res.send("You already exist as a " + type + "!");
                }
                else
                {
                    res.send(CalculatedKeyWord);
                }
            }
            else
            {
                res.send("Registration denied!");
            }
        });
        client.close();
    });
});
AuthenticationRouter.post('/SecondStep', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        Assert.ifError(err);
        var collection;
        if(req.body.ADMIN == true)
        {
            collection = client.collection('admins');
        }
        else
        {
            collection = client.collection('users');
        }
        var collection = client.collection('allowedhashes');
        ahcollection.find({},{_id:0}).toArray((err,data) => {
            Assert.ifError(err);
            var y = false;
            for(var i = 0; i < data.length; i++)
            {
                if(data[i].hash == req.body.ASSHASH)
                {
                    y = true;
                }
            }
            if(req.body.KEYWORD == CalculatedKeyWord && y) 
            {
                collection.insert({user:req.body.APPHASH}, (err, data) => {
                    Assert.ifError(err);
                    res.send('You have been successfully registered!');
                });
            }
            else
            {
                res.send('Registration denied!');
            }
            CalculatedKeyWord = Math.floor((Math.random() * 100000000) + 1) + Keyword + Math.floor((Math.random() * 100000000) + 1);
            console.log('This session has the keyword set to : ' + CalculatedKeyWord);
        });
        client.close();
    });
});
// DATABASE ROUTER
DatabaseRouter.get('/:userid/:collection', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        Assert.ifError(err);
        var exists = false;
        var acollection = client.collection('admins');
        var ucollection = client.collection('users');
        acollection.find({},{_id:0}).toArray((err, data) => {
            if(data.indexOf(req.params.userid) != -1)
            {
                exists = true;
            }
        });
        ucollection.find({},{_id:0}).toArray((err, data) => {
            if(data.indexOf(req.params.userid) != -1)
            {
                exists = true;
            }
        });
        client.close();
        if(exists)
        {
            databaseClient.connect(DatabasePath, (err, client) => {
                Assert.ifError(err);
                var collection = client.collection(req.params.collection);
                collection.find({},{_id:0}).toArray((err, data) => {
                    res.send(data);
                    client.close();
                });
            });
        }
    });
});

DatabaseRouter.post('/:userid/collection', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        Assert.ifError(err);
        var exists = false;
        var acollection = client.collection('admins');
        var ucollection = client.collection('users');
        acollection.find({},{_id:0}).toArray((err, data) => {
            if(data.indexOf(req.params.userid) != -1)
            {
                exists = true;
            }
        });
        ucollection.find({},{_id:0}).toArray((err, data) => {
            if(data.indexOf(req.params.userid) != -1)
            {
                exists = true;
            }
        });
        client.close();
        if(exists)
        {
            databaseClient.connect(DatabasePath, (err, client) => {
                Assert.equal(null, err);
                var collection = client.collection(req.params.collection);
                collection.insert(req.body, (err, data) => {
                    res.send('Object successfully saved to database (' + req.params.collection + ')');
                });
                client.close();
            });
        }
    });
});

DatabaseRouter.delete('/:userid/collection', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        Assert.ifError(err);
        var exists = false;
        var acollection = client.collection('admins');
        var ucollection = client.collection('users');
        acollection.find({},{_id:0}).toArray((err, data) => {
            if(data.indexOf(req.params.userid) != -1)
            {
                exists = true;
            }
        });
        ucollection.find({},{_id:0}).toArray((err, data) => {
            if(data.indexOf(req.params.userid) != -1)
            {
                exists = true;
            }
        });
        client.close();
        if(exists)
        {
            databaseClient.connect(DatabasePath, (err, client) => {
                Assert.equal(null, err);
                var collection = client.collection(req.params.collection);
                collection.remove({}, (err, data) => {
                    res.send('Object successfully deleted everything in database (' + req.params.collection + ')');
                });
                client.close();
            });
        }
    });
});

Aplication.use('/XZXXY-AUTH/',AuthenticationRouter);
Aplication.use('/XZXXY-DATABASE/',DatabaseRouter);

Aplication.use(function(err, req, res, next){
    var msg = err.message;
    var error = err.error || err;
    var status = err.status || 500;
    res.status(status).json({
        message: msg,
        error: error
    });
});

Aplication.listen(ListenPort, '0.0.0.0', err => {
    if (err) {
        throw err;
    }
    CalculatedKeyWord = Math.floor((Math.random() * 100000000) + 1) + Keyword + Math.floor((Math.random() * 100000000) + 1);
    console.log('This session has the keyword set to : ' + CalculatedKeyWord);
    console.log('Server up and started on port ' + ListenPort);
});




