import { Request, RequestReader } from "./mod.ts";
const listen = Deno.listen;

const opts: Deno.ListenOptions = {
  hostname: "127.0.0.1",
  port: 9999,
};

function createResponse(bodyStr: string): Uint8Array {
  const CRLF = "\r\n";
  const encoder = new TextEncoder();
  const ctxBody = encoder.encode(bodyStr);
  const resHeaders = [
    `HTTP/1.1 200`,
    `content-length: ${ctxBody.byteLength}`,
    CRLF,
  ];
  const ctxHeader = encoder.encode(resHeaders.join(CRLF));
  const data = new Uint8Array(ctxHeader.byteLength + ctxBody.byteLength);
  data.set(ctxHeader, 0);
  data.set(ctxBody, ctxHeader.byteLength);
  return data;
}

async function response(conn: Deno.Conn) {
  const requestReader: Request = new RequestReader(conn);
  const headers: Headers = await requestReader.getHeaders();
  const headerObj: any = {};
  for (const key of headers.keys()) {
    headerObj[key] = headers.get(key);
  }
  const generalObj = await requestReader.getGeneral();
  const ctx = createResponse(
    JSON.stringify({ general: generalObj, headers: headerObj }),
  );
  await conn.write(ctx);
  conn.close();
}

async function server(opts: Deno.ListenOptions) {
  const listener: Deno.Listener = Deno.listen(opts) as Deno.Listener;
  console.log(`listening on ${opts.hostname}:${opts.port}`);
  while (true) {
    const conn = await listener.accept();
    // console.log('conn',conn)
    await response(conn);
  }
}

server(opts);
