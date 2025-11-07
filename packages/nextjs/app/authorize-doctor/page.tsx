"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONTRACT_ABI_PRESCRIPTION, CONTRACT_ADDRESS_PRESCRIPTION } from "../init/page";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export default function AuthorizeDoctorPage() {
  const [doctorAddress, setDoctorAddress] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const { writeContract, isPending, data: transactionHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  useEffect(() => {
    if (typeof window !== "undefined") setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorAddress) {
      alert("Informe o endereço do médico.");
      return;
    }

    // ✅ A mesma função "authorizeDoctor" é usada para autorizar e revogar.
    // Basta passar o booleano true ou false.
    writeContract({
      address: CONTRACT_ADDRESS_PRESCRIPTION,
      abi: CONTRACT_ABI_PRESCRIPTION,
      functionName: "authorizeDoctor",
      args: [doctorAddress, isAuthorizing], // <-- CORRIGIDO
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">
          {isAuthorizing ? "Autorizar Médico" : "Revogar Autorização"}
        </h1>
        <p className="text-gray-600 mb-6">
          Use este painel para conceder ou remover permissão de emissão de prescrições.
        </p>

        <form onSubmit={handleAction} className="space-y-4">
          <div>
            <label htmlFor="doctorAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Endereço do Médico
            </label>
            <input
              id="doctorAddress"
              type="text"
              value={doctorAddress}
              onChange={e => setDoctorAddress(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x1234..."
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-2 rounded-lg font-semibold text-white transition ${
              isAuthorizing ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isPending ? "Processando..." : isAuthorizing ? "Autorizar Médico" : "Revogar Autorização"}
          </button>
        </form>

        <div className="flex justify-between mt-6">
          <button onClick={() => setIsAuthorizing(!isAuthorizing)} className="text-sm text-blue-600 underline">
            {isAuthorizing ? "Trocar para Revogar" : "Trocar para Autorizar"}
          </button>

          <Link href="/init" className="text-blue-600 hover:underline text-sm">
            ← Voltar para Início
          </Link>
        </div>

        <div className="mt-6 space-y-2">
          {transactionHash && (
            <p className="text-gray-700">
              Hash da Transação: <span className="font-mono text-sm break-all text-blue-600">{transactionHash}</span>
            </p>
          )}
          {isConfirming && <p className="text-yellow-600">Aguardando confirmação...</p>}
          {isConfirmed && <p className="text-green-600 font-semibold">✅ Transação confirmada com sucesso!</p>}
          {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}
        </div>
      </div>
    </div>
  );
}
