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

  isFinished(): boolean {
    return this._eof && this._current.byteLength === 0;
  }

  async readLine(): Promise<string> {
    let lineBuf = new Uint8Array(0);

    while (!this._eof || this._chunk.length > 0) {
      const current = this._current;

      for (let i = 0; i < current.byteLength; i++) {
        // TODO:
      }
    }

    const result = this._current;
    this._chunk = new Uint8Array(0);

    return decoder.decode(result);
  }

  /**
     * 读取一个自定义长度的数据块
     * TODO: 
     * @param size 
     */
  async readCustomChunk(size: number): Promise<Uint8Array> {
    let customChunk = new Uint8Array();

    return customChunk;
  }
}
