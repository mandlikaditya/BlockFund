# BlockFund

BlockFund is a decentralized crowdfunding platform built on Ethereum. It utilizes smart contracts written in Solidity for secure, transparent campaign management and features a modern, responsive React frontend.

## Features

- **Launch Campaigns:** Anyone can create a fundraising campaign with a title, description, funding goal, and deadline.
- **Contribute ETH:** Support campaigns by directly sending ETH to the contract.
- **Withdraw Funds:** Campaign creators can withdraw funds once their goal is reached.
- **Refunds:** Contributors can request refunds automatically if the campaign misses its goal.
- **Live Stats:** Real-time feedback on campaign progress, contributors, and funds managed.

## Technology Stack

- **Smart Contracts:** Solidity, Truffle (with Ganache for local blockchain development)
- **Frontend:** ReactJS (Create React App), Web3.js for blockchain integration
- **Styling:** Tailwind CSS for a clean, responsive UI

## Getting Started

### Prerequisites

- Node.js and npm installed
- [Truffle](https://www.trufflesuite.com/) installed globally
- [Ganache](https://trufflesuite.com/ganache/) (or another Ethereum local network)
- MetaMask (for browser wallet integration)

### Setup

1. **Clone the repo:**
   ```
   git clone https://github.com/mandlikaditya/BlockFund.git
   cd BlockFund
   ```

2. **Install dependencies:**
   ```
   npm install
   cd client
   npm install
   cd ..
   ```

3. **Start your local blockchain (Ganache):**
   - Make sure Ganache is running at `localhost:8545`.

4. **Compile and deploy contracts:**
   ```
   truffle compile
   truffle migrate --network development
   ```

5. **Start the frontend app:**
   ```
   cd client
   npm start
   ```
   Access the app at [http://localhost:3000](http://localhost:3000).

## Testing

- **Solidity Contract Testing:**  
  Run automated tests with:
  ```
  truffle test
  ```
  Tests cover campaign creation, contributing, withdrawals, and refunds to ensure reliable contract logic.

## File Structure

- `contracts/`: Solidity smart contracts (main: `Crowdfunding.sol`)
- `client/`: React frontend
- `migrations/`: Truffle deployment scripts
- `scripts/`: Utility scripts (deployment info)
- `truffle-config.js`: Truffle network configuration

## Extending BlockFund

The design is modular. Easily add features such as:
- Campaign categories
- Milestone-based payouts
- Advanced statistics and filtering

## License

[MIT](LICENSE)

## Author

Created by [@mandlikaditya](https://github.com/mandlikaditya)

---

Feel free to open issues or pull requests for improvements and new features!