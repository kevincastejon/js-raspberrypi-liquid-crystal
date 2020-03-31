const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
lcd.begin()
  .then(() => lcd.clear())
  .then(() => lcd.print('hello'))
  .then(() => lcd.setCursor(0, 1))
  .then(() => lcd.print('world!'));
