// 예제 6-9  기본 폼 처리

// body-parser 미들웨어를 먼저 링크해야 합니다.
app.post('/process-contact', function(req, res){
    console.log('Received contact from ' + req.body.name +
		' <' + req.body.email + '>');
    // 데이터베이스에 저장....
    res.redirect(303, 'thank-you');
});
