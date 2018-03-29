var fortune = require('../lib/fortune.js');

exports.home = function(req, res){
    res.render('home');
};

exports.about = function(req, res){
    res.render('about', {
	fortune: fortune.getFortune(),
	pageTestScript: '/qa/tests-about.js'
    } );
};

exports.newsletter = function(req, res){
    // CSRF에 대해서는 나중에 배웁니다.
    // 지금은 일단 가짜 값을 쓰겠습니다.
    res.render('newsletter', { csrf: 'CSRF token goes here' });
};

// for now, we're mocking NewsletterSignup
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
    cb();
}

var VALID_EMAIL_REGEX = new RegExp(
    '^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
	'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
	'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-z0-9])?)+$'
);


exports.newsletterProcessPost = function(req, res){
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
}

exports.newsletterArchive = function(req, res){
    res.render('newsletter/archive');
}

exports.genericThankYou = function(req, res){
    res.render('thank-you');
}
