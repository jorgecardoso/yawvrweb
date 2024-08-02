// bse
const express = require('express');


let YawDiscovery = require('./discovery');
let YawCommunication = require('./yawcommunication')

let simulators = [];
let yawDiscovery = new YawDiscovery();
let yawCommunication = new YawCommunication();
yawDiscovery.onNewSimulator = function (newSim) {
	 simulators = yawDiscovery.simulators;

	//yawCommunication.connect(newSim);
	//yawCommunication.yawCheckIn("My Super Game");
	//yawCommunication.yawStart();
	//yawCommunication.yawSetPosition(10,30,40);
}









const app = express ();
app.use(express.json());
const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});


app.use('/', express.static('public'));


app.get('/simulators', (request, response) => {
	response.send(simulators);
});


app.get('/connect/:simulatorId', (request, response) => {
	// find simulator
	let sim = simulators.filter((sim) => sim.simulatorId ===  request.params['simulatorId'])[0];
	if (sim) {
		yawCommunication.connect(sim, function(msg) {
			response.send(msg);
		});

	} else {
		response.send({message: 'Simulator not found'});
	}
});

app.get('/checkin/:appname', (request, response) => {
	yawCommunication.yawCheckIn(request.params['appname'], function(msg){
		response.send(msg);
	});

});

app.get('/start/', (request, response) => {
	yawCommunication.yawStart(function(msg) {
		response.send(msg);
	});
});

app.get('/stop/', (request, response) => {
	yawCommunication.yawStop(function(msg) {
		response.send(msg);
	});
});

app.get('/exit/', (request, response) => {
	yawCommunication.yawExit(function(msg) {
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

