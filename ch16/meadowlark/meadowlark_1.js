var express = require('express');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var credentials = require('./credentials.js');
var emailService = require('./lib/email.js')(credentials);
var fs = require('fs');
var Vacation = require('./models/vacation.js');
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');

var app = express();

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

app.set('port', process.env.PORT || 3000);

// use domains for better error handling
app.use(function(req, res, next){
    // 이 요청을 처리할 도메인 생성
    var domain = require('domain').create();
    // 도메인에서 일어난 에러 처리
    domain.on('error', function(err){
	console.error('DOMAIN ERROR CAUGHT\n', err.stack);
	try {
	    // 5초 후에 안전한 셧다운
	    setTimeout(function(){
		console.error('Failsafe shutdown.');
		process.exit(1);
	    }, 5000);

	    // 클러스터 연결 해제
	    var worker = require('cluster').worker;
	    if(worker) worker.disconnect();

	    // 요청을 받은 것을 중지
	    server.close();
	    try {
		// 익스프레스의 에러 라우트 시도
		next(err);
	    } catch(err){
		// 익스프레스 에러 라우트가 실패하면
		// 일반 노드 응답 사용
		console.error('Express error mechanism failed.\n', err.stack);
		res.statusCode = 500;
		res.setHeader('content-type', 'text/plain');
		res.end('Server error.');
	    }
	} catch(err){

	    console.error('Unable to send 500 response.\n', err.stack);
	}
    });

    // 도메인에 요청과 응답 객체 추가
    domain.add(req);
    domain.add(res);

    // 나머지 요청 체인을 도메인에서 처리
    domain.run(next);
});
// 나머지 미들웨어와 라우트을 여기에 입력...


// logging
switch(app.get('env')){
case 'development':
    app.use(require('morgan')('dev'));
    break;
case 'production':
    app.use(require('express-logger')({
	path: __dirname + '/log/requests.log'
    }));
    break;
}

var MongoSessionStore = require('session-mongoose')(require('connect'));
try{
    new MongoSessionStore();
} catch(e) {}
var sessionStore = new MongoSessionStore({
    url: credentials.mongo[app.get('env')].connectionString
});

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
//    store: sessionStore
}));
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({ extended: true }));

// database configuration
var mongoose = require('mongoose');
var opts = {
    server: {
	socketOptions: { keepAlive: 1 }
    }
};
switch(app.get('env')){
case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, opts);
    break;
case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, opts);
    break;
default:
    throw new Error('Unknown execution environment: ' + app.get('env'));
}

// initialize vacation
Vacation.find(function(err, vacations){
    if(err) return console.error(err);
    if(vacations.length) return;

    new Vacation({
	name: 'Hood River Day Trip',
	slug: 'hood-river-day-trip',
	category: 'Day Trip',
	sku: 'HR199',
	description: 'Spend a day sailing on the Columbia and ' +
	    'enjoying craft beers in Hood River!',
	priceInCents: 9995,
	tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
	inSeason: true,
	maximumGuests: 16,
	available: true,
	packagesSold: 0,
    }).save();

    new Vacation({
	name: 'Oregon Coast Getaway',
	slug: 'oregon-coast-getaway',
	category: 'Weekend Getaway',
	sku: '0C39',
	description: 'Enjoy the ocean air and quaint coastal towns!',
	priceInCents: 269995,
	tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
	inSeason: false,
	maximumGuests: 8,
	available: true,
	packagesSold: 0,
    }).save();

    new Vacation({
	name: 'Rock Climbing in Bend',
	slug: 'rock-climbing-in-bend',
	category: 'Adventure',
	sku: 'B99',
	description: 'Experience the thrill of climbing in the high desert.',
	priceInCents: 289995,
	tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing'],
	inSeason: true,
	requiresWaiver: true,
	maximumGuests: 4,
	available: false,
	packagesSold: 0,
	notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});

// flash message middleware
app.use(function(req, res, next){
    // 플래시 메시지가 있다면 콘텍스트에 전달한 다음 지웁니다.
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});


// mocked wether data
app.use(function(req, res, next){
    res.locals.showTests = app.get('env') !== 'production' &&
	req.query.test === '1';
    next();
});

// mocked weather data
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


// middleware to add weather data to context
app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
});

app.use(function(req, res, next){
    var cluster = require('cluster');
    if(cluster.isWorker) console.log('Worker %d received request',
				     cluster.worker.id);
    next();
});

var vhost = require('vhost');
// admin 서브도메인을 만듭니다. 이 코드는 다른 라우트보다 앞에 있어야 합니다.
var admin = express.Router();
app.use(vhost('admin.*', admin));

// admin 라우트를 만듭니다. 이 코드의 위치는 상관없습니다.
admin.get('/', function(req, res){
    res.render('admin/home');
});
admin.get('/users', function(req, res){
    res.render('admin/users');
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

// 디렉토리가 존재하는지 확인하고 없으면 만듭니다.
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSyc(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
    // TODO 이 부분은 나중에 완성합니다.
}

app.post('/contest/vacation-photo/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
	if(err) return res.redirect(303, '/error');
	if(err) {
	    res.session.flash = {
		type: 'danger',
		intro: 'Oops!',
		message: 'There was an error processing your submission.' +
		    'Please try again.',
	    };
	    return res.redirect(303, '/contest/vacation-photo');
	}
	var photo = files.photo;
	var dir = vacationPhotoDir + '/' + Date.now();
	var path = dir + '/' + photo.name;
	fs.mkdirSync(dir);
	fs.renameSync(photo.path, dir + '/' + photo.name);
	saveContestEntry('vacation-photo', fields.email,
	    req.params.year, req.params.month, path);
	req.session.flash = {
	    type: 'success',
	    intro: 'Good luck!',
	    message: 'You have been entered into the contest.',
	};
	return res.redirect(303, '/contest/vacation-photo/entries');
    });
});

