var http = require('http');

http.createServer(function(req,res){
    // url에서 쿼리스트링과 옵션인 마지막 슬래시를
    // 지우고 소문자로 바꿔서 정규화합니다.
    var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
    switch(path) {
    case '':
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Homepage');
	break;
    case '/about':
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('About');
	break;
    default:
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Not Found');
	break;
    }
}).listen(3000);

console.log('Server started on localhost:3000; press Ctrl-C to terminate....');
