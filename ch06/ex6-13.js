// 예제 6-13  업데이트용 PUT 종단점

// 여행 상품을 업데이트하고 JSON을 반환하는 API
// 매개변수는 쿼리스트링으로 받습니다.
app.put('/api/tour/:id', function(req, res){
    var p = tours.filter(function(p){ return p.id == req.params.id })[0];
    if( p ) {
	if( req.query.name ) p.name = req.query.name;
	if( req.query.price ) p.price  req.query.price;
	res.json({success: true});
    } else {
	res.json({error: 'No such tour exists.'});
    }
});