// /cart/add 라우트는 저장소 파일을 참고

app.get('/vacations', function(req, res){
    Vacation.find({ available: true }, function(err, vacations){
	var currency = req.session.currency || 'USD';
	var context = {
	    currency: currency,
	    vacations: vacations.map(function(vacation){
		return {
		    sku: vacation.sku,
		    name: vacation.name,
		    description: vacation.description,
		    inSeason: vacation.inSeason,
		    price: convertFromUSD(vacation.priceInCents/100, currency),
		    qty: vacation.qty,
		}
	    })
	};
	switch(currency){
	case 'USD': context.currencyUSD = 'selected'; break;
	case 'GBP': context.currencyGBP = 'selected'; break;
	case 'BTC': context.currencyBTC = 'selected'; break;
	}
	res.render('vacations', context);
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

app.get('/notify-me-when-in-season', function(req, res){
    res.render('notify-me-when-in-season', { sku: req.query.sku });
});

app.post('/notify-me-when-in-season', function(req, res){
    VacationInSeasonListener.update(
	{ email: req.body.email },
	{ $push: { skus: req.body.sku } },
	{ upsert: true },
	function(err){
	    if(err) {
		console.error(err.stack);
		req.session.flash = {
		    type: 'danger',
		    intro: 'Ooops!',
		    message: 'There was an errr processing your request.',
		};
		return res.redirect(303, '/vacations');
	    }
	    req.session.flash = {
		type: 'success',
		intro: 'Thank you!',
		message: 'You will be notified when this vacation is in season.',
	    };
	    return res.redirect(303, '/vacations');
	}
    );
});

app.get('/set-currency/:currency', function(req, res){
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');
});
function convertFromUSD(value, currency){
    switch(currency){
    case 'USD': return value * 1;
    case 'GBP': return value * 0.6;
    case 'BTC': return value * 0.0023707918444761;
    default: return NaN;
    }
}

app.get('/fail', function(req, res){
    throw new Error('Nope!');
});

app.get('/epic-fail', function(req, res){
    process.nextTick(function(){
	throw new Error('Kaboom!');
    });
});

app.get('/foo', function(req, res, next){
    if(Math.random() < 0.5) return next();
    res.send('sometimes this');
});
app.get('/foo', function(req, res){
    res.send('and sometimes that');
});

app.get('/foo2',
	function(req, res, next){
	    if(Math.random() < 0.33) return next();
	    res.send('red');
	},
	function(req, res, next){
	    if(Math.random() < 0.5) return next();
	    res.send('green');
	},
	function(req, res){
	    res.send('blue');
	}
       );

function specials(req, res, next){
    res.locals.specials = getSpecialsFromDatabase();
    next();
}

app.get('/page-with-specials', function(req,res){
    res.render('page-with-specials');
});

function authorize(req, res, next){
    if(req.session.authorized) return next();
    res.render('not-authorized');
}

app.get('/secret', authorize, function(req,res){
    res.render('secret');
})

app.get('/sub-rosa', authorize, function(req,res){
    res.render('sub-rosa');
});

app.get('/user(name)?', function(req,res){
    res.render('user');
});

app.get('/khaa+n', function(req,res){
    res.render('khaaan');
});

app.get(/crazy|mad(ness)?|lunacy/, function(req,res){
    res.render('madness');
});

var staff = {
    mitch: { bio: 'Mitch is the man to have at your back in a bar fight.' },
    madeline: { bio: 'Madeline is our Oregon expert.' },
    walt: { bio: 'Walt is our Oregon Coast expert.' },
};
app.get('/staff/:name', function(req, res){
    var info = staff[req.params.name];
    if(!info) return next();        // 마지막엔 404가 될 겁니다.
    res.render('staffer', {'info':info});
})

var staff = {
    portland: {
	mitch: { bio: 'Mitch is the man to have at your back in a bar fight.' },
	madeline: { bio: 'Madeline is our Oregon expert.' },
    },
    bend: {
	walt: { bio: 'Walt is our Oregon Coast expert.' },
    },
};  
app.get('/staff/:city/:name', function(req, res){
    var info = staff[req.params.city][req.params.name];
    if(!info) return next();        // 마지막엔 404가 될 겁니다.
    res.render('staffer', {'info':info});
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

function startServer() {
    app.listen(app.get('port'), function(){
	console.log( 'Express started in ' + app.get('env') +
		     ' mode on http://localhost:' +	app.get('port') +
		     '; press Ctrl-C to terminate.');
    });
}
if(require.main === module){
    // 애플리케이션은 앱 서버를 시동해 직접 실행됩니다.
    startServer();
} else {
    // require를 통해 애플리케이션을 모듈처럼 가져옵니다.
    // 함술ㄹ 반환해서 서버를 생성합니다.
    module.exports = startServer;
}
