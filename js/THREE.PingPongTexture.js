function PingPongTexture( renderer, shader, width, height, format, type, buffersCount ) {

	this.renderer = renderer;
	this.shader = shader;
	this.orthoScene = new THREE.Scene();
	var fbo = new THREE.WebGLRenderTarget( width, height, {
		wrapS: THREE.RepeatWrapping,
		wrapT: THREE.RepeatWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: format || THREE.RGBAFormat,
		type: type || THREE.UnsignedByte
	} );
	this.target = 0;
	this.buffersCount = buffersCount || 2;
	this.targets = [];
	this.targets.push( fbo );
	for( var j = 1; j < this.buffersCount; j++ ){
		this.targets.push( fbo.clone() );
	}
	this.orthoCamera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, .00001, 1000 );
	this.orthoQuad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ), this.shader );
	this.orthoQuad.scale.set( width, height, 1 );
	this.orthoScene.add( this.orthoQuad );
	this.front = this.targets[ 0 ];
	this.back = this.targets[ 1 ];

}

PingPongTexture.prototype.render = function() {

	this.shader.uniforms.source.value = this.front.texture;

	this.target++;
	this.target %= this.buffersCount;
	this.front = this.targets[ this.target ];
	var prev = this.target - 1;
	if( prev < 0 ) prev += this.buffersCount;
	this.back = this.targets[ prev ];

	this.renderer.render( this.orthoScene, this.orthoCamera, this.front );

}

PingPongTexture.prototype.setSize = function( width, height ) {

	this.orthoQuad.scale.set( width, height, 1. );

	this.targets[ 0 ].setSize( width, height );
	this.targets[ 1 ].setSize( width, height );

	this.orthoQuad.scale.set( width, height, 1 );

	this.orthoCamera.left   = - width / 2;
	this.orthoCamera.right  =   width / 2;
	this.orthoCamera.top    =   height / 2;
	this.orthoCamera.bottom = - height / 2;
	this.orthoCamera.updateProjectionMatrix();

}
