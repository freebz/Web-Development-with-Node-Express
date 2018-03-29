exports.staffer = function (req, res, next) {
    //...

    var info = staffs[req.params.name];
    if (info) {
	res.render('staffer', {'info':info});
	return;
    };

    res.render('staffer', {'notFound':'404'});
};
