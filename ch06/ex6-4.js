// 예제 6-4  레이아웃 없이 뷰 렌더링

// 다음 레이아웃에는 레이아웃 파일이 없으므로 views/no-layout.handlebars에
// 필요한 HTML이 다 들어 있어야 합니다.
app.get('/no-layout', function(req, res){
    res.render('no-layout', { layout: null });
});
