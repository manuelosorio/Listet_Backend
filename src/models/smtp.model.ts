export interface SmtpModel {
  pool?: boolean,
  host: string,
  port: number,
  secure: boolean,
  auth: {
    username: string,
    password: string,
  },
  email: string,
}
