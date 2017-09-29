const EventEmitter = require('events').EventEmitter;
const Aircon = require('./Aircon');

/**
 * 室温チェッカー
 * 
 * 発生するイベント
 * check: 室温の取得が完了した
 * change: 室温が変化した
 * stablize: 室温が安定した（一度だけ）
 */
class TemperatureChekcer extends EventEmitter {
    /**
     * 
     * @param {Aircon} aircon 
     * @param {config} settings 
     */
    constructor(aircon, settings) {
        super();
        this.aircon = aircon;
        this.currentTemperature = -100;
        this.currentSince = new Date();
        this.stabilized = false;
        
        this.options = Object.assign({
            interval: 600000,
            stablizedInterval: 3600000
        }, settings);
    }
    
    check() {
        this.aircon
            .currentTemperature()
            .then((temperature) => {
                if (isNaN(temperature)) {
                    // 取得できなかった
                } else {
                    if (this.currentTemperature !== temperature) {
                        this.currentSince = new Date();
                        this.stabilized = false;
                        this.emit('change', temperature);
                        console.log(`current temperature changed: ${temperature}`);
                    } else if (!this.stabilized && this.currentSince.getTime() <= new Date().getTime() - this.options.stablizedInterval) {
                        this.stabilized = true;                   
                        this.emit('stablize', temperature);     
                        console.log(`current temperature ${temperature} is stabilized from : ${this.currentSince}`);
                    }

                    this.currentTemperature = temperature;
                    this.emit('check', temperature);
                }
            });
    }

    watch() {
        setInterval(() => {
            this.check();
        }, this.options.interval)
        this.check();
    }
}

module.exports = TemperatureChekcer;