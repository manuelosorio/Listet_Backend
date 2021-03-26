import EmailTemplate from 'email-templates'
import { SmtpModel } from '../models/smtp.model';
import { EmailDataModel } from '../models/email-data.model';



export class Mailer {
  smtp;
  transporter;
  email
  constructor(smtp: SmtpModel) {
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
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendMail(sender, data: EmailDataModel, template?: string | 'verify-email' | 'reset-password') {
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
