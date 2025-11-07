import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
/**
 * Deploy do contrato PharmaLinkSupplyChain
 */
const deployPharmaLinkSupplyChain: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // ✅ Este contrato não tem construtor com parâmetros
  await deploy("PharmaLinkSupplyChain", {
    from: deployer,
    log: true,
    autoMine: true, // útil para localhost
  });

  console.log("🚀 PharmaLinkSupplyChain deployed successfully!");
};

export default deployPharmaLinkSupplyChain;
deployPharmaLinkSupplyChain.tags = ["PharmaLinkSupplyChain"];
