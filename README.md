# rehub

A tokenized incentive system on the ICP blockchain that encourages individuals to seek rehab & stay clean. Tokens are awarded for meeting sobriety milestones, participating in counseling sessions, or engaging in community service activities. These tokens can be redeemed for rewards such as access to job training programs or discounts on goods and services.

✨ Key Features

_Tokenized incentives_: Earn fungible tokens for achieving goals and participating in recovery activities.

_Milestone-based rewards_: Unlock rewards for reaching designated sobriety milestones.

_Activity validation_: Securely validate activities through a designated validator role.

_Reward marketplace_: Redeem tokens for valuable rewards that support recovery and well-being.

_Transparency and trust_: Leverage the power of blockchain technology to ensure data integrity and accountability.
✨

To learn more before you start working with types, see the following documentation available online:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd types/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor
