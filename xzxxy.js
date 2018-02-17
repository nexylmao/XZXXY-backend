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
const AuthenticationDatabasePath = process.env.MONGODB_PATH;
const AuthDatabase = 'xzxxy-auth';
// collections : users, admins, allowedhashes
const DatabasePath = process.env.MONGODB_PATH;
const DatabaseName = 'xzxxy-database';
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
        if(err)
        {
            res.send('Application could not connection to the database!');
            Assert.ifError(err);
        }
        var DB = client.db(AuthDatabase);
        var collection = DB.collection('allowedhashes');
        var acollection = DB.collection('admins');
        acollection.findOne({user:req.body.APPHASH}, (err,users) => {
            if(err)
            {
                res.send('An error occured while reading the admins database!');
                Assert.ifError(err);
            }
            try
            {
                if(users.user === req.body.APPHASH && CalculatedKeyWord == req.body.KEYWORD)
                {
                    collection.find({hash:req.body.ASSHASH}).toArray((err, data) => {
                        if(err)
                        {
                            res.send('An error occured while reading the allowedhashes database!');
                            Assert.ifError(err);
                        }
                        console.log(data);
                        console.log(typeof data);
                        try
                        {
                            if(data[0].hash === req.body.ASSHASH)
                            {
                                res.send('The hash is already in the database!');
                            }
                        }
                        catch (err)
                        {
                            collection.insertOne({hash:req.body.ASSHASH}, err => {
                                if(err)
                                {
                                    res.send('An error occured while inserting the new hash!');
                                    Assert.ifError(err);
                                }
                                res.send('Successfully added the hash to database!');
                            });
                        }
                        client.close();
                    });
                }
                else
                {
                    if(CalculatedKeyWord !== req.body.KEYWORD || CalculatedKeyWord != req.body.KEYWORD)
                    {
                        res.send('The keyword you\'re trying to send is not correct!');
                    }
                    else
                    {
                        res.send('Could not add the hash to database!');
                    }
                    client.close();
                }
            }
            catch (err)
            {
                res.send('User that is trying to submit is not registered/admin!');
                client.close();
            }
        });
    });
});
AuthenticationRouter.post('/FirstStep', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        var DB = client.db(AuthDatabase);
        var collection = DB.collection('allowedhashes');
        collection.findOne({hash:req.body.ASSHASH}, (err,data) => {
            console.log(data);
            if(data.hash === req.body.ASSHASH)
            {
                var ucollection = DB.collection('users');
                var acollection = DB.collection('admins');
                ucollection.findOne({user:req.body.APPHASH}, (err,user) => {
                    if(user.user === req.body.APPHASH)
                    {
                        console.log(user);
                        res.send("You already exist as an user!");
                    }
                    else
                    {
                        acollection.findOne({user:req.body.APPHASH},{_id:0})
                        {
                            (err,users) => {
                                if(users === req.body.APPHASH)
                                {
                                    console.log(users);
                                    res.send("You already exist as an admin!");

                                }
                                else
                                {
                                    res.send(CalculatedKeyWord);
                                }
                            };
                        } 
                    }
                });
            }
            else
            {
                res.send("Registration denied!");
            }
            client.close();
        });
    });
});
AuthenticationRouter.post('/SecondStep', (req, res, next) => {
    authenticationClient.connect(AuthenticationDatabasePath, (err, client) => {
        var DB = client.db(AuthDatabase);
        var collection;
        if(req.body.ADMIN == true)
        {
            collection = DB.collection('admins');
        }
        else
        {
            collection = DB.collection('users');
        }
        var ahcollection = DB.collection('allowedhashes');
        ahcollection.find({},{_id:0}).toArray((err,data) => {
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
        var exists = false;
        var DB = client.db(AuthDatabase);
        var acollection = DB.collection('admins');
        var ucollection = DB.collection('users');
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
                var DB = client.db(DatabaseName);
                var collection = DB.collection(req.params.collection);
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
        var exists = false;
        var DB = client.db(AuthDatabase);
        var acollection = DB.collection('admins');
        var ucollection = DB.collection('users');
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
                var DB = client.db(DatabaseName);
                var collection = DB.collection(req.params.collection);
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
        var exists = false;
        var DB = client.db(AuthDatabase);
        var acollection = DB.collection('admins');
        var ucollection = DB.collection('users');
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
                var DB = client.db(DatabaseName);
                var collection = DB.collection(req.params.collection);
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
