module.exports = {
    cookieSecret: 'your cookie secret goes here',
    gmail: {
	user: 'your gmail username',
	password: 'your gmail password',
    },
    mongo: {
	development: {
	    //connectionString: 'your_dev_connection_string',
	    connectionString: 'mongodb://dbuser:dbpassword@ds239557.mlab.com:39557/node',
	},
	production: {
	    connectionString: 'your_production_connection_string',
	}
    }
};
