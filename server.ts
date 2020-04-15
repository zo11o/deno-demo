import { serve } from "https://deno.land/std@v0.36.0/http/server.ts";
const s = serve({ port: 8999 });
console.log("http://localhost:8999/");
for await (const req of s) {
  req.respond({ body: "Hello World\n" });
}
