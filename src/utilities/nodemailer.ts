import path from 'path';
import { fileURLToPath } from 'url';
import EmailTemplate, {
  EmailConfig,
  NodeMailerTransportOptions,
} from 'email-templates';
import { SmtpModel } from '#models/smtp.model';
import { EmailDataModel } from '#models/email-data.model';
import { join } from 'path';

export class Mailer {
  smtp: SmtpModel;
  transporter: NodeMailerTransportOptions;
  email: EmailTemplate;

  readonly filename = fileURLToPath(import.meta.url);
  readonly dirname = path.dirname(this.filename);

  private emailsRoot = join(this.dirname, '..', '..');
  private cssRoot = join(this.emailsRoot, 'css');
  constructor(smtp: SmtpModel) {
    this.transporter = {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure as boolean,
      pool: true,
      auth: {
        user: smtp.auth.username,
        pass: smtp.auth.password,
      },
    };
  }

  /**
   *
   * @param sender John Doe <sender@email.com>.
   * @param data Data used inside email templates.
   * @param template Corresponds to a directory inside of 'emails'.
   */

  sendMail(
    sender: any,
    data: EmailDataModel,
    template?: string | 'verify-email' | 'reset-password'
  ) {
    this.email = new EmailTemplate({
      views: {
        root: this.emailsRoot,
      },
      message: {
        from: sender,
      },
      send: true,
      transport: this.transporter,
      juice: true,
      juiceSettings: {
        tableElements: ['table'],
      },
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: this.cssRoot,
        },
      },
    } as EmailConfig);
    this.email
      .send({
        template,
        message: {
          to: `${data.firstName} ${data.lastName} <${data.email}>`,
        },
        locals: data,
      })
      .catch(err => {
        console.error(err);
      });
  }
}
