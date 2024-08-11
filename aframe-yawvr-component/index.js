/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Yaw VR component for A-Frame.
 */
AFRAME.registerComponent('yawvr', {
  schema: {
    appname: {type: 'string', default: 'myApp'},
    framerate: {type: 'number', default: 1}
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
    this._lastT = 0; // Timestamp of last position sent to simulator. To keep framerate

    let _this = this;

    this._registeredEventsPromise =findMiddleware()
        .then(function(middlewareAddress){
          _this._middlewareAddress = middlewareAddress;
          return findSimulator(middlewareAddress, /.*/);
        })
        .then(function([middlewareAddress, simulator]){
          return connect(middlewareAddress, simulator);
        })
        .then(function ([middlewareAddress, simulator]){
          return checkIn(middlewareAddress, simulator, _this.data.appname);
        })
        .then(function ([middlewareAddress, simulator, appName]){
          return registerUnloadEvents(middlewareAddress, simulator, appName);
        })
        /*.then(function ([middlewareAddress, simulator, appName]){
          return start(middlewareAddress, simulator, appName);
        })
        .then(function ([middlewareAddress, simulator, appName]){
          _this._ready = true;

        })*/
        .catch(error=>{
          console.log("Init: ", error);
          return Promise.reject(error);
        });

  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    this._interval = 1000/this.data.framerate;
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
      let _this = this;
      this._registeredEventsPromise
          .then(function ([middlewareAddress, simulator, appName]){
              _this.ready = false;
              stop(middlewareAddress, simulator, appName);
              exit(middlewareAddress, simulator, appName);
          })
          .catch(error=>{
              console.log(error);
          });
  },

  /**
   * Called on each scene tick.
   */
   tick: function (t) {
     if (!this._ready ) return;
     if (t-this._lastT >= this._interval) {
       let y = THREE.MathUtils.radToDeg(this.el.object3D.rotation.y)
       let p = THREE.MathUtils.radToDeg(this.el.object3D.rotation.x);
       let r = THREE.MathUtils.radToDeg(this.el.object3D.rotation.z);
       fetch(this._middlewareAddress+"/SET_POSITION/" + y +"/" +  p + "/" + r ) // console.log(y, p, r)l
       this._lastT = t;
     }
  },

  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () {
    let _this = this;
    this._registeredEventsPromise
        .then(function ([middlewareAddress, simulator, appName]){
          return stop(middlewareAddress, simulator, appName);
        })
        .then(function ([middlewareAddress, simulator, appName]){
          _this._ready = false;
        })
        .catch(error=>{
          console.log(error);
        });
  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
    let _this = this;
    this._registeredEventsPromise
        .then(function ([middlewareAddress, simulator, appName]){
          return start(middlewareAddress, simulator, appName);
        })
        .then(function ([middlewareAddress, simulator, appName]){
          _this._ready = true;
        })
        .catch(error=>{
          console.log("Play: ", error);
        });
  },

});



function registerUnloadEvents(middlewareAddress, simulator, appName) {
    console.log("Registering unload event.")
    window.addEventListener("beforeunload", function (event) {
      console.log("Unloading window");
      /*stop().then(function(res){ console.log(res) });
      exit().then(function(res){ console.log(res) });
      event.preventDefault();
      event.returnValue = true;*/

    fetch(middlewareAddress+"/stop/",{keepalive: true})
        .then(function(res){ return res.json() })
        .then(function(json) { console.log(json)})
        .catch(function(res){ console.log(res) })

    fetch(middlewareAddress+"/exit/",{keepalive: true})
        .then(function(res){ return res.json() })
        .then(function(json) { console.log(json)})
        .catch(function(res){ console.log(res) });

    });

    return Promise.resolve([middlewareAddress, simulator, appName]);
}



function connect(middlewareAddress, simulator) {
  return new Promise((resolve, reject) => {
    console.log("Connecting to: " + simulator.simulatorId);
    fetch(middlewareAddress+"/connect/" + simulator.simulatorId)
        .then(function(resp){ return resp.json(); })
        .then(function(json) {
          console.log("Connected to: " + simulator.simulatorId);
          resolve([middlewareAddress, simulator])
        })
        .catch(error => {
          console.log(error);
          reject(error);
        })
  });
}


