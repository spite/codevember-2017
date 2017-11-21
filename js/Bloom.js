function Bloom( levels ) {

	this.levels = levels !== undefined ? levels : 5;
	this.fbos = [];

	this.fbos.push( this.createFBO() );
	helper.attach( this.fbos[0], 'highlight' );

	for( var j = 0; j < this.levels; j++ ) {
		var fbo = this.createFBO();
		this.fbos.push( fbo );
		helper.attach( fbo, 'blur.' + j + '.h' );
		var fbo = this.createFBO();
		this.fbos.push( fbo );
		helper.attach( fbo, 'blur.' + j + '.v' );
	}
	this.fbos.push( this.createFBO() );

	this.highlightShader = new THREE.RawShaderMaterial({
		uniforms: {
			source: { type: 't', value: null },
			threshold: { type: 'f', value: 1. }
		},
		vertexShader: document.getElementById('ortho-vs').textContent,
		fragmentShader: document.getElementById('highlight-fs').textContent,
	});

	this.blurShader = new THREE.RawShaderMaterial({
		uniforms: {
			source: { type: 't', value: null },
			resolution: { type: 'v2', value: new THREE.Vector2(1,1) },
			delta: { type: 'v2', value: new THREE.Vector2( 0, 1 )}
		},
		vertexShader: document.getElementById('ortho-vs').textContent,
		fragmentShader: document.getElementById('blur-fs').textContent,
	});

	this.bloomShader = new THREE.RawShaderMaterial({
		uniforms: {
			levels: { type: 'f', value: this.levels },
			base: { type: 't', value: baseFBO.texture },
			level0: { type: 't', value: this.levels>0?this.fbos[2].texture:null },
			level1: { type: 't', value: this.levels>1?this.fbos[4].texture:null },
			level2: { type: 't', value: this.levels>2?this.fbos[6].texture:null },
			level3: { type: 't', value: this.levels>3?this.fbos[8].texture:null },
			level4: { type: 't', value: this.levels>4?this.fbos[10].texture:null },
			resolution: { type: 'v2', value: new THREE.Vector2(1,1) },
			boost: { type: 'f', value: 1.1 },
			reduction: { type: 'f', value: 1.1 },
			amount: { type: 'f', value: 0 },
			time: { type: 'f', value: 0 }
		},
		vertexShader: document.getElementById('ortho-vs').textContent,
		fragmentShader: document.getElementById('bloom-fs').textContent,
	});

	this.orthoScene = new THREE.Scene();
	this.orthoCamera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, .00001, 1000 );
	this.orthoQuad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ), this.highlightShader );
	this.orthoScene.add( this.orthoQuad );

}

Bloom.prototype.createFBO = function() {

	var fbo = new THREE.WebGLRenderTarget( 1, 1, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		stencilBuffer: false,
		depthBuffer: false
	});

	fbo.texture.generateMipMaps = false;

	return fbo;
}

Bloom.prototype.setSize = function(w, h) {

	this.width = w;
	this.height = h;

	var tw = w;
	var th = h;

	this.fbos[ 0 ].setSize( tw, th );
	helper.refreshFBO( this.fbos[0] );

	tw /= 2; th /= 2;
	tw = Math.round( tw );
	th = Math.round( th );

	for( var j = 1; j < this.levels * 2; j+= 2) {
		this.fbos[ j ].setSize( tw, th );
		helper.refreshFBO( this.fbos[j] );
		this.fbos[ j + 1 ].setSize( tw, th );
		helper.refreshFBO( this.fbos[j+1] );
		tw /= 2; th /= 2;
		tw = Math.round( tw );
		th = Math.round( th );
	}

}

Bloom.prototype.setRenderSize = function(width, height) {

	this.orthoQuad.scale.set( width, height, 1. );

	this.orthoCamera.left   = - width / 2;
	this.orthoCamera.right  =   width / 2;
	this.orthoCamera.top    =   height / 2;
	this.orthoCamera.bottom = - height / 2;
	this.orthoCamera.updateProjectionMatrix();

}

Bloom.prototype.render = function() {

	this.highlightShader.uniforms.source.value = baseFBO.texture;
	var w = this.fbos[ 0 ].width;
	var h = this.fbos[ 0 ].height;
	this.orthoQuad.material = this.highlightShader;
	this.setRenderSize(w, h);
	renderer.render(this.orthoScene,this.orthoCamera, this.fbos[ 0 ] );

	var v = 1;

	for( var j = 1; j < this.levels * 2; j+= 2 ){

		this.orthoQuad.material = this.blurShader;
		this.orthoQuad.material.uniforms.delta.value.set( v,0 );
		this.orthoQuad.material.uniforms.source.value = this.fbos[ j - 1 ].texture;
		this.orthoQuad.material.uniforms.resolution.value.set( this.fbos[j].width, this.fbos[j].height );
		this.setRenderSize( this.fbos[ j ].width, this.fbos[ j ].height );
		renderer.render(this.orthoScene,this.orthoCamera, this.fbos[ j ] );

		this.orthoQuad.material = this.blurShader;
		this.orthoQuad.material.uniforms.delta.value.set( 0,v );
		this.orthoQuad.material.uniforms.source.value = this.fbos[ j ].texture;
		this.orthoQuad.material.uniforms.resolution.value.set( this.fbos[j+1].width, this.fbos[j+1].height );
		this.setRenderSize( this.fbos[ j + 1 ].width, this.fbos[ j + 1 ].height );
		renderer.render(this.orthoScene,this.orthoCamera, this.fbos[ j + 1 ] );

	}

	this.orthoQuad.material = this.bloomShader;
	this.orthoQuad.material.uniforms.amount.value = .01;
	this.orthoQuad.material.uniforms.time.value = .001 * performance.now();
	this.orthoQuad.material.uniforms.resolution.value.set( this.width, this.height );
	this.setRenderSize( this.width, this.height );
	renderer.render(this.orthoScene,this.orthoCamera );

}
