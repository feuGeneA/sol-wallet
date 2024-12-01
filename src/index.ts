#!/usr/bin/env node

// TODO: encrypt private key before writing to (and decrypt upon read from)
// disk.

// TODO: allow user to specify a key file to use instead of the default of
// $HOME/sol-wallet.key

import fs from "node:fs/promises";
import os from "node:os";
import process from "node:process";
process.removeAllListeners("warning");

import { program } from "commander";
import { Keypair } from "@solana/web3.js";

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

async function address() {
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
  const keypair = (() => {
    try {
      return Keypair.fromSecretKey(secretKey);
    } catch (err) {
      console.error(
        "Failed to create keypair from the contents of the file at",
        keyfile,
      );
      throw err;
    }
  })();
  console.log(keypair.publicKey.toString());
}

program.parse();
