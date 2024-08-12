const PORT = process.env.PORT || 9090;
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL ? process.env.SERVICE_DISCOVERY_URL : "https://hmd-link-service.glitch.me";
const ip = require('ip');
const selfsigned = require('selfsigned');
const pems = selfsigned.generate([{ name: 'commonName', value: ip.address() }], { days: 365 });
//console.log(pems)

const https = require('https')
const express = require('express');
var cors = require('cors')
var log = require('loglevel');
log.setLevel("info");

const app = express();
app.use(cors())
app.use(express.json());
app.use('/', express.static('public'));

https.createServer({key: pems.private,cert: pems.cert}, app).listen(PORT, () => {
	console.log("Server Listening on PORT:", ip.address(), PORT);
})

let YawDiscovery = require('./discovery');
let YawCommunication = require('./yawcommunication')

let yawDiscovery = new YawDiscovery();
let yawCommunication = new YawCommunication();


app.get('/simulators', (request, response) => {
	log.info("/simulators");
	response.send(yawDiscovery.simulators);
});


app.get('/connect/:simulatorId', (request, response) => {
	log.info("/connect");
	// find simulator
	let sim = yawDiscovery.simulators.filter((sim) => sim.simulatorId ===  request.params['simulatorId'])[0];
	if (sim) {
		yawCommunication.connect(sim, function(msg) {
			response.send(msg);
		});

	} else {
		response.send({message: 'Simulator not found'});
	}
});

app.get('/checkin/:appname', (request, response) => {
	log.info("/checkin");
	yawCommunication.yawCheckIn(request.params['appname'], function(msg){
		response.send(msg);
	});

});

app.get('/start/', (request, response) => {
	log.info("/start");
	yawCommunication.yawStart(function(msg) {
		response.send(msg);
	});
});

app.get('/stop/', (request, response) => {
	log.info("/stop");
	yawCommunication.yawStop(function(msg) {
		response.send(msg);
	});
});

app.get('/exit/', (request, response) => {
	log.info("/exit");
	yawCommunication.yawExit(function(msg) {
		response.send(msg);
		yawCommunication.disconnect();
	});
});

app.get('/set_tilt_limits/:pitchForward/:pitchBackward/:rollLimit', (request, response) => {
	log.info("/set_tilt_limits: ", request.params['pitchForward'],request.params['pitchBackward'],request.params['rollLimit']);
	yawCommunication.yawSetTiltLimits(
		request.params['pitchForward'],request.params['pitchBackward'],request.params['rollLimit'],
		function(msg) {
			response.send(msg);
	});
});


app.get('/set_yaw_limit/:yawLimit', (request, response) => {
	log.info("/set_yaw_limit: ", request.params['yawLimit']);
	yawCommunication.yawSetYawLimit(
		request.params['yawLimit'],
		function(msg) {
			response.send(msg);
		});
});

app.get('/SET_POSITION/:yaw/:pitch/:roll', (req, resp) => {
	let yaw = req.params['yaw'];
	let pitch = req.params['pitch'];
	let roll = req.params['roll'];

	yawCommunication.yawSetPosition(yaw, pitch, roll);
    resp.send();
});


app.get('/SET_POSITION', (req, resp) => {
	let yaw = req.query.yaw;
	let pitch = req.query.pitch;
	let roll = req.query.roll;

	yawCommunication.yawSetPosition(yaw, pitch, roll);
    resp.send();
});

	console.log("Using Service Discovery Server: " + SERVICE_DISCOVERY_URL);
	let handle = setInterval( function() {
		fetch(SERVICE_DISCOVERY_URL+"/yawmiddleware/https://"+ip.address()+":"+PORT).then(function(data){
			return data.json();
			//console.log(data);
		}).then(function(json){
			//console.log(json);
		}).catch(error => {
			console.error("Could not connect to service discovery server. Stopping further attemps.")
			clearInterval(handle);
			console.error(error);
		});

	}, 5000)


//require('child_process').exec('start https://'+ip.address()+":"+PORT);





