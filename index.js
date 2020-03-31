/**
 * raspberrypi-i2c-lcd - Control i2c lcd screens with a Raspberry Pi using the i2c-bus module with using PCF8574 I2C port expander
 * https://github.com/kevincastejon/js-raspberrypi-i2c-lcd
 */
const i2c = require('i2c-bus');
const sleep = require('sleep');

const LCD = class LCD {
  constructor(busNumber, address, cols, rows) {
    this.displayPorts = {
      RS: 0x01,
      E: 0x04,
      D4: 0x10,
      D5: 0x20,
      D6: 0x40,
      D7: 0x80,

      CHR: 1,
      CMD: 0,

      backlight: 0x08,
      RW: 0x20, // not used
    };

    // commands
    this.CLEARDISPLAY = 0x01;
    this.RETURNHOME = 0x02;
    this.ENTRYMODESET = 0x04;
    this.DISPLAYCONTROL = 0x08;
    this.CURSORSHIFT = 0x10;
    this.FUNCTIONSET = 0x20;
    this.SETCGRAMADDR = 0x40;
    this.SETDDRAMADDR = 0x80;

    // # flags for display entry mode
    this.ENTRYRIGHT = 0x00;
    this.ENTRYLEFT = 0x02;
    this.ENTRYSHIFTINCREMENT = 0x01;
    this.ENTRYSHIFTDECREMENT = 0x00;

    // # flags for display on/off control
    this.DISPLAYON = 0x04;
    this.DISPLAYOFF = 0x00;
    this.CURSORON = 0x02;
    this.CURSOROFF = 0x00;
    this.BLINKON = 0x01;
    this.BLINKOFF = 0x00;

    // # flags for display/cursor shift
    this.DISPLAYMOVE = 0x08;
    this.CURSORMOVE = 0x00;
    this.MOVERIGHT = 0x04;
    this.MOVELEFT = 0x00;

    // # flags for function set
    this._8BITMODE = 0x10;
    this._4BITMODE = 0x00;
    this._2LINE = 0x08;
    this._1LINE = 0x00;
    this._5x10DOTS = 0x04;
    this._5x8DOTS = 0x00;

    // Line addresses.
    this.LINEADDRESS = [0x80, 0xC0, 0x94, 0xD4];

    this.busNumber = busNumber;
    this.address = address;
    this.cols = cols;
    this.rows = rows;
    this.i2c = null;
    this._blinking = false;
    this._cursor = false;
  }

  begin() {
    return (new Promise((res, rej) => {
      this.beginAsync((err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  beginSync() {
    this.i2c = i2c.openSync(this.busNumber);
    this._write4Sync(0x33, this.displayPorts.CMD); // initialization
    this._write4Sync(0x32, this.displayPorts.CMD); // initialization
    this._write4Sync(0x06, this.displayPorts.CMD); // initialization
    this._write4Sync(0x28, this.displayPorts.CMD); // initialization
    this._write4Sync(0x01, this.displayPorts.CMD); // initialization
    this._write4Sync(this.FUNCTIONSET | this._4BITMODE | this._2LINE | this._5x10DOTS, this.displayPorts.CMD); // 4 bit - 2 line 5x7 matrix
    this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD); // turn cursor off 0x0E to enable cursor
    this._writeSync(this.ENTRYMODESET | this.ENTRYLEFT, this.displayPorts.CMD); // shift cursor right
    this._writeSync(this.CLEARDISPLAY, this.displayPorts.CMD); // LCD clear
    this._writeSync(this.displayPorts.backlight, this.displayPorts.CHR); // Turn on backlight.
    return this;
  }

  beginAsync(cb) {
    this.i2c = i2c.open(this.busNumber, async (err) => {
      if (err) {
        if (cb) {
          cb(err);
        }
      } else {
        try {
          await this._write4(0x33, this.displayPorts.CMD); // initialization
          await this._write4(0x32, this.displayPorts.CMD); // initialization
          await this._write4(0x06, this.displayPorts.CMD); // initialization
          await this._write4(0x28, this.displayPorts.CMD); // initialization
          await this._write4(0x01, this.displayPorts.CMD); // initialization
          await this._write4(this.FUNCTIONSET | this._4BITMODE | this._2LINE | this._5x10DOTS, this.displayPorts.CMD); // 4 bit - 2 line 5x7 matrix
          await this._write(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD); // turn cursor off 0x0E to enable cursor
          await this._write(this.ENTRYMODESET | this.ENTRYLEFT, this.displayPorts.CMD); // shift cursor right
          await this._write(this.CLEARDISPLAY, this.displayPorts.CMD); // LCD clear
          await this._write(this.displayPorts.backlight, this.displayPorts.CHR); // Turn on backlight.
        } catch (e) {
          if (cb) {
            cb(e);
          }
          return;
        }
        if (cb) {
          cb();
        }
      }
    });
  }

  close() {
    return (new Promise((res, rej) => {
      this.i2c.close((err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  closeSync() {
    return this.i2c.closeSync();
  }

  closeAsync(cb) {
    this.i2c.close(cb);
  }

  clear() {
    return this._write(this.CLEARDISPLAY, this.displayPorts.CMD);
  }

  clearSync() {
    return this._writeSync(this.CLEARDISPLAY, this.displayPorts.CMD);
  }

  clearAsync(cb) {
    this._writeAsync(this.CLEARDISPLAY, this.displayPorts.CMD, cb);
  }

  /** set cursor to 0,0 */
  home() {
    return this._write(this.SETDDRAMADDR | 0x00, this.displayPorts.CMD);
  }

  homeSync() {
    return this._writeSync(this.SETDDRAMADDR | 0x00, this.displayPorts.CMD);
  }

  homeAsync(cb) {
    this._writeAsync(this.SETDDRAMADDR | 0x00, this.displayPorts.CMD, cb);
  }

  /** set cursor pos, top left = 0,0 */
  setCursor(x, y) {
    const l = [0x00, 0x40, 0x14, 0x54];
    return this._write(this.SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD);
  }

  setCursorSync(x, y) {
    const l = [0x00, 0x40, 0x14, 0x54];
    return this._writeSync(this.SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD);
  }

  setCursorAsync(x, y, cb) {
    const l = [0x00, 0x40, 0x14, 0x54];
    this._writeAsync(this.SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD, cb);
  }

  print(_str) {
    return (new Promise((res, rej) => {
      this.printAsync(_str, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  printSync(_str) {
    const str = _str.toString();
    for (let i = 0; i < str.length; i += 1) {
      const c = str[i].charCodeAt(0);
      this._writeSync(c, this.displayPorts.CHR);
    }
    return this;
  }

  async printAsync(_str, cb) {
    const str = _str.toString();
    for (let i = 0; i < str.length; i += 1) {
      const c = str[i].charCodeAt(0);
      try {
        await this._write(c, this.displayPorts.CHR);
      } catch (e) {
        if (cb) {
          cb(e);
        }
        return;
      }
    }
    if (cb) {
      cb();
    }
  }

  printLine(line, _str) {
    return (new Promise((res, rej) => {
      this.printLineAsync(line, _str, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  printLineSync(line, _str) {
    const str = _str.toString();
    if (line < this.rows) {
      this._writeSync(this.LINEADDRESS[line], this.displayPorts.CMD);
    }
    return this.printSync(str.substring(0, this.cols));
  }

  printLineAsync(line, _str, cb) {
    const str = _str.toString();
    if (line < this.rows) {
      this._write(this.LINEADDRESS[line], this.displayPorts.CMD)
        .then(() => {
          this.printAsync(str.substring(0, this.cols), cb);
        })
        .catch((e) => {
          if (cb) {
            cb(e);
          }
        });
    }
  }

  /** Turn block cursor on */
  cursor() {
    this._cursor = true;
    return this._write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | (this._blinking ? this.BLINKON : this.BLINKOFF), this.displayPorts.CMD);
  }

  cursorSync() {
    this._cursor = true;
    return this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | (this._blinking ? this.BLINKON : this.BLINKOFF), this.displayPorts.CMD);
  }

  cursorAsync(cb) {
    this._cursor = true;
    this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | (this._blinking ? this.BLINKON : this.BLINKOFF), this.displayPorts.CMD, cb);
  }

  /** Turn block cursor off */
  noCursor() {
    this._cursor = false;
    return this._write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | (this._blinking ? this.BLINKON : this.BLINKOFF), this.displayPorts.CMD);
  }

  noCursorSync() {
    this._cursor = false;
    return this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | (this._blinking ? this.BLINKON : this.BLINKOFF), this.displayPorts.CMD);
  }

  noCursorAsync(cb) {
    this._cursor = false;
    this._writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | (this._blinking ? this.BLINKON : this.BLINKOFF), this.displayPorts.CMD, cb);
  }

  /** Turn underline cursor on */
  blink() {
    this._blinking = true;
    return this._write(this.DISPLAYCONTROL | this.DISPLAYON | (this._cursor ? this.CURSORON : this.CURSOROFF) | this.BLINKON, this.displayPorts.CMD);
  }

  blinkSync() {
    this._blinking = true;
    return this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON | (this._cursor ? this.CURSORON : this.CURSOROFF) | this.BLINKON, this.displayPorts.CMD);
  }

  blinkAsync(cb) {
    this._blinking = true;
    this._writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | (this._cursor ? this.CURSORON : this.CURSOROFF) | this.BLINKON, this.displayPorts.CMD, cb);
  }

  /** Turn underline cursor off */
  noBlink() {
    this._blinking = false;
    return this._write(this.DISPLAYCONTROL | this.DISPLAYON | (this._cursor ? this.CURSORON : this.CURSOROFF) | this.BLINKOFF, this.displayPorts.CMD);
  }

  noBlinkSync() {
    this._blinking = false;
    return this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON | (this._cursor ? this.CURSORON : this.CURSOROFF) | this.BLINKOFF, this.displayPorts.CMD);
  }

  noBlinkAsync(cb) {
    this._blinking = false;
    this._writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | (this._cursor ? this.CURSORON : this.CURSOROFF) | this.BLINKOFF, this.displayPorts.CMD, cb);
  }

  /** Turn display on */
  display() {
    this.displayPorts.backlight = 0x08;
    return this._write(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD);
  }

  displaySync() {
    this.displayPorts.backlight = 0x08;
    return this._writeSync(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD);
  }

  displayAsync(cb) {
    this.displayPorts.backlight = 0x08;
    this._writeAsync(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD, cb);
  }

  /** Turn display off */
  noDisplay() {
    this.displayPorts.backlight = 0x00;
    return this._write(this.DISPLAYCONTROL | this.DISPLAYOFF, this.displayPorts.CMD);
  }

  noDisplaySync() {
    this.displayPorts.backlight = 0x00;
    return this._writeSync(this.DISPLAYCONTROL | this.DISPLAYOFF, this.displayPorts.CMD);
  }

  noDisplayAsync(cb) {
    this.displayPorts.backlight = 0x00;
    this._writeAsync(this.DISPLAYCONTROL | this.DISPLAYOFF, this.displayPorts.CMD, cb);
  }

  scrollDisplayLeft() {
    return this._write(this.CURSORSHIFT | this.DISPLAYMOVE | this.MOVELEFT);
  }

  scrollDisplayLeftSync() {
    return this._writeSync(this.CURSORSHIFT | this.DISPLAYMOVE | this.MOVELEFT);
  }

  scrollDisplayLeftAsync(cb) {
    this._writeAsync(this.CURSORSHIFT | this.DISPLAYMOVE | this.MOVELEFT, cb);
  }

  scrollDisplayRight() {
    return this._write(this.CURSORSHIFT | this.DISPLAYMOVE | this.MOVERIGHT);
  }

  scrollDisplayRightSync() {
    return this._writeSync(this.CURSORSHIFT | this.DISPLAYMOVE | this.MOVERIGHT);
  }

  scrollDisplayRightAsync(cb) {
    this._writeAsync(this.CURSORSHIFT | this.DISPLAYMOVE | this.MOVERIGHT, cb);
  }

  leftToRight() {
    return this._write(this.ENTRYMODESET | this.ENTRYLEFT);
  }

  leftToRightSync() {
    return this._writeSync(this.ENTRYMODESET | this.ENTRYLEFT);
  }

  leftToRightAsync(cb) {
    this._writeAsync(this.ENTRYMODESET | this.ENTRYLEFT, cb);
  }

  rightToLeft() {
    return this._write(this.ENTRYMODESET | this.ENTRYRIGHT);
  }

  rightToLeftSync() {
    return this._writeSync(this.ENTRYMODESET | this.ENTRYRIGHT);
  }

  rightToLeftAsync(cb) {
    this._writeAsync(this.ENTRYMODESET | this.ENTRYRIGHT, cb);
  }

  /** set special character 0..7, data is an array(8) of bytes, and then return to home addr */
  createChar(ch, data) {
    return (new Promise((res, rej) => {
      this.createCharAsync(ch, data, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  createCharSync(ch, data) {
    this._writeSync(this.SETCGRAMADDR | ((ch & 7) << 3), this.displayPorts.CMD);
    for (let i = 0; i < 8; i += 1) {
      this._writeSync(data[i], this.displayPorts.CHR);
    }
    return this._writeSync(this.SETDDRAMADDR, this.displayPorts.CMD);
  }

  createCharAsync(ch, data, cb) {
    this._write(this.SETCGRAMADDR | ((ch & 7) << 3), this.displayPorts.CMD)
      .then(async () => {
        for (let i = 0; i < 8; i += 1) {
          try {
            await this._write(data[i], this.displayPorts.CHR);
          } catch (e) {
            if (cb) {
              cb(e);
            }
            return;
          }
        }
        this._write(this.SETDDRAMADDR, this.displayPorts.CMD)
          .then(() => {
            if (cb) {
              cb();
            }
          }).catch((e) => {
            if (cb) {
              cb(e);
            }
          });
      })
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      });
  }

  _write(x, c) {
    return (new Promise((res, rej) => {
      this._writeAsync(x, c, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  _writeSync(x, c) {
    this._write4Sync(x, c);
    this._write4Sync(x << 4, c);
    return this;
  }

  _writeAsync(x, c, cb) {
    this._write4(x, c)
      .then(() => (this._write4(x << 4, c)))
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      })
      .then(() => {
        if (cb) {
          cb();
        }
      })
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      });
  }

  _write4(x, c) {
    return (new Promise((res, rej) => {
      this._write4Async(x, c, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  _write4Sync(x, c) {
    const a = (x & 0xF0); // Use upper 4 bit nibble
    this.i2c.sendByteSync(this.address, a | this.displayPorts.backlight | c);
    this.i2c.sendByteSync(this.address, a | this.displayPorts.E | this.displayPorts.backlight | c);
    this.i2c.sendByteSync(this.address, a | this.displayPorts.backlight | c);
    sleep.usleep(2000);
    return (this);
  }

  _write4Async(x, c, cb) {
    const a = (x & 0xF0); // Use upper 4 bit nibble
    this._sendByte(a | this.displayPorts.backlight | c)
      .then(() => (this._sendByte(a | this.displayPorts.E | this.displayPorts.backlight | c)))
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      })
      .then(() => (this._sendByte(a | this.displayPorts.backlight | c)))
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      })
      .then(() => {
        if (cb) {
          cb();
        }
      }, (e) => {
        if (cb) {
          cb(e);
        }
      });
  }

  _sendByte(x) {
    return (new Promise((res, rej) => {
      this.i2c.sendByte(this.address, x, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }
};
module.exports = LCD;
