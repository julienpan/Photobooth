window.addEventListener("load", event => new Base());

class Base {

	constructor() {
		console.log("loaded");

		this.initialize();
	}

	async initialize() {

		this.iospace = "baseapp"; // IO namespace for this app
		this.io = io.connect("http://localhost/" + this.iospace); // connect socket.io
		this.io.on("connect", () => this.onIOConnect()); // listen connect event

		this.mvc = new MVC("myMVC", this, new MyModel(), new MyView(), new MyController()); // init app MVC
		await this.mvc.initialize(); // run init async tasks
		this.mvc.view.attach(document.body); // attach view
		this.mvc.view.activate(); // activate user interface
	}

	/**
	 * @method test : test server GET fetch
	 */
	async test() {
		console.log("test server hello method");
		let result = await Comm.get("hello/everyone"); // call server hello method with argument "everyone"
		console.log("result", result);
		console.log("response", result.response);
	}

	/**
	 * @method onIOConnect : socket is connected
	 */
	onIOConnect() {
		trace("yay IO connected");
		this.io.on("dummy", packet => this.onDummyData(packet)); // listen to "dummy" messages
		this.io.emit("dummy", {value: "dummy data from client"}) // send test message
	}

	/**
	 * @method onDummyData : dummy data received from io server
	 * @param {Object} data 
	 */
	onDummyData(data) {
		trace("IO data", data);
		//this.mvc.controller.ioDummy(data); // send it to controller
	}
}

class MyModel extends Model {

	constructor() {
		super();
	}

	async initialize(mvc) {
		super.initialize(mvc);

		// tab with different filter
		this.filters = [ { 
			name: "Reset",
			filter: ""
		  }, { 
			name: "Contrast",
			filter: "contrast(500%)"
		  }, { 
			name: "BnW",
			filter: "grayscale(100%)" 
		  }, { 
			name: "Bright",
			filter: "brightness(300%)"
		  },{
			name: "Sepia",
			filter: "sepia(400%)"
		  },{
			name: "Invert",
			filter: "invert(100%)"
		  },{
			name: "Saturate",
			filter: "saturate(800%)"
		  },{
			name: "Hue",
			filter: "hue-rotate(90deg)"
		  },{
			name: "Blur",
			filter: "blur(3px)"
		  }];	  
	}

	async data() {
		trace("get data");
		// keep data in class variable ? refresh rate ?
		let result = await Comm.get("data"); // wait data from server
		return result.response; // return it to controller
	}
}

class MyView extends View {

	constructor() {
		super();
		this.table = null;
	}

	initialize(mvc) {
		super.initialize(mvc);

		// create video 
		this.video = document.createElement('video');
		this.stage.appendChild(this.video);
		this.video.className = "Video";
		this.video.width = "400";
		this.video.height = "300";
		this.video.style.margin = "20px";

		// canvas photo
		this.canvas = document.createElement("canvas");
		this.canvas.width = "400";
		this.canvas.height = "300";
		this.canvas.style.margin = "20px";
		this.canvas.className = "Canvas";
		this.ctx = this.canvas.getContext('2d');
		this.stage.appendChild(this.canvas);

		// create video btn
		this.btnv = document.createElement("button");
		this.btnv.innerHTML = "Camera";
		this.stage.appendChild(this.btnv);
		this.btnv.className = "Btn";

		// Take photo
		this.btnPhoto = document.createElement("button");
		this.btnPhoto.innerHTML = "Take Photo";
		this.stage.appendChild(this.btnPhoto);
		this.btnPhoto.className = "Btn";

		// create div filter
		this.divFilter = document.createElement("div");
		this.divFilter.className = "filterButtons";
		this.stage.appendChild(this.divFilter);

		// create button dynamically
		for(var i = 0; i < this.mvc.model.filters.length; i++){
			this.button = document.createElement("button");
			this.button.id = this.mvc.model.filters[i].name;
			this.button.innerHTML = this.mvc.model.filters[i].name;
			this.button.className = "Btnf";
			this.divFilter.appendChild(this.button);
		}
	}