function checkIn(middlewareAddress, simulator, appName) {
  return new Promise((resolve, reject) => {
    let appId = appName+crypto.randomUUID();
    let checkedIn = false;
    console.log("Checking in app: ", appId)
    fetch(middlewareAddress+"/checkin/"+appId)
        .then(function(res){ return res.json() })
        .then(function(json) {

          if (json.devicestatus == 'AVAILABLE') {
            checkedIn = true;
          }
          if (checkedIn) {
            console.log("Checked in: ", json)
            resolve([middlewareAddress, simulator, appId]);
          } else {
            console.log("Could not check in: ", json)
            reject(json);
          }
        })
        .catch(function(res){
          console.log(res)
          reject(error)
        })
  });
}


function start(middlewareAddress, simulator, appName) {
  return new Promise((resolve, reject) => {
    console.log("Starting app: ", appName)
    fetch(middlewareAddress+"/start/")
        .then(function(res){ return res.json() })
        .then(function(json) {
          if (json.commandreceived == 'START') {
            console.log("Started")
            resolve([middlewareAddress, simulator, appName]);
          } else {
            console.log("Could not start", json)
            reject(json);
          }
        })
        .catch(function(res){
          console.log(res)
          reject(error)
        })
  });
}

function stop(middlewareAddress, simulator, appName) {
  return new Promise((resolve, reject) => {
    console.log("Stopping app: ", appName)
    fetch(middlewareAddress+"/stop/",{keepalive: true})
        .then(function(res){ return res.json() })
        .then(function(json) {
          if (json.commandreceived == 'STOP') {
            console.log("Stopped")
            resolve([middlewareAddress, simulator, appName]);
          } else {
            console.log("Could not stop", json)
            reject(json);
          }
        })
        .catch(function(res){
          console.log(res)
          reject(error)
        })
  });
}


function exit(middlewareAddress, simulator, appName) {
    return new Promise((resolve, reject) => {
        console.log("Exiting app: ", appName)
        fetch(middlewareAddress+"/exit/",{keepalive: true})
            .then(function(res){ return res.json() })
            .then(function(json) {
                if (json.commandreceived == 'EXIT') {
                    console.log("Exited")
                    resolve([middlewareAddress, simulator, appName]);
                } else {
                    console.log("Could not exit", json)
                    reject(json);
                }
            })
            .catch(function(res){
                console.log(res)
                reject(error)
            })
    });
}

function findMiddleware() {
  return new Promise(function(resolve, reject) {
    let interval = 2;
    console.log("Using Service Discovery: https://hmd-link-service.glitch.me/")
    setTimeout(search, interval);
    function search() {
      fetch("https://hmd-link-service.glitch.me/").then(function(page){
        return page.json();
      }).then(function(json){
        //console.log(json);
        if (json.yawmiddleware) {
          console.log("Yaw Middleware found through service discovery: ", json.yawmiddleware);
          resolve(json.yawmiddleware.address);
          //begin(middleware.address);
        } else {
          interval = Math.min(interval *2, 30);
          console.log("Yaw Middleware not found through service discovery. Trying again in ", interval, " seconds.");
          setTimeout(search, interval*1000);
        }
      }).catch(function(error){
        console.log(error);
        reject(error);
      });
    }
  });
}

function findSimulator(middlewareAddress, simulatorNameRegExp) {
  return new Promise(function(resolve, reject){
    console.log("Asking Yaw Middleware: ", middlewareAddress, " for existing simulators.")
    let interval = 2;
    setTimeout(search, interval);
    function search() {
      fetch(middlewareAddress+"/simulators").then(function(data){
        return data.json();
      }).then(function(json){
        let simulator = null;
        if (json.length > 0) {
          console.log("Found simulators: ", json);
          json.forEach(sim=>{
            if (sim.simulatorName.match(simulatorNameRegExp)) {
              console.log("Found simulator matching '", simulatorNameRegExp, "': ", sim);
              simulator = sim;
            }
          });
          //simulator = json[0];
        }
        if (simulator) {
          resolve([middlewareAddress, simulator]);
        } else {
          interval = Math.min(interval *2, 30);
          console.log("No simulators found through middleware. Asking again in ", interval, " seconds.");
          setTimeout(search, interval*1000);
        }
      }).catch(function(error){
        console.log(error);
        reject(error);
      });
    }
  });
}
