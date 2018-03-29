module.exports = {
    bundles: {
	clientJavaScript: {
	    main: {
		file: '/js/meadowlark.min.bd300053.js',
		location: 'head',
		contents: [
		    '/js/contact.js',
		    '/js/cart.js',
		]
	    }
	},

	clientCss: {
	    main: {
		file: '/css/meadowlark.min.4d5ee502.css',
		contents: [
		    '/css/main.css',
		    '/css.cart.css',
		]
	    }
	}
    }
}
