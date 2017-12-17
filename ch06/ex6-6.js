// 예제 6-6  평범한 텍스트 출력 렌더링

app.get('/test', function(req, res){
    res.type('text/plain');
    res.send('this is a test');
});