	// activate UI
	activate() {
		super.activate();
		this.addListeners(); // listen to events
	}

	// deactivate
	deactivate() {
		super.deactivate();
		this.removeListeners();
	}

	addListeners() {

		this.photoHandler = e => this.photoClick(e);
		this.btnPhoto.addEventListener("click", this.photoHandler);
		
		this.filterHandler = e => this.filterClick(e);
		this.divFilter.addEventListener("click", this.filterHandler);

		this.getBtnvHandler = e => this.btnvClick(e);
		this.btnv.addEventListener("click", this.getBtnvHandler);

	}

	removeListeners() {
		this.btnPhoto.removeEventListener("click", this.photoHandler);
		this.divFilter.removeEventListener("click", this.filterHandler);
		this.btnv.removeEventListener("click", this.getBtnvHandler);
		this.btn.removeEventListener("click", this.getBtnHandler);
		this.iobtn.removeEventListener("click", this.ioBtnHandler);
	}

	filterClick(event){
		this.mvc.controller.filterWasClicked(event);
	}

	photoClick(event){
		this.mvc.controller.photoWasClicked(event);
	}

	btnvClick(){
		this.mvc.controller.btnvWasClicked("btnvClick");
	}

	updateFilter(filter){
		this.mvc.video.style.filter = filter;
		this.mvc.video.style.webkitFilter = filter;
	}
	
	updateVideo(){
		// Webcam
		navigator.getUserMedia = navigator.getUserMedia ||
			                     navigator.webkitGetUserMedia ||
			                     navigator.mozGetUserMedia;

		if (navigator.getUserMedia) {
			navigator.getUserMedia({ audio: false, video: {width: 1920, height: 1080} },
				function(stream) {
					var video = document.querySelector('video');
					video.srcObject = stream;
					video.onloadedmetadata = function() {
					video.play();
					};
				},
				function(err) {
					console.log("The following error occurred: " + err.name);
				}
			);
		} else {
			console.log("getUserMedia not supported");
		}
	}

	updateFilter(filter){
		this.mvc.view.video.style.filter = filter.filter;
		this.mvc.view.video.style.webkitFilter = filter.filter;
	}

	savePhoto(){
		// create img
		this.image = document.createElement("img");
		this.image.src = this.mvc.view.canvas.toDataURL();
		this.image.style.filter = this.mvc.view.video.style.filter;
		this.image.style.webkitFilter = this.mvc.view.video.style.webkitFilter;
		this.canvas.style.filter = this.mvc.view.video.style.filter;
		this.canvas.style.webkitFilter = this.mvc.view.video.style.webkitFilter;
		this.mvc.view.ctx.drawImage(this.mvc.view.video, 0 ,0, 500, 300);
		this.mvc.view.canvas.appendChild(this.image);
	}
}

class MyController extends Controller {

	constructor() {
		super();
	}
	initialize(mvc) {
		super.initialize(mvc);
	}

	// Start the cam when btnv was clicked
	async btnvWasClicked() {
		this.mvc.view.updateVideo();
	}

	async photoWasClicked(){
		this.mvc.view.savePhoto();
	}

	// add event dynamically
	findFilter(filters, name){
		for(var i = 0; i < this.mvc.model.filters.length; i++){
			if(this.mvc.model.filters[i].name === name){
				return filters[i];
			}
		}
		return null;
	}
	
	async filterWasClicked(event){
		trace("filter clicked", event);
		console.log(event.target);
		if(event.target.nodeName === "BUTTON"){
			this.filter = this.mvc.controller.findFilter(this.mvc.model.filters, event.target.id);
			if(this.filter) {
				this.mvc.view.updateFilter(this.filter);
			}
		}
	}
}
