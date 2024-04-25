# raspberrypi-liquid-crystal
 Control i2c lcd screens with a Raspberry Pi module with using PCF8574 I2C port expander

## Overview
For use on a Raspberry Pi, raspberrypi-liquid-crystal is a node.js library for accessing LCD character displays using I2C via a PCF8574 port expander, typically found on inexpensive LCD I2C "backpacks".

raspberrypi-liquid-crystal supports 16x2 and 20x4 LCD character displays based on the Hitachi HD44780 LCD controller ( https://en.wikipedia.org/wiki/Hitachi_HD44780_LCD_controller ). raspberrypi-liquid-crystal uses the i2c-bus library ( https://github.com/fivdi/i2c-bus ) instead of the i2c library since the former supports more recent versions of node (e.g. 4.2.1).

This work is based upon the following repository:

https://github.com/wilberforce/lcd-pcf8574

It follows the Arduino LiquidCrystal API, so the method names will be the same as:

https://www.arduino.cc/en/Reference/LiquidCrystal

(the following methods are missing: autoscroll(), noAutoscroll() and write())

raspberrypi-liquid-crystal also provides a new method for displaying text on a specific line (for multiline screens) :
```
printLine ( line : int, text : string )
```

Each method has a synchronous version, an asynchronous version (Promise) and an error-first callback pattern version. (Except getChar() which returns directly a previously created custom character)

Example with the print() method (applies to all methods):
```
print ( text : string )                             - Promise
printSync ( text : string )                         - Synchronous
printAsync ( text : string, callback : function )   - Error-first callback (classic node)
```

## Installation

```
npm install raspberrypi-liquid-crystal
```


## Usage

First, set up I2C on your Raspberry Pi. More information about this can be found here:

https://learn.adafruit.com/adafruits-raspberry-pi-lesson-4-gpio-setup/configuring-i2c

Now, check for the address of the LCD on the I2C bus:

For a rev. 1 board (old), use the following:

```
sudo i2cdetect -y 0
```

For a rev. 2+ board (new), use the following:

```
sudo i2cdetect -y 1
```

This will print out the devices on the I2C bus, such as:

```
root@raspberrypi:/home/pi/raspberrypi-liquid-crystal# sudo i2cdetect -y 1
    0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- --
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
20: -- -- -- -- -- -- -- 27 -- -- -- -- -- -- -- --
30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
70: -- -- -- -- -- -- -- --

```

Here, we see the device on address 0x27.

To use raspberrypi-liquid-crystal, add the following code to your node.js application to import and instantiate the LCD object:

```
const LCD = require('raspberrypi-liquid-crystal');
const lcd = new LCD( 1, 0x27, 16, 2 );
lcd.beginSync();
```

Note that this will set up an I2C LCD on I2C bus 1, address 0x27, with 16 columns and 2 rows.

You can set the cursor position then print text on the screen with the following code:
```
lcd.clearSync();
lcd.printSync( 'Hello' );
lcd.setCursorSync(0, 1);
lcd.printSync( 'World' );
```


To print out a string to the LCD panel using specified line numbers, see the following example code:

```
lcd.clearSync();
lcd.printLineSync(0, 'This is line 1');
lcd.printLineSync(1, 'This is line 2');
```

To create custom characters:

```
lcd.createCharSync( 0,[ 0x1B,0x15,0x0E,0x1B,0x15,0x1B,0x15,0x0E] ).createCharSync( 1,[ 0x0C,0x12,0x12,0x0C,0x00,0x00,0x00,0x00] );
```

More information about creating such custom characters can be found here:

http://www.quinapalus.com/hd44780udg.html

## Error Checking

- Promise methods
```
lcd.begin()
  .then(() => {})
  .catch((e) => console.log(e))
```
- Synchronous methods
```
try {
  lcd.beginSync();
} catch (e) {
  console.log(e);
}
```
- Error-first callback methods
```
lcd.beginAsync((err) => {
  if (err) {
    console.log(err);
  }
});
```

## Examples
See a lot of examples on the examples folder

Basic synchronous example:
```
// Import the module
const LCD = require('raspberrypi-liquid-crystal');

// Instantiate the LCD object on bus 1 address 3f with 16 chars width and 2 lines
const lcd = new LCD(1, 0x3f, 16, 2);
// Init the lcd (must be done before calling any other methods)
lcd.beginSync();
// Clear any previously displayed content
lcd.clearSync();
// Display text multiline
lcd.printLineSync(0, 'hello');
lcd.printLineSync(1, 'world!');
```

## API
- **constructor ( bus : int, address : int, width : int, height : int , \[linesAddresses : array of hex = \[0x80, 0xC0, 0x94, 0xD4\]\])**
### Properties (read-only)
- **busNumber** : int - The bus number declared when instantiating the LCD object.
- **address** : int - The i2c address declared when instantiating the LCD object.
- **cols** : int - The number of characters width declared when instantiating the LCD object.
- **rows** : int - The number of lines declared when instantiating the LCD object.
- **began** : boolean - True if the LCD has been initialized, false if not.
### Methods
- **begin ()** - Initializes the interface to the LCD screen. Has to be called before any command.
- **clear ()** - Clears the LCD screen and positions the cursor in the upper-left corner.
- **home ()** - Positions the cursor in the upper-left of the LCD.
- **setCursor ( col : int, row : int )** - Positions the LCD cursor.
- **print ( text : string )** - Prints text to the LCD.
- **printLine ( line : int, text : string )** - Prints text to the LCD on the specified line.
- **cursor ()** - Displays the LCD cursor (underscore line).
- **noCursor ()** - Hides the LCD cursor.
- **blink ()** - Displays the blinking LCD cursor (white block).
- **noBlink ()** - Turns off the blinking LCD cursor.
- **display ()** - Turns on the LCD display.
- **noDisplay ()** - Turns off the LCD display.
- **scrollDisplayLeft ()** - Scrolls the contents of the display (text and cursor) one space to the left.
- **scrollDisplayRight ()** - Scrolls the contents of the display (text and cursor) one space to the right.
- **leftToRight ()** - Sets the direction for text written to the LCD to left-to-right, the default.
- **rightToLeft ()** - Sets the direction for text written to the LCD to right-to-left.
- **createChar ( id : int, dots : array of int )** - Creates a custom character (glyph) for use on the LCD. Up to eight characters of 5x8 pixels are supported (id 0 to 7). The appearance of each custom character is specified by an array of eight bytes, one for each row. The five least significant bits of each byte determine the pixels in that row. To display a custom character on the screen, use print(LCD.getChar(id)).
- **getChar ( id : int )** - Returns a custom character previously created at specified id (0 to 7). No async version for this method!
