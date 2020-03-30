/**
 * lcdi2c.js - Add I2C LCD character display using PCF8574 I2C port expander.
 * https://github.com/wilberforce/lcd-pcf8574 but replaced calls to i2c library with
 * calls to i2c-bus. Currently, only works in synchronous output mode. Asynch mode does not work.
 * LCD i2c interface via PCF8574P
 * http://dx.com/p/lcd1602-adapter-board-w-iic-i2c-interface-black-works-with-official-arduino-boards-216865

 * https://gist.github.com/chrisnew/6725633
 * http://www.espruino.com/HD44780
 * http://www.espruino.com/LCD1602
 */
const i2c = require('i2c-bus');
// const sleep = require('sleep');

const LCD = class LCD {
  constructor(device, address, cols, rows) {
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

    this.device = device;
    this.address = address;
    this.cols = cols;
    this.rows = rows;
    this.i2c = null;
  }

  init() {
    return (new Promise((res, rej) => {
      this.initAsync((err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  initSync() {
    this.i2c = i2c.openSync(this.device);
    this.write4Sync(0x33, this.displayPorts.CMD); // initialization
    this.write4Sync(0x32, this.displayPorts.CMD); // initialization
    this.write4Sync(0x06, this.displayPorts.CMD); // initialization
    this.write4Sync(0x28, this.displayPorts.CMD); // initialization
    this.write4Sync(0x01, this.displayPorts.CMD); // initialization
    this.write4Sync(this.FUNCTIONSET | this._4BITMODE | this._2LINE | this._5x10DOTS, this.displayPorts.CMD); // 4 bit - 2 line 5x7 matrix
    this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD); // turn cursor off 0x0E to enable cursor
    this.writeSync(this.ENTRYMODESET | this.ENTRYLEFT, this.displayPorts.CMD); // shift cursor right
    this.writeSync(this.CLEARDISPLAY, this.displayPorts.CMD); // LCD clear
    this.writeSync(this.displayPorts.backlight, this.displayPorts.CHR); // Turn on backlight.
  }

  initAsync(cb) {
    this.i2c = i2c.open(this.device, async (err) => {
      if (err) {
        if (cb) {
          cb(err);
        }
      } else {
        try {
          await this.write4(0x33, this.displayPorts.CMD); // initialization
          await this.write4(0x32, this.displayPorts.CMD); // initialization
          await this.write4(0x06, this.displayPorts.CMD); // initialization
          await this.write4(0x28, this.displayPorts.CMD); // initialization
          await this.write4(0x01, this.displayPorts.CMD); // initialization
          await this.write4(this.FUNCTIONSET | this._4BITMODE | this._2LINE | this._5x10DOTS, this.displayPorts.CMD); // 4 bit - 2 line 5x7 matrix
          await this.write(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD); // turn cursor off 0x0E to enable cursor
          await this.write(this.ENTRYMODESET | this.ENTRYLEFT, this.displayPorts.CMD); // shift cursor right
          await this.write(this.CLEARDISPLAY, this.displayPorts.CMD); // LCD clear
          await this.write(this.displayPorts.backlight, this.displayPorts.CHR); // Turn on backlight.
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

  closeASync(cb) {
    this.i2c.close(cb);
  }

  write(x, c) {
    return (new Promise((res, rej) => {
      this.writeAsync(x, c, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  writeSync(x, c) {
    this.write4Sync(x, c);
    this.write4Sync(x << 4, c);
    return this;
  }


  writeAsync(x, c, cb) {
    this.write4(x, c)
      .then(() => (this.write4(x << 4, c)))
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

  writeBlock(x, c) {
    return (new Promise((res, rej) => {
      this.writeBlockAsync(x, c, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  writeBlockSync(x, c) {
    this.write4Block(x, c);
    return this.write4Block(x << 4, c);
  }

  writeBlockAsync(x, c, cb) {
    this.write4Block(x, c)
      .then(() => {
        this.write4BlockAsync(x << 4, cb);
      })
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      });
  }

  clear() {
    return this.write(this.CLEARDISPLAY, this.displayPorts.CMD);
  }

  clearSync() {
    return this.writeSync(this.CLEARDISPLAY, this.displayPorts.CMD);
  }

  clearAsync(cb) {
    this.writeAsync(this.CLEARDISPLAY, this.displayPorts.CMD, cb);
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
      this.writeSync(c, this.displayPorts.CHR);
    }
    return this;
  }

  async printAsync(_str, cb) {
    const str = _str.toString();
    for (let i = 0; i < str.length; i += 1) {
      const c = str[i].charCodeAt(0);
      try {
        await this.writeChar(c);
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

  writeChar(c) {
    return this.write(c, this.displayPorts.CHR);
  }

  writeCharSync(c) {
    return this.writeSync(c, this.displayPorts.CHR);
  }

  writeCharAsync(c, cb) {
    this.writeAsync(c, this.displayPorts.CHR, cb);
  }

  printBlock(_str) {
    return (new Promise((res, rej) => {
      this.printBlockAsync(_str, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  printBlockSync(_str) {
    const str = _str.toString();
    for (let i = 0; i < str.length; i += 1) {
      const c = str[i].charCodeAt(0);
      this.writeBlockSync(c, this.displayPorts.CHR);
    }
    return this;
  }

  async printBlockAsync(_str, cb) {
    const str = _str.toString();
    for (let i = 0; i < str.length; i += 1) {
      const c = str[i].charCodeAt(0);
      try {
        await this.writeBlock(c, this.displayPorts.CHR);
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

  println(_str, line) {
    return (new Promise((res, rej) => {
      this.printlnAsync(_str, line, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  printlnSync(_str, line) {
    const str = _str.toString();
    if (line < this.rows) {
      this.writeSync(this.LINEADDRESS[line], this.displayPorts.CMD);
    }
    return this.printSync(str.substring(0, this.cols));
  }

  printlnAsync(_str, line, cb) {
    const str = _str.toString();
    if (line < this.rows) {
      this.write(this.LINEADDRESS[line], this.displayPorts.CMD)
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

  /** flashing block for the current cursor */
  printlnBlock(_str, line) {
    return (new Promise((res, rej) => {
      this.printlnBlockAsync(_str, line, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  printlnBlockSync(_str, line) {
    const str = _str.toString();
    if (line > 0) {
      this.writeSync(this.LINEADDRESS[line - 1], this.displayPorts.CMD);
    }
    return this.printBlockSync(str.substring(0, this.cols));
  }

  printlnBlockAsync(_str, line, cb) {
    const str = _str.toString();
    if (line > 0) {
      this.writeAsync(this.LINEADDRESS[line - 1], this.displayPorts.CMD, (e) => {
        if (e) {
          if (cb) {
            cb();
          }
        } else {
          this.printBlockAsync(str.substring(0, this.cols), cb);
        }
      });
    }
  }

  cursorFull() {
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKON, this.displayPorts.CMD);
  }

  cursorFullSync() {
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKON, this.displayPorts.CMD);
  }

  cursorFullAsync(cb) {
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKON, this.displayPorts.CMD, cb);
  }

  /** small line under the current cursor */
  cursorUnder() {
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKOFF, this.displayPorts.CMD);
  }

  cursorUnderSync() {
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKOFF, this.displayPorts.CMD);
  }

  cursorUnderAsync(cb) {
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKOFF, this.displayPorts.CMD, cb);
  }

  /** set cursor pos, top left = 0,0 */
  setCursor(x, y) {
    const l = [0x00, 0x40, 0x14, 0x54];
    return this.write(this.SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD);
  }

  setCursorSync(x, y) {
    const l = [0x00, 0x40, 0x14, 0x54];
    return this.writeSync(this.SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD);
  }

  setCursorAsync(x, y, cb) {
    const l = [0x00, 0x40, 0x14, 0x54];
    this.writeAsync(this.SETDDRAMADDR | (l[y] + x), this.displayPorts.CMD, cb);
  }

  /** set cursor to 0,0 */
  home() {
    return this.write(this.SETDDRAMADDR | 0x00, this.displayPorts.CMD);
  }

  homeSync() {
    return this.writeSync(this.SETDDRAMADDR | 0x00, this.displayPorts.CMD);
  }

  homeAsync(cb) {
    this.writeAsync(this.SETDDRAMADDR | 0x00, this.displayPorts.CMD, cb);
  }

  /** Turn underline cursor off */
  blinkOff() {
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | this.BLINKOFF, this.displayPorts.CMD);
  }

  blinkOffSync() {
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | this.BLINKOFF, this.displayPorts.CMD);
  }

  blinkOffAsync(cb) {
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | this.BLINKOFF, this.displayPorts.CMD, cb);
  }

  /** Turn underline cursor on */
  blinkOn() {
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKOFF, this.displayPorts.CMD);
  }

  blinkOnSync() {
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKOFF, this.displayPorts.CMD);
  }

  blinkOnAsync(cb) {
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKOFF, this.displayPorts.CMD, cb);
  }

  /** Turn block cursor off */
  cursorOff() {
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | this.BLINKON, this.displayPorts.CMD);
  }

  cursorOffSync() {
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | this.BLINKON, this.displayPorts.CMD);
  }

  cursorOffAsync(cb) {
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSOROFF | this.BLINKON, this.displayPorts.CMD, cb);
  }

  /** Turn block cursor on */
  cursorOn() {
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKON, this.displayPorts.CMD);
  }

  cursorOnSync() {
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKON, this.displayPorts.CMD);
  }

  cursorOnAsync(cb) {
    this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON | this.CURSORON | this.BLINKON, this.displayPorts.CMD, cb);
  }

  /** setBacklight */
  setBacklight(val) {
    if (val > 0) {
      this.displayPorts.backlight = 0x08;
    } else {
      this.displayPorts.backlight = 0x00;
    }
    return this.write(this.DISPLAYCONTROL, this.displayPorts.CMD);
  }

  setBacklightSync(val) {
    if (val > 0) {
      this.displayPorts.backlight = 0x08;
    } else {
      this.displayPorts.backlight = 0x00;
    }
    return this.writeSync(this.DISPLAYCONTROL, this.displayPorts.CMD);
  }

  setBacklightAsync(val, cb) {
    if (val > 0) {
      this.displayPorts.backlight = 0x08;
    } else {
      this.displayPorts.backlight = 0x00;
    }
    this.writeAsync(this.DISPLAYCONTROL, this.displayPorts.CMD, cb);
  }

  /** Turn display off */
  off() {
    this.displayPorts.backlight = 0x00;
    return this.write(this.DISPLAYCONTROL | this.DISPLAYOFF, this.displayPorts.CMD);
  }

  offSync() {
    this.displayPorts.backlight = 0x00;
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYOFF, this.displayPorts.CMD);
  }

  offAsync(cb) {
    this.displayPorts.backlight = 0x00;
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYOFF, this.displayPorts.CMD, cb);
  }

  /** Turn display on */
  on() {
    this.displayPorts.backlight = 0x08;
    return this.write(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD);
  }

  onSync() {
    this.displayPorts.backlight = 0x08;
    return this.writeSync(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD);
  }

  onAsync(cb) {
    this.displayPorts.backlight = 0x08;
    this.writeAsync(this.DISPLAYCONTROL | this.DISPLAYON, this.displayPorts.CMD, cb);
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
    this.writeSync(this.SETCGRAMADDR | ((ch & 7) << 3), this.displayPorts.CMD);
    for (let i = 0; i < 8; i += 1) {
      this.writeSync(data[i], this.displayPorts.CHR);
    }
    return this.writeSync(this.SETDDRAMADDR, this.displayPorts.CMD);
  }

  createCharAsync(ch, data, cb) {
    this.write(this.SETCGRAMADDR | ((ch & 7) << 3), this.displayPorts.CMD)
      .then(async () => {
        for (let i = 0; i < 8; i += 1) {
          try {
            await this.write(data[i], this.displayPorts.CHR);
          } catch (e) {
            if (cb) {
              cb(e);
            }
            return;
          }
        }
        this.write(this.SETDDRAMADDR, this.displayPorts.CMD)
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

  write4(x, c) {
    return (new Promise((res, rej) => {
      this.write4Async(x, c, (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    }));
  }

  write4Sync(x, c) {
    const a = (x & 0xF0); // Use upper 4 bit nibble
    this.i2c.sendByteSync(this.address, a | this.displayPorts.backlight | c);
    this.i2c.sendByteSync(this.address, a | this.displayPorts.E | this.displayPorts.backlight | c);
    this.i2c.sendByteSync(this.address, a | this.displayPorts.backlight | c);
    return (this);
  }

  write4Async(x, c, cb) {
    const a = (x & 0xF0); // Use upper 4 bit nibble
    this.sendByte(a | this.displayPorts.backlight | c)
      .then(() => (this.sendByte(a | this.displayPorts.E | this.displayPorts.backlight | c)))
      .catch((e) => {
        if (cb) {
          cb(e);
        }
      })
      .then(() => (this.sendByte(a | this.displayPorts.backlight | c)))
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

  sendByte(x) {
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
