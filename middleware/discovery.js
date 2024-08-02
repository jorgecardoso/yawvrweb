// discovery.js
// ========
const dgram = require('dgram');
var log = require('loglevel');
log.setLevel("trace")

/* Send device discovery message */
const message = Buffer.from('YAW_CALLING');



class YawDiscovery {
    constructor() {
        this._discoverySocket = dgram.createSocket('udp4');

        this._discoverySocket.on('listening', this.onListening.bind(this));
        this._discoverySocket.on('message', this.onMessage.bind(this));

        this._discoverySocket.bind();

        this._simulators = [];

        this._newSimulatorCallback = null;
    }

    set onNewSimulator(callback) {
        this._newSimulatorCallback = callback;
    }

    get simulators() {
        return this._simulators;
    }

    sendYawCallingMessage() {
        this._discoverySocket.send(message, 0, message.length, 50010, '255.255.255.255');
        log.debug("Sent device discovery message...");

        // increase simulator age
        this._simulators.forEach(function(sim) {
            sim.simulatorAge++;
            //this.printSimulatorData(sim);
        }.bind(this));

        // delete old simulators
        let oldSimulators = this._simulators;
        this._simulators = oldSimulators.filter((sim) => sim.simulatorAge < 2);
    }


    onListening() {
        log.info("Service discovery socket listening..");
        this._discoverySocket.setBroadcast(true);
        this.sendYawCallingMessage();

        let handler = setInterval(() => {
            this.sendYawCallingMessage();
        }, 10000);

    }

    onMessage(message, remote) {
        log.debug('CLIENT RECEIVED: ', remote.address + ':' + remote.port +' - ' + message.toString());

        let parts = message.toString().split(";");

        let simulatorIP = remote.address;
        let simulatorPort = parts[3];
        let simulatorId = parts [1];
        let simulatorName = parts [2];
        let simulatorAvailable = parts[4];


        let newSimulator = {};

        let exists = false;

        this._simulators.forEach(sim => {
            if (sim.simulatorId === simulatorId) {
                newSimulator = sim;
                exists = true;
            }
        });
        newSimulator.simulatorIP = simulatorIP;
        newSimulator.simulatorPort = simulatorPort;
        newSimulator.simulatorId = simulatorId;
        newSimulator.simulatorName = simulatorName;
        newSimulator.simulatorAvailable = simulatorAvailable === 'AVAILABLE';
        newSimulator.simulatorAge = 0;

        if (!exists) {
            log.info("New simulator found:");
            this.printSimulatorData(newSimulator);
            this._simulators.push(newSimulator);
            if (this._newSimulatorCallback) {
                this._newSimulatorCallback(newSimulator);
            }
        }

    }

    printSimulatorData(sim) {
        console.log ("Simulator Id: ", sim.simulatorId);
        console.log ("Simulator Name: ", sim.simulatorName);
        console.log ("Simulator IP: ", sim.simulatorIP);
        console.log ("Simulator Port: ", sim.simulatorPort);
        console.log ("Simulator Available: ", sim.simulatorAvailable);
        console.log ("Simulator Age: ", sim.simulatorAge);
    }

}


module.exports = YawDiscovery;

//exports.YawDiscovery = YawDiscovery.class;
//exports.test = test;