'use strict';

const http = require('http');
const Requester = require('./lib/Requester');
const MailSender = require('./lib/MailSender');
const Aircon = require('./lib/Aircon');
const SensorChecker = require('./lib/SensorChecker');
const config = require('config');

const aircon = new Aircon(config.host);
const sensorChecker = new SensorChecker(aircon, config.watchSettings);
sensorChecker.on('change', (temperature) => {    
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

sensorChecker.on('check', (sensorValues) => {    
    // データベースが設定されている場合はデータを記録する
    if (config.database !== undefined) {
        const db = config.database;
        const timestamp = +(new Date()) * 1000000;
        const data = `temperature,location=${config.location} value=${sensorValues.htemp} ${timestamp}
temperature,location=${config.locationOutdoor} value=${sensorValues.otemp} ${timestamp}`;
        const options = {
            host: db.host,
            port: db.port,
            path: `/write?db=${db.dbname}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        const request = http.request(options, (response) => {
            response.setEncoding('utf8');
            response.on('data', (responseData) => {
                console.log(responseData);
            });
        });
        request.on('error', (error) => {
            console.log(error.message);
        });
        request.write(data);
        request.end();
    }
});
sensorChecker.on('stabilize', (temperature) => {    
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

sensorChecker.watch();

