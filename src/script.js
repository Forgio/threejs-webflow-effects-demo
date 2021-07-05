import './style.css'
import './locomotive-scroll.css'

import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';

import gsap from 'gsap';
// import Scroll from './scroll';
import LocomotiveScroll from 'locomotive-scroll';

import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'
import noise from './shaders/noise.glsl'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'


/**
 * Base
 */

// Debug
// const gui = new dat.GUI({ width: 340 })
// const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Preloading 
 */ 

// Fonts
// const fontOpen = new Promise(resolve => {
//     new FontFaceObserver("Open Sans").load().then(() => {
//       resolve();
//     });
//   });

//   const fontPlayfair = new Promise(resolve => {
//     new FontFaceObserver("Playfair Display").load().then(() => {
//       resolve();
//     });
//   });

// Preload images
const preloadImages = new Promise((resolve, reject) => 
{
    imagesLoaded(document.querySelectorAll("img[class=\"img-3d\"]"), { background: true }, resolve);
});

//  let allDone = [fontOpen,fontPlayfair,preloadImages]
    let allDone = [preloadImages]

// How bad is this practice?
Promise.all(allDone).then(() => {


/**
 * Sizes
 */
 const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


/**
 * Custom scroll 
 */ 

 const scroll = new LocomotiveScroll({
     el: document.querySelector("div[id=\"data-scroll\"]"),
     smooth: true 
 });

// let scroll = new Scroll()

let currentScroll = 0
let previousScroll = 0

/**
 * Images from web
 */ 

let images = [...document.querySelectorAll('img[class=\"img-3d\"]')]
let imageStore = []
let materials = []

const addImages = () =>
{

// Base shader
let shaderMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uImage: { value: 0 },
        uHover: { value: new THREE.Vector2(0.5, 0.5) },
        uHoverState: { value: 0 }
    },
    side: THREE.DoubleSide,
    fragmentShader: fragment,
    vertexShader: vertex,
//  wireframe: true
})

const textureLoader = new THREE.TextureLoader()
textureLoader.setCrossOrigin('anonymous')




// Checking all images on page and creating corresponding meshes
imageStore = images.map(img => 
{
    let bounds = img.getBoundingClientRect()

    let geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height, 100, 100)

   // let texture = textureLoader.load(img)
    // let texture = new THREE.Texture(img)
    // texture.crossOrigin = 'anonymous'

  //  const src = 'https://api.allorigins.win/raw?url='+img.src
     const src = img.src
    let texture = textureLoader.load(src)
  //  console.log(img)
   // texture.needsUpdate = true

    let material = shaderMaterial.clone()

    // Hover events
    img.addEventListener('mouseenter',() => 
        {
            gsap.to(material.uniforms.uHoverState,
            {
                duration: 1,
                value: 1
            })
        })

    img.addEventListener('mouseout',() => 
        {
        gsap.to(material.uniforms.uHoverState,
            {
            duration: 1,
            value: 0
            })
        })

    materials.push(material)

    material.uniforms.uImage.value = texture

    let mesh = new THREE.Mesh(geometry, material)

    scene.add(mesh)

    return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
    }
})
}
addImages()

const setPosition = () =>
{
    imageStore.forEach(o => 
    {
        o.mesh.position.y = currentScroll - o.top + sizes.height / 2 - o.height / 2
        o.mesh.position.x = o.left - sizes.width / 2 + o.width / 2

    })
}
setPosition()

const updateSize = () =>
{
    imageStore.forEach(o => 
    {
        // Remove geometry
        o.mesh.geometry.dispose()

        // Remove material
        o.mesh.material.dispose()

        // Remove texture?

        // Remove mesh
        scene.remove(o.mesh)

    })

    // Readding
    addImages()
    setPosition()
}


/**
 * Raycaster */ 
const raycaster = new THREE.Raycaster()

// Mouse
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children)

    if(intersects.length > 0){
      // console.log(intersects[0])
        let obj = intersects[0].object
        obj.material.uniforms.uHover.value = intersects[0].uv
    }
})


/**
 * Resizes */ 
 window.addEventListener('resize', () =>
 {
     // Update sizes
     sizes.width = window.innerWidth
     sizes.height = window.innerHeight
 
     // Update positions
     updateSize()

     // Update camera
     camera.aspect = sizes.width / sizes.height
     camera.fov = 2 * Math.atan((sizes.height / 2) / 600 ) * (180 / Math.PI)
     camera.updateProjectionMatrix()
 
     // Update renderer
     renderer.setSize(sizes.width, sizes.height)
     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update composer
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    effectComposer.setSize(sizes.width, sizes.height)
 
 })


