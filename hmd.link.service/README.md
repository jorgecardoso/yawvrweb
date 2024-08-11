# HMD.link Service

Inspired by the link sharing [hmd.link](mattrossman/hmd-link), the hmd.link.service allows sharing services through a REST interface to be consumed through JavaScript.
 
This implementation does not use any persistence so services should announce themselves periodically.

Test server at https://hmd-link-service.glitch.me

## API


| Endpoint | Method | Description                                                                                                                                         |
|------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `/`  | GET    | Returns JSON list of services currently registered at same public IP as requester.                                                                  |
| `/<servicename>/<serviceaddress>/` | GET | Sets or updates a service under the requester's public IP. Records are eliminated by the server automatically (default TIME_TO_LIVE is 10 minutes). |

### JSON Format

```json
{
  "<servicename1>":
    {
      "address":"<URL>",
      "timestamp":<number>
    },
  "<servicename2>":
   {
      "address":"<URL>",
      "timestamp":<number>
   }
}
```

`timestamp` is the server's timestamp of the last service's update.

