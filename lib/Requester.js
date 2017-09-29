const http = require('http');

class Requester {
    constructor(url) {
        this.url = url;
    }

    get() {
        return new Promise((resolve, reject) =>{
            http.get(this.url, (response) => {
                let body = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    body += chunk;
                });
                response.on('end', () => {
                    resolve(body);
                });
            }).on('error', (error) => {
                console.log(error.message);
            });    
        });
    }
}
module.exports = Requester;