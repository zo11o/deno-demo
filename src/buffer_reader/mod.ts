const decoder = new TextDecoder();

// 回车符
const CR = "\r".charCodeAt(0);
// 换行符
const LF = "\n".charCodeAt(0);

const MAX_BUFFER_SIZE = 4096;
const MIN_BUFFER_SIZE = 4;
const DEFAULT_BUFFER_SIZE = 256;

interface BufReader {
  // 读取一行
  readLine(): Promise<string>;
  // 读取自定义块
  readCustomChunk(size: number): Promise<Uint8Array>;
  // 是否读数结束
  isFinished(): boolean;
}

export class BufferReader implements BufReader {
  private _reader: Deno.Reader;
  private _size = DEFAULT_BUFFER_SIZE;
  private _chunk: Uint8Array = new Uint8Array(0);

  private _eof = false;
  // 缓冲区数据读取的当前的索引
  private _currentReadIndex = 0;

  /**
     * 读取缓冲区当前已经读到的数据块
     * @return {Uint8Array}
     */
  public get _current(): Uint8Array {
    return this._chunk.subarray(this._currentReadIndex);
  }

  constructor(reader: Deno.Reader, size?: number) {
    this._reader = reader;

    if (
      size !== undefined && size <= MAX_BUFFER_SIZE && size >= MIN_BUFFER_SIZE
    ) {
      this._size = size;
    }
    this._chunk = new Uint8Array(0);
  }

  /**
   * 是否读取数据结束
   */
  isFinished(): boolean {
    return this._eof && this._current.byteLength === 0;
  }

  /**
   * 是否换行
   * @param buf 
   */
  private _isCRLF(buf: Uint8Array): boolean {
    return buf.byteLength === 2 && buf[0] === CR && buf[1] === LF;
  }

  /**
   * 读取一行
   */
  async readLine(): Promise<string> {
    let lineBuf = new Uint8Array(0);

    while (!this._eof || this._chunk.length > 0) {
      const current = this._current;

      for (let i = 0; i < current.byteLength; i++) {
        if (current.byteLength <= 0) {
          continue;
        }

        const buf = current.subarray(i, i + 2);
        if (this._isCRLF(buf)) {
          lineBuf = current.subarray(0, i);
          this._currentReadIndex += i + 2;
          return decoder.decode(lineBuf);
        }
      }
      const result = await this._readChunk();
      if (!result) {
        break;
      }
    }

    const result = this._current;
    this._chunk = new Uint8Array(0);

    return decoder.decode(result);
  }

  /**
     * 读取一个自定义长度的数据块
     * @param size 
     */
  async readCustomChunk(size: number): Promise<Uint8Array> {
    let customLength = size;
    if (size < 0) {
      customLength = 0;
    }
    const current = this._current;
    const currentLength = current.length;
    let customChunk = new Uint8Array(0);

    if (customLength <= currentLength) {
      customChunk = current.subarray(0, customLength);
      this._currentReadIndex = customLength;
    } else {
      const reLength = customLength - currentLength;
      const reChunk = new Uint8Array(reLength);
      await this._reader.read(customChunk);
      customChunk = new Uint8Array(customLength);
      customChunk.set(current, 0);
      customChunk.set(reChunk, current.length);
    }
    this._chunk = new Uint8Array(0);
    this._currentReadIndex = 0;

    return customChunk;
  }

  private async _readChunk(): Promise<boolean> {
    let isNeedRead = false;

    if (this._eof === true) {
      return isNeedRead;
    }

    const chunk = new Uint8Array(this._size);
    const result = await this._reader.read(chunk);
    const numRead: number = result === Deno.EOF ? 0 : result;
    if (numRead === 0) {
      this._eof = true;
      return isNeedRead;
    } else {
      isNeedRead = true;
    }

    let remainLength = 0;
    if (this._chunk.byteLength > 0) {
      remainLength = this._chunk.byteLength - this._currentReadIndex;
    }

    const newChunk = new Uint8Array(remainLength + numRead);
    newChunk.set(this._chunk.subarray(this._currentReadIndex), 0);
    newChunk.set(chunk.subarray(0, numRead), remainLength);
    this._currentReadIndex = 0;
    this._chunk = newChunk;

    return isNeedRead;
  }
}
