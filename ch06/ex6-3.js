// 예제 6-3  쿼리스트링과 쿠키, 세션 값을 포함한 콘텍스트를 뷰에 전달

app.get('/greeting', function(req, res){
    res.render('about', {
	message: 'welcome',
	style: req.query.style,
	userid: req.cookie,userid,
	username: req.session.username,
    });
});
