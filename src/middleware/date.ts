export class DateUtil{
  date: any;
  constructor(date) {
    this.date = date;
  }
  months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  format() {
    const date = new Date(this.date);
    const month = this.months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return month + " " + day + ", " + year;
  }
}