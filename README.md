# Yaw VR Web

A set of components to control the Yaw VR motion simulator through WebXR/web applications.

## Middleware
The middleware is the bridge between the WebXR/web app and the simulator. It "converts" HTTP messages sent by the web app into TCP/UCP messages to the simulator.

[Middleware README](middleware/README.md)

## HMD Link Service

This component is not strictly necessary, but makes it easier to set up the web app without static addresses.
The Middleware registers itself in this service discovery server allowing web apps to discover the address of the middleware.

[HMD Link Service README](hmd.link.service/README.md)

## A-Frame YawVR Component

A component for A-Frame WebXR framework. The components reads rotation values from an entity and forwards it to the simulator.

[A-Frame YawVR Component README](aframe-yawvr-component/README.md)