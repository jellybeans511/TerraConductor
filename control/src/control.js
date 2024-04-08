"use strict";

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
//import "./control.js"

//const { logiHanconButtonExists } = require("./gpdfn");
const API_KEY = "e316eaa7-4c1c-468c-b23a-9ce51b074ab7";
var peer = new Peer({
    key: API_KEY,
    debug: 3
});

let remoteVideo = null;
let mediaConnection = 0;
let dataConnection = 0;
let vehicleSelecter = "SOCKMR1000A";
document.getElementById("current-vehicle").textContent = vehicleSelecter;
let killRemoteTrigger = document.getElementById("kill-remote-mode");
let initcanTrigger = document.getElementById("init-can-trigger");
let RemoteStartTrigger = document.getElementById("remote-start-trigger");
let RemoteStopTrigger = document.getElementById("remote-stop-trigger");
let ApllyTrigger = document.getElementById("for-autorun-apply");
let VehicleStartTrigger = document.getElementById("vehicle-start");
let VehicleStopTrigger = document.getElementById("vehicle-stop");
let VehicleAdjustSpeed = document.getElementById("adjust-speed");
let VehicleAdjustHitch = document.getElementById("adjust-hitch");
let VehicleAdjustPto = document.getElementById("adjust-pto");
let drivingLocus = document.getElementById("driving-locus");
//let currentVehicle = document.getElementById("current-vehicle");
let canvas = document.getElementById('video-canvas');
//canvas.setAttribute('width', width)
//canvas.setAttribute('height', height)
let context2d = canvas.getContext('2d');
let context3d = canvas.getContext('3d');
//console.log(context2d);
let offScreen = document.createElement("canvas");
let offCanvas = offScreen.getContext("2d");
let supercnt = 0;

let fromAutorunInfo = {
    'latitude': 0,
    'longitude': 0,
    'gpsSpeed': 0, //m/s
    'headingError': 0, //deg
    'lateralError': 0, //m
    'steer': 0, //deg
    'realSteer': 0 //deg
};
let fromRobotInfo = {
    "lat": 0,
    "lon": 0,
    "gnssQuality": 0,
    "gnssSpeed": 0,
    "heading": 0,
    "headingError": 0,
    "lateralError": 0,
    "steerAngle": 0,
    "realSteerAngle": 0,
    "stopStatus": 0
}
let tempCnt = 0;

function SendDataChannel(senddata) {
    if (dataConnection.open == true) {
        dataConnection.send(senddata);
        console.log(senddata);
    } else if (dataConnection.open == false) {
        console.log("DataConnection is not opened");
    }
}

// シグナリングサーバーと接続が成功したタイミングで発生する
peer.on('open', function() {
    (document.getElementById('my-id')).textContent = peer.id;
});
let callTrigger = document.getElementById("call-trigger");
let closeTrigger = document.getElementById("close-trigger");

var haveEvents = 'ongamepadconnected' in window;
var controllers = {};

let forAutorunInfo = {
    adjustSpeed: 0, //km/h
    adjustHitch: 100, //100% UP
    adjustPto: false
}

let gpdInfo = {
    setSteer: 0,
    setGear: 1,
    setRpm: 800,
    setShuttle: "N",
    setHorn: false,
    setPto: false,
    setLinkHeight: 100
};
let gpdEvInfo = {
    setTorque: 0,
    setSteer: 0,
    setShuttle: "N",
    setBreak: true
};
let gpdMMInfo = {
    setJoyX: 0,
    setJoyY: 0,
    setDirection: 0, //0 Neurtal,1 Front, -1 Rear
    setRemoteCont: 0,
    setAdStop: 0 //0 AD start, 1 stop
};

let gpdMR1000AInfo = {
    inputSteer: 0,
    inputEngineCycle: 0,
    inputGear: 1,
    inputShuttle: 0,
    inputSpeed: 0,
    inputPtoHeight: 0,
    inputPtoOn: 0,
    inputHorn: 0,
    isRemoteCont: 0,
    isAutoRunStart: 0,
    isUseSafetySensorInTeleDrive: 0
}

let setRemoteControl = false;

function connecthandler(e) {
    addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
    controllers[gamepad.index] = gamepad;

    var divbyGpd = document.createElement("div");
    divbyGpd.setAttribute("id", "controller" + gamepad.index);

    var gpdId = document.createElement("h1");
    gpdId.appendChild(document.createTextNode("gamepad: " + gamepad.id));
    divbyGpd.appendChild(gpdId);
    requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
    removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
    var d = document.getElementById("controller" + gamepad.index);
    document.body.removeChild(d);
    delete controllers[gamepad.index];
}
//Declaration of variable to make gpdinfo
var lateralCount = 0;
var lateralStopFlag = false;
var cnt = 0;
let upLinkFlag = false;
let downLinkFlag = false;
let pto_Count = 0;
let ptoFlag = false;
let max_upLinkCount = 0;
let min_downLinkCount = 0;
let upGearFlag = false;
let downGearFlag = false;
let speedUpFlag = false;
let speedDownFlag = false;
let remoteButtonFlag = false;
let displayRpm = 0;

