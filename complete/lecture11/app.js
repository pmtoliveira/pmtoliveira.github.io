import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { FBXLoader } from '../../libs/three/jsm/FBXLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { LoadingBar } from '../../libs/LoadingBar.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
        this.loadingBar = new LoadingBar();
        //this.loadingBar.visible = false;

		this.assetsPath = '../../assets/ar-shop/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 4, 14 );
        
		this.scene = new THREE.Scene();
        //this.scene.background = new THREE.Color( 0xaaaaaa );
        
		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
        // const light = new THREE.DirectionalLight( 0xFFFFFF, 1.5 );
        // light.position.set( 0.2, 1, 1);
        // this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        //container.appendChild( this.renderer.domElement );
		this.setEnvironment();
        
        //this.workingVec3 = new THREE.Vector3();

        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        
        //this.setupXR();
		
        //this.loadingBar = new LoadingBar();
        
        //this.loadGLTF();
        //this.loadFBX();
        
        // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // this.controls.target.set(0, 3.5, 0);
        // this.controls.update();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    setupXR(){
        this.renderer.xr.enabled = true;
        
        // if ( 'xr' in navigator ) {

		// 	navigator.xr.isSessionSupported( 'immersive-ar' ).then( ( supported ) => {

        //         if (supported){
        //             const collection = document.getElementsByClassName("ar-button");
        //             [...collection].forEach( el => {
        //                 el.style.display = 'block';
        //             });
        //         }
		// 	} );
            
		// } 
        
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
        //this.initAR();
        
        const loader = new GLTFLoader( ).setPath('../../assets/');
        const self = this;
        
        this.loadingBar.visible = true;
				
		// Load a glTF resource
		loader.load(
			// resource URL
            //`steampunk_camera.glb`,
			`base.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				self.scene.add( gltf.scene );
                self.chair = gltf.scene;
        
                self.chair.visible = false; 
                
                self.loadingBar.visible = false;
                
                self.renderer.setAnimationLoop( self.render.bind(self) );
                // const bbox = new THREE.Box3().setFromObject( gltf.scene );
                // console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
                
                // gltf.scene.traverse( ( child ) => {
                //     if (child.isMesh){
                //         child.material.metalness = 0.2;
                //     }
                // })
                // self.chair = gltf.scene;
                
				// self.scene.add( gltf.scene );
                
                // self.loadingBar.visible = false;
				
				// self.renderer.setAnimationLoop( self.render.bind(self));
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}  
        );
    }
    
    loadFBX(){
        const loader = new FBXLoader( ).setPath('../../assets/');
        const self = this;
    
        loader.load( 'office-chair.fbx', 
            function ( object ) {    
                self.chair = object;

                self.scene.add( object );
            
                self.loadingBar.visible = false;
            
                self.renderer.setAnimationLoop( self.render.bind(self));
            },
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			} 
        );
    }
    
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