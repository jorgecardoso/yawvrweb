const net = require("net");
const dgram = require('dgram');

var log = require('loglevel');
log.setLevel("info");

const CHECK_IN = 0x30;
const CHECK_IN_ANS = 0x31;
const START = 0xA1;
const STOP = 0xA2;
const EXIT = 0xA3;
const SET_TILT_LIMITS = 0x40;
const SET_YAW_LIMIT  = 0x70;
const ERROR = 0xA5;

class YawCommunication {
    constructor() {
        this._udpSocket = dgram.createSocket('udp4');
        this._udpSocket.on('listener', this.onUDPListening);
        this._udpSocket.on('message', this.onUDPMessage);
        this._udpSocket.bind();

        this._simulator = null;
        //socket.bind(5000);
    }

    connect(simulator, callback) {
        this._connectCallback = callback;
        if (this._tcpSocket != null) {
            log.error("Already connected. Call disconnect first.");
            this._connectCallback({connectionstatus: 'NOT CONNECTED',
                message: 'Already connected. Call disconnect first.'});
            return;
        }

        if (simulator.simulatorAvailable) {
            this._simulator = simulator;
            this._tcpSocket = new net.Socket();
            this._tcpSocket.on('data', this.onTCPData.bind(this));
            this._tcpSocket.on('close', this.onTCPClose.bind(this));
            this._tcpSocket.on('error', this.onTCPError.bind(this));

            this._tcpSocket.connect(simulator.simulatorPort, simulator.simulatorIP, this.onTCPConnected.bind(this));
        } else {
            log.warn("Cannot connect to simulator: not available");
            if (this._connectCallback)
                this._connectCallback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot connect to simulator: not available'});
        }

    }

    disconnect() {
        if (this._tcpSocket) this._tcpSocket.destroy();
        this._tcpSocket = null;
    }

    yawCheckIn(gameName = "MyGame", callback) {
        this._yawCheckInCallback = callback;
        if (!this._tcpSocket) {
            if (callback) {
                callback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot checkin to simulator.'});
            }
            return;
        }

        let utf8Encode = new TextEncoder();

        let port = this._udpSocket.address().port;
        let name = utf8Encode.encode(gameName);

        let message = new Uint8Array([CHECK_IN, (port>>24)&255,(port>>16)&255,(port>>8)&255,port&255, ...name]);
        this._tcpSocket.write(message);
    }

    yawStart(callback) {
        this._yawStartCallback = callback;
        if (!this._tcpSocket) {
            if (callback) {
                callback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot start simulator.'});
            }
            return;
        }

        let message = new Uint8Array([START]);
        this._tcpSocket.write(message);
    }

    yawStop(callback) {
        this._yawStopCallback = callback;
        if (!this._tcpSocket) {
            if (callback) {
                callback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot stop simulator.'});
            }
            return;
        }

        let message = new Uint8Array([STOP]);
        this._tcpSocket.write(message);
    }

    yawExit(callback) {
        this._yawExitCallback = callback;
        if (!this._tcpSocket) {
            if (callback) {
                callback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot exit simulator.'});
            }
            return;
        }

        let message = new Uint8Array([EXIT]);
        this._tcpSocket.write(message);
    }

    yawSetTiltLimits(pitchForwardLimit, pitchBackwardLimit, rollLimit,callback) {
        this._yawSetTiltLimitsCallback = callback;
        if (!this._tcpSocket) {
            if (callback) {
                callback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot set tilt limits.'});
            }
            return;
        }
        let pfl = Number(pitchForwardLimit);
        let pbl = Number(pitchBackwardLimit);
        let rl = Number(rollLimit);
        /*NOTE: YAW Documentation seems to be wrong about the order of these parameters:
        Parameters in order: int pitchForwardLimit (4 bytes), int pitchBackwardLimit (4 bytes), int rollLimit (4 bytes)
        The actual order seems to be pitchBackwardLimit, pitchForwardLimit, rollLimit
        */
        let message = new Uint8Array([SET_TILT_LIMITS, (pbl>>24)&255,(pbl>>16)&255,(pbl>>8)&255,pbl&255,
            (pfl>>24)&255,(pfl>>16)&255,(pfl>>8)&255,pfl&255,
            (rl>>24)&255,(rl>>16)&255,(rl>>8)&255,rl&255
        ]);
        this._tcpSocket.write(message);
    }

