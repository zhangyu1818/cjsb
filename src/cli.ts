#!/usr/bin/env node

import parser from "yargs-parser";
import { execSync } from "child_process";
import glob from "glob";
import * as babel from "@babel/core";
import fs from "fs-extra";
import path from "path";

import type { CompilerOptions } from "typescript";

interface Args {
  cwd?: string;
  source?: string;
  outDir?: string;
  nodeVersion?: number;
  declaration?: boolean | string;
}

const argv = parser(process.argv.slice(2), {
  alias: {
    declaration: ["d"],
  },
}) as Args;

const {
  cwd = process.cwd(),
  source = "src",
  outDir = "lib",
  nodeVersion = 12,
  declaration,
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
  .filter(
    (file) =>
      file.endsWith(".js") || (file.endsWith(".ts") && !file.endsWith(".d.ts"))
  );

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

if (declaration) {
  const sourceTscConfig = path.join(cwd, "tsconfig.json");
  const tsConfigPath =
    typeof declaration === "boolean" ? sourceTscConfig : declaration;
  let originContent;
  if (fs.existsSync(sourceTscConfig)) {
    originContent = fs.readFileSync(sourceTscConfig, "utf-8");
  } else if (typeof declaration === "boolean") {
    fs.writeFileSync(sourceTscConfig, "{}", "utf-8");
  }
  const options = require(tsConfigPath);
  options.include = [source];
  options.compilerOptions = Object.assign({}, options.compilerOptions, {
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    declarationDir: outDir,
  } as CompilerOptions);
  try {
    fs.writeFileSync(tsConfigPath, JSON.stringify(options));
    execSync("tsc", { stdio: "inherit" });
  } finally {
    fs.removeSync(tsConfigPath);
    if (originContent) {
      fs.writeFileSync(sourceTscConfig, originContent, "utf-8");
    }
  }
}
