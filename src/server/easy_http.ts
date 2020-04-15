/**
 * 创建响应内容
 * @param {string} bodyStr
 * @return {Uint8Array}
 */
function createResponse(bodyStr: string): Uint8Array {
  const CRLF = "\r\n";
  const encoder = new TextEncoder();

  const resLines = [
    `HTTP/1.1 200`,
    `content-length: ${bodyStr.length}`,
    ``,
    bodyStr,
  ];
  const res = encoder.encode(resLines.join(CRLF));
  return res;
}

async function response(conn: Deno.Conn) {
  // 创建响应信息
  const res = createResponse("hello world");
  await conn.write(res);
  conn.close();
}

/**
 * HTTP服务
 * @param opts {Deno.ListenOptions}
 */
async function server(opts: Deno.ListenOptions) {
  // 创建 TCP 服务
  const listener: Deno.Listener = Deno.listen(opts) as Deno.Listener;
  console.log("listening on", `${opts.hostname}:${opts.port}`);

  // 死循环监听 TCP 请求
  while (true) {
    // 等待 TCP 连接
    const connection = await listener.accept();
    response(connection);
  }
}

server({
  hostname: "127.0.0.1",
  port: 9999,
});
