// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleToken is ERC20 {
    address public owner;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialHolder
    ) ERC20(name, symbol) {
        owner = msg.sender;
        _mint(initialHolder, initialSupply);
    }
    
    // Mint function for owner
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint");
        _mint(to, amount);
    }
    
    // Burn function
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
