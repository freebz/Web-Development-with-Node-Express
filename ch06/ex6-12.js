// 예제 6-12  JSON이나 XML, 텍스트를 반환하는 GET 종단점

var tours = [
    { id: 0, name: 'Hood River', price: 99.99 },
    { id: 1, name: 'Oregon Coast', price: 149.95 },
};


app.get('/api/tours', function(req, res){
    var toursXml = '' +
	products.map(function(p){
	    return '" id="' + p.id + '">' + p.name + '';
	}).join('') + '';
    var toursText = tours.map(function(p){
	return p.id + ': ' + p.name + ' (' + p.price + ')';
    }).join('\n');
    res.format({
	'application/json': function(){
	    res.json(tours);
	},
	'application/xml': function(){
	    res.type('application/xml');
	    res.send(toursXml);
	},
	'text/xml': function(){
	    res.type('text/xml');
	    res.send(toursXml);
	},
	'text/plain': function(){
	    res.type('text/plain');
	    res.send(toursXml);
	}
    });
});