function updateStatus() {
    setTimeout(function() {
        if (!haveEvents) {
            scangamepads();
        }
        //supercnt++;
        //The first of index's gamepad will be used.
        let usingController = controllers[0];
        //console.log(vehicleSelecter);
        if (vehicleSelecter == "MR1000A") {

            let displaySteer = Math.floor(usingController.axes[0] * 100);
            if (displaySteer > 70) {
                displaySteer = 70;
            } else if (displaySteer < -70) {
                displaySteer = -70;
            }
            displayRpm = Math.floor(usingController.axes[2] * (-2000) + 800);
            if (displayRpm < 800) {
                displayRpm = 800;
            }

            document.getElementById("set-steer").textContent = displaySteer;
            document.getElementById("set-gear").textContent = gpdInfo.setGear.toString();
            document.getElementById("set-rpm").textContent = displayRpm.toString();
            document.getElementById("set-shuttle").textContent = (gpdInfo.setShuttle).toString();
            document.getElementById("set-link-height").textContent = gpdInfo.setLinkHeight.toString();
            document.getElementById("set-pto").textContent = (gpdInfo.setPto).toString();
            document.getElementById("set-horn").textContent = (gpdInfo.setHorn).toString();

            gpdInfo.setSteer = usingController.axes[0];
            gpdInfo.setRpm = usingController.axes[2];

            if (usingController.buttons[2].pressed == true) {
                gpdInfo.setShuttle = "F";
                if (setRemoteControl === false) {
                    SendDataChannel("vehiclestart");
                    console.log("Vehicle will move. Please attention...");
                }
            } else if (usingController.buttons[0].pressed == true) {
                gpdInfo.setShuttle = "R";
            } else if (usingController.buttons[1].pressed == true) {
                gpdInfo.setShuttle = "N";
                if (setRemoteControl === false) {
                    SendDataChannel("vehiclestop");
                    console.log("Vehicle will stop");
                }
            }

            if (usingController.buttons[3].pressed == true) {
                ptoFlag = true;
                pto_Count += 1;
                gpdInfo.setPto = false;
            } else if (usingController.buttons[3].pressed == false && ptoFlag == true) {
                pto_Count = 0;
                ptoFlag = false;
            }
            if (pto_Count > 60) {
                gpdInfo.setPto = true;
            }

            if (usingController.buttons[8].pressed == true) {
                gpdInfo.setHorn = true;
            } else if (usingController.buttons[8].pressed == false) {
                gpdInfo.setHorn = false;
            }

            if (usingController.buttons[4].pressed == true) {
                upGearFlag = true;
            } else if (usingController.buttons[4].pressed == false && upGearFlag == true) {
                gpdInfo.setGear += 1;
                upGearFlag = false;
                if (gpdInfo.setGear > 8) {
                    gpdInfo.setGear = 8;
                }
            }

            if (usingController.buttons[5].pressed == true) {
                downGearFlag = true;
            } else if (usingController.buttons[5].pressed == false && downGearFlag == true) {
                gpdInfo.setGear -= 1;
                downGearFlag = false;
                if (gpdInfo.setGear < 1) {
                    gpdInfo.setGear = 1;
                }
            }

            if (usingController.axes[9] == -1) {
                upLinkFlag = true;
                max_upLinkCount += 1;
            } else if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && upLinkFlag == true) {
                max_upLinkCount = 0;
                upLinkFlag = false;
                gpdInfo.setLinkHeight += 5;
                if (gpdInfo.setLinkHeight > 100) {
                    gpdInfo.setLinkHeight = 100;
                }
            }
            if (max_upLinkCount > 60) {
                max_upLinkCount = 0;
                gpdInfo.setLinkHeight = 100;
            }
            if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && max_upLinkCount != 0) {
                max_upLinkCount = 0;
            }

            if (Math.floor(usingController.axes[9] * 10) / 10 == 0.1) {
                downLinkFlag = true;
                min_downLinkCount += 1;
            } else if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && downLinkFlag == true) {
                min_downLinkCount = 0;
                downLinkFlag = false;
                gpdInfo.setLinkHeight -= 5;
                if (gpdInfo.setLinkHeight < 0) {
                    gpdInfo.setLinkHeight = 0;
                }
            }
            if (min_downLinkCount > 60) {
                min_downLinkCount = 0;
                gpdInfo.setLinkHeight = 0;
            }
            if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && min_downLinkCount != 0) {
                min_downLinkCount = 0;
            }

            if (usingController.buttons[24].pressed == true) {
                remoteButtonFlag = true;
            }
            if (usingController.buttons[24].pressed == false && remoteButtonFlag == true) {
                remoteButtonFlag = false;
                if (setRemoteControl === false) {
                    gpdInfo.setGear = 1;
                    gpdInfo.setPto = false;
                    gpdInfo.setLinkHeight = 100;
                    gpdInfo.setShuttle = "N";
                    setRemoteControl = true;
                    SendDataChannel("remotetrue")
                } else if (setRemoteControl === true) {
                    setRemoteControl = false;
                    SendDataChannel("remotefalse");
                }
            }

            //Send gpdInfo by 10Hz
            cnt += 1;
            if (cnt % 6 == 0) {
                cnt = 0;
                if (dataConnection.open == false) {
                    console.log('DataConnection is not opened');
                } else if (dataConnection.open == true) {
                    dataConnection.send(gpdInfo);
                    //console.log(usingController);
                }
            }
        }


        //********** MM 
        if (vehicleSelecter == "MOVER") {
            //console.log("MM Mode is developing...");

            gpdMMInfo.setJoyX = Math.floor(usingController.axes[0] * 71);
            if (gpdMMInfo.setJoyX < 8.0 && -8.0 < gpdMMInfo.setJoyX) {
                gpdMMInfo.setJoyX = 0;
            }
            if (gpdMMInfo.setJoyX > 8.0) {
                gpdMMInfo.setJoyX -= 8.0;
            } else if (gpdMMInfo.setJoyX < -8.0) {
                gpdMMInfo.setJoyX += 8.0;
            }
            gpdMMInfo.setJoyY = Math.floor((usingController.axes[1]) * (-63));


            if (usingController.buttons[1].pressed == false && usingController.buttons[2].pressed == false) {
                gpdMMInfo.setDirection = 0;
            } else if (usingController.buttons[2].pressed == true) {
                gpdMMInfo.setDirection = 1;
            } else if (usingController.buttons[1].pressed == true) {
                gpdMMInfo.setDirection = -1;
            }
            if (usingController.buttons[3].pressed == true) {
                gpdMMInfo.setAdStop = 0;
            } else if (usingController.buttons[0].pressed == true) {
                gpdMMInfo.setAdStop = 1;
            }
            if (usingController.buttons[12].pressed == true) {
                remoteButtonFlag = true;
            }
            if (usingController.buttons[12].pressed == false && remoteButtonFlag == true) {
                remoteButtonFlag = false;
                if (setRemoteControl == false) {
                    gpdMMInfo.setJoyX = 0;
                    gpdMMInfo.setJoyY = 0;
                    gpdMMInfo.setDirection = 0;
                    gpdMMInfo.setRemoteCont = 1;
                    gpdMMInfo.setAdStop = 0;
                    setRemoteControl = true;
                    SendDataChannel("remotetrue")
                } else if (setRemoteControl == true) {
                    setRemoteControl = false;
                    gpdMMInfo.setRemoteCont = 0;
                    gpdMMInfo.setAdStop = 1;
                }
            }

            cnt += 1;
            if (cnt % 6 == 0) {
                cnt = 0;
                if (dataConnection.open == false) {
                    console.log('DataConnection is not opened');
                } else if (dataConnection.open == true) {
                    dataConnection.send(gpdMMInfo);
                    console.log(gpdMMInfo);
                }
            }
            document.getElementById("set-rpm").textContent = gpdMMInfo.setJoyY * gpdMMInfo.setDirection;
            document.getElementById("set-steer").textContent = gpdMMInfo.setJoyX;
        }

        //***********MM Fin */

        if (vehicleSelecter == "SOCKMR1000A") {

            let displaySteer = Math.floor(usingController.axes[0] * 100);


            document.getElementById("set-remote-cont").textContent = (gpdMR1000AInfo.isRemoteCont).toString();
            document.getElementById("set-steer").textContent = (gpdMR1000AInfo.inputSteer).toString();
            document.getElementById("set-gear").textContent = (gpdMR1000AInfo.inputGear).toString();
            document.getElementById("set-rpm").textContent = (gpdMR1000AInfo.inputEngineCycle).toString();
            document.getElementById("set-shuttle").textContent = (gpdMR1000AInfo.inputShuttle).toString();
            document.getElementById("set-link-height").textContent = (gpdMR1000AInfo.inputPtoHeight).toString();
            document.getElementById("set-pto").textContent = (gpdMR1000AInfo.inputPtoOn).toString();
            document.getElementById("set-horn").textContent = (gpdMR1000AInfo.inputHorn).toString();
            document.getElementById("set-speed").textContent = (gpdMR1000AInfo.inputSpeed).toString();

            //Controller free zone tuning
            gpdMR1000AInfo.inputSteer = Math.floor(usingController.axes[0] * 100);
            if (gpdMR1000AInfo.inputSteer > 70) {
                gpdMR1000AInfo.inputSteer = 70;
            } else if (gpdMR1000AInfo.inputSteer < -70) {
                gpdMR1000AInfo.inputSteer = -70;
            }
            gpdMR1000AInfo.inputEngineCycle = Math.floor(usingController.axes[2] * 1000 - 1000) * (-1) + 800;

            if (usingController.buttons[2].pressed == true) {
                gpdMR1000AInfo.inputShuttle = 1;
                if (setRemoteControl === false) {
                    gpdMR1000AInfo.isAutoRunStart = 1;
                    console.log("Vehicle will move. Please attention...");
                }
            } else if (usingController.buttons[0].pressed == true) {
                gpdMR1000AInfo.inputShuttle = -1;
            } else if (usingController.buttons[1].pressed == true) {
                gpdMR1000AInfo.inputShuttle = 0;
                if (setRemoteControl === false) {
                    gpdMR1000AInfo.isAutoRunStart = 0;
                    console.log("Vehicle will stop");
                }
            }

            if (usingController.buttons[3].pressed == true) {
                ptoFlag = true;
                pto_Count += 1;
                gpdMR1000AInfo.inputPtoOn = 0;
            } else if (usingController.buttons[3].pressed == false && ptoFlag == true) {
                pto_Count = 0;
                ptoFlag = false;
            }
            if (pto_Count > 60) {
                gpdMR1000AInfo.inputPtoOn = 1;
            }

            if (usingController.buttons[8].pressed == true) {
                gpdMR1000AInfo.inputHorn = 1;
            } else if (usingController.buttons[8].pressed == false) {
                gpdMR1000AInfo.inputHorn = 0;
            }

            if (usingController.buttons[4].pressed == true) {
                upGearFlag = true;
            } else if (usingController.buttons[4].pressed == false && upGearFlag == true) {
                gpdMR1000AInfo.inputGear += 1;
                upGearFlag = false;
                if (gpdMR1000AInfo.inputGear > 8) {
                    gpdMR1000AInfo.inputGear = 8;
                }
            }

            if (usingController.buttons[5].pressed == true) {
                downGearFlag = true;
            } else if (usingController.buttons[5].pressed == false && downGearFlag == true) {
                gpdMR1000AInfo.inputGear -= 1;
                downGearFlag = false;
                if (gpdMR1000AInfo.inputGear < 1) {
                    gpdMR1000AInfo.inputGear = 1;
                }
            }

            if (usingController.axes[9] == -1) {
                upLinkFlag = true;
                max_upLinkCount += 1;
            } else if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && upLinkFlag == true) {
                max_upLinkCount = 0;
                upLinkFlag = false;
                gpdMR1000AInfo.inputPtoHeight += 5;
                if (gpdMR1000AInfo.inputPtoHeight > 100) {
                    gpdMR1000AInfo.inputPtoHeight = 100;
                }
            }
            if (max_upLinkCount > 60) {
                max_upLinkCount = 0;
                gpdMR1000AInfo.inputPtoHeight = 100;
            }
            if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && max_upLinkCount != 0) {
                max_upLinkCount = 0;
            }

            if (Math.floor(usingController.axes[9] * 10) / 10 == 0.1) {
                downLinkFlag = true;
                min_downLinkCount += 1;
            } else if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && downLinkFlag == true) {
                min_downLinkCount = 0;
                downLinkFlag = false;
                gpdMR1000AInfo.inputPtoHeight -= 5;
                if (gpdMR1000AInfo.inputPtoHeight < 0) {
                    gpdMR1000AInfo.inputPtoHeight = 0;
                }
            }
            if (min_downLinkCount > 60) {
                min_downLinkCount = 0;
                gpdMR1000AInfo.inputPtoHeight = 0;
            }
            if (Math.round(usingController.axes[9] * 10) / 10 == 1.3 && min_downLinkCount != 0) {
                min_downLinkCount = 0;
            }

            if (usingController.buttons[21].pressed == true) {
                speedUpFlag = true;
            } else if (usingController.buttons[21].pressed == false && speedUpFlag == true) {
                speedUpFlag = false;
                gpdMR1000AInfo.inputSpeed += 0.5;
                Math.floor(gpdMR1000AInfo.inputSpeed * 10) / 10;
                if (gpdMR1000AInfo.inputSpeed > 10) {
                    gpdMR1000AInfo.inputSpeed = 10;
                }
            }
            if (usingController.buttons[22].pressed == true) {
                speedDownFlag = true;
            } else if (usingController.buttons[22].pressed == false && speedDownFlag == true) {
                speedDownFlag = false;
                gpdMR1000AInfo.inputSpeed -= 0.5;
                Math.floor(Math.floor(gpdMR1000AInfo.inputSpeed * 10) / 10);
                if (gpdMR1000AInfo.inputSpeed < 0) {
                    gpdMR1000AInfo.inputSpeed = 0;
                }
            }

            if (usingController.buttons[23].pressed == true) {
                remoteButtonFlag = true;
            }
            if (usingController.buttons[23].pressed == false && remoteButtonFlag == true) {
                remoteButtonFlag = false;
                if (setRemoteControl === false) {
                    gpdMR1000AInfo.inputGear = 1;
                    gpdMR1000AInfo.inputPtoOn = 0;
                    gpdMR1000AInfo.inputPtoHeight = 100;
                    gpdMR1000AInfo.inputShuttle = 0;
                    gpdMR1000AInfo.inputSpeed = 0;
                    gpdMR1000AInfo.isRemoteCont = 1;
                    setRemoteControl = true;
                } else if (setRemoteControl === true) {
                    gpdMR1000AInfo.isRemoteCont = 0;
                    gpdMR1000AInfo.isAutoRunStart = 0;
                    setRemoteControl = false;
                }
            }
            //console.log(document.getElementById("obs-det-inremote").checked);
            gpdMR1000AInfo.isUseSafetySensorInTeleDrive = Number(document.getElementById("obs-det-inremote").checked);

            //console.log(gpdMR1000AInfo);
            //Send gpdInfo by 10Hz
            cnt += 1;
            if (cnt % 6 == 0) {
                cnt = 0;
                if (dataConnection.open == false) {
                    console.log('DataConnection is not opened');
                } else if (dataConnection.open == true) {
                    dataConnection.send(gpdMR1000AInfo);
                    //console.log(usingController);
                }
            }
        }
        //console.log(supercnt);
        //console.log(Date.now());
        requestAnimationFrame(updateStatus);
    }, 1000 / 60);
}

function scangamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].index in controllers) {
                controllers[gamepads[i].index] = gamepads[i];
            } else {
                addgamepad(gamepads[i]);
            }
        }
    }
}

window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
    setInterval(scangamepads, 500);
}

callTrigger.addEventListener('click', function() {
    var IDEle = document.getElementById('their-id');
    var theirID = IDEle.value;
    mediaConnection = peer.call(theirID, null, {
        videoCodec: 'VP9'
    });
    setEventListener(mediaConnection);
    dataConnection = peer.connect(theirID);
    setEventListenerData(dataConnection);
});

var setEventListenerData = function(dataConnection) {
    dataConnection.once('open', function() {
        console.log('DataConnection Created');
        if (vehicleSelecter == "MR1000A") {
            gpdInfo.setGear = 1;
            gpdInfo.setPto = false;
            gpdInfo.setLinkHeight = 100;
            gpdInfo.setShuttle = "N";
        } else if (vehicleSelecter == "SOCKMR1000A") {
            gpdMR1000AInfo.inputGear = 1;
            gpdMR1000AInfo.inputPtoOn = 0;
            gpdMR1000AInfo.inputPtoHeight = 100;
            gpdMR1000AInfo.inputShuttle = 0;
        }
    });

    dataConnection.on('data', vehicleInfo => {

        console.log(vehicleInfo);
        if (typeof vehicleInfo == "string") {
            vehicleSelecter = vehicleInfo;
            document.getElementById("current-vehicle").textContent = vehicleSelecter;
            //console.log(vehicleInfo);
        }
        if (vehicleSelecter == "MR1000A") {
            /*if (vehicleInfo.Info == 1) {
                document.getElementById("engine-rpm").textContent = vehicleInfo.EngineRpm.toString();
                document.getElementById("dpf").textContent = vehicleInfo.DpfLv.toString();
                document.getElementById("engine-temperature").textContent = vehicleInfo.EngineTemp.toString();
                document.getElementById("engine-load").textContent = vehicleInfo.EngineLoad.toString();
                document.getElementById("fuel-amount").textContent = vehicleInfo.FuelAmo.toString();
            }
            else if (vehicleInfo.Info == 2) {
                //document.getElementById("speed").textContent = vehicleInfo.VehicleSpd.toString();
                document.getElementById("shuttle").textContent = vehicleInfo.Shuttle.toString();
                document.getElementById("main-gear").textContent = vehicleInfo.MainGear.toString();
                document.getElementById("sub-gear").textContent = vehicleInfo.SubGear.toString();
                document.getElementById("steer").textContent = vehicleInfo.Steer.toString();
            }
            else if (vehicleInfo.Info == 3) {
                console.log('Info3 arrived!!!!!!! It is uncorrect data!!!!!!!!!!!!!!!!!!!');
            }*/
            if (vehicleInfo.Info == 4) {
                fromAutorunInfo.latitude = vehicleInfo.latitude;
                fromAutorunInfo.longitude = vehicleInfo.longitude;
                document.getElementById("latitude").textContent = (fromAutorunInfo.latitude).toString();
                document.getElementById("longitude").textContent = (fromAutorunInfo.longitude).toString();
            } else if (vehicleInfo.Info == 5) {
                fromAutorunInfo.gpsSpeed = vehicleInfo.gpsSpeed;
                fromAutorunInfo.headingError = vehicleInfo.headingError;
                fromAutorunInfo.lateralError = vehicleInfo.lateralError;
                fromAutorunInfo.steer = vehicleInfo.steer;
                fromAutorunInfo.realSteer = vehicleInfo.realSteer;
                document.getElementById("speed").textContent = vehicleInfo.gpsSpeed.toString();
                document.getElementById("heading-error").textContent = (fromAutorunInfo.headingError).toString();
                document.getElementById("lateral-error").textContent = (fromAutorunInfo.lateralError).toString();
                document.getElementById("steer").textContent = (fromAutorunInfo.steer).toString();
            }
        }
        if (vehicleSelecter == "SOCKMR1000A") {
            fromRobotInfo.lat = vehicleInfo.lat;
            fromRobotInfo.lon = vehicleInfo.lon;
            fromRobotInfo.gnssQuality = vehicleInfo.gnssQuality;
            fromRobotInfo.gnssSpeed = vehicleInfo.gnssSpeed;
            fromRobotInfo.heading = vehicleInfo.heading;
            fromRobotInfo.headingError = vehicleInfo.headingError;
            fromRobotInfo.lateralError = vehicleInfo.lateralError;
            fromRobotInfo.steerAngle = vehicleInfo.steerAngle;
            fromRobotInfo.realSteerAngle = vehicleInfo.realSteerAngle;
            fromRobotInfo.stopStatus = vehicleInfo.stopStatus;
        }
    });

    dataConnection.on('close', function() {
        dataConnection.close();
    });
};
// 着信時にイベントリスナーをセットする関数: media
var setEventListener = function(mediaConnection) {
    mediaConnection.on('stream', function(stream) {
        remoteVideo = document.getElementById('their-video');
        remoteVideo.srcObject = stream;
        remoteVideo.play();
        init();
        animate();

    });
};