    yawSetYawLimit(yawLimit,callback) {
        this._yawSetYawLimitCallback = callback;
        if (!this._tcpSocket) {
            if (callback) {
                callback({connectionstatus: 'NOT CONNECTED',
                    message: 'Cannot set yaw limit.'});
            }
            return;
        }
        let yl = Number(yawLimit);
        let message = new Uint8Array([SET_YAW_LIMIT, (yl>>24)&255,(yl>>16)&255,(yl>>8)&255,yl&255]);
        this._tcpSocket.write(message);
    }

    yawSetPosition(yaw, pitch, roll) {

        let msg = `Y[${yaw}]P[${pitch}]R[${roll}]`;

        this._udpSocket.send(msg, 0, msg.length, 50010, this._simulator.simulatorIP);
    }

    onTCPConnected() {
        log.info('Connected to Simulator (TCP)');
        if (this._connectCallback)
            this._connectCallback({connectionstatus: 'CONNECTED',
                message: 'Connected to simulator'});
    }

    onTCPData(data) {
        switch(data[0]) {
            case CHECK_IN_ANS: // CHECK_IN_ANS
                log.info('Received: CHECK_IN_ANS' );
                if (this._yawCheckInCallback) {
                    let msg = data.subarray(1).toString();
                    if (msg.startsWith("AVAILABLE")) {
                        this._yawCheckInCallback({devicestatus:"AVAILABLE", commandreceived:"CHECK_IN"});
                    } else {
                        this._yawCheckInCallback({devicestatus:"RESERVED", commandreceived:"CHECK_IN", message: msg});
                    }
                }
                this._yawCheckInCallback = null;
                break;
            case  START: // START
                log.info('Received: START' );
                if (this._yawStartCallback) {
                    this._yawStartCallback({commandreceived: "START"});
                }
                this._yawStartCallback = null;
                break;
            case STOP: //STOP
                log.info('Received: STOP' );
                if (this._yawStopCallback) {
                    this._yawStopCallback({commandreceived: "STOP"});
                }
                this._yawStopCallback = null;
                break;
            case EXIT: //EXIT
                log.info('Received: EXIT' );
                if (this._yawExitCallback) {
                    this._yawExitCallback({commandreceived: "EXIT"});
                }
                this._yawExitCallback = null;
                break;
            case SET_TILT_LIMITS: // SET_TILT_LIMITS
                let pbl = (data[1]<<24)+(data[2]<<16)+(data[3]<<8)+data[4];
                let pfl = (data[5]<<24)+(data[6]<<16)+(data[7]<<8)+data[8];
                let rl = (data[9]<<24)+(data[10]<<16)+(data[11]<<8)+data[12];
                log.info('Received: SET_TILT_LIMITS', pfl, pbl, rl);

                if (this._yawSetTiltLimitsCallback) {
                    this._yawSetTiltLimitsCallback({commandreceived: "SET_TILT_LIMITS",
                    pitchForwardLimit: pfl,
                    pitchBackwardLimit: pbl,
                    rollLimit:rl});
                }
                this._yawSetTiltLimitsCallback = null;
                break;
            case SET_YAW_LIMIT: // SET_YAW_LIMIT
                let yl = (data[1]<<24)+(data[2]<<16)+(data[3]<<8)+data[4];
                log.info('Received: SET_YAW_LIMIT', yl );
                if (this._yawSetYawLimitCallback) {
                    this._yawSetYawLimitCallback({commandreceived: "SET_YAW_LIMIT",
                    yawLimit: yl});
                }
                this._yawSetYawLimitCallback = null;
                break;
            case ERROR: // ERROR
                log.info('Received: ERROR' );
                break;
            default:
                log.info('Received: ', data[0]);

        }


    }

    onTCPClose() {
        log.info("TCP Connection closed.")
        this.disconnect();
    }

    onTCPError(data) {
        console.log(data);
        if (this._connectCallback)
            this._connectCallback({connectionstatus: 'NOT CONNECTED',
                message: 'Cannot connect to simulator.'});
    }

    onUDPListening() {
        log.debug("UDP socket listening")
    }

    onUDPMessage(message, remote) {
        log.debug('CLIENT RECEIVED: ', remote.address + ':' + remote.port +' - ' + message.toString());
    }
}


module.exports = YawCommunication;