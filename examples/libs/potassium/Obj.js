/*
A handy, chain oriented API for creating Three.js scenes
*/
import el from './El.js'

let obj = {}
export default obj

/*
	if the first parameter in params is an array, the values of the array will be passed into the constructor of the instance
*/
obj.nodeFunction = function(clazz, ...params){

	let instance = null
	let consumedFirstParam = false
	if(Array.isArray(params[0])){
		consumedFirstParam = true
		instance = new THREE[clazz](...params[0])
	} else {
		instance = new THREE[clazz]()
	}

	// A convenience function to allow chaining like `let group = obj.group().appendTo(scene)`
	instance.appendTo = function(parent){
		parent.add(this)
		return this
	}

	// A convenience function to allow appending dictionaries of attributes, arrays of subchildren, or children
	instance.append = function(child=null){
		if(child === null){ return }
		if(typeof child === 'object' && typeof child.matrixWorld === 'undefined'){
			// If it's an object but not an Object3D, consider it a dictionary of attributes
			for(let key in child){
				if(child.hasOwnProperty(key) == false) continue
				this[key] = child[key]
			}
		} else {
			this.add(child)
		}
		return this
	}

	// Append the children parameters
	for(let i=0; i < params.length; i++){
		if(i == 0 && consumedFirstParam) continue
		instance.append(params[i])
	}
	return instance
}

let Engine = class {
	constructor(scene, camera){
		this._boundRender = this._render.bind(this)

		this.scene = scene
		this.camera = camera
		this.scene.add(this.camera)

		this.glCanvas = el.canvas()
		this.glContext = this.glCanvas.getContext('webgl')
		if(this.glContext === null){
			throw new Error('Could not create GL context')
		}
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.glCanvas,
			context: this.glContext,
			antialias: false,
			alpha: false
		})
		this.renderer.autoClear = true
		setTimeout(this._initRenderer.bind(this), 3000) // TODO HACK!
	}
	get el(){
		return this.renderer.domElement
	}
	_initRenderer(){
		this.renderer.setPixelRatio(1)
		this.renderer.autoClear = false
		this.renderer.setClearColor('#000', 0)
		this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)
		console.log('inited')
		window.requestAnimationFrame(this._boundRender)
	}
	_render(){
		window.requestAnimationFrame(this._boundRender)
		this.renderer.render(this.scene, this.camera)
	}
}

obj.engine = (scene, camera) => { return new Engine(scene, camera) }

obj.gltf = (path) => {
	let group = obj.group()
	loadGLTF(path).then(gltf => {
		group.add(gltf.scene)
	}).catch((...params) =>{
		console.error('could not load gltf', ...params)
	})
	return group
}

obj.GRAPH_CLASSES = [
	{ class: 'Scene', name: 'scene' },
	{ class: 'Group', name: 'group' },
	{ class: 'AmbientLight', name: 'ambientLight' },
	{ class: 'PerspectiveCamera', name: 'perspectiveCamera' }
]

// This loop generates the element generating functions like el.div(...)
for(let graphClassInfo of obj.GRAPH_CLASSES){
	let innerClazz = graphClassInfo.class
	obj[graphClassInfo.name] = function(...params){
		return obj.nodeFunction(innerClazz, ...params)
	}
}