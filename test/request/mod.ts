#!/usr/bin/env deno run --allow-run --allow-net --allow-env
import { assertEquals, equal } from "https://deno.land/std/testing/asserts.ts";
import { BufferReader } from "../../src/buffer_reader/mod.ts";

const { test, run, runTests } = Deno;

const decoder = new TextDecoder();
const testSite = "http://127.0.0.1:9999";

let httpServer: Deno.Process;

async function startHTTPServer() {
  httpServer = run({
    cmd: [
      Deno.execPath(),
      "--allow-net",
      "../../src/server/easy_http.ts",
      "--",
      ".",
      "--cors",
    ],
    stdout: "piped",
  });

  const buffer: Deno.ReadCloser | undefined = httpServer.stdout;
  if (buffer) {
    const bufReader: BufferReader = new BufferReader(buffer);

    const line = await bufReader.readLine();
    equal("listening on 127.0.0.1:9999", line);
    console.log("\r\nstart http server\r\n");
  } else {
    throw Error("Testing server started fail !!");
  }
}

function closeHTTPServer() {
  if (httpServer) {
    httpServer.close();
    httpServer.stdout && httpServer.stdout.close();
  }
  console.log("\r\nclose http server\r\n");
}

test(async function serverGetRequest() {
  try {
    // 等待服务启动
    await startHTTPServer();
    const res = await fetch(`${testSite}/page/test.html?a=1&b=2`, {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Content-test": "helloworld",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
    });
    const json = await res.json();
    const acceptResult = {
      "general": {
        "method": "GET",
        "protocol": "HTTP/1.1",
        "pathname": "/page/test.html",
        "search": "a=1&b=2",
      },
      "headers": {
        "content-type": "application/json",
        "content-test": "helloworld",
        "accept-encoding": "gzip",
        "user-agent": `Deno/${Deno.version.deno}`,
        "accept": "*/*",
        "host": "127.0.0.1:3001",
      },
      "body": "",
      "beforeFinish": false,
      "afterFinish": true,
    };

    assertEquals(json, acceptResult);
  } finally {
    closeHTTPServer();
  }
});

runTests();
