const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
async function test() {
  await lcd.begin();
  await lcd.clear();
  await lcd.print('hello');
  await lcd.setCursor(0, 1);
  await lcd.print('world!');
}
test();