killRemoteTrigger.addEventListener("click", function() {
    if (dataConnection.open == true) {
        dataConnection.send("X");
        console.log('Mode is changed Hojo moving mode to manual mode.');
    } else if (dataConnection.open == false) {
        console.log("DataConnection is not undifined")
    }
});

closeTrigger.addEventListener('click', () => {
    mediaConnection.close(true);
    dataConnection.close(true), {
        once: true,
    };
});

initcanTrigger.addEventListener('click', () => {
    gpdInfo.setGear = 1;
    gpdInfo.setPto = false;
    gpdInfo.setLinkHeight = 100;
    gpdInfo.setShuttle = "N";
    SendDataChannel("Init");
    console.log('Init CAN');
});

RemoteStartTrigger.addEventListener('click', () => {
    gpdInfo.setGear = 1;
    gpdInfo.setPto = false;
    gpdInfo.setLinkHeight = 100;
    gpdInfo.setShuttle = "N";
    setRemoteControl = true;
    SendDataChannel("remotetrue");
    console.log('retmote control start');
});

RemoteStopTrigger.addEventListener('click', () => {
    setRemoteControl = false;
    SendDataChannel("remotefalse");
    console.log('retmote control stop');
});

ApllyTrigger.addEventListener("click", () => {
    forAutorunInfo.adjustSpeed = Number(VehicleAdjustSpeed.value).toFixed(1);
    if (forAutorunInfo.adjustSpeed > 10) {
        forAutorunInfo.adjustSpeed = 10;
        document.getElementById("adjust-speed").value = 10;
    } else if (forAutorunInfo.adjustSpeed < 0) {
        forAutorunInfo.adjustSpeed = 0;
        document.getElementById("adjust-speed").value = 0;
    }
    forAutorunInfo.adjustHitch = Math.floor(Number(VehicleAdjustHitch.value));
    if (forAutorunInfo.adjustHitch > 100) {
        forAutorunInfo.adjustHitch = 100;
        document.getElementById("adjust-hitch").value = 100;
    } else if (forAutorunInfo.adjustHitch < 0) {
        forAutorunInfo.adjustHitch = 0;
        document.getElementById("adjust-hitch").value = 0;
    }
    forAutorunInfo.adjustPto = VehicleAdjustPto.checked;
    //console.log(forAutorunInfo);
    SendDataChannel(forAutorunInfo);
})

