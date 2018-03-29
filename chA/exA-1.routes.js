module.exports = function(app){
    //...

    //직원 소개와 관련된 url의 일부만 입력해도 모두 staffer에서 처리합니다.
    app.get('/staff', main.staffer);
    app.get('/staff/:city', main.staffer);
    app.get('/staff/:city/:name', main.staffer);
};
