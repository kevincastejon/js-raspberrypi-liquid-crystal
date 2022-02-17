declare module 'raspberrypi-liquid-crystal' {
  type LCDCallback = (err: Error) => void;

  export default class LCD {
    constructor(bus: number, address: number, width: number, height: number);
    
    begin(): Promise<void>;
    beginSync(): void;
    beginAsync(callback: LCDCallback): void;

    clear(): Promise<void>;
    clearSync(): void;
    clearAsync(callback: LCDCallback): void;

    home(): Promise<void>;
    homeSync(): void;
    homeAsync(callback: LCDCallback): void;

    setCursor(col: number, row: number): Promise<void>;
    setCursorSync(col: number, row: number): void;
    setCursorAsync(col: number, row: number, callback: LCDCallback): void;

    print(text: string): Promise<void>;
    printSync(text: string): void;
    printAsync(text: string, callback: LCDCallback): void;

    printLine(line: number, text: string): Promise<void>;
    printLineSync(line: number, text: string): void;
    printLineASync(line: number, text: string, callback: LCDCallback): void;

    cursor(): Promise<void>;
    cursorSync(): void;
    cursorAync(callback: LCDCallback): void;

    noCursor(): Promise<void>;
    noCursorSync(): void;
    noCursorAsync(callback: LCDCallback): void;

    blink(): Promise<void>;
    blinkSync(): void;
    blinkAsync(callback: LCDCallback): void;

    noBlink(): Promise<void>;
    noBlinkSync(): void;
    noBlinkAsync(callback: LCDCallback): void;

    display(): Promise<void>;
    displaySync(): void;
    displayAsync(callback: LCDCallback): void;

    noDisplay(): Promise<void>;
    noDisplaySync(): void;
    noDisplayAsync(callback: LCDCallback): void;

    scrollDisplayLeft(): Promise<void>;
    scrollDisplayLeftSync(): void;
    scrollDisplayLeftAsync(callback: LCDCallback): void;

    scrollDisplayRight(): Promise<void>;
    scrollDisplayRightSync(): void;
    scrollDisplayRightAsync(callback: LCDCallback): void;

    leftToRight(): Promise<void>;
    leftToRightSync(): void;
    leftToRightAsync(callback: LCDCallback): void;

    rightToLeft(): Promise<void>;
    rightToLeftSync(): void;
    rightToLeftAsync(callback: LCDCallback): void;
    
    createChar(line: number, chars: Array<number>): Promise<void>;
    createCharSync(line: number, chars: Array<number>): void;
    createCharASync(line: number, chars: Array<number>, callback: LCDCallback): void;
  }
}
