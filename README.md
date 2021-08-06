# cjsb

A CLI tool to build the CommonJS library quickly.

It supports JavaScript and TypeScript, support Monorepo.

## installation

```shell
npm i cjsb -D
```

```shell
yarn add cjsb --dev
```

## usage

```shell
cjsb --source src --outDir lib --nodeVersion 8 --declaration

cjsb [--source path/to/folder] [--outDir outDirName] [--nodeVersion version] [--declaration]
```

**monorepo**

```shell
cjsb --source src --packages packages/c packages/a packages/b
```

Some packages in Monorepo depend on each other, cjsb will pack them in pass order.
