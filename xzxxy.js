const MongoDB = require('mongodb').MongoClient;
const Express = require('express');
const Aplication = Express();
var AuthenticationRouter = Express.Router();
var DatabaseRouter = Express.Router();
const Parser = require('body-parser');
const PackageFile = require('./package.json');

const ListenPort = process.env.Port || 3000;
const DatabasePath = 1; // waiting 
const AuthenticationDatabaseName = 'xzxxy-auth';
// collections : users, admins, allowedhashes
const DatabaseName = 'xzxxy-database';

Aplication.use(Parser.urlencoded({
    extended: true
}));
Aplication.use(Parser.json());

// AUTH ROUTER
AuthenticationRouter.post('/', (req, res, next) => {
    console.log('auth request!');
});
// DATABASE ROUTER
DatabaseRouter.get('/:userid/:collection', (req, res, next) => {
    console.log('get database request!');
});
DatabaseRouter.post('/:userid/collection', (req, res, next) => {
    console.log('post database request!');
});
DatabaseRouter.delete('/:userid/collection', (req, res, next) => {
    console.log('delete database request!');
});

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
    console.log('Server up and started on port ' + ListenPort);
});