VehicleStartTrigger.addEventListener("click", () => {
    SendDataChannel("vehiclestart");
    console.log("Vehicle will move. Please attention...");
})

VehicleStopTrigger.addEventListener("click", () => {
    SendDataChannel("vehiclestop");
    console.log("Vehicle will stop");
})

//着信処理: media
/*peer.on('call', async mc => {
    let mediaConnection = mc;
    mediaConnection.answer(localStream);
    setEventListenerMedia(mediaConnection);
});*/
//着信処理: data
peer.on('connection', function(dc) {
    dataConnection = dc;
    setEventListenerData(dataConnection);
});

setInterval(() => {
    let dimensionSelecterArray = document.getElementsByName("dimension-selecter");
    let checkedDimension = null;
    if (remoteVideo == null) {
        console.log("Remote video is not arrived");
        return 0;
    }
    for (let i = 0; i < dimensionSelecterArray.length; i++) {
        if (dimensionSelecterArray.item(i).checked) {
            checkedDimension = dimensionSelecterArray.item(i).value;
        }
    }
    if (checkedDimension == "2D") {
        console.log(fromRobotInfo.gnssSpeed);


        context2d.drawImage(remoteVideo, 0, 0, 1920, 1080);
        if (setRemoteControl === false) {
            context2d.setLineDash([]);
            context2d.lineWidth = 2;
            context2d.fillStyle = "red";
            context2d.font = "Italic 80px serif";
            context2d.fillText("AutoDriving Mode", 10, 1060);
            context2d.font = "Italic 80px serif";
            context2d.strokeStyle = "magenta";
            context2d.strokeText("AutoDriving Mode", 10, 1060);
        }
        if (setRemoteControl === true) {
            context2d.beginPath();
            context2d.strokeStyle = "cyan";
            context2d.lineWidth = 4;
            context2d.setLineDash([10, 10]);
            /*let usingLatForPix = fromAutorunInfo.lateralError;
            let latPix = 960 - 160 * usingLatForPix;
            if (latPix < 0) {
                latPix = 0;
            }
            else if (latPix > 1920) {
                latPix = 1920;
            }
            context2d.moveTo(960, 1060);
            context2d.lineTo(latPix, 1060);
            context2d.stroke();*/
            let usingHeadForPix = fromRobotInfo.headingError;
            /*if (usingHeadForPix == fromAutorunInfo.lateralError) {
                lateralCount++;
            }
            else if (usingHeadForPix != fromAutorunInfo.lateralError) {
                lateralCount = 0;
                lateralStopFlag = false;
            }
            if (lateralCount > 300) {
                lateralStopFlag = true;
            }*/

            if (usingHeadForPix < -90) {
                usingHeadForPix = -90;
            } else if (usingHeadForPix > 90) {
                usingHeadForPix = 90;
            }

            // if (lateralStopFlag == false) {
            let headPix = 960 - Math.floor(1060 * Math.sin((usingHeadForPix) * (Math.PI / 180)));
            context2d.beginPath();
            context2d.moveTo(960, 1060);
            context2d.lineTo(headPix, 320);
            //370 is 10m line point
            context2d.setLineDash([10, 10]);
            context2d.lineWidth = 10;
            context2d.stroke();

            context2d.setLineDash([]);
            context2d.lineWidth = 2;
            context2d.fillStyle = "red";
            context2d.font = "Italic 80px serif";
            context2d.fillText("TeleDriving Mode", 10, 1060);
            context2d.font = "Italic 80px serif";
            context2d.strokeStyle = "magenta";
            context2d.strokeText("TeleDriving Mode", 10, 1060);

            context2d.fillStyle = "blue";
            context2d.font = "Italic 80px serif";
            context2d.fillText(("Lateral Error : " + (Math.floor((fromRobotInfo.lateralError) * 100)).toString() + " cm"), 1200, 1060);
            context2d.font = "Italic 80px serif";
            context2d.strokeStyle = "cyan";
            context2d.strokeText(("Lateral Error : " + (Math.floor((fromRobotInfo.lateralError) * 100)).toString() + " cm"), 1200, 1060);

            //}
        }
        //context2d.strokeText(("Heading Error is " + (fromAutorunInfo.headingError).toString() + "deg"), 1200, 1000);

        context2d.beginPath();
        context2d.setLineDash([]);
        let usingPtoStatus = "OFF";
        if (gpdInfo.setPto == true) {
            usingPtoStatus = "ON"
        }
        if (gpdMR1000AInfo.inputPtoOn == true) {
            usingPtoStatus = "ON";
        }
        context2d.font = "Italic 48px serif";
        context2d.lineWidth = 2;
        context2d.fillStyle = "white";
        context2d.strokeStyle = "magenta";

        //if (typeof fromRobotInfo.gnssSpeed == "number") {
        context2d.fillText("Speed : " + ((fromRobotInfo.gnssSpeed).toString()) + " km/h", 10, 50);
        context2d.strokeText("Speed : " + ((fromRobotInfo.gnssSpeed).toString()) + " km/h", 10, 50);
        //}

        if (setRemoteControl == true) {
            context2d.fillText("Hitch Height : " + (gpdMR1000AInfo.inputPtoHeight).toString() + "%", 1470, 50);
            context2d.strokeText("Hitch Height : " + (gpdMR1000AInfo.inputPtoHeight).toString() + "%", 1470, 50);
            context2d.fillText("PTO : " + (usingPtoStatus).toString(), 1470, 105);
            context2d.strokeText("PTO : " + (usingPtoStatus).toString(), 1470, 105);
            context2d.fillText("Shuttle : " + (gpdMR1000AInfo.inputShuttle).toString(), 10, 165);
            context2d.strokeText("Shuttle : " + (gpdMR1000AInfo.inputShuttle).toString(), 10, 165);
            context2d.fillText("Set Speed : " + (gpdMR1000AInfo.inputSpeed).toString() + " km/h", 10, 105);
            context2d.strokeText("Set Speed : " + (gpdMR1000AInfo.inputSpeed).toString() + " km/h", 10, 105);

            //context2d.fillText("エンジン回転数 : " + (displayRpm).toString() + " rpm", 1330, 160);
            //context2d.strokeText("エンジン回転数 : " + (displayRpm).toString() + " rpm", 1330, 160);
            //context2d.fillText("主変速段 : " + (gpdInfo.setGear).toString(), 1470, 105);
            //context2d.strokeText("主変速段 : " + (gpdInfo.setGear).toString(), 1470, 105);
            //context2d.fillText("PTO : " + (usingPtoStatus).toString(), 10, 105);
            //context2d.strokeText("PTO : " + (usingPtoStatus).toString(), 10, 105);
            //context2d.fillText("リンク高さ : " + (gpdInfo.setLinkHeight).toString() + " % UP", 10, 50);
            //context2d.strokeText("リンク高さ : " + (gpdInfo.setLinkHeight).toString() + " % UP", 10, 50);
        }
        /*fromAutorunInfo.gpsSpeed += 1;
        if (fromAutorunInfo.gpsSpeed > 30) {
            fromAutorunInfo.gpsSpeed = 1;
        }
        displayRpm += 1;
        if (displayRpm > 2800) {
            displayRpm = 800;
        }
        */
        context2d.font = "Italic 64px serif";
        context2d.fillStyle = "yellow";
        context2d.strokeStyle = "orange";
        context2d.fillText("10m", 10, 400);
        context2d.fillText("5m", 30, 720);
        context2d.fillText("3m", 200, 820);
        context2d.strokeText("10m", 10, 400);
        context2d.strokeText("5m", 30, 720);
        context2d.strokeText("3m", 200, 820);
        context2d.setLineDash([]);
        context2d.stroke();

        //look ahead distance
        context2d.beginPath();
        context2d.strokeStyle = "black";
        context2d.setLineDash([10, 10]);
        context2d.lineWidth = 5;
        context2d.moveTo(860, 370);
        context2d.lineTo(1060, 370);
        /*context2d.moveTo(860, 460);
        context2d.lineTo(1060, 460);
        context2d.moveTo(860,550);
        context2d.lineTo(1060,550);*/
        context2d.stroke();

        context2d.beginPath();
        context2d.strokeStyle = "white";
        context2d.moveTo(960, 1060);
        context2d.lineTo(960, 370);
        context2d.lineWidth = 5;
        context2d.setLineDash([5, 5, 60, 5]);
        context2d.stroke();

        //lateral error right zone
        context2d.beginPath();
        /*context2d.moveTo(1240, 900);
        context2d.lineTo(1240, 800);
        context2d.moveTo(1390, 870);
        context2d.lineTo(1390, 770);
        context2d.moveTo(1525, 840);
        context2d.lineTo(1525, 740);
        context2d.moveTo(1630, 800);
        context2d.lineTo(1630, 700);
        context2d.moveTo(1690, 760);
        context2d.lineTo(1690, 660);
        //lateral error left 
        context2d.moveTo(680, 900);
        context2d.lineTo(680, 800);
        context2d.moveTo(530, 870);
        context2d.lineTo(530, 770);
        context2d.moveTo(395, 840);
        context2d.lineTo(395, 740);
        context2d.moveTo(290, 800);
        context2d.lineTo(290, 700);
        context2d.moveTo(230, 760);
        context2d.lineTo(230, 660);*/
        // Draw zone 5m
        context2d.setLineDash([5, 5, 10]);
        context2d.strokeStyle = "orange";
        context2d.moveTo(230, 710);
        context2d.quadraticCurveTo(960, 210, 1690, 710);
        context2d.strokeStyle = "red";
        context2d.moveTo(395, 790);
        context2d.quadraticCurveTo(960, 310, 1525, 790);
        context2d.stroke();

        //test
        /*fromAutorunInfo.headingError++;
        if (fromAutorunInfo.headingError > 90) {
            fromAutorunInfo.headingError = -90;
        }
        fromAutorunInfo.lateralError += 0.01;
        if (fromAutorunInfo.lateralError > 1) {
            fromAutorunInfo.lateralError = -1;
        }

        else if (checkedDimension == "3D") {
            console.log("Koujityu");
        }*/
    }

}, 17);

