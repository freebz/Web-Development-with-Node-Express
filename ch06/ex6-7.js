// 예제 6-7  에러 핸들러 추가

// 모든 라우트 다음에 써야 합니다.
// 'next'라는 함수가 필요 없더라도꼭 써야만
// 익스프레스에서 에러 핸들러라고 인식합니다.
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).render('error');
});
