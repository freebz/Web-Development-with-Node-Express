// 예제 6-8  404 핸들러 차가

// 모든 라우트 다음에 써야 합니다.
app.use(function(req, res){
    res.status(404).render('not-found');
});
