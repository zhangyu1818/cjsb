#!/usr/bin/env node

import parser from "yargs-parser";
import glob from "glob";
import * as babel from "@babel/core";
import fs from "fs-extra";
import path from "path";

interface Args {
  cwd?: string;
  source?: string;
  outDir?: string;
  nodeVersion?: number;
}

const argv = parser(process.argv.slice(2)) as Args;

const {
  cwd = process.cwd(),
  source = "src",
  outDir = "lib",
  nodeVersion = 12,
} = argv;

const filesDir = path.join(cwd, source);

const toJsFile = (filePath: string) => {
  const { dir, name } = path.parse(filePath);
  return path.format({ dir, name, ext: ".js" });
};

const toRelative = (filePath: string) => path.relative(filesDir, filePath);

const files = glob
  .sync("**/*", {
    cwd: filesDir,
    nodir: true,
    absolute: true,
  })
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

fs.removeSync(outDir);

files.forEach((filePath) => {
  const { code } = babel.transformFileSync(filePath, {
    babelrc: false,
    configFile: false,
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            node: nodeVersion,
          },
        },
      ],
      "@babel/preset-typescript",
    ],
  })!;
  const outputPath = path.join(outDir, toJsFile(toRelative(filePath)));
  fs.outputFileSync(outputPath, code, "utf-8");
});
