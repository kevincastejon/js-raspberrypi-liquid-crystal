const LCD = require('./index');

const lcd = new LCD(1, 0x3f, 16, 2);
let firstLine = '';
let lastFirstLine = '';
let secondLine = '';
let lastSecondLine = '';
const messages = [
  ['1111111111111111', 'AAAAAAAAAAAAAAAA'],
  ['2222222222222222', 'BBBBBBBBBBBBBBBB'],
  ['3333333333333333', 'CCCCCCCCCCCCCCCC'],
  ['4444444444444444', 'DDDDDDDDDDDDDDDD'],
];
let currentMessage = 0;
function displayMessage() {
  if (firstLine !== lastFirstLine || secondLine !== lastSecondLine) {
    lastFirstLine = firstLine;
    lastSecondLine = secondLine;
    lcd.clearAsync(() => {
      lcd.printlnAsync(firstLine, 1, () => {
        lcd.printlnAsync(secondLine, 2, () => {
          displayMessage();
        });
      });
    });
  } else {
    setTimeout(() => displayMessage(), 16);
  }
}

function onFrame() {
  const message = messages[currentMessage];
  const firstMsg = message[0];
  const secondMsg = message[1];
  firstLine = firstMsg;
  secondLine = secondMsg;
  currentMessage = currentMessage + 1 > messages.length - 1 ? 0 : currentMessage + 1;
}

lcd.clearAsync(() => {
  displayMessage();
});
setInterval(() => onFrame(), 100);
