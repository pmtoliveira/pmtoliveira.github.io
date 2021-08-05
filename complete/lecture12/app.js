import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { FBXLoader } from '../../libs/three/jsm/FBXLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { ARButton } from '../../libs/ARButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';

var container;
var camera, scene, renderer;
var controller;

var reticle;

var hitTestSource = null;
var hitTestSourceRequested = false;


class App{
	constructor(){
        container = document.createElement( 'div' );
        document.body.appendChild( container );
    
        scene = new THREE.Scene();
    
        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
        camera.position.z = 10;
    
        var light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
        light.position.set( 0.5, 1, 0.25 );
        scene.add( light );
    
        //
    
        renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.xr.enabled = true;
        container.appendChild( renderer.domElement );

        const btn = new ARButton( renderer, { sessionInit: { requiredFeatures: [ 'hit-test' ], optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );
    
        var boxgeometry = new THREE.BoxBufferGeometry( 0.25, 0.25, 0.25 ).translate( 0, 0.1, 0 );
    
        function onSelect() {
    
            if ( reticle.visible ) {
    
                var material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
                var mesh = new THREE.Mesh( boxgeometry, material );
                mesh.position.setFromMatrixPosition( reticle.matrix );
                //mesh.scale.y = Math.random() * 2 + 1;
                mesh.scale.set( 0.25, 0.25, 0.25 );
                scene.add( mesh );
    
    
            }
    
        }
    
        controller = renderer.xr.getController( 0 );
        controller.addEventListener( 'select', onSelect );
        scene.add( controller );
    
        reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add( reticle );
    
        //
    
        window.addEventListener( 'resize', onWindowResize, false );
    }
}
    
    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize( window.innerWidth, window.innerHeight );
    
    }
    
    //
    
    function animate() {
    
        renderer.setAnimationLoop( render );
    
    }
    
    function render( timestamp, frame ) {
    
        if ( frame ) {
    
            var referenceSpace = renderer.xr.getReferenceSpace();
            var session = renderer.xr.getSession();
    
            if ( hitTestSourceRequested === false ) {
    
                session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
    
                    session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
    
                        hitTestSource = source;
    
                    } );
    
                } );
    
                session.addEventListener( 'end', function () {
    
                    hitTestSourceRequested = false;
                    hitTestSource = null;
    
                } );
    
                hitTestSourceRequested = true;
    
            }
    
            if ( hitTestSource ) {
    
                var hitTestResults = frame.getHitTestResults( hitTestSource );
    
                if ( hitTestResults.length ) {
    
                    var hit = hitTestResults[ 0 ];
    
                    reticle.visible = true;
                    reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
    
                } else {
    
                    reticle.visible = false;
    
                }
    
            }
    
        }
    
        renderer.render( scene, camera );
    
    }

export { App };