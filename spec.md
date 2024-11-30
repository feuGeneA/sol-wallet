# TypeScript Interview Exercise

Write a small TypeScript CLI tool that acts as a basic Solana wallet.

## Requirements

- Provides a basic CLI interface for core functionality:
    - Generate a new Solana keypair and store it
    - Print your public wallet address
    - Print your SOL balance
    - Send SOL to a given address
    - Send SPL tokens to a given address (stretch goal)
- Acceptance criteria:
    - Provide your CLI tool source code, as well as an NPM package .tgz (using `npm pack`)
    - Provide documentation on how to use it

Please don't spend more than four hours on this! While working, take note of what came to mind that you would want to tackle next. Be prepared to discuss that.

## Notes
- You will want to use Solana-Web3.js: https://solana.com/docs/clients/javascript
- For the purposes of the exercise, please use Solana devnet or a [local validator](https://docs.solanalabs.com/cli/examples/test-validator)
    - You can get free devnet SOL here: https://faucet.solana.com/
    - You can query Solana devnet on this RPC node: [https://api.devnet.solana.com](https://api.devnet.solana.com/)
    - You can find Solana RPC documentation here: https://solana.com/docs/rpc
