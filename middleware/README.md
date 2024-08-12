# Yaw VR Web Middleware

A middleware to control the Yaw VR motion simulator through WebXR apps.

## Install
```bash
cd middleware
npm install
```

## Start
```bash
npm run start
```

The middleware accepts HTTPS request and currently uses a self-signed certificate, which triggers warnings on the browser. You need to accept the warning on the browser the first time you open the webpage (this also applies to the XR headset's browser).

If you deploy your own Service Discovery Server, you can change the URL in the Middleware in `package.json` run script.