module.exports = {
    cookieSecret: 'your cookie secret goes here',
    gmail: {
	user: 'your gmail username',
	password: 'your gmail password',
    },
    mongo: {
	development: {
	    connectionString: 'your_dev_connection_string',
	},
	production: {
	    connectionString: 'your_production_connection_string',
	}
    },

    authProviders: {
	facebook: {
	    development: {
		appId: 'your_app_id',
		appSecret: 'your_app_secret',
	    },
	},
	google: {
	    development: {
		clientID: 'your_client_id',
		clientSecret: 'you_client_secret',
	    },
	},
    },
};
