#!/usr/bin/env node

// TODO: consider the security of the private key. can't someone just view the
// decrypted file contents by eg adding a console.log statement of the right
// variable?

// TODO: reconsider the hashing of the wallet password. i blindly followed an
// example somewhere, but since we're not storing that password anywhere
// there's probably no reason to be hashing it, so we can probably just use the
// user input directly as the symmetric key to the file encryption.

// TODO: allow user to specify a key file to use instead of the default of
// $HOME/sol-wallet.key

// TODO: add some automated tests

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import process from "node:process";
import url from "node:url";

process.removeAllListeners("warning");
/* this was added to suppress the following:
 * (node:1015698) [DEP0040] DeprecationWarning: The `punycode` module is
 * deprecated. Please use a userland alternative instead.
 * (Use `node --trace-deprecation ...` to show where the warning was created)
 */

import "source-map-support/register.js";
process.setSourceMapsEnabled(true);

import { InvalidArgumentError, program } from "commander";
import web3 from "@solana/web3.js";
import prompts from "prompts";

const keyfile = os.homedir() + "/sol-wallet.key";
const keyFileCryptoAlgo = "aes-256-ctr";

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
  .requiredOption("--rpc <url>", "URL of RPC endpoint", validateRpcUrl)
  .action(balance);

program
  .command("sendSOL")
  .description("send SOL to a given address")
  .requiredOption("--rpc <url>", "URL of RPC endpoint", validateRpcUrl)
  .requiredOption("--amount <amount>", "amount of SOL to send")
  .requiredOption("--to <address>", "destination address", addressToPubKey)
  .action(sendSol);

function validateRpcUrl(rpcUrl: string) {
  if (!url.URL.canParse(rpcUrl)) {
    throw new InvalidArgumentError(
      `RPC endpoint '${rpcUrl}' is not a valid URL`,
    );
  }
  return rpcUrl;
}

function addressToPubKey(address: string): web3.PublicKey {
  try {
    const pubKey = new web3.PublicKey(address);
    if (!web3.PublicKey.isOnCurve(pubKey)) {
      throw new InvalidArgumentError(`'${address}' is not on the curve`);
    }
    return pubKey;
  } catch (err) {
    throw new InvalidArgumentError(
      `'${address}' is not valid: ${err?.toString()}`,
    );
  }
}

async function generate() {
  const keypair = web3.Keypair.generate();
  const keyFilePassword = (
    await prompts({
      type: "password",
      name: "password",
      message: "Please enter a wallet password:",
    })
  ).password as string;
  const hashedPassword = crypto
    .createHash("sha256")
    .update(keyFilePassword)
    .digest("base64")
    .slice(0, 32);
  const initVector = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    keyFileCryptoAlgo,
    hashedPassword,
    initVector,
  );
  const encryptedSecretKey = Buffer.concat([
    initVector,
    cipher.update(keypair.secretKey),
    cipher.final(),
  ]);
  try {
    await fs.writeFile(keyfile, encryptedSecretKey, {
      flag: "wx",
    });
  } catch (err) {
    console.error("Failed to write generated key to file at", keyfile);
    throw err;
  }
}

async function readKeypair(): Promise<web3.Keypair> {
  const keyFileContents = await (async () => {
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
  const keyFilePassword = (
    await prompts({
      type: "password",
      name: "password",
      message: "Please enter the wallet password:",
    })
  ).password as string;
  const hashedPassword = crypto
    .createHash("sha256")
    .update(keyFilePassword)
    .digest("base64")
    .slice(0, 32);
  const secretKey = (() => {
    try {
      // decrypt the contents of the file
      const initVector = keyFileContents.subarray(0, 16);
      const encrypted = keyFileContents.subarray(16);
      const decipher = crypto.createDecipheriv(
        keyFileCryptoAlgo,
        hashedPassword,
        initVector,
      );
      return Buffer.concat([
        decipher.update(Buffer.from(encrypted)),
        decipher.final(),
      ]);
    } catch (err) {
      console.error(
        "Failed to decrypt private key from the contents of the file at",
        keyfile,
      );
      throw err;
    }
  })();
  try {
    return web3.Keypair.fromSecretKey(secretKey);
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
  const pubKey = (await readKeypair()).publicKey;
  const connection = new web3.Connection(options.rpc);
  console.log(await connection.getBalance(pubKey));
}

async function sendSol(options: {
  rpc: string;
  to: web3.PublicKey;
  amount: number;
}) {
  const keypair = await readKeypair();
  const connection = new web3.Connection(options.rpc);

  const tx = new web3.Transaction();
  const fromPubkey = keypair.publicKey;
  const toPubkey = options.to;
  const lamports = web3.LAMPORTS_PER_SOL * options.amount;
  tx.add(web3.SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));

  await web3.sendAndConfirmTransaction(connection, tx, [keypair]);
}

program.parse();
