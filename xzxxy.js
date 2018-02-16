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
const DatabasePath = process.env.MONGODB_PATH;
// DBPATH set in enviroment variables
const AuthenticationDatabaseName = 'xzxxy-auth';
// collections : users, admins, allowedhashes
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
    authenticationClient.connect(DatabasePath, (err, client) => {
        Assert.ifError(err);
        var DB = client.db(AuthenticationDatabaseName);
        var collection = DB.collection('allowedhashes');
        console.log(req.body);
        if(req.body.KEYWORD == CalculatedKeyWord)
        {
            collection.findOneAndUpdate({name:"hashesArray"},{$push:{hashes:req.body.ASSHASH}}, (err,data) => {
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
    authenticationClient.connect(DatabasePath, (err, client) => {
        Assert.ifError(err);
        var DB = client.db(AuthenticationDatabaseName);
        var collection = DB.collection('allowedhashes');
        console.log(req.body);
        // add first check to see if is already registered
        collection.find({name:"hashesArray"},{_id:0,name:0,hashes:1}, (err,data) => {
            var ASSHASH = req.body.ASSHASH;
            var y = false;
            foreach(x in data)
            {
                if(x == ASSHASH)
                {
                    y = true;
                }
            }
            if(y)
            {
                res.send(CalculatedKeyWord);
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
    authenticationClient.connect(DatabasePath, (err, client) => {
        Assert.ifError(err);
        var DB = client.db(AuthenticationDatabaseName);
        var collection;
        console.log(req.body);
        if(req.body.ADMIN == true)
        {
            collection = db.collection('admins');
        }
        else
        {
            collection = db.collection('users');
        }
        var ahcollection = db.collection('allowedhashes');
        ahcollection.find({name:"hashesArray"},{_id:0,name:0,hashes:1}, (err,data) => {
            var y = false;
            foreach(x in data)
            {
                if(x == req.body.ASSHASH)
                {
                    y = true;
                }
            }
            if(req.body.KEYWORD == CalculatedKeyWord && y) 
            {
                collection.insert(req.body.APPHASH, (err, data) => {
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
    authenticationClient.connect(DatabasePath, (err, client) => {
        Assert.ifError(err);
        var DB = client.db(AuthenticationDatabaseName);
        var exists = false;
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
                Assert.ifError(err);
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
    authenticationClient.connect(DatabasePath, (err, client) => {
        Assert.ifError(err);
        var DB = client.db(AuthenticationDatabaseName);
        var exists = false;
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
                Assert.equal(null, err);
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
    authenticationClient.connect(DatabasePath, (err, client) => {
        Assert.ifError(err);
        var DB = client.db(AuthenticationDatabaseName);
        var exists = false;
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
                Assert.equal(null, err);
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




