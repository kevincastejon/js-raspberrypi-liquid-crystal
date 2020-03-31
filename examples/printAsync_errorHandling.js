const LCD = require('../index');

const lcd = new LCD(1, 0x3f, 16, 2);
lcd.beginAsync((err1) => {
  if (err1) {
    console.log(err1);
  } else {
    lcd.clearAsync((err2) => {
      if (err2) {
        console.log(err2);
      } else {
        lcd.printAsync('hello', (err3) => {
          if (err3) {
            console.log(err3);
          } else {
            lcd.setCursorAsync(0, 1, (err4) => {
              if (err4) {
                console.log(err4);
              } else {
                lcd.printAsync('world!', (err5) => {
                  if (err5) {
                    console.log(err5);
                  }
                });
              }
            });
          }
        });
      }
    });
  }
});
