# CLI.js for Passbolt

This is a node.js API CLI designed to interact with Passbolt. With this client, you'd be able to fetch and interact with various resources.

## Prerequisites 
- [Node.js](https://nodejs.org/en)
- [Passbolt](https://help.passbolt.com/hosting/install)
- Private key and the passphrase associated from your passbolt account

## Installation
1. Clone this repository
    ```bash
    git clone https://github.com/qntoni/passbolt-nodejs-api-cli
    ```
   
2. Install the dependancies
    ```bash
    cd passbolt-nodejs-api-cli
    npm install 
    ```
   
3. Update `./env` with the correct private key passphrase and server url
4. Import the private key file to `./config/key/`

## Usage

1. Run the CLI
   ```bash
   node cli.js
   ```
   
- Authentication with GPG
- Choose actions
  - Display all resources
  - Remove recursive permissions on a specific directory

## Warning

This project should not be used on a production environment as of right now.

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by or in any way officially connected with [Passbolt](https://github.com/passbolt) or any subsidiaries or its affiliates. 
