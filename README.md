# Yaw VR Web


A component to control the Yaw VR motion simulator

For [A-Frame](https://aframe.io).

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|          |             |               |

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.9.2/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-yawvr-component@1.0.0/dist/aframe-yawvr-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity yawvr="foo: bar"></a-entity>
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
