
const net = require('net');
const dgram = require('dgram');
const express = require('express');

let client = new net.Socket();

let discovering = true;
let simulatorIP = null;
let simulatorPort = null;
let simulatorId = null;
let simulatorName = null;

/* Send device discovery message */
const message = Buffer.from('YAW_CALLING');
const discoverySocket = dgram.createSocket('udp4');
const socket = dgram.createSocket('udp4');


discoverySocket.on('listening', function () {
	console.log("Service discovery socket listening");

	discoverySocket.setBroadcast(true);
	let handler = setInterval(() => {
		discoverySocket.send(message, 0, message.length, 50010, '255.255.255.255');
		console.log('Sent device discovery message...')
	}, 1000);


	discoverySocket.on('message', function (message, remote) {
		console.log('CLIENT RECEIVED: ', remote.address + ':' + remote.port +' - ' + message.toString());

		
		let parts = message.toString().split(";");
		simulatorIP = remote.address;
		simulatorPort = parts[3];
		simulatorId = parts [1];
		simulatorName = parts [2];

		printSimulatorData();

		clearInterval(handler);
		discovering = false;
		
	//	let msg = 'Y[000.00]P[359.99]R[342.54]';

	//	socket.send(msg, 0, msg.length, simulatorPort, simulatorIP);

		client.connect(simulatorPort, simulatorIP, function() {
			console.log('Connected');
			let x = new Uint8Array([0xA1]);
			client.write(x);

			x = new Uint8Array([0x30, 0x00,0x00,0x13,0x88,0x88,0x88,0x00]);
			client.write(x);
			//client.write('Y[000.00]P[359.99]R[342.54]');
		});

		client.on('data', function(data) {
			console.log('Received: ' + data);
			
		});

		client.on('close', function() {
			console.log('Connection closed');

		});
		//client.destroy(); // kill client after server's response
		discoverySocket.close();
	});

});



discoverySocket.bind();



socket.on('listening', function () {
	console.log("socket listening")

	socket.on('message', function (message, remote) {
		console.log('CLIENT RECEIVED: ', remote.address + ':' + remote.port +' - ' + message.toString());
	});

});

socket.bind(5000);

function printSimulatorData() {
	console.log ("Simulator Id: ", simulatorId);
	console.log ("Simulator Name: ", simulatorName);
	console.log ("Simulator IP: ", simulatorIP);
	console.log ("Simulator Port: ", simulatorPort);
}



const app = express ();
//app.use(express.json());
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

app.get('/status', (request, response) => {
   const status = {
      'Discovering': discovering,
      'SimulatorIP': simulatorIP,
	 'SimulatorPort': simulatorPort,
	 'SimulatorId': simulatorId,
	'SimulatorName': simulatorName 
   };
   
   response.send(status);
});


app.get('/', (request, response) => {
    
   response.send(`
   	<html>

   	<input type="range" id="volume" name="volume" min="0" max="11" />
   	</html>
   	`);
});

app.get('/SET_POSITION/:yaw/:pitch/:roll', (req, resp) => {
	let yaw = req.params['yaw'];
	let pitch = req.params['pitch'];
	let roll = req.params['roll'];
	
    if (simulatorIP) {
    	let msg = `Y[${yaw}]P[${pitch}]R[${roll}]`;

		socket.send(msg, 0, msg.length, 50010, simulatorIP);
		console.log("sent position to simulator", msg);
    }
    resp.send(webpage);
});


app.get('/SET_POSITION', (req, resp) => {
	let yaw = req.query.yaw;
	let pitch = req.query.pitch;
	let roll = req.query.roll;
	
    if (simulatorIP) {
    	let msg = `Y[${yaw}]P[${pitch}]R[${roll}]`;

		socket.send(msg, 0, msg.length, 50010, simulatorIP);
		console.log("sent position to simulator", msg);
    }
    resp.send(webpage);
});

const webpage = `
<html>
<head>
</head>
<body>
<form action="/SET_POSITION" method="GET">
 	Yaw: <input type="range" id="yaw" name="yaw" min="0" max="720" />
 	Pitch: <input type="range" id="pitch" name="pitch" min="0" max="359" />
 	Roll: <input type="range" id="roll" name="roll" min="0" max="359" />
 	<input type="submit">
 	</form>

 	<script>
 		let y = document.querySelector("#yaw");
 		let p = document.querySelector("#pitch");
 		let r = document.querySelector("#roll");

 		y.addEventListener("input", function(el){
 			console.log("el.value");
 			
 			fetch("/SET_POSITION/" + y.value +"/" +  p.value + "/" + r.value );
 		});
 	</script>
</body>

</html>
`