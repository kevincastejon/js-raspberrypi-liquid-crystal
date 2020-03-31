const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
lcd.beginSync()
  .clearSync()
  .printSync('hello')
  .setCursorSync(0, 1)
  .printSync('world!');
