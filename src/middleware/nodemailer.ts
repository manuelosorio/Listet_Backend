import {Smtp} from '../models/smtp';
import EmailTemplate from 'email-templates'
import {EmailData} from '../models/email-data';



export class Mailer {
  smtp;
  transporter;
  email
  constructor(smtp: Smtp) {
    this.smtp = smtp;
    this.transporter = {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.pool as boolean,
      auth: {
        user: smtp.auth.username,
        pass: smtp.auth.password
      },
    }
  }

  /**
   *
   * @param sender John Doe <sender@email.com>.
   * @param data Data used inside email templates.
   * @param template Corresponds to a directory inside of 'emails'.
   */
  sendMail(sender, data: EmailData, template?: string | 'verify-email' | 'reset-password') {
    this.email = new EmailTemplate({
      message: {
        from: sender
      },
      send: true,
      transport: this.transporter,
    });
    this.email.send({
      template,
      message: {
        to: `${data.firstName} ${data.lastName} <${data.email}>`
      },
      locals: data
    }).then(console.log)
      .catch(console.error);
  }
}
