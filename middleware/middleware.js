const PORT = process.env.PORT || 9090;
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL ? process.env.SERVICE_DISCOVERY_URL : "https://hmd-link-service.glitch.me";
const ip = require('ip');
const selfsigned = require('selfsigned');
const cert =
	{
		private: '-----BEGIN RSA PRIVATE KEY-----\r\n' +
			'MIICXAIBAAKBgQC435Y5s8nyDX4mHE6NWsVCjSCaF1knUAmWB/eMNfvgjkvl+MHe\r\n' +
			'Qayq3d5f2hgjEPfyCETKjWZ5YuFpgL7hwQ5V6C/E/ZkHRI2/n+RXXo0G/nDBzvdO\r\n' +
			'210lOOIcGBCVUccVJ8ignk/XeLLHUno0tFicLn0WiF3rgNQVijR15htp0wIDAQAB\r\n' +
			'AoGAfpxJkt0Jeec5tLoAJhi7LbffUwiYey76UbDFHVY/WOu7GRWDGEbcDO0EBZsk\r\n' +
			'mqddV3nIOvwZ6RoKDCorEAsaWBlMO4sG/PwNSC8TK78LX/fT/3BHKjUiSwALo1h0\r\n' +
			'QbUKSbpQmzjA6+ch0YMTmcO8tqe32BTBGhIk5LEv4QHRS4ECQQDz6ApRuzLTRJQp\r\n' +
			'ZRYh6sF2C04ISrIlxd5l6MzdNEmgCKSUyzRmW90nUY2hWeX9GaO4cqq6pLUnesrx\r\n' +
			'l80bFQFBAkEAwgo6FdJL/3jolyeRHzUrul9ae/UzWrAaq3GGSBzPPMt9vZm65jlA\r\n' +
			'XW15KGPrlsWgnZw59grCZY+Ha44V0kXSEwJBAMQ5eRvaBADOGnjXF6A/0lbar3Oi\r\n' +
			'TIJxFwRb731DFLyIV4hRlx2GaHy6crxNq+cc2oeI0OwJmKhjdKQ7IUrZckECQAvm\r\n' +
			'Oqep7NUu4fybBZBHX3YfcNoXMF4IXKpU3OpBMghFZmGhMs/5hNP16a8raYAmgHIJ\r\n' +
			'6ZgIEuHNin1zCi2J8JcCQBanSxskYBy0a6w1pZLwcCe5ZK4ftcWvMNWhN+WxOmjN\r\n' +
			'59ey8fUA8t/ey0e30vgsoSel4Zyc5aoztw2EvI063Vo=\r\n' +
			'-----END RSA PRIVATE KEY-----\r\n',
		public: '-----BEGIN PUBLIC KEY-----\r\n' +
			'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC435Y5s8nyDX4mHE6NWsVCjSCa\r\n' +
			'F1knUAmWB/eMNfvgjkvl+MHeQayq3d5f2hgjEPfyCETKjWZ5YuFpgL7hwQ5V6C/E\r\n' +
			'/ZkHRI2/n+RXXo0G/nDBzvdO210lOOIcGBCVUccVJ8ignk/XeLLHUno0tFicLn0W\r\n' +
			'iF3rgNQVijR15htp0wIDAQAB\r\n' +
			'-----END PUBLIC KEY-----\r\n',
		cert: '-----BEGIN CERTIFICATE-----\r\n' +
			'MIIB4zCCAUygAwIBAgIJKWTjjIraud0OMA0GCSqGSIb3DQEBBQUAMBAxDjAMBgNV\r\n' +
			'BAMTBVZSTGFiMB4XDTI0MTAxNjE3MjkyOFoXDTI1MTAxNjE3MjkyOFowEDEOMAwG\r\n' +
			'A1UEAxMFVlJMYWIwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBALjfljmzyfIN\r\n' +
			'fiYcTo1axUKNIJoXWSdQCZYH94w1++COS+X4wd5BrKrd3l/aGCMQ9/IIRMqNZnli\r\n' +
			'4WmAvuHBDlXoL8T9mQdEjb+f5FdejQb+cMHO907bXSU44hwYEJVRxxUnyKCeT9d4\r\n' +
			'ssdSejS0WJwufRaIXeuA1BWKNHXmG2nTAgMBAAGjRTBDMAwGA1UdEwQFMAMBAf8w\r\n' +
			'CwYDVR0PBAQDAgL0MCYGA1UdEQQfMB2GG2h0dHA6Ly9leGFtcGxlLm9yZy93ZWJp\r\n' +
			'ZCNtZTANBgkqhkiG9w0BAQUFAAOBgQAsXCsgRjp7bCa+0wYjGVglvHwwUe0di4Ld\r\n' +
			'CfJbR9uTwMX3bd7+WKqHlje0LGivX0S6vpsgRbdMlzGI65ft3tkyYGISogA+R1ge\r\n' +
			'XMPNWQ30Ljg1tOe0NWSYRndehf+LJYdGD2+ct/7+fN7TVRUxmqG7a0Q4Awwgvd3Q\r\n' +
			'pHy3jlyBiA==\r\n' +
			'-----END CERTIFICATE-----\r\n',
		fingerprint: 'fc:a2:fe:6e:c5:e5:48:12:0c:53:e3:93:f0:d3:69:bb:fd:19:dc:9e'
	}

//const pems = selfsigned.generate([{name: 'commonName', value: "VRLab", issuer: "UC" }], { days: 365 });
//console.log(pems)

const https = require('https')
const express = require('express');
const MyWebSocketServer = require('ws').WebSocketServer;

var cors = require('cors')
var log = require('loglevel');
log.setLevel("info");

const app = express();
app.use(cors())
app.use(express.json());
app.use('/', express.static('public'));


let server = https.createServer({key: cert.private,cert: cert.cert}, app).listen(PORT, () => {
	console.log("Server Listening on: https://"+ip.address()+":"+PORT);
})

let wss = new MyWebSocketServer({server});
//console.log(wss);

let YawDiscovery = require('./discovery');
let YawCommunication = require('./yawcommunication')
const {WebSocketServer} = require("ws");

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
		}, udpCallback);

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


let clientWS = null;
wss.on('connection', function connection(ws) {
	clientWS = ws;
	//console.log("connected", ws)
	ws.on('error', console.error);

	ws.on('message', function message(data) {
		console.log(data);
		let v = data.toString().split(" ");

		yawCommunication.yawSetPosition(v[0], v[1], v[2]);
	});

	//ws.send('something');
});

function udpCallback(y,p, r) {
	//console.log(y, p, r)
	if (clientWS)	clientWS.send(y + " " + p + " " + r);
}


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





/*
const appSecure = express();
appSecure.use('/', express.static('public'));

let secureServer = https.createServer({key: cert.private,cert: cert.cert}, appSecure).listen(8080, () => {
	console.log("Server Listening on PORT:", ip.address(), 8080);
})
*/