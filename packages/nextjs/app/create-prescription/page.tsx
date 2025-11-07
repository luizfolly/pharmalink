"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONTRACT_ABI_PRESCRIPTION, CONTRACT_ADDRESS_PRESCRIPTION } from "../init/page";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export default function CreatePrescription() {
  const [isMounted, setIsMounted] = useState(false);
  const [patientAddress, setPatientAddress] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const { writeContract, isPending, data: transactionHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  // 🚫 Evita execução no SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  if (!isMounted) {
    // Impede renderização no servidor
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientAddress || !tokenURI) {
      alert("Preencha todos os campos.");
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS_PRESCRIPTION,
      abi: CONTRACT_ABI_PRESCRIPTION,
      functionName: "createPrescription",
      args: [patientAddress, tokenURI],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">Criar Prescrição NFT</h1>
        <p className="text-gray-600 mb-6">
          Insira as informações abaixo para emitir uma nova prescrição médica como NFT na rede.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="patientAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Endereço do Paciente
            </label>
            <input
              id="patientAddress"
              type="text"
              value={patientAddress}
              onChange={e => setPatientAddress(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x1234..."
            />
          </div>

          <div>
            <label htmlFor="tokenURI" className="block text-sm font-medium text-gray-700 mb-1">
              URI da Prescrição (IPFS)
            </label>
            <input
              id="tokenURI"
              type="text"
              value={tokenURI}
              onChange={e => setTokenURI(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ipfs://..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            disabled={isPending}
          >
            {isPending ? "Processando..." : "Criar Prescrição"}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {transactionHash && (
            <p className="text-gray-700">
              Hash da Transação: <span className="font-mono text-sm break-all text-blue-600">{transactionHash}</span>
            </p>
          )}
          {isConfirming && <p className="text-yellow-600">Aguardando confirmação...</p>}
          {isConfirmed && <p className="text-green-600 font-semibold">✅ Prescrição criada com sucesso!</p>}
          {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}
        </div>

        <div className="mt-8 text-center">
          <Link href="/init" className="text-blue-600 hover:underline font-medium">
            ← Voltar para Início
          </Link>
        </div>
      </div>
    </div>
  );
}
