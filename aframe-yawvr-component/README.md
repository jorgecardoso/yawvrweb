## aframe-yawvr-component

[![Version](http://img.shields.io/npm/v/aframe-yawvr-component.svg?style=flat-square)](https://npmjs.org/package/aframe-yawvr-component)
[![License](http://img.shields.io/npm/l/aframe-yawvr-component.svg?style=flat-square)](https://npmjs.org/package/aframe-yawvr-component)

A component to control the Yaw VR motion simulator. Rotation value applied to an entity are communicated to the Yaw VR Simulator by this component.

For [A-Frame](https://aframe.io).

__Tested only in the YawVR Emulator for now.__

### API

| Property | Description                                                                                                                                                                                                      | Default Value |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| appname  | The name of the app that will be registered in the simulator. To guarantee that only one instance controls the simulator, app names are appended with an UUID before registration.                               | 'myApp'       |
| rate     | The number of position messages sent to the simulator, per second.                                                                                                                                               | 10            |
| yawlimit     | Yaw limit (see Yaw VR Configuration software)                                                                                                                                                                    | 180           |
| pitchforwardlimit     | Pitch forward limit (see Yaw VR Configuration software)                                                                                                                                                          | 15            |
| pitchbackwardlimit     | Pitch backward limit (see Yaw VR Configuration software)                                                                                                                                                         | 55            |
| rolllimit     | Roll limit (see Yaw VR Configuration software)                                                                                                                                                                   | 20            |
| middlewareaddress     | Communication between the web XR app and the simulator requires a middleware. This is the address for that middleware. If empty, the component will use a service discovery server to try to find the middleware | ' '           |
| servicediscoveryaddress   | The address of a service discovery server that the middleware registers to. | 'https://hmd-link-service.glitch.me'   |


## Examples

https://jorgecardoso.github.io/yawvrweb/aframe-yawvr-component/examples/basic/

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-yawvr-component@0.7.0/dist/aframe-yawvr-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity yawvr animation="property: rotation; from: 0 -30 -45; to: 0 30 45; dur: 2000; loop: true; dir: alternate; easing: linear" ></a-entity>
  </a-scene>
</body>
```

#### npm

Install via npm:

```bash
npm install aframe-yawvr-component
```

Then require and use.

```js
require('aframe');
require('aframe-yawvr-component');
```
