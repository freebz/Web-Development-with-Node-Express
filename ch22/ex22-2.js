// 미들웨어를 반환하는 함수를 반환하는 모듈

module.exports = function(config){
    // 설정 객체가 전달되지 않았을 때를 대비해 기본값을 가진
    // 객체를 만들어두는 게 일반적입니다.
    if(!config) config = {};
    return function(req, res, next){
	// 여기에 미들웨어 코드를 씁니다... 이 미들웨어가 종단점이 아니라면
	// next()나 next('route')를 잊지 말고 호출해야 합니다.
	next();
    }
}



var stuff = require('meadowlark-stuff')({ option: 'my choice' });

app.use(stuff);
