$('#error').html('Something <b>very bad</b> happened!');


$('#error').html('<div class="error"><h3>Error</h3>' +
    '<p>Something <b><a href="error-detail/' + errorNumer
    +'">very bad</a></b> ' +
    'happended.  <a href="/try-again">Try again<a>, or ' +
    '<a href="/contact">contact support</a>.</p></div>');
