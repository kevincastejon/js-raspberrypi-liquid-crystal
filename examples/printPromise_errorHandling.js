const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
lcd.begin()
  .then(() => lcd.clear())
  .catch((e) => console.log(e))
  .then(() => lcd.print('hello'))
  .catch((e) => console.log(e))
  .then(() => lcd.setCursor(0, 1))
  .catch((e) => console.log(e))
  .then(() => lcd.print('world!'))
  .catch((e) => console.log(e));
