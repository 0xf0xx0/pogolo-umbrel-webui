fork of umbrel-bitcoin, stripped down with claude for use with pogolo  
i hate frontend

includes the widget from pogolo-umbrel-widget

## Usage
### env vars
```
POGOLO_API_URL: http://10.21.21.9:5662 # pogolo's HTTP API
POGOLO_LOG: /data/pogolo.log # log file we tail for the live log stream
POGOLO_DIR: /data # where pogolo.toml lives
STRATUM_PORT: 5661 # shown in the connect modal

# CONNECTION DETAILS (shown to user in the connect modal)
DEVICE_DOMAIN_NAME: pogolo.on.umbrel.local
```
