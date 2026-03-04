import { createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

const transform = new Transform({
  transform(chunk: Buffer, _enc, next) {
    const dados = JSON.parse(chunk.toString());
    const filtrados = dados.filter((item: any) => item.vitalicio === "true");
    this.push(JSON.stringify(filtrados));
    next();
  },
});

// createGzip()

await pipeline(
  createReadStream("./dados.json", { highWaterMark: 20_000 }),
  transform,
  createWriteStream("./dados-vitalicio.json"),
);
