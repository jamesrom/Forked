$(jig);
$(window).resize(jig);

function jig() {
	var h = $(window).height();
	h -= $('#box').height();
	h *= 0.3;
	$('#box').css('padding-top', h + 'px');
}