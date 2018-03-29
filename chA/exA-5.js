export.staffer = function (req, res, next) {
    if (!req.params.city) {
	//...

    }

    var cityName = req.params.city, staffs = staff[cityName];
    if (!req.params.name) {
	res.render('staffer', {'staffs':staffs, 'cityName':cityName});
	return;
    }

    //...
};
