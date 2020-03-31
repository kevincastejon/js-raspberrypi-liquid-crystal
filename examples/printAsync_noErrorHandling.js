const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
lcd.beginAsync(() => {
  lcd.clearAsync(() => {
    lcd.printAsync('hello', () => {
      lcd.setCursorAsync(0, 1, () => {
        lcd.printAsync('world!');
      });
    });
  });
});
