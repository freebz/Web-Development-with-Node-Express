// 예제 6-10  더 견고한  폼 처리

// body-parser 미들웨어를 먼저 링크해야 합니다.
app.post('/process-contact', function(req, res){
    console.log('Received contact from ' + req.body.name +
		' <' + req.body.email + '>');
    try {
	// 데이터베이스에 저장....
	return res.xhr ?
	    res.render({ success: true }) :
	    res.redirect(303, 'thank-you');
    } catch(ex) {
	return res.xhr ?
	    res.json({ error: 'Database error.' }) :
	    res.redirect(303, '/database-error');
    }
});
