const express = require("express");
var cors = require("cors");
const app = express();

const TIMETOLIVE = 10*60*1000; // 10 min

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", function (req, response) {
    let clientAddress = req.headers["x-forwarded-for"].split(",")[0];
    let s = services[clientAddress];
    response.send(s);
});

app.get("/:servicename/:serviceaddress(*)", function (req, response) {
    let clientAddress = req.headers["x-forwarded-for"].split(",")[0];
    console.log("Client address: ", clientAddress, "sent: ", req.params["servicename"], ": ", req.params["serviceaddress"]);

    let localServices = services[clientAddress];
    if (!localServices) {
        services[clientAddress] = {};
        localServices = services[clientAddress];
    }

    let service = localServices[req.params["servicename"]];
    if (!service) {
        service = {};
        localServices[req.params["servicename"]] = service;
    }
    service.address = req.params["serviceaddress"];

    service.timestamp = Date.now();

    response.send(localServices);
    startCleaning();
});

const listener = app.listen(process.env.PORT, function () {
    console.log("Your app is listening on port " + listener.address().port);
});

let services = {};
let cleaningHandle = null;
function startCleaning(interval=0) {
    if (cleaningHandle) return;
    console.log("Starting clearning task in " + interval/1000 + " seconds.")
    cleaningHandle = setTimeout(
        function () {
            console.log("Running cleaning task");
            let currentTimestamp = Date.now();
            //console.log(services);
            let min = 100000000000;

            let newServices = {};
            let entires = Object.entries(services);
            for (const [ip, serv] of entires) {
                let newIp = {};

                for (const [name, detail] of Object.entries(serv)) {
                    let dif = currentTimestamp - detail.timestamp;

                    if (dif < TIMETOLIVE) {
                        newIp[name] = detail;
                        let remaining = TIMETOLIVE - dif;
                        //console.log(remaining/1000);
                        if (remaining < min) min = remaining+5000;
                    } else {
                        console.log("Deleting service ", name, " that was set ", dif/1000, " seconds ago.");
                    }


                }
                if (Object.keys(newIp).length > 0) newServices[ip] = newIp;
            }
            services = newServices;

            cleaningHandle = null;
            if (Object.keys(services).length == 0) {
                console.log("Stopping cleaning task");
            } else {
                startCleaning(min);
            }
        }.bind(this),
        interval
    );
}
