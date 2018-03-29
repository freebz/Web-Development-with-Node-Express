// 미들웨어 함수를 직접적으로 반환하는 모듈

module.exports = function(req, res, next){
    // 여기에 미들웨어 코드를 씁니다... 이 미들웨어가 종단점이 아니라면
    // next()나 next('route')를 잊지 말고 호출해야 합니다.
    next();
}



var stuff = require('meadowlark-stuff');

app.use(stuff);
