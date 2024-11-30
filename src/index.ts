#!/usr/bin/env node

import { program } from "commander";

program.name("sol-wallet").option("--first");

program.parse();

const options = program.opts();
console.log("args[0]:", program.args[0]);
console.log("options:", options);