let fullCanvasTrigger = document.getElementById("fullcanvas-trigger");

fullCanvasTrigger.addEventListener("click", () => {
    canvas.hidden = "";
    canvas.requestFullscreen = canvas.requestFullscreen || canvas.mozRequestFullScreen || canvas.webkitRequestFullscreen || canvas.msRequestFullscreen;
    canvas.requestFullscreen().then(
        function() {
            console.log("Full Screen OK");
        },
        function(errorMessage) {
            console.log(`Full Screen failed => ${errorMessage}`);;
        }
    );
});

let toStreamTrigger = document.getElementById("tostream-trigger");
toStreamTrigger.addEventListener("click", () => {
    let canvasElt = document.querySelector('canvas');
    let canvasStream = canvasElt.captureStream(25);
    remoteVideo.srcObject = canvasStream;
});

var vrButton = VRButton;

// グローバル変数
var camera, scene, renderer, clock, sphere;
var video, texture;
//let localVideo = document.getElementById("js-local-video");

// 初期化関数
function init() {

    clock = new THREE.Clock();

    scene = new THREE.Scene();

    const light = new THREE.AmbientLight(0xffff00, 1);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    camera.layers.enable(1); // render left view when no stereo available
    //camera.position.set(0, 1.6, 0);
    //scene.add(camera);

    const panoSphereGeo = new THREE.SphereGeometry(6, 256, 256);
    const panoSphereMat = new THREE.MeshStandardMaterial({
        side: THREE.BackSide,
        displacementScale: -4.0
    });
    sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);

    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    // Webカメラから映像を取得するためのvideo要素を作成
    /*video = document.createElement('video');
    video.width = window.innerWidth;
    video.height = window.innerHeight;
    video.autoplay = true;
    video.playsInline = true;
  
    // getUserMediaを使って、Webカメラから映像を取得する
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 3840,
        height: 1920,
        frameRate: 30
      }
    }).then(function (stream) {
      video.srcObject = stream;
      localVideo.srcObject = stream;
      localVideo.autoplay = true;
      localVideo.playsInline = true;
    }).catch(function (err) {
      console.log("An error occurred: " + err);
    });*/

    // video要素をテクスチャとして読み込む
    texture = new THREE.VideoTexture(remoteVideo);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);



    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;

    // left ///////////////////////////////////
    /*
      const geometry1 = new THREE.SphereGeometry(500, 60, 40);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry1.scale(- 1, 1, 1);
    
      const uvs1 = geometry1.attributes.uv.array;
    
      for (let i = 0; i < uvs1.length; i += 2) {
    
        uvs1[i] *= 0.5;
    
      }
    
      const material1 = new THREE.MeshBasicMaterial({ map: texture });
    
      const mesh1 = new THREE.Mesh(geometry1, material1);
      mesh1.rotation.y = - Math.PI / 2;
      mesh1.layers.set(1); // display in left eye only
      scene.add(mesh1);
    
      // right /////////////////////////////////
    
      const geometry2 = new THREE.SphereGeometry(500, 60, 40);
      geometry2.scale(-1, 1, 1);
    
      const uvs2 = geometry2.attributes.uv.array;
    
      for (let i = 0; i < uvs2.length; i += 2) {
    
        uvs2[i] *= 0.5;
       // uvs2[i] += 0.5;
    
      }
    
      const material2 = new THREE.MeshBasicMaterial({ map: texture });
    
      const mesh2 = new THREE.Mesh(geometry2, material2);
      mesh2.rotation.y = - Math.PI / 2;
      mesh2.layers.set(2); // display in right eye only
      scene.add(mesh2);
    */
    //Single Display Mode 

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    //mesh.rotation.y = - Math.PI / 2;
    scene.add(mesh);


    ///////////////
    // レンダラーを作成
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    //let container = document.getElementById("conteiner");
    container.appendChild(renderer.domElement);
    container.hidden = "hidden";

    // ドキュメントにレンダラーを追加
    //document.body.appendChild(renderer.domElement);

    document.body.appendChild(VRButton.createButton(renderer));
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

// アニメーション関数
function animate() {
    renderer.setAnimationLoop(render);
}

// レンダリング関数
function render() {
    /*if (video.readyState === video.HAVE_ENOUGH_DATA) {
      texture.needsUpdate = true;
    }*/
    renderer.render(scene, camera);
}

// 初期化とアニメーションの開始

//init();
//animate();