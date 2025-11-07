import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy do contrato PharmaLinkPrescription
 */
const deployPharmaLinkPrescription: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("PharmaLinkPrescription", {
    from: deployer,
    log: true,
    autoMine: true, // útil para localhost
    // ✅ args removido, porque o construtor não espera argumentos
  });

  console.log("🚀 PharmaLinkPrescription deployed successfully!");
};

export default deployPharmaLinkPrescription;
deployPharmaLinkPrescription.tags = ["PharmaLinkPrescription"];
