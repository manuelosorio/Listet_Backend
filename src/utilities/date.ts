export class DateUtil{
  date: any;
  constructor(date: Date) {
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
  getMonth() {
    return new Date(this.date).getMonth() + 1;
  }
  getYear() {
    return new Date(this.date).getFullYear();
  }

  setExpire(timeInMilliSeconds: number): Date {
    return new Date(this.date.getTime() + timeInMilliSeconds);
  }
  checkExpire(endDate: Date): boolean {
    return this.date >= endDate;
  }
}
