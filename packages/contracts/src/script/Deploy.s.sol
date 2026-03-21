// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { TimeLendMVP } from "../src/TimeLendMVP.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        TimeLendMVP contract_ = new TimeLendMVP();
        
        vm.stopBroadcast();

        console2.log("TimeLendMVP deployed to:", address(contract_));
        console2.log("Save this address for the frontend!");
    }
}
