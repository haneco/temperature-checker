const nodemailer = require('nodemailer');
class MailSender {
    constructor(settings) {
        this.options = Object.assign({}, settings);
    }

    send(subject, body) {
        nodemailer.createTestAccount((err, account) => {
            const transporter = nodemailer.createTransport(this.options.smtp);
            const mailOptions = {
                from: this.options.from,
                to: this.options.to,
                subject: subject,
                text: body
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
            });
        });
    }
}

module.exports = MailSender;