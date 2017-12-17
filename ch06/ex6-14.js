// 예제 6-14  삭제에 사용하는 DEL 종단점

// 상품을 삭제하는 API
app.del('/api/tour/:id', function(req, res){
    var i;
    for( var i=tours.length-1; i>=0; i-- )
	if( tours[i].id == req.params.id ) break;
    if( i>=0 ) {
	tours.splice(i, 1);
	res.json({success: true});
    } else {
	res.json({error: 'No such tour exists.'});
    }
});