/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 100, 2000)
camera.position.z = 600

// Projection to web
camera.fov = 2 * Math.atan((sizes.height / 2) / 600 ) * (180 / Math.PI)
camera.updateProjectionMatrix()

scene.add(camera)


/** 
 * Controls 
 * */ 
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true


/**
 * Renderer
 */

// Base renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Render target
let RenderTargetClass = null
if(renderer.capabilities.isWebGL2)
{
    RenderTargetClass = THREE.WebGLMultisampleRenderTarget
   // console.log('Using WebGLMultisampleRenderTarget')
}
else
{
    RenderTargetClass = THREE.WebGLRenderTarget
   // console.log('Using WebGLRenderTarget')
}

const renderTarget = new RenderTargetClass(
    800,
    600,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.sRGBEncoding
    }
)

// Composer
const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

// SMAA Pass
if(!renderer.capabilities.isWebGL2)
{
    const smaaPass = new SMAAPass()
   // console.log('Using SMAA')
   smaaPass.renderToScreen = true;

    smaaPass.enabled = true
    effectComposer.addPass(smaaPass)
}

// Custom shader pass
var counter = 0.0;
let myEffect = {
    uniforms: {
      "tDiffuse": { value: null },
      "scrollSpeed": { value: null },
      "amount": { value: 0.1 },
      "angle": { value: 0.0 }
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix 
        * modelViewMatrix 
        * vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float angle;
    varying vec2 vUv;
    uniform float scrollSpeed;
    void main(){

        vec2 newUV = vUv;
        float area = smoothstep(0.4, 0.0, vUv.y);
        area = pow(area, 4.0);
        newUV.x -= (vUv.x - 0.5) * 0.6 * area * scrollSpeed;

		vec2 offset = amount * vec2(cos(angle), sin(angle)) * area * scrollSpeed;
		vec4 cr = texture2D(tDiffuse, newUV + offset);
		vec4 cga = texture2D(tDiffuse, newUV);
		vec4 cb = texture2D(tDiffuse, newUV - offset);
        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);

    //   gl_FragColor = vec4(area,0.,0.,1.);
    }
    `
  }

const customPass = new ShaderPass(myEffect)
customPass.renderToScreen = true

effectComposer.addPass(customPass)



/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update scroll
    // scroll.render()
    // previousScroll = currentScroll
    // currentScroll = scroll.scrollToRender

    // scroll.update()

    // const lerp = (a, b, n) => (1 - n) * a + n * b
    // previousScroll = lerp(
    //     previousScroll,
    //     currentScroll,
    //     0.1
    //   );

    previousScroll = currentScroll;
    scroll.on('scroll', (args) => {
        currentScroll = args.scroll.y;
        
        // Don't call 
        if( Math.round(currentScroll) !== Math.round(previousScroll) )
        {
            setPosition()
            // customPass.uniforms.scrollSpeed.value = scroll.speed
            scroll.on('scroll', (args) => {
                customPass.uniforms.scrollSpeed.value = Math.min(Math.abs(previousScroll - currentScroll), 200)/200;
            });
        }

    });

    // Update materials
    materials.forEach(m => {
        m.uniforms.uTime.value = elapsedTime
    })

    // Update controls
    controls.update()

    // Render
    // renderer.render(scene, camera)
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

})


// // Ховеры
// let affectedImages = [...document.querySelectorAll('.newhover')];
// const map = (x, a, b, c, d) => (x - a) * (d - c) / (b - a) + c;
// const clamp = (val, min, max) => Math.max(Math.min(val, max), min);
// let scrollDistance = 0;
// let blurVal = 0;
// let brightnessVal = 0;

// let currentScroll = 0;
// let previousScroll = 0;
// scroll.on('scroll', (args) => {
// 	previousScroll = currentScroll;
//     currentScroll = args.scroll.y;
//     scrollDistance = (currentScroll - previousScroll) * 1.5;
//     blurVal = clamp(map(Math.abs(scrollDistance), 0, 400, 0, 10), 0, 10);
//     brightnessVal = clamp(map(Math.abs(scrollDistance), 0, 400, 1, 3), 1, 3);
//     affectedImages.forEach(o => 
//      {
//     	o.style.transform = `translateY(${scrollDistance}px) 
//          scale(${clamp(map(scrollDistance, 0, 800, 1, 0.6), 0.6, 1)})
//          skewX(${-1*map(scrollDistance, 0, 500, 0, 10)}deg) skewY(${-1*map(scrollDistance, 0, 500, 0, 10)}deg)`;
//   		o.style.filter = `blur(${blurVal.toFixed(2)}px) brightness(${brightnessVal.toFixed(2)})`;
//      })

// });