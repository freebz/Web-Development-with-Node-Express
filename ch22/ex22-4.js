// 객체 생성자를 반환하는 모듈

function Stuff(config){
    this.config = config || {};
}
Stuff.prototype.m1 = function(req, res, next){
    // 주의: 여기서 this는 예상과 다른 값입니다. 쓰지 마십시오.
    next();
};
Stuff.prototype.m2 = function(){
    // Function.prototype.bind를 써서 이 인스턴스를
    // this 프로퍼티에 연결합니다.
    return (function(req, res, next){
	// 이제 this는 Stuff 인스턴스입니다.
	next();
    }).bind(this);
);

module.exports = Stuff;



var Stuff = require('meadowlark-stuff');

var stuff = new Stuff({ option: 'my choice' });

app.use(stuff.m1);
app.use(stuff.m2());
