exports.staffer = function (req, res, next) {
    if (!req.params.city) {
	res.render('staffer', {'cities':staff});
	//이 핸들러 안에서 전부 처리하므로 next()를 호출하지 않습니다
	return;
    }
};
