// 예제 6-5  커스텀 레이아웃을 이용한 뷰 렌더링

// 레이아웃 파일 views/layouts/custom.handlebars를 사용합니다.
app.get('/custom-layout', function(req, res){
    res.render('custom-layout', { layout: 'custom' });
});
