// /ˈôdēˌō/

( function() {

var AudioContext = window.AudioContext || window.webkitAudioContext;

function OdeoSoundCloudPlayer( id, odeo ) {

	this.id = id;
	this.odeo = odeo;

	SC.initialize({
		client_id: this.id
	});

	this.audio = document.createElement( 'audio' );
	this.audio.loop = true;
	this.audio.autoplay = true;
	this.audio.crossOrigin = '';

	this.songSource = this.odeo.context.createMediaElementSource( this.audio );
	this.songSource.connect( this.odeo.analyser );
	this.songSource.connect( this.odeo.context.destination );

}

OdeoSoundCloudPlayer.prototype.getSong = function( songURL ) {

	this.audio.play();

	SC.resolve( songURL ).then( function( song ){

		console.log( song );
		//songInfo.innerHTML = '<p><b><a href="' + song.permalink_url + '" >' + song.title + '</a> <a href="#" id="pauseBtn" >PAUSE</a></b><br/><a href="' + song.user.permalink_url + '">' + song.user.username + '</a></p>'

		this.audio.src = song.stream_url + "?client_id=" + this.id;

		this.songSource.connect( this.odeo.analyser );
		this.songSource.connect( this.odeo.context.destination );

	}.bind( this ) );

}

OdeoSoundCloudPlayer.prototype.stop = function() {

	this.audio.pause();

}

function OdeoMediaPlayer() {

	thia.audioElement = document.createElement( 'audio' );

}

OdeoMediaPlayer.prototype.play = function( src ) {

	this.audioElement.src = src;
	this.audioElement.play();

	this.audioSource = this.context.createMediaElementSource( this.audioElement );
	this.audioSource.connect( this.odeo.analyser );
	this.audioSource.connect( this.odeo.context.destination );

}

function OdeoMicrophone( odeo ) {

	this.microphone = null;
	this.odeo = odeo;

}

OdeoMicrophone.prototype.play = function() {

	if( navigator.getUserMedia ) {

		navigator.getUserMedia( { audio: true }, function( stream ) {

			this.microphone = this.odeo.context.createMediaStreamSource( stream );
			this.microphone.connect( this.odeo.analyser );

		}.bind( this ),
		function() {

		} );

	} else if( navigator.mediaDevices ) {

		navigator.mediaDevices.getUserMedia( { audio: true } ).then(function( stream ) {

			this.microphone = this.odeo.context.createMediaStreamSource( stream );
			this.microphone.connect( this.odeo.analyser );

		}.bind( this ) ).catch(function(err) {
		});
	}

}

OdeoMicrophone.prototype.stop = function() {

	if( this.microphone ) {
		this.microphone.disconnect( this.odeo.analyser );
	}
	this.microphone = null;

}

function Odeo( opts ){

	this.options = opts || {};

	this.context = new AudioContext();
	this.analyser = this.context.createAnalyser();
	this.analyser.fftSize = this.options.fftSize || 256;
	this.frequencyData = new Uint8Array( this.analyser.frequencyBinCount );
	this.timeData = new Uint8Array( this.analyser.frequencyBinCount );
	this.waveData = [];
	this.levelsData = [];
	this.levelsCount = 16
	this.beatCutOff = 0;
	this.beatTime = 0;
	this.bpmStart = 0;
	this.volume = 0;

	this.spectrumTexture = null;

	this.soundCloudPlayer = null;
	this.microphone = null;

}

Odeo.prototype.playMedia = function() {

}

Odeo.prototype.useMicrophone = function() {

	if( !this.microphone ) this.microphone = new OdeoMicrophone( this );
	this.microphone.play();

}

Odeo.prototype.stopUsingMicrophone = function() {

	if( !this.microphone ) return;
	this.microphone.stop();

}

Odeo.prototype.playSoundCloud = function( url ) {

	if( !this.soundCloudPlayer ) this.soundCloudPlayer = new OdeoSoundCloudPlayer( this.options.soundCloudId, this );
	this.soundCloudPlayer.getSong( url );

}

Odeo.prototype.stopSoundCloud = function( url ) {

	if( !this.soundCloudPlayer ) return;
	this.soundCloudPlayer.stop();

}

Odeo.prototype.getSpectrumTexture = function() {

	this.spectrumTexture = new THREE.DataTexture( this.frequencyData, 1 * this.frequencyData.length, 1, THREE.LuminanceFormat );
	//this.spectrumTexture = new THREE.DataTexture( this.timeData, 1 * this.timeData.length, 1, THREE.LuminanceFormat );
	this.spectrumTexture.minFilter = THREE.NearestFilter;
	this.spectrumTexture.magFilter = THREE.NearestFilter;
	this.spectrumTexture.needsUpdate = true;

	return this.spectrumTexture;

}

Odeo.prototype.update = function() {

	var volSens = 1;

	this.analyser.getByteFrequencyData( this.frequencyData );
	if( this.spectrumTexture ) this.spectrumTexture.needsUpdate = true;
	//kick.onUpdate();


	this.analyser.getByteTimeDomainData(this.timeData); // <-- waveform

	for(var i = 0; i < this.analyser.frequencyBinCount; i++) {
		this.waveData[i] = ((this.timeData[i] - 128) /128 ) * volSens;
	}

	var levelBins = Math.floor(this.analyser.frequencyBinCount / this.levelsCount);

	for(var i = 0; i < this.levelsCount; i++) {
		var sum = 0;
		for(var j = 0; j < levelBins; j++) {
			sum += this.frequencyData[(i * levelBins) + j];
		}
		this.levelsData[i] = sum / levelBins/256 * volSens;
	}

	var sum = 0;
	for(var j = 0; j < this.levelsCount; j++) {
		sum += this.levelsData[j];
	}

	this.volume = sum / this.levelsCount;

	var BEAT_HOLD_TIME = 40;
	var BEAT_DECAY_RATE = 0.98;
	var BEAT_MIN = 0.15;

	if (this.volume  > this.beatCutOff && this.volume > BEAT_MIN){
		if( this.onBeat ) this.onBeat();
		this.bpmStart = performance.now();

		this.beatCutOff = this.volume *1.1;
		this.beatTime = 0;
	}else{
		if (this.beatTime <= BEAT_HOLD_TIME){
			this.beatTime ++;
		}else{
			this.beatCutOff *= BEAT_DECAY_RATE;
			this.beatCutOff = Math.max(this.beatCutOff,BEAT_MIN);
		}
	}

	this.bpmTime = (performance.now() - this.bpmStart)/633;

}

// [ mic ] [ url ] [ play / pause ]

Odeo.prototype.getUI = function() {

	this.div = document.createElement('div');
	var code = '<style>.odeo-player{position:absolute;left:10px; bottom:10px; z-index:1000;}.odeo-player *{all:unset;font-size: 12px}</style>';
	code += '<style>.odeo-button, .odeo-input{border: 1px solid white; display: inline-block; padding: .5em; opacity: .5; cursor: pointer}</style>';
	code += '<style>.odeo-button:hover, .odeo-input:hover{opacity:1}</style>';
	code += '<style>.odeo-input:focus{width: 200px}</style>';
	code += '<style>.odeo-active{opacity:1}</style>';
	code += '<div class="odeo-player"><div class="odeo-button odeo-mic">Mic</div><div class="odeo-button odeo-url">URL</div><input placeholder="soundcloud url" type="text" class="odeo-input"></div>';
	this.div.innerHTML = code;

	var odeo = this;
	var div = this.div;
	var useMic = this.div.querySelector('.odeo-mic');
	var useURL = this.div.querySelector('.odeo-url');

	useMic.addEventListener('click', function(){
		useURL.classList.remove('odeo-active');
		useMic.classList.add('odeo-active');
		odeo.stopSoundCloud();
		odeo.useMicrophone();
	});

	useURL.addEventListener('click', function(){
		useMic.classList.remove('odeo-active');
		useURL.classList.add('odeo-active');
		var url = div.querySelector('.odeo-input').value;
		odeo.stopUsingMicrophone();
		odeo.playSoundCloud(url);
	});

	return this.div;
}

window.Odeo = Odeo;

} )();
