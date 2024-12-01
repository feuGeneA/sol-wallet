#!/usr/bin/env node

// TODO: encrypt private key before writing to (and decrypt upon read from)
// disk.

// TODO: allow user to specify a key file to use instead of the default of
// $HOME/sol-wallet.key

import fs from "node:fs/promises";
import os from "node:os";
import process from "node:process";
import url from "node:url";

process.removeAllListeners("warning");

import { program } from "commander";
import { Connection, Keypair } from "@solana/web3.js";

const keyfile = os.homedir() + "/sol-wallet.key";

program.name("sol-wallet");

program
  .command("generate")
  .description("generate a new keypair")
  .action(generate);

program
  .command("address")
  .description("print the public wallet address")
  .action(address);

program
  .command("balance")
  .description("print the SOL balance")
  .requiredOption("--rpc <url>", "URL of RPC endpoint")
  .action(balance);

async function generate() {
  const keypair = Keypair.generate();
  try {
    await fs.writeFile(keyfile, keypair.secretKey, {
      flag: "wx",
    });
  } catch (err) {
    console.error("Failed to write generated key to file at", keyfile);
    throw err;
  }
}

async function readKeypair(): Promise<Keypair> {
  const secretKey = await (async () => {
    try {
      return await fs.readFile(keyfile);
    } catch (err) {
      if (
        typeof err === "object" &&
        err &&
        "code" in err &&
        err.code === "ENOENT"
      ) {
        console.error(
          "Key file does not exist. Consider using the generate command to create one.",
        );
      }
      throw err;
    }
  })();
  try {
    return Keypair.fromSecretKey(secretKey);
  } catch (err) {
    console.error(
      "Failed to create keypair from the contents of the file at",
      keyfile,
    );
    throw err;
  }
}

async function address() {
  const keypair = await readKeypair();
  console.log(keypair.publicKey.toString());
}

async function balance(options: { rpc: string }) {
  if (!url.URL.canParse(options.rpc)) {
    throw new Error(`RPC endpoint '${options.rpc}' is not a valid URL`);
  }
  const pubKey = (await readKeypair()).publicKey;
  const connection = new Connection(options.rpc);
  console.log(await connection.getBalance(pubKey));
}

program.parse();
