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
    this._CLEARDISPLAY = 0x01;
    this._RETURNHOME = 0x02;
    this._ENTRYMODESET = 0x04;
    this._DISPLAYCONTROL = 0x08;
    this._CURSORSHIFT = 0x10;
    this._FUNCTIONSET = 0x20;
    this._SETCGRAMADDR = 0x40;
    this._SETDDRAMADDR = 0x80;

    // # flags for display entry mode
    this._ENTRYRIGHT = 0x00;
    this._ENTRYLEFT = 0x02;
    this._ENTRYSHIFTINCREMENT = 0x01;
    this._ENTRYSHIFTDECREMENT = 0x00;

    // # flags for display on/off control
    this._DISPLAYON = 0x04;
    this._DISPLAYOFF = 0x00;
    this._CURSORON = 0x02;
    this._CURSOROFF = 0x00;
    this._BLINKON = 0x01;
    this._BLINKOFF = 0x00;

    // # flags for display/cursor shift
    this._DISPLAYMOVE = 0x08;
    this._CURSORMOVE = 0x00;
    this._MOVERIGHT = 0x04;
    this._MOVELEFT = 0x00;

    // # flags for function set
    this._8BITMODE = 0x10;
    this._4BITMODE = 0x00;
    this._2LINE = 0x08;
    this._1LINE = 0x00;
    this._5x10DOTS = 0x04;
    this._5x8DOTS = 0x00;

    // Line addresses.
    this._LINEADDRESS = [0x80, 0xC0, 0x94, 0xD4];

    this._busNumber = busNumber;
    this._address = address;
    this._cols = cols;
    this._rows = rows;
    this._i2c = null;
    this._blinking = false;
    this._cursor = false;
    this._began = false;
  }

  get busNumber() {
    return this._busNumber;
  }

  get address() {
    return this._address;
  }

  get cols() {
    return this._cols;
  }

  get rows() {
    return this._rows;
  }

  get began() {
    return this._began;
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
    if (this._began) {
      throw new Error('The LCD is already initialized! You called begin() twice!');
    }
    this._i2c = i2c.openSync(this._busNumber);
    this._write4Sync(0x33, this.displayPorts.CMD); // initialization
    this._write4Sync(0x32, this.displayPorts.CMD); // initialization
    this._write4Sync(0x06, this.displayPorts.CMD); // initialization
    this._write4Sync(0x28, this.displayPorts.CMD); // initialization
    this._write4Sync(0x01, this.displayPorts.CMD); // initialization
    this._write4Sync(this._FUNCTIONSET | this._4BITMODE | this._2LINE | this._5x10DOTS, this.displayPorts.CMD); // 4 bit - 2 line 5x7 matrix
    this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON, this.displayPorts.CMD); // turn cursor off 0x0E to enable cursor
    this._writeSync(this._ENTRYMODESET | this._ENTRYLEFT, this.displayPorts.CMD); // shift cursor right
    this._writeSync(this._CLEARDISPLAY, this.displayPorts.CMD); // LCD clear
    this._writeSync(this.displayPorts.backlight, this.displayPorts.CHR); // Turn on backlight.
    this._began = true;
    return this;
  }

  beginAsync(cb) {
    if (this._began) {
      cb(new Error('The LCD is already initialized! You called begin() twice!'));
      return;
    }
    this._i2c = i2c.open(this._busNumber, async (err) => {
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
          await this._write4(this._FUNCTIONSET | this._4BITMODE | this._2LINE | this._5x10DOTS, this.displayPorts.CMD); // 4 bit - 2 line 5x7 matrix
          await this._write(this._DISPLAYCONTROL | this._DISPLAYON, this.displayPorts.CMD); // turn cursor off 0x0E to enable cursor
          await this._write(this._ENTRYMODESET | this._ENTRYLEFT, this.displayPorts.CMD); // shift cursor right
          await this._write(this._CLEARDISPLAY, this.displayPorts.CMD); // LCD clear
          await this._write(this.displayPorts.backlight, this.displayPorts.CHR); // Turn on backlight.
        } catch (e) {
          if (cb) {
            cb(e);
          }
          return;
        }
        this._began = true;
        if (cb) {
          cb();
        }
      }
    });
  }

  close() {
    return (new Promise((res, rej) => {
      this._i2c.close((err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  closeSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._i2c.closeSync();
  }

  closeAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._i2c.close(cb);
  }

  clear() {
    return this._write(this._CLEARDISPLAY, this.displayPorts.CMD);
  }

  clearSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._writeSync(this._CLEARDISPLAY, this.displayPorts.CMD);
  }

  clearAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._writeAsync(this._CLEARDISPLAY, this.displayPorts.CMD, cb);
  }

  /** set cursor to 0,0 */
  home() {
    return this._write(this._SETDDRAMADDR | 0x00, this.displayPorts.CMD);
  }

  homeSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._writeSync(this._SETDDRAMADDR | 0x00, this.displayPorts.CMD);
  }

  homeAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._writeAsync(this._SETDDRAMADDR | 0x00, this.displayPorts.CMD, cb);
  }

  /** set cursor pos, top left = 0,0 */
  setCursor(x, y) {
    const l = [0x00, 0x40, 0x14, 0x54];
    return this._write(this._SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD);
  }

  setCursorSync(x, y) {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    const l = [0x00, 0x40, 0x14, 0x54];
    return this._writeSync(this._SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD);
  }

  setCursorAsync(x, y, cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    const l = [0x00, 0x40, 0x14, 0x54];
    this._writeAsync(this._SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD, cb);
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
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    const str = _str.toString();
    for (let i = 0; i < str.length; i += 1) {
      const c = str[i].charCodeAt(0);
      this._writeSync(c, this.displayPorts.CHR);
    }
    return this;
  }

  async printAsync(_str, cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
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
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    const str = _str.toString();
    if (line < this._rows) {
      this._writeSync(this._LINEADDRESS[line], this.displayPorts.CMD);
    }
    return this.printSync(str.substring(0, this._cols));
  }

  printLineAsync(line, _str, cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    const str = _str.toString();
    if (line < this._rows) {
      this._write(this._LINEADDRESS[line], this.displayPorts.CMD)
        .then(() => {
          this.printAsync(str.substring(0, this._cols), cb);
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
    return this._write(this._DISPLAYCONTROL | this._DISPLAYON | this._CURSORON | (this._blinking ? this._BLINKON : this._BLINKOFF), this.displayPorts.CMD);
  }

  cursorSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this._cursor = true;
    return this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON | this._CURSORON | (this._blinking ? this._BLINKON : this._BLINKOFF), this.displayPorts.CMD);
  }

  cursorAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._cursor = true;
    this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON | this._CURSORON | (this._blinking ? this._BLINKON : this._BLINKOFF), this.displayPorts.CMD, cb);
  }

  /** Turn block cursor off */
  noCursor() {
    this._cursor = false;
    return this._write(this._DISPLAYCONTROL | this._DISPLAYON | this._CURSOROFF | (this._blinking ? this._BLINKON : this._BLINKOFF), this.displayPorts.CMD);
  }

  noCursorSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this._cursor = false;
    return this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON | this._CURSOROFF | (this._blinking ? this._BLINKON : this._BLINKOFF), this.displayPorts.CMD);
  }

  noCursorAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._cursor = false;
    this._writeAsync(this._DISPLAYCONTROL | this._DISPLAYON | this._CURSOROFF | (this._blinking ? this._BLINKON : this._BLINKOFF), this.displayPorts.CMD, cb);
  }

  /** Turn underline cursor on */
  blink() {
    this._blinking = true;
    return this._write(this._DISPLAYCONTROL | this._DISPLAYON | (this._cursor ? this._CURSORON : this._CURSOROFF) | this._BLINKON, this.displayPorts.CMD);
  }

  blinkSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this._blinking = true;
    return this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON | (this._cursor ? this._CURSORON : this._CURSOROFF) | this._BLINKON, this.displayPorts.CMD);
  }

  blinkAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._blinking = true;
    this._writeAsync(this._DISPLAYCONTROL | this._DISPLAYON | (this._cursor ? this._CURSORON : this._CURSOROFF) | this._BLINKON, this.displayPorts.CMD, cb);
  }

  /** Turn underline cursor off */
  noBlink() {
    this._blinking = false;
    return this._write(this._DISPLAYCONTROL | this._DISPLAYON | (this._cursor ? this._CURSORON : this._CURSOROFF) | this._BLINKOFF, this.displayPorts.CMD);
  }

  noBlinkSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this._blinking = false;
    return this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON | (this._cursor ? this._CURSORON : this._CURSOROFF) | this._BLINKOFF, this.displayPorts.CMD);
  }

  noBlinkAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._blinking = false;
    this._writeAsync(this._DISPLAYCONTROL | this._DISPLAYON | (this._cursor ? this._CURSORON : this._CURSOROFF) | this._BLINKOFF, this.displayPorts.CMD, cb);
  }

  /** Turn display on */
  display() {
    this.displayPorts.backlight = 0x08;
    return this._write(this._DISPLAYCONTROL | this._DISPLAYON, this.displayPorts.CMD);
  }

  displaySync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this.displayPorts.backlight = 0x08;
    return this._writeSync(this._DISPLAYCONTROL | this._DISPLAYON, this.displayPorts.CMD);
  }

  displayAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this.displayPorts.backlight = 0x08;
    this._writeAsync(this._DISPLAYCONTROL | this._DISPLAYON, this.displayPorts.CMD, cb);
  }

  /** Turn display off */
  noDisplay() {
    this.displayPorts.backlight = 0x00;
    return this._write(this._DISPLAYCONTROL | this._DISPLAYOFF, this.displayPorts.CMD);
  }

  noDisplaySync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this.displayPorts.backlight = 0x00;
    return this._writeSync(this._DISPLAYCONTROL | this._DISPLAYOFF, this.displayPorts.CMD);
  }

  noDisplayAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this.displayPorts.backlight = 0x00;
    this._writeAsync(this._DISPLAYCONTROL | this._DISPLAYOFF, this.displayPorts.CMD, cb);
  }

  scrollDisplayLeft() {
    return this._write(this._CURSORSHIFT | this._DISPLAYMOVE | this._MOVELEFT);
  }

  scrollDisplayLeftSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._writeSync(this._CURSORSHIFT | this._DISPLAYMOVE | this._MOVELEFT);
  }

  scrollDisplayLeftAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._writeAsync(this._CURSORSHIFT | this._DISPLAYMOVE | this._MOVELEFT, cb);
  }

  scrollDisplayRight() {
    return this._write(this._CURSORSHIFT | this._DISPLAYMOVE | this._MOVERIGHT);
  }

  scrollDisplayRightSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._writeSync(this._CURSORSHIFT | this._DISPLAYMOVE | this._MOVERIGHT);
  }

  scrollDisplayRightAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._writeAsync(this._CURSORSHIFT | this._DISPLAYMOVE | this._MOVERIGHT, cb);
  }

  leftToRight() {
    return this._write(this._ENTRYMODESET | this._ENTRYLEFT);
  }

  leftToRightSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._writeSync(this._ENTRYMODESET | this._ENTRYLEFT);
  }

  leftToRightAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._writeAsync(this._ENTRYMODESET | this._ENTRYLEFT, cb);
  }

  rightToLeft() {
    return this._write(this._ENTRYMODESET | this._ENTRYRIGHT);
  }

  rightToLeftSync() {
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    return this._writeSync(this._ENTRYMODESET | this._ENTRYRIGHT);
  }

  rightToLeftAsync(cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._writeAsync(this._ENTRYMODESET | this._ENTRYRIGHT, cb);
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
    if (!this._began) {
      throw new Error('The LCD is not initialized! Call begin() before using any method!');
    }
    this._writeSync(this._SETCGRAMADDR | ((ch & 7) << 3), this.displayPorts.CMD);
    for (let i = 0; i < 8; i += 1) {
      this._writeSync(data[i], this.displayPorts.CHR);
    }
    return this._writeSync(this._SETDDRAMADDR, this.displayPorts.CMD);
  }

  createCharAsync(ch, data, cb) {
    if (!this._began) {
      cb(new Error('The LCD is not initialized! Call begin() before using any method!'));
      return;
    }
    this._write(this._SETCGRAMADDR | ((ch & 7) << 3), this.displayPorts.CMD)
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
        this._write(this._SETDDRAMADDR, this.displayPorts.CMD)
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
    this._i2c.sendByteSync(this._address, a | this.displayPorts.backlight | c);
    this._i2c.sendByteSync(this._address, a | this.displayPorts.E | this.displayPorts.backlight | c);
    this._i2c.sendByteSync(this._address, a | this.displayPorts.backlight | c);
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
      this._i2c.sendByte(this._address, x, (err) => {
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
