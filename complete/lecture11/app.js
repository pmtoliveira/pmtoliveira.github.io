import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { FBXLoader } from '../../libs/three/jsm/FBXLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { ARButton } from '../../libs/ARButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

		this.assetsPath = '../../assets/';
        
		// this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		// this.camera.position.set( 0, 1.6, 3 );
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();
        
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        
        this.loadGLTF();
        
        this.setupXR();
		
		window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    setupXR(){
        this.renderer.xr.enabled = true;
        
        const btn = new ARButton( this.renderer, { sessionInit: { requiredFeatures: [ 'hit-test' ], optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );
        
        if ( 'xr' in navigator ) {

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( ( supported ) => {

                if (supported){
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach( el => {
                        el.style.display = 'block';
                    });
                }
			} );
            
		} 
        
        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        
        function onSelect() {
            if (self.chair===undefined) return;
            
            if (self.reticle.visible){
                self.chair.position.setFromMatrixPosition( self.reticle.matrix );
                self.chair.visible = true;
            }
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );
    }
    
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( '../../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
    
    loadGLTF(){
        const loader = new GLTFLoader().setPath('../../assets/');
        const self = this;
        
        this.loadingBar.visible = true;

        loader.load( 'base.glb',
            function ( gltf ) {
                self.scene.add( gltf.scene );
                self.chair = gltf.scene.children[0];;
                self.chair.visible = false; 
                self.loadingBar.visible = false;
                // self.renderer.setAnimationLoop( self.render.bind(self) );
                self.renderer.render(scene, camera);
        
        },
        function ( xhr ) {

            self.loadingBar.progress = (xhr.loaded / xhr.total);
            
        },
        function ( error ) {        
            console.error( error );
        
        } );
        
        // //this.initAR();
        
        // const loader = new GLTFLoader( ).setPath('../../assets/');
        // const self = this;
        
        // this.loadingBar.visible = true;
				
		// // Load a glTF resource
		// loader.load(
		// 	// resource URL
        //     //`steampunk_camera.glb`,
		// 	`base.glb`,
		// 	// called when the resource is loaded
		// 	function ( gltf ) {
		// 		self.scene.add( gltf.scene );
        //         self.chair = gltf.scene;
        
        //         self.chair.visible = false; 
                
        //         self.loadingBar.visible = false;
                
        //         self.renderer.setAnimationLoop( self.render.bind(self) );
		// 	},
		// 	// called while loading is progressing
		// 	function ( xhr ) {

		// 		self.loadingBar.progress = (xhr.loaded / xhr.total);
				
		// 	},
		// 	// called when loading has errors
		// 	function ( error ) {

		// 		console.log( 'An error happened' );

		// 	}  
        // );
    }
    
    // loadFBX(){
    //     const loader = new FBXLoader( ).setPath('../../assets/');
    //     const self = this;
    
    //     loader.load( 'office-chair.fbx', 
    //         function ( object ) {    
    //             self.chair = object;

    //             self.scene.add( object );
            
    //             self.loadingBar.visible = false;
            
    //             self.renderer.setAnimationLoop( self.render.bind(self));
    //         },
	// 		// called while loading is progressing
	// 		function ( xhr ) {

	// 			self.loadingBar.progress = (xhr.loaded / xhr.total);
				
	// 		},
	// 		// called when loading has errors
	// 		function ( error ) {

	// 			console.log( 'An error happened' );

	// 		} 
    //     );
    // }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.chair.rotateY( 0.01 );
        this.renderer.render( this.scene, this.camera );
    }

    initAR(){
        let currentSession = null;
        const self = this;
        
        const sessionInit = { requiredFeatures: [ 'hit-test' ] };
        
        
        function onSessionStarted( session ) {

            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setReferenceSpaceType( 'local' );
            self.renderer.xr.setSession( session );
       
            currentSession = session;
            
        }

        function onSessionEnded( ) {

            currentSession.removeEventListener( 'end', onSessionEnded );

            currentSession = null;
            
            if (self.chair !== null){
                self.scene.remove( self.chair );
                self.chair = null;
            }
            
            self.renderer.setAnimationLoop( null );

        }

        if ( currentSession === null ) {

            navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

        } else {

            currentSession.end();

        }
    }
    
}

export { App };