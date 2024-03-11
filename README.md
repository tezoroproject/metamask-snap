# @tezoroproject/snap

### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and
fix any automatically fixable issues.

### Using NPM packages with scripts

Scripts are disabled by default for security reasons. If you need to use NPM
packages with scripts, you can run `yarn allow-scripts auto`, and enable the
script in the `lavamoat.allowScripts` section of `package.json`.

See the documentation for [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)
for more information.

# Description

At 00:00 on day-of-month 1 and 15 it checks the balance of the account and sends a notification if the balance is not backed up.

# Usage

Install snap on [Tezoro](https://tezoro.io) website (dashboard), give required permissions.
