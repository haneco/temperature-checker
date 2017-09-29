'use strict';

const Requester = require('./lib/Requester');
const MailSender = require('./lib/MailSender');
const Aircon = require('./lib/Aircon');
const TemperatureChekcer = require('./lib/TemperatureChekcer');
const config = require('config');

const aircon = new Aircon(config.host);
const tempChekcer = new TemperatureChekcer(aircon, config.watchSettings);
tempChekcer.on('change', (temperature) => {    
    const highThreshold = config.temperatureThreshold.high;
    const lowThreshold = config.temperatureThreshold.low;

    if (temperature >= highThreshold || temperature <= lowThreshold) {
        const mode = (temperature >= highThreshold) ? Aircon.MODE.COOLING : Aircon.MODE.HEATING;
        const modeString = (temperature >= highThreshold) ? '冷房' : '暖房';
        const targetTemperature = (temperature >= highThreshold) ? config.targetTemperature.cooling : config.targetTemperature.heating;
        
        aircon.startOperation(mode, targetTemperature)
            .then((result) => {
                if (result === Aircon.OPERATION.ACTIVE) {
                    const mailer = new MailSender(config.mailSettings);
                    mailer.send(`${modeString}運転開始`, `${modeString}の運転を開始しました。`);
                }
            });
    }
});

tempChekcer.on('stabilize', (temperature) => {    
    if (temperature >= 28 || temperature <= 18) {
        aircon.stopOperation()
            .then((result) => {
                if (result === Aircon.OPERATION.INACTIVE) {
                    const mailer = new MailSender(config.mailSettings);
                    mailer.send(
                        'エアコン運転停止',
                        `同じ室温のまま、設定された時間を経過したためエアコンの運転を停止しました。現在の室温は${temparature}です。`);
                }
            });
    }
});

tempChekcer.watch();

