// 예제 8-3. 애플리케이션 파일

app.post('/process', function(req, res){
    if(req.xhr || req.accepts('json,html')==='json'){
	res.send({ success: true });
	// (에러가 있다면 { error: 'error description' }을 보냅니다)
    } else {
	res.redirect(303, '/thank-you');
	// (에러가 있다면 에러 페이지로 리다이렉트합니다)
    }
});
