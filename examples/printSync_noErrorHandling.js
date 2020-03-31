const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
lcd.beginSync();
lcd.clearSync();
lcd.printSync('hello');
lcd.setCursorSync(0, 1);
lcd.printSync('world!');
