exports.requestGroupRate = function(req, res){
    res.render('request-group-rate');
}

exports.requestGroupRateProcessPort = function(req, res, next){
    next(new Error('Request roup rate processing not yet implemented!'));
}

exports.home = function(req, res, next){
    next(new Error('Contact page not yet implemented!'));
}

exports.homeProcessPost = function(req, res, next){
    next(new Error('Contact page not yet implemented!'));
}
