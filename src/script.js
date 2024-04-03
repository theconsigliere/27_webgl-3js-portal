import GUI from "lil-gui"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"

//SHADERS
import portalVertexShader from "./shaders/portal/vertex.glsl"
import portalFragmentShader from "./shaders/portal/fragment.glsl"
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl"
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl"

/**
 * Base
 */
// Debug
const debugObject = {
  background: "#2a1d1d",
  colorStart: "#e675a6",
  colorEnd: "#2a1d1d",
}
const gui = new GUI({
  width: 400,
})
// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath("draco/")

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// TEXTURE
const bakedTexture = textureLoader.load("./assets/baked.jpg")
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

// material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
})

// PORTAL LIGHT MATERIAL
const portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(0xe675a6) },
    uColorEnd: { value: new THREE.Color(0x2a1d1d) },
  },
})

// pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffe5,
})

// MODEL

gltfLoader.load("./assets/portal-ultimate.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === "merge")

  const poleLightA = gltf.scene.children.find(
    (child) => child.name === "poleLightA"
  )
  const poleLightB = gltf.scene.children.find(
    (child) => child.name === "poleLightB"
  )
  const portalLight = gltf.scene.children.find(
    (child) => child.name === "portalLight"
  )

  bakedMesh.material = bakedMaterial

  poleLightA.material = poleLightMaterial
  poleLightB.material = poleLightMaterial
  portalLight.material = portalLightMaterial

  gltf.scene.rotation.y = -Math.PI * 0.9

  scene.add(gltf.scene)
})

// FIREFLIES
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
  positionArray[i * 3 + 1] = Math.random() * 2
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

  scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
)

firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
)

const firefliesMaterial = new THREE.ShaderMaterial({
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  )
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//GUI

renderer.setClearColor(debugObject.clearColor)

gui.addColor(debugObject, "background").onChange(() => {
  renderer.setClearColor(debugObject.background)
})

gui.add(firefliesMaterial.uniforms.uSize, "value").min(0).max(500).step(1)

gui.addColor(debugObject, "colorStart").onChange(() => {
  portalLightMaterial.uniforms.uColorStart.value.set(debugObject.colorStart)
})

gui.addColor(debugObject, "colorEnd").onChange(() => {
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.colorEnd)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update fireflies
  firefliesMaterial.uniforms.uTime.value = elapsedTime

  // Update portal light
  portalLightMaterial.uniforms.uTime.value = elapsedTime

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
