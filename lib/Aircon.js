const Requester = require('./Requester');

class Aircon {
    constructor(host) {
        this.host = host;
    }

    startOperation(mode, temperature) {
        return new Promise((resolve, reject) =>{
            const controlRequest = new Requester(`http://${this.host}/aircon/get_control_info`);
            controlRequest
                .get()
                .then((body) => {
                    const powerMatches = body.match(/pow=([^,]+)/);
                    const power = parseFloat(powerMatches[1]);
    
                    const modeMatches = body.match(/mode=([^,]+)/);
                    const currentMode = parseFloat(modeMatches[1]);
                    
                    if (power === '1' && currentMode === mode) {
                        console.log('aircon already oparating.');
                        resolve(Aircon.OPERATION.ALREADY);
                    } else {
                        const requestQuery = body.replace(/pow=[^,]+/, 'pow=1')
                            .replace(/mode=[^,]+/, `mode=${mode}`)
                            .replace(/stemp=[^,]+/, `stemp=${temperature}`)
                            .replace(new RegExp(`dt${mode}=[^,]+`), `dt${mode}=${temperature}`)
                            .replace(new RegExp(`dh${mode}=[^,]+`), `dh${mode}=50`)
                            .replace(/,/g, '&');
    
                        const controlRequest = new Requester(`http://${this.host}/aircon/get_control_info?${requestQuery}`);
                        controlRequest.get()
                            .then((body) => {
                                if (body.indexOf('ret=OK')) {
                                    resolve(Aircon.OPERATION.ACTIVE);
                                } else {
                                    resolve(Aircon.OPERATION.ERROR);
                                    console.log(body);
                                }
                            });
                    }
                });
        });
    }

    stopOperation() {
        return new Promise((resolve, reject) =>{
            const controlRequest = new Requester(`http://${this.host}/aircon/get_control_info`);
            controlRequest
                .get()
                .then((body) => {
                    const powerMatches = body.match(/pow=([^,]+)/);
                    const power = parseFloat(powerMatches[1]);
    
                    if (power === '0') {
                        console.log('aircon already stoped.');
                        resolve(Aircon.OPERATION.ALREADY);
                    } else {
                        const requestQuery = body.replace(/pow=[^,]+/, 'pow=0')
                            .replace(/,/g, '&');
                        const controlRequest = new Requester(`http://${this.host}/aircon/get_control_info?${requestQuery}`);
                        controlRequest.get()
                            .then((body) => {
                                if (body.indexOf('ret=OK')) {
                                    resolve(Aircon.OPERATION.INACTIVE);
                                } else {
                                    resolve(Aircon.OPERATION.ERROR);
                                    console.log(body);
                                }
                            });
                    }
                });
        });
    }

    currentTemperature() {
        return new Promise((resolve, reject) =>{
            const sensorRequest = new Requester(`http://${this.host}/aircon/get_sensor_info`);
            sensorRequest
                .get()
                .then((body) => {
                    const matches = body.match(/htemp=([^,]+)/);
                    const temperature = parseFloat(matches[1]);
                    resolve(temperature);
                });
        });
    }
}

Aircon.MODE = {
    COOLING: '3',
    MODE: '4'
};
Aircon.OPERATION = {
    ERROR: -1,
    INACTIVE: 0,
    ACTIVE: 1,
    ALREADY: 2
}
module.exports = Aircon;