/**
 * @param firstName Recipient's First Name
 * @param lastName Recipient's Last Name
 * @param email Recipient's email
 * @param token token using
 */
export interface EmailData {
  firstName: string,
  lastName: string,
  email: string,
  token: string | '',
}
