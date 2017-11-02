function addCommonUI( element, callback ) {

	element = element || document.body;
	callback = callback || function() {}

	function goFS() {

		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
		callback();

	}

	function toggleDetails() {
		document.getElementById('details').classList.toggle('hidden');
	}

	window.addEventListener( 'keydown', function( e ) {
		if( e.keyCode === 70 ) {
			goFS();
		}
	} )

	var btn = document.createElement( 'div' );
	btn.textContent = '↗';
	btn.className = 'fullscreen-button button'
	document.body.appendChild( btn );
	btn.addEventListener( 'click', goFS );

	var info = document.createElement( 'div' );
	info.textContent = 'i';
	info.className = 'info-button button'
	document.body.appendChild( info );
	info.addEventListener( 'click', toggleDetails );

	document.body.querySelector( '#moreDetails' ).addEventListener( 'click', toggleDetails );
	document.body.querySelector( '#close-details' ).addEventListener( 'click', toggleDetails );

	var hub = document.createElement( 'p' );
	hub.className = 'hub';
	hub.innerHTML = '<a href="https://clicktorelease.com/code/codevember-2017/" >See other experiments for Codevember 2017</a>';
	document.body.appendChild( hub );

}
