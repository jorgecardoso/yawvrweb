/* global AFRAME */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component "yawvr" attempted to register before AFRAME was available.');
}

/**
 * TODO:
 * property to specify simulator name regex (right now, it picks up the last simulator found if several are available)
 * connect through websocket for position messages
 * send vibration data
 */
/**
 * Yaw VR component for A-Frame.
 */
AFRAME.registerComponent('yawvr', {
    schema: {
        appname:            {type: 'string', default: 'myApp'},
        rate:               {type: 'number', default: 20},

        yawlimit:           {type: 'number', default: 180},
        pitchforwardlimit:  {type: 'number', default: 15},
        pitchbackwardlimit: {type: 'number', default: 55},
        rolllimit:          {type: 'number', default: 20},
        motioncompensation: {type: 'boolean', default: false},

        middlewareaddress: {type: 'string', default:''},
        servicediscoveryaddress: {type: 'string', default:'https://hmd-link-service.glitch.me'},
    },

    /**
     * Set if component needs multiple instancing.
     */
    multiple: false,

    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function () {
        this._ready = false;
        this._lastTick = 0; // Timestamp of last position sent to simulator. To keep framerate

        let _this = this;

        this._camera = this.el.querySelector("[camera],a-camera");
        this._cameraParent = this._camera.parentElement;

        console.log("Camera: ", this._camera);

        let middlewarePromise = null;
        if (_this.data.middlewareaddress == '') {
            middlewarePromise = _this._findMiddleware(this.data.servicediscoveryaddress);
        } else {
            middlewarePromise = Promise.resolve(_this.data.middlewareaddress);
        }
        this._registeredEventsPromise = middlewarePromise
            .then(function (middlewareAddress) {
                _this._middlewareAddress = middlewareAddress;
                return _this._findSimulator(middlewareAddress, /.*/);
            })
            .then(function ([middlewareAddress, simulator]) {
                return _this.connect(middlewareAddress, simulator);
            })
            .then(function ([middlewareAddress, simulator]) {
                return _this.checkIn(middlewareAddress, simulator, _this.data.appname);
            })
            .then(function ([middlewareAddress, simulator, appName]) {
                return _this._registerUnloadEvents(middlewareAddress, simulator, appName);
            })
            .catch(error => {
                console.error("Init component: ", error);
                return Promise.reject(error);
            });

    },

    /**
     * Called when component is attached and when component data changes.
     * Generally modifies the entity based on the data.
     */
    update: function (oldData) {
        let _this = this;

        this._interval = 1000 / this.data.rate;

        this._registeredEventsPromise
            .then( ([middlewareAddress, simulator, appName]) => {
                return _this.setTiltLimits(middlewareAddress, simulator, appName,
                    _this.data.pitchforwardlimit, _this.data.pitchbackwardlimit, _this.data.rolllimit)
            })
            .then( ([middlewareAddress, simulator, appName]) => {
                return _this.setYawLimit(middlewareAddress, simulator, appName, _this.data.yawlimit);
            })
            .catch(error=> {
                console.error("Updating component: ", error);
            })
    },

    /**
     * Called when a component is removed (e.g., via removeAttribute).
     * Generally undoes all modifications to the entity.
     */
    remove: function () {
        let _this = this;
        this._registeredEventsPromise
            .then(function ([middlewareAddress, simulator, appName]) {
                _this.ready = false;
                stop(middlewareAddress, simulator, appName);
                exit(middlewareAddress, simulator, appName);
            })
            .catch(error => {
                console.log(error);
            });
    },

    /**
     * Called on each scene tick.
     */
    tick: function (t) {
        if (!this._ready) return;

        if (t - this._lastTick >= this._interval) {
            let y = THREE.MathUtils.radToDeg(-this.el.object3D.rotation.y)
            let p = THREE.MathUtils.radToDeg(this.el.object3D.rotation.x);
            let r = THREE.MathUtils.radToDeg(this.el.object3D.rotation.z);
            fetch(this._middlewareAddress + "/SET_POSITION/" + y + "/" + p + "/" + r);
            this._lastTick = t;


            if (this.data.motioncompensation) {
                let motion = this.yCurrent - this.yPrevious;
                this.yPrevious = this.yCurrent;
                this._cameraParent.object3D.rotation.y += THREE.MathUtils.degToRad(motion);
                this._cameraParent.object3D.updateMatrix();
                console.log( this._cameraParent.object3D.rotation)
            }
        }
    },

    /**
     * Called when entity pauses.
     * Use to stop or remove any dynamic or background behavior such as events.
     */
    pause: function () {
        let _this = this;
        this._registeredEventsPromise
            .then(function ([middlewareAddress, simulator, appName]) {
                return _this.stop(middlewareAddress, simulator, appName);
            })
            .then(function ([middlewareAddress, simulator, appName]) {
                _this._ready = false;
            })
            .catch(error => {
                console.error(error);
            });
    },

    /**
     * Called when entity resumes.
     * Use to continue or add any dynamic or background behavior such as events.
     */
    play: function () {
        let _this = this;

        this._registeredEventsPromise
            .then(function ([middlewareAddress, simulator, appName]) {
                _this._socket = new WebSocket("wss://"+middlewareAddress.substring(6));
                _this.yCurrent = null;
                _this.yPrevious = null;
                _this._socket.addEventListener("message", (event) => {
                    //console.log("Message from server ", event.data);
                    let data = event.data.split(" ");

                    if (_this.yPrevious == null) {
                        _this.yPrevious = data[0];
                    }
                    _this.yCurrent = data[0];
                });

                return _this.start(middlewareAddress, simulator, appName);
            })
            .then(function ([middlewareAddress, simulator, appName]) {
                _this._ready = true;
            })
            .catch(error => {
                console.error("Playing component: ", error);
            });
    },


    _registerUnloadEvents: function (middlewareAddress, simulator, appName) {
        console.info("Registering unload event.")
        window.addEventListener("beforeunload", function (event) {
            console.log("Unloading window");
            fetch(middlewareAddress + "/stop/", {keepalive: true})
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    console.log(json)
                })
                .catch(function (res) {
                    console.log(res)
                })

            fetch(middlewareAddress + "/exit/", {keepalive: true})
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    console.log(json)
                })
                .catch(function (res) {
                    console.log(res)
                });

        });

        return Promise.resolve([middlewareAddress, simulator, appName]);
    },


    _findMiddleware: function (serviceDiscoveryAddress) {
        return new Promise(function (resolve, reject) {
            let interval = 2;
            console.info("Using Service Discovery: ", serviceDiscoveryAddress)
            setTimeout(search, interval);

            function search() {
                fetch(serviceDiscoveryAddress).then(function (page) {
                    return page.json();
                }).then(function (json) {
                    //console.log(json);
                    if (json.yawmiddleware) {
                        console.info("Yaw Middleware found through service discovery: ", json.yawmiddleware);
                        resolve(json.yawmiddleware.address);
                        //begin(middleware.address);
                    } else {
                        interval = Math.min(interval * 2, 30);
                        console.warn("Yaw Middleware not found through service discovery. Trying again in ", interval, " seconds.");
                        setTimeout(search, interval * 1000);
                    }
                }).catch(function (error) {
                    console.log(error);
                    reject(error);
                });
            }
        });
    },

    _findSimulator: function (middlewareAddress, simulatorNameRegExp) {
        return new Promise(function (resolve, reject) {
            console.info("Asking Yaw Middleware: ", middlewareAddress, " for existing simulators.")
            let interval = 2;
            setTimeout(search, interval);

            function search() {
                fetch(middlewareAddress + "/simulators").then(function (data) {
                    return data.json();
                }).then(function (json) {
                    let simulator = null;
                    if (json.length > 0) {
                        console.debug("Found simulators: ", json);
                        json.forEach(sim => {
                            if (sim.simulatorName.match(simulatorNameRegExp)) {
                                console.info("Found simulator matching '", simulatorNameRegExp, "': ", sim);
                                simulator = sim;
                            }
                        });
                        //simulator = json[0];
                    }
                    if (simulator) {
                        resolve([middlewareAddress, simulator]);
                    } else {
                        interval = Math.min(interval * 2, 30);
                        console.warn("No simulators found through middleware. Asking again in ", interval, " seconds.");
                        setTimeout(search, interval * 1000);
                    }
                }).catch(function (error) {
                    console.log(error);
                    reject(error);
                });
            }
        });
    },


    connect: function (middlewareAddress, simulator) {
        return new Promise((resolve, reject) => {
            console.info("Connecting to: " + simulator.simulatorId);
            fetch(middlewareAddress + "/connect/" + simulator.simulatorId)
                .then(function (resp) {
                    return resp.json();
                })
                .then(function (json) {
                    console.info("Connected to: " + simulator.simulatorId);
                    resolve([middlewareAddress, simulator])
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                })
        });
    },


    checkIn: function (middlewareAddress, simulator, appName) {
        return new Promise((resolve, reject) => {
            let appId = appName + crypto.randomUUID();
            let checkedIn = false;
            console.info("Checking in app: ", appId)
            fetch(middlewareAddress + "/checkin/" + appId)
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {

                    if (json.devicestatus == 'AVAILABLE') {
                        checkedIn = true;
                    }
                    if (checkedIn) {
                        console.info("Checked in: ", json)
                        resolve([middlewareAddress, simulator, appId]);
                    } else {
                        console.warn("Could not check in: ", json)
                        reject(json);
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    reject(error)
                })
        });
    },


    start: function (middlewareAddress, simulator, appName) {
        return new Promise((resolve, reject) => {
            console.info("Starting app: ", appName)
            fetch(middlewareAddress + "/start/")
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    if (json.commandreceived == 'START') {
                        console.info("Started")
                        resolve([middlewareAddress, simulator, appName]);
                    } else {
                        console.warn("Could not start", json)
                        reject(json);
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    reject(error)
                })
        });
    },

    stop: function (middlewareAddress, simulator, appName) {
        return new Promise((resolve, reject) => {
            console.info("Stopping app: ", appName)
            fetch(middlewareAddress + "/stop/", {keepalive: true})
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    if (json.commandreceived == 'STOP') {
                        console.info("Stopped")
                        resolve([middlewareAddress, simulator, appName]);
                    } else {
                        console.warn("Could not stop", json)
                        reject(json);
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    reject(error)
                })
        });
    },


    exit: function (middlewareAddress, simulator, appName) {
        return new Promise((resolve, reject) => {
            console.info("Exiting app: ", appName)
            fetch(middlewareAddress + "/exit/", {keepalive: true})
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    if (json.commandreceived == 'EXIT') {
                        console.info("Exited")
                        resolve([middlewareAddress, simulator, appName]);
                    } else {
                        console.warn("Could not exit", json)
                        reject(json);
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    reject(error)
                })
        });
    },

    setTiltLimits: function (middlewareAddress, simulator, appName, pitchForwardLimit, pitchBackwardLimit, rollLimit) {
        return new Promise((resolve, reject) => {
            console.info("Setting tilt limits for ", appName);
            fetch(middlewareAddress + "/set_tilt_limits/" + pitchForwardLimit + "/" + pitchBackwardLimit + "/" + rollLimit)
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    if (json.commandreceived == 'SET_TILT_LIMITS') {
                        console.info("Set tilt limits: ", json.pitchForwardLimit, json.pitchBackwardLimit, json.rollLimit)
                        resolve([middlewareAddress, simulator, appName, json]);
                    } else {
                        console.warn("Could set tilt limits", json)
                        reject(json);
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    reject(error)
                })
        });
    },


    setYawLimit: function (middlewareAddress, simulator, appName, yawLimit) {
        return new Promise((resolve, reject) => {
            console.info("Setting yaw limit for ", appName);
            fetch(middlewareAddress + "/set_yaw_limit/" + yawLimit)
                .then(function (res) {
                    return res.json()
                })
                .then(function (json) {
                    if (json.commandreceived == 'SET_YAW_LIMIT') {
                        console.info("Set yaw limits: ", json.yawLimit)
                        resolve([middlewareAddress, simulator, appName, json]);
                    } else {
                        console.warn("Could set yaw limit", json)
                        reject(json);
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    reject(error)
                })
        });
    }


});

