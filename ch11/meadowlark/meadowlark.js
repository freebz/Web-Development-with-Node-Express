var express = require('express');

var fortune = require('./lib/fortune.js');

var formidable = require('formidable');

var credentials = require('./credentials.js');

var nodemailer = require('nodemailer');

var emailService = require('./lib/email.js')(credentials);
emailService.send('joecustomer@gmail.com', 'Hod River tours on sale today!',
		  'Get \'em while they\'re hot!');

var mailTransport = nodemailer.createTransport( 'SMTP', {
    //service: 'Gmail',
    host: 'smtp.meadowlarktravelcom',
    port: 465,    
    auth: {
	user: credentials.gmail.user,
	pass: credentials.gmail.password,
    }
});

mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'joecustomer@gmail.com, "Jane Customer" <jane@yahoo.com>, ' +
	'fred@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with ' +
	'Meadowlark Travel.  <b>We look forward to your visit!</b>',
    text: 'Thank you for booking your trip with Meadowlark Travel. ' +
	'We look forward to your visit!',
}, function(err){
    if(err) console.error( 'Unable to send email: ' + err );
});

mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'joecustomer@gmail.com, "Jane Customer" <jane@yahoo.com>, ' +
	'fred@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with ' +
	'Meadowlark Travel.  <b>We look forward to your visit!</b>',
    generateTextFromHtml: true,
}, function(err){
    if(err) console.error( 'Unable to send email: ' + err );
});


// largeRecipientList는 이메일 주소 배열입니다.
/*
for (var i=0; i < largeRecipientList.length/recipientLimit; i++) {
    mailTransport.sendMail({
	from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
	to: largeRecipientList
	    .slice(i * recipientLimit, i * (recipientLimit + 1)).join(','),
	subject: 'Special price on Hood River travel package!',
	text: 'Book your trip to scenic Hood River now!',
    }, function(err){
	if(err) console.error( 'Unable to send email: ' + err );
    });
}
*/

var app = express();

app.set('port', process.env.PORT || 3000);

/*
app.use(function(req, res, next){
    console.log('processing request for "' + req.url + '"...');
    next();
});

app.use(function(req, res, next){
    console.log('terminating request');
    res.send('thanks for playing!');
    // next()를 호출하지 않았으므로 요청은 여기서 종료됩니다.
});

app.use(function(req, res, next){
    console.log('whoops, i\'ll never get called!');
});
*/

app.use(express.static(__dirname + '/public'));

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret
}));

app.use(function(req, res, next){
    // 플래시 메시지가 있다면 콘텍스트에 전달한 다음 지웁니다.
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});


// 핸들바 뷰 엔진 설정
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
	section: function(name, options){
	    if(!this._sections) this._sections = {};
	    this._sections[name] = options.fn(this);
	    return null;
	}
    }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(function(req, res, next){
    res.locals.showTests = app.get('env') !== 'production' &&
	req.query.test === '1';
    next();
});

app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
});

app.get('/', function(req, res){
    res.render('home');
});
app.get('/about', function(req, res){
    res.render('about', {
	fortune: fortune.getFortune(),
	pageTestScript: '/qa/tests-about.js'
    } );
});
app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
});
app.get('/headers', function(req,res){
    res.set('Content-Type', 'text/plain');
    var s = '';
    for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
    res.send(s);
});

app.disable('x-bowered-by');

app.get('/jquery-test', function(req,res){
    res.render('jquery-test');
});

app.get('/nursery-rhyme', function(req, res){
    res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
    res.json({
	animal: 'squirrel',
	bodyPart: 'tail',
	adjective: 'bushy',
	noun: 'heck',
    });
});


app.use(require('body-parser').urlencoded({ extended: true }));

app.get('/newsletter', function(req, res){
    // CSRF에 대해서는 나중에 배웁니다.
    // 지금은 일단 가짜 값을 쓰겠습니다.
    res.render('newsletter', { csrf: 'CSRF token goes here' });
});

// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
// 위 문서에 있는 W3C HTML5 공식 이메일 정규 표현식을 살짝 바꾼 겁니다.
var VALID_EMAIL_REGEX = new RegExp(
    '^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
    '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
    '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-z0-9])?)+$'
);

app.post('/newsletter', function(req, res){
    var name = req.body.name || '', email = req.body.email || '';
    // 입력 유효성 검사
    if(!email.match(VALID_EMAIL_REGEX)) {
	if(req.xhr) return res.json({ error: 'Invalid name email address.' });
	req.session.flash = {
	    type: 'danger',
	    intro: 'Validation error!',
	    message: 'The email address you entered was not valid.',
	};
	return res.redirect(303, '/newletter/archive');
    }
    // NewsletterSignup은 독자 여러분이 만들게 될 객체 예제입니다.
    // 프로젝트에 따라 정확한 구현 내용이나 인테페이스는 모두
    // 달라질 테고 그건 여러분의 몫입니다.
    // 일반적인 익스프레스 프로그램이 어떤 모양인지 참고만 하십시오.
    new NewsletterSignup({ name: name, email: email }).save(function(err){
	if(err) {
	    if(req.xhr) return res.join({ error: 'Database error.' });
	    req.session.flash = {
		type: 'danger',
		intro: 'Database error!',
		message: 'There was a database error; please try again later.',
	    }
	    return res.redirect(303, '/newsletter/archive');
	}
	if(req.xhr) return res.json({ success: true });
	res.session.flash = {
	    type: 'success',
	    intro: 'Thank you!',
	    message: 'You have now been signed up for the newsletter.',
	};
	return res.redirect(303, '/newsletter/archive');
    });
});


app.post('/process', function(req, res){
    if(req.xhr || req.accepts('json,html')==='json'){
	res.send({ success: true });
	// (에러가 있다면 { error: 'error description' }을 보냅니다)
    } else {
	res.redirect(303, '/thank-you');
	// (에러가 있다면 에러 페이지로 리다이렉트합니다)
    }
});

app.get('/contest/vacation-photo', function(req, res){
    var now = new Date();
    res.render('contest/vacation-photo', {
	year: now.getFullYear(), month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
	if(err) return res.redirect(303, '/error');
	console.log('received fields:');
	console.log(fields);
	console.log('received files:');
	console.log(files);
	res.redirect(303, '/thank-you');
    });
});


app.use(require('./lib/requiresWaiver.js'));


var cartValidation = require('./lib/cartValidation.js');

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);


app.get('/cart/checkout', function(req, res, next) {
    var cart = req.session.cart;
    if(!cart) next();
    res.render('cart-checkout');
});

app.post('/cart/checkout', function(req, res){
    var cart = req.session.cart;
    if(!cart) next(new Error('Cart does not exist.'));
    var name = req.body.name || '', email = req.body.email || '';
    // 유효성 검사
    if(!email.match(VALID_EMAIL_REGEX))
	return res.next(new Error('Invalid email address.'));
    // 랜덤한 장바구니 ID를 부여합니다. 실무라면 데이터베이스 ID를 섰을 겁니다.
    cart.number = Math.random().toString().replace(/^0\.0*/, '');
    cart.billing = {
	name: name,
	email: email,
    };
    res.render('email/cart-thank-you',
	{ layout: null, cart: cart }, function(err,html){
	    if( err ) console.log('error in email template');
	    mailTransport.sendMail({
		from: '"Meadowlark Travel": info@meadowlarktravel.com',
		to: cart.billing.email,
		subject: 'Thank You for Book your Trip with Meadowlark',
		html: html,
		generateTextFromHtml: true
	    }, function(err){
		if(err) console.error('Unable to send confirmation: '
				      + err.stack);
	    });
	}
    );
    res.render('cart-thank-you', { cart: cart });
});
		
								

// 커스텀 404 페이지
app.use(function(req, res){
    res.status(404);
    res.render('404');
});

// 커스텀 500 페이지
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log( 'Express started on http://localhost:' +
		 app.get('port') + '; press Ctrl-C to terminate.');
});



function getWeatherData(){
    return {
	locations: [
	    {
		name: 'Portland',
		forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
		iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
		weather: 'Overcast',
		temp: '54.1 F (12.3 C)',
	    },
	    {
		name: 'Bend',
		forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
		iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
		weather: 'Partly Cloudy',
		temp: '55.0 F (12.8 C)',
	    },
	    {
		name: 'Manzanita',
		forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
		iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
		weather: 'Light Rain',
		temp: '55.0 F (12.8 C)',
	    },
	],
    };
}
