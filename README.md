This repo was the deliverable for a technical exercise for a job interview. The assignment is described [here](./spec.md).

```bash
$ sol-wallet --help
Usage: sol-wallet [options] [command]

Options:
  -h, --help         display help for command

Commands:
  generate           generate a new keypair
  address            print the public wallet address
  balance [options]  print the SOL balance
  sendSOL [options]  send SOL to a given address
  help [command]     display help for command
```

```bash
$ sol-wallet balance --help
Usage: sol-wallet balance [options]

print the SOL balance

Options:
  --rpc <url>  URL of RPC endpoint
  -h, --help   display help for command
```

```bash
$ sol-wallet sendSOL --help
Usage: sol-wallet sendSOL [options]

send SOL to a given address

Options:
  --rpc <url>        URL of RPC endpoint
  --amount <amount>  amount of SOL to send
  --to <address>     destination address
  -h, --help         display help for command
```
