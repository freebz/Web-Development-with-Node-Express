// 예제 6-2  200 이외의 응답 코드로 응답

app.get('/error', function(req, res){
    res.status(500);
    res.render('error');
});
// 한 줄로 쓰려면
app.get('/error', function(req, res){
    res.status(500).render('error');
});
