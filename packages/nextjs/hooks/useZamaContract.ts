/**
 * Hook customizado para interagir com contratos Zama
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const ZAMA_INTEGRATION_ABI = [
    "function storePrescriptionEncrypted(uint256 prescriptionId, bytes encryptedData) external",
    "function getPrescriptionEncrypted(uint256 prescriptionId) external view returns (bytes)",
    "function storeMedicineEncrypted(uint256 medicineId, bytes encryptedData) external",
    "function getMedicineEncrypted(uint256 medicineId) external view returns (bytes)",
    "function storeValidationEncrypted(uint256 validationId, bytes32 requestId, bytes encryptedData) external",
    "function getValidationEncrypted(uint256 validationId) external view returns (bytes)",
    "function authorizeDecryptor(uint256 dataId, address decryptor) external",
    "function revokeDecryptor(uint256 dataId, address decryptor) external",
    "function isAuthorizedDecryptor(uint256 dataId, address decryptor) external view returns (bool)",
    "function registerPublicKey(bytes publicKey) external",
    "function getPublicKey(address user) external view returns (bytes)",
];

export interface UseZamaContractProps {
    contractAddress?: string;
    network?: string;
}

export function useZamaContract({ contractAddress, network = "sepolia" }: UseZamaContractProps) {
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    // Inicializar contrato
    useEffect(() => {
        const initializeContract = async () => {
            try {
                if (!window.ethereum) {
                    setError("MetaMask não encontrado");
                    return;
                }

                const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                const ethersSigner = await ethersProvider.getSigner();

                setProvider(ethersProvider);
                setSigner(ethersSigner);

                if (contractAddress) {
                    const zamaContract = new ethers.Contract(
                        contractAddress,
                        ZAMA_INTEGRATION_ABI,
                        ethersSigner
                    );
                    setContract(zamaContract);
                }
            } catch (err) {
                setError(`Erro ao inicializar: ${err}`);
            }
        };

        initializeContract();
    }, [contractAddress]);

    // Armazenar prescrição criptografada
    const storePrescriptionEncrypted = async (
        prescriptionId: number,
        encryptedData: string
    ): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const tx = await contract.storePrescriptionEncrypted(prescriptionId, encryptedData);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (err) {
            const errorMsg = `Erro ao armazenar prescrição: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Recuperar prescrição criptografada
    const getPrescriptionEncrypted = async (prescriptionId: number): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const data = await contract.getPrescriptionEncrypted(prescriptionId);
            return data;
        } catch (err) {
            const errorMsg = `Erro ao recuperar prescrição: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Armazenar medicamento criptografado
    const storeMedicineEncrypted = async (
        medicineId: number,
        encryptedData: string
    ): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const tx = await contract.storeMedicineEncrypted(medicineId, encryptedData);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (err) {
            const errorMsg = `Erro ao armazenar medicamento: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Recuperar medicamento criptografado
    const getMedicineEncrypted = async (medicineId: number): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const data = await contract.getMedicineEncrypted(medicineId);
            return data;
        } catch (err) {
            const errorMsg = `Erro ao recuperar medicamento: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Registrar chave pública
    const registerPublicKey = async (publicKey: string): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const tx = await contract.registerPublicKey(publicKey);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (err) {
            const errorMsg = `Erro ao registrar chave pública: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Obter chave pública
    const getPublicKey = async (userAddress: string): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const key = await contract.getPublicKey(userAddress);
            return key;
        } catch (err) {
            const errorMsg = `Erro ao obter chave pública: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Autorizar descriptor
    const authorizeDecryptor = async (dataId: number, decryptor: string): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const tx = await contract.authorizeDecryptor(dataId, decryptor);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (err) {
            const errorMsg = `Erro ao autorizar descriptor: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Revogar descriptor
    const revokeDecryptor = async (dataId: number, decryptor: string): Promise<string> => {
        try {
            setLoading(true);
            setError("");

            if (!contract) {
                throw new Error("Contrato não inicializado");
            }

            const tx = await contract.revokeDecryptor(dataId, decryptor);
            const receipt = await tx.wait();

            return receipt.transactionHash;
        } catch (err) {
            const errorMsg = `Erro ao revogar descriptor: ${err}`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        contract,
        provider,
        signer,
        loading,
        error,
        storePrescriptionEncrypted,
        getPrescriptionEncrypted,
        storeMedicineEncrypted,
        getMedicineEncrypted,
        registerPublicKey,
        getPublicKey,
        authorizeDecryptor,
        revokeDecryptor,
    };
}
