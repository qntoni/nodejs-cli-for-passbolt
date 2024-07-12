```
👩  This project is not associated officially with Passbolt
⚗️   It is used to illustrate an article or as a conversation starter.
🧪  Use at your own risks!
```

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
  - Remove permissions from a group in a specific folder

### Remove permissions from a group in a specific folder
In order to remove permissions from a specific folders (which works for recursive as well), here is what you need to do after running the CLI

1. Since the CLI is using Inquirer.JS use the arrows and hit enter on **Remove permissions from a group in a specific folder**
2. It will ask which folders do you want to take the control of, if you have multiple "OG" folders you can write `OG` and hit enter. **WARNING:** This will works for all of the OG folders you have update/ownership access to and will work for all the typo e.g. oG, og, OG, Og
3. It will ask which groups you want to remove the permissions from the folder, you can specify multiple groups using `,`  e.g. `Jedi, Sith`
4. The script should run and update the according permissions

**WARNING:** For the moment, it works for these specific folders and the resources insides, but if you have sub-folder inside these specific folders, you should either re-run the script and provide these sub sub-folders names or do it manually.


## Troubleshooting
An `./app.log` should be created and updated every time you are running the CLI. If you encounter any issues with this, feel free to share it with whom it belongs.

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by or in any way officially connected with [Passbolt](https://github.com/passbolt) or any subsidiaries or its affiliates. 

## License
This project is licensed under the MIT License. See the LICENSE file for details.
