const Requester = require('./Requester');

class Aircon {
    constructor(host) {
        this.host = host;
    }

    /**
     * アダプタからのレスポンスをオブジェクトに変換する
     * @param {string} response - HTTPのレスポンスボディ
     * @return {object}
     */
	parseResponse(response) {
        const vals = {};
        if (response) {
            const items = response.split(',');
            const length = items.length;
            for (let i = 0; i < length; i++) {
                const keyVal = items[i].split('=');
                vals[keyVal[0]] = keyVal[1];
            }
        }
		return vals;
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
    
                        const controlRequest = new Requester(`http://${this.host}/aircon/set_control_info?${requestQuery}`);
                        controlRequest.get()
                            .then((body) => {
                                if (body.indexOf('ret=OK') !== -1) {
                                    resolve(Aircon.OPERATION.ACTIVE);
                                } else {
                                    resolve(Aircon.OPERATION.ERROR);
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

    sensorInfo() {
        return new Promise((resolve, reject) =>{
            const sensorRequest = new Requester(`http://${this.host}/aircon/get_sensor_info`);
            sensorRequest
                .get()
                .then((body) => {
                    const values = this.parseResponse(body);
                    resolve(values);
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