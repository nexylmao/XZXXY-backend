const Assert = require('assert');
const databaseClient = require('mongodb').MongoClient;
const authenticationClient = require('mongodb').MongoClient;
const Express = require('express');
const Parser = require('body-parser');

const Aplication = Express(); // eslint-disable-line new-cap
const AuthenticationRouter = Express.Router(); // eslint-disable-line new-cap
const DatabaseRouter = Express.Router(); // eslint-disable-line new-cap

const Keyword = process.env.KEYWORD;
let CalculatedKeyWord;
const ListenPort = process.env.PORT || 3000;
// DBPATH set in enviroment variables
const AuthenticationDatabasePath = process.env.MONGODB_PATH;
const AuthDatabase = 'xzxxy-auth';
// Collections : users, admins, allowedhashes
const DatabasePath = process.env.MONGODB_PATH;
const DatabaseName = 'xzxxy-database';
// Collections - for every class there's one

Aplication.use(Parser.urlencoded({
	extended: true
}));
Aplication.use(Parser.json());

// AUTH ROUTER
AuthenticationRouter.get('/WriteKeyword', (req, res) =>
{
	console.log('This session has the keyword set to : ' + CalculatedKeyWord);
	res.send('Wrote the keyword to server console!');
});
AuthenticationRouter.post('/Hash', (req, res) =>
{
	authenticationClient.connect(AuthenticationDatabasePath, (err, client) =>
	{
		if (err)
		{
			res.send('Application could not connection to the database!');
			Assert.ifError(err);
		}
		const DB = client.db(AuthDatabase);
		const collection = DB.collection('allowedhashes');
		const acollection = DB.collection('admins');
		acollection.findOne({user: req.body.APPHASH}, (err, users) =>
		{
			if (err)
			{
				res.send('An error occured while reading the admins database!');
				Assert.ifError(err);
			}
			try
			{
				if (users.user === req.body.APPHASH && CalculatedKeyWord === req.body.KEYWORD)
				{
					collection.findOne({hash: req.body.ASSHASH},
					(err, data) =>
					{
						if (err)
						{
							res.send('An error occured while reading the allowedhashes database!');
							Assert.ifError(err);
						}
						try
						{
							if (data.hash === req.body.ASSHASH)
							{
								res.send('The hash is already in the database!');
							}
						}
						catch (err)
						{
							collection.insertOne({hash: req.body.ASSHASH}, err =>
							{
								if (err)
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
					if (CalculatedKeyWord !== req.body.KEYWORD || CalculatedKeyWord !== req.body.KEYWORD)
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
				if (CalculatedKeyWord !== req.body.KEYWORD || CalculatedKeyWord !== req.body.KEYWORD)
				{
					res.send('The keyword you\'re trying to send is not correct!');
				}
				else
				{
					res.send('User that is trying to submit is not registered/admin!');
				}
				client.close();
			}
		});
	});
});

AuthenticationRouter.post('/FirstStep', (req, res) =>
{
	authenticationClient.connect(AuthenticationDatabasePath, (err, client) =>
	{
		if (err)
		{
			res.send('There was an error while connecting to the database!');
			Assert.ifError(err);
		}
		const DB = client.db(AuthDatabase);
		const collection = DB.collection('allowedhashes');
		collection.findOne({hash: req.body.ASSHASH},
		(err, data) =>
		{
			if (err)
			{
				res.send('There was an error while querying the hashes database!');
				Assert.ifError(err);
			}
			try
			{
				if (data.hash === req.body.ASSHASH)
				{
					const ucollection = DB.collection('users');
					ucollection.findOne({user: req.body.APPHASH},
					(err, data) =>
					{
						if (err)
						{
							res.send('Error showed up while searching for the user!');
							Assert.ifError(err);
						}
						try
						{
							if (data.user === req.body.APPHASH)
							{
								res.send('You already exist as an user!');
								client.close();
							}
						}
						catch (err)
						{
							const acollection = DB.collection('admins');
							acollection.findOne({user: req.body.APPHASH}, {_id: 0},
								(err, data) =>
								{
									if (err)
									{
										res.send('Error showed up while searching for the admin!');
										Assert.ifError();
									}
									try
									{
										if (data.user === req.body.APPHASH)
										{
											res.send('You already exist as an admin!');
											client.close();
										}
									}
									catch (err)
									{
										res.send(CalculatedKeyWord);
										client.close();
									}
								}
							);
						}
					});
				}
			}
			catch (err)
			{
				res.send('Registration denied!');
				client.close();
			}
		});
	});
});
AuthenticationRouter.post('/SecondStep', (req, res) =>
{
	authenticationClient.connect(AuthenticationDatabasePath, (err, client) =>
	{
		if (err)
		{
			res.send('There was an error while connecting to the database!');
			Assert.ifError(err);
		}
		const DB = client.db(AuthDatabase);
		const ahcollection = DB.collection('allowedhashes');
		let collection;
		if (req.body.ADMIN === true)
		{
			collection = DB.collection('admins');
		}
		else
		{
			collection = DB.collection('users');
		}
		ahcollection.findOne({hash: req.body.ASSHASH},
			(err, data) =>
			{
				if (err)
				{
					res.send('There was an error while querying the hash!');
					Assert.ifError(err);
				}
				try
				{
					if (data.hash === req.body.ASSHASH && req.body.KEYWORD === CalculatedKeyWord)
					{
						collection.insert({user: req.body.APPHASH}, () =>
						{
							res.send('You have been successfully registered!');
						});
					}
				}
				catch (err)
				{
					res.send('Registration denied!');
				}
				CalculatedKeyWord = Math.floor((Math.random() * 100000000) + 1) + Keyword + Math.floor((Math.random() * 100000000) + 1);
				console.log('This session has the keyword set to : ' + CalculatedKeyWord);
				client.close();
			});
	});
});
// DATABASE ROUTER
DatabaseRouter.get('/:userid/:collection', (req, res) =>
{
	authenticationClient.connect(AuthenticationDatabasePath, (err, client) =>
	{
		if (err)
		{
			res.send('An error occured while connecting to the authentication database!');
			Assert.ifError(err);
		}
		const DB = client.db(AuthDatabase);
		const acollection = DB.collection('admins');
		const ucollection = DB.collection('users');
		acollection.findOne({user: req.body.APPHASH}, (err, data) =>
		{
			if (err)
			{
				res.send('An error occured while querying the admin database!');
				Assert.ifError(err);
			}
			try
			{
				if (data.user === req.body.APPHASH)
				{
					databaseClient.connect(DatabasePath, (err, client) =>
					{
						if (err)
						{
							res.send('An error occued while connecting to the database!');
							Assert.ifError(err);
						}
						const DB = client.db(DatabaseName);
						const collection = DB.collection(req.params.collection);
						collection.find({}, {_id: 0}).toArray((err, data) =>
						{
							if (err)
							{
								res.send('An error occured while querying the database!');
								Assert.ifError(err);
							}
							res.send(data);
						});
						client.close();
					});
				}
				client.close();
			}
			catch (err)
			{
				ucollection.findOne({user: req.body.APPHASH}, (err, data) =>
				{
					if (err)
					{
						res.send('An error occured while querying the user database!');
						Assert.ifError(err);
					}
					try
					{
						if (data.user === req.body.APPHASH)
						{
							databaseClient.connect(DatabasePath, (err, client) =>
							{
								if (err)
								{
									res.send('An error occured while querying the database!');
									Assert.ifError(err);
								}
								const DB = client.db(DatabaseName);
								const collection = DB.collection(req.params.collection);
								collection.find({}, {_id: 0}).toArray((err, data) =>
								{
									if (err)
									{
										res.send('An error occured while querying the database!');
										Assert.ifError(err);
									}
									res.send(data);
								});
								client.close();
							});
						}
						client.close();
					}
					catch (err)
					{
						res.send('The user doesn\' exist! Request denied!');
						client.close();
					}
				});
			}
		});
	});
});

DatabaseRouter.post('/:userid/collection', (req, res) =>
{
	authenticationClient.connect(AuthenticationDatabasePath, (err, client) =>
	{
		if (err)
		{
			res.send('An error occured while querying the database!');
			Assert.ifError(err);
		}
		const DB = client.db(AuthDatabase);
		const acollection = DB.collection('admins');
		const ucollection = DB.collection('users');
		acollection.findOne({user: req.body.APPHASH},
		(err, data) =>
		{
			if (err)
			{
				res.send('An error occured while querying the database!');
				Assert.ifError(err);
			}
			try
			{
				if (data.user === req.body.APPHASH)
				{
					databaseClient.connect(DatabasePath, (err, client) =>
					{
						if (err)
						{
							res.send('An error occured while querying the database!');
							Assert.ifError(err);
						}
						const DB = client.db(DatabaseName);
						const collection = DB.collection(req.params.collection);
						collection.insert(req.body, err =>
						{
							if (err)
							{
								res.send('An error occured while querying the database!');
								Assert.ifError(err);
							}
							res.send('Object successfully saved to database (' + req.params.collection + ')');
						});
						client.close();
					});
					client.close();
				}
			}
			catch (err)
			{
				ucollection.findOne({user: req.body.APPHASH},
				(err, data) =>
				{
					if (err)
					{
						res.send('An error occured while querying the database!');
						Assert.ifError(err);
					}
					try
					{
						if (data.user === req.body.APPHASH)
						{
							databaseClient.connect(DatabasePath, (err, client) =>
							{
								if (err)
								{
									res.send('An error occured while querying the database!');
									Assert.ifError(err);
								}
								const DB = client.db(DatabaseName);
								const collection = DB.collection(req.params.collection);
								collection.insert(req.body, err =>
								{
									if (err)
									{
										res.send('An error occured while querying the database!');
										Assert.ifError(err);
									}
									res.send('Object successfully saved to database (' + req.params.collection + ')');
								});
								client.close();
							});
						}
						client.close();
					}
					catch (err)
					{
						res.send('Couldn\'t find your user! Query denied!');
						client.close();
					}
				});
			}
		});
	});
});

DatabaseRouter.delete('/:userid/collection', (req, res) =>
{
	authenticationClient.connect(AuthenticationDatabasePath, (err, client) =>
	{
		if (err)
		{
			res.send('An error occured while querying the database!');
			Assert.ifError(err);
		}
		const DB = client.db(AuthDatabase);
		const acollection = DB.collection('admins');
		const ucollection = DB.collection('users');
		acollection.find({user: req.body.APPHASH},
		(err, data) =>
		{
			if (err)
			{
				res.send('An error occured while querying the database!');
				Assert.ifError(err);
			}
			try
			{
				if (data.user === req.body.APPHASH)
				{
					databaseClient.connect(DatabasePath, (err, client) =>
					{
						if (err)
						{
							res.send('An error occured while connecting to the database!');
							Assert.ifError(err);
						}
						const DB = client.db(DatabaseName);
						const collection = DB.collection(req.params.collection);
						collection.remove({}, err =>
						{
							if (err)
							{
								res.send('An error occured while querying the database!');
								Assert.ifError(err);
							}
							res.send('Object successfully deleted everything in database (' + req.params.collection + ')');
						});
						client.close();
					});
				}
				client.close();
			}
			catch (err)
			{
				ucollection.find({user: req.body.APPHASH},
				(err, data) =>
				{
					if (err)
					{
						res.send('An error occured while querying the database!');
						Assert.ifError(err);
					}
					try
					{
						if (data.user === req.body.APPHASH)
						{
							databaseClient.connect(DatabasePath, (err, client) =>
							{
								if (err)
								{
									res.send('An error occured while connecting to the database!');
									Assert.ifError(err);
								}
								const DB = client.db(DatabaseName);
								const collection = DB.collection(req.params.collection);
								collection.remove({}, err =>
								{
									if (err)
									{
										res.send('An error occured while querying the database!');
										Assert.ifError(err);
									}
									res.send('Object successfully deleted everything in database (' + req.params.collection + ')');
								});
								client.close();
							});
						}
						client.close();
					}
					catch (err)
					{
						res.send('Couldn\'t find your user! Query denied!');
						client.close();
					}
				});
			}
		});
	});
});

Aplication.use('/XZXXY-AUTH/', AuthenticationRouter);
Aplication.use('/XZXXY-DATABASE/', DatabaseRouter);

Aplication.use((err, req, res) =>
{
	const msg = err.message;
	const error = err.error || err;
	const status = err.status || 500;
	res.status(status).json({
		message: msg,
		error
	});
});

Aplication.listen(ListenPort, '0.0.0.0', err =>
{
	if (err)
	{
		throw err;
	}
	CalculatedKeyWord = Math.floor((Math.random() * 100000000) + 1) + Keyword + Math.floor((Math.random() * 100000000) + 1);
	console.log('This session has the keyword set to : ' + CalculatedKeyWord);
	console.log('Server up and started on port ' + ListenPort);
});
