var https = require('https'),
    express = require('express'),
    formidable = require('formidable'),
    fs = require('fs'),
    Vacation = require('./models/vacation.js');

var app = express();

var credentials = require('./credentials.js');

var emailService = require('./lib/email.js')(credentials);

// 핸들바 뷰 엔진 설정
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
	section: function(name, options){
	    if(!this._sections) this._sections = {};
	    this._sections[name] = options.fn(this);
	    return null;
	},
	static: function(name) {
	    return require('./lib/static.js').map(name);
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
try{ new MongoSessionStore(); } catch(e) {}
var sessionStore = new MongoSessionStore({ url: credentials.mongo[app.get('env')].connectionString });

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: sessionStore
}));
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({ extended: true }));

// 이 코드는 body-parser, cookie-parser, express-session 연결 다음에 와야 합니다.
app.use(require('csurf')());
app.use(function(req, res, next){
    res.locals._csrfToken = req.csrfToken();
    next();
});

// database configuration
var mongoose = require('mongoose');
var options = {
    server: {
	socketOptions: { keepAlive: 1 }
    }
};
switch(app.get('env')){
case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, options);
    break;
case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, options);
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

// middleware to handle logo image easter eggs
var static = require('./lib/static.js').map;

app.use(function(req, res, next){
    var now = new Date();
    res.locals.logoImage = now.getMonth()==11 && now.getDate()==19 ?
	static('/img/logo_bud_clark.png') :
	static('/img/logo.png');
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

app.use(require('cors')());
app.use('/api', require('cors')());


// add routes
require('./routes.js')(app);

// api

var rest = require('connect-rest');

// rest.VERB로 API 라우트들을 여기 정의합니다...

// API 설정

var Attraction = require('./models/attraction.js');

var apiOptions = {
    context: '/api',
    domain: require('domain').create(),
};

apiOptions.domain.on('error', function(err){
    console.log('API domain error.\n', err.stack);
    setTimeout(function(){
	console.log('Server shutting down after API domain error.');
	process.exit(1);
    }, 5000);
    server.close();
    var worker = require('cluster').worker;
    if(worker) worker.disconnect();
});

// API를 파이프라인에 연결합니다.
// app.use(rest.rester(apiOptions));
app.use(vhost('api.*', rest.rester(apiOptions)));


rest.get('/attractions', function(req, content, cb){
    Attraction.find({ approved: true }, function(err, attractions){
	if(err) return cb({ error: 'Internal error.' });
	cb(null, attractions.map(function(a){
	    return {
		name: a.name,
		description: a.description,
		location: a.location,
	    };
	}));
    });
});

rest.post('/attraction', function(req, content, cb){
    var a = new Attraction({
	name: req.body.name,
	description: req.body.description,
	location: { lat: req.body.lat, lng: req.body.lng },
	history: {
	    event: 'created',
	    email: req.body.email,
	    date: new Date(),
	},
	approved: false,
    });
    a.save(function(err, a){
	if(err) return cb({ error: 'Unable to add attraction' });
	cb(null, { id: a._id });
    });
});

rest.get('/attraction/:id', function(req, content, cb){
    Attraction.findById(req.params.id, function(err, a){
	if(err) return cb({ error: 'Unable to retrieve attraction.' });
	cb(null, {
	    name: a.name,
	    description: a.description,
	    location: a.location,
	});
    });
});


// authentication
var auth = require('./lib/auth.js')(app, {
    // baseUrl은 옵션이며, 생략할 경우 기본값은 localhost입니다.
    // 로컬에서 작업하지 않을 때는 baseUrl이 유용한데,
    // 예를 들어 스테이징 서버가 있다면 BASE_URL 환경 변수를
    // https://staging.meadowlark.com으로 설정하면 됩니다.
    baseUrl: process.env.BASE_URL,
    providers: credentials.authProviders,
    successRedirect: '/account',
    failureRedirect: '/unauthorized',
});

// auth.init()는 패스포트 미들웨어를 연결합니다.
auth.init();

// 이제 인증 라우트를 사용할 수 있습니다.
auth.registerRoutes();

// authorization helpers
function customerOnly(req, res, next){
    if(req.user && req.user.role==='customer') return next();
    // 고객 전용 페이지를 만들어, 로그인해야 함을 알리고 싶습니다.
    res.redirect(303, '/unauthorized');
}
function employeeOnly(req, res, next){
    if(req.user && req.user.role==='employee') return next();
    // 직원 전용 승인에 실패했다는 결과를 숨겨서, 잠재적 해커가 그런 페이지가
    // 존재한다는 사실조차 모르게 하고 싶습니다.
    next('route');
}
function allow(roles) {
    return function(req, res, next) {
	if(req.user && roles.split(',').indexOf(req.user.role)!==-1)
	    return next();
	res.redirect(303, '/unauthorized');
    };
}

// 고객용 라우트
app.get('/account', allow('customer,employee'), function(req, res){
    res.render('account');
});
app.get('/account/order-history', customerOnly, function(req, res){
    res.render('account/order-history');
});
app.get('/account/email-prefs', customerOnly, function(req, res){
    res.render('account/email-prefs');
});

// 직원용 라우트
app.get('/sales', employeeOnly, function(req, res){
    res.render('sales');
});

// add support for auto views
var autoViews = {};

app.use(function(req, res, next){
    var path = req.path.toLowerCase();
    // 캐시가 있으면 뷰를 렌더링합니다.
    if(autoViews[path]) return res.render(autoViews[path]);
    // 캐시가 없다면 일치하는 .handlebars 파일이 있는지 확인합니다.
    if(fs.existsSync(__dirname + '/views' + path + '.handlebars')){
	autoViews[path] = path.replace(/^\//, '');
	return res.render(autoViews[path]);
    }
    // 뷰를 찾을 수 없으므로 404 핸들러에 넘깁니다.
    next();
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
    var options = {
	key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt')
    };
    https.createServer(options, app).listen(app.get('port'), function(){
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
