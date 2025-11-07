"use client";

import Link from "next/link";
import { Abi } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

export const CONTRACT_ADDRESS_PRESCRIPTION = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

export const CONTRACT_ABI_PRESCRIPTION = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "doctor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "authorized",
        type: "bool",
      },
    ],
    name: "DoctorAuthorized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "doctor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "patient",
        type: "address",
      },
    ],
    name: "PrescriptionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "PrescriptionBurned",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "doctor",
        type: "address",
      },
      {
        internalType: "bool",
        name: "status",
        type: "bool",
      },
    ],
    name: "authorizeDoctor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "prescriptionId",
        type: "uint256",
      },
    ],
    name: "burnPrescription",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "patient",
        type: "address",
      },
      {
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
    ],
    name: "createPrescription",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "prescriptionCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "prescriptions",
    outputs: [
      {
        internalType: "address",
        name: "doctor",
        type: "address",
      },
      {
        internalType: "address",
        name: "patient",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isValid",
        type: "bool",
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "authorizedDoctors",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as Abi;

export type Prescription = {
  doctor: string;
  patient: string;
  isValid: boolean;
  metadataURI: string;
} | null;

export default function CreatePrescriptionPage() {
  const {
    data: totalPrescriptions,
    isLoading: countLoading,
    isError: countError,
  } = useReadContract({
    address: CONTRACT_ADDRESS_PRESCRIPTION,
    abi: CONTRACT_ABI_PRESCRIPTION,
    functionName: "prescriptionCounter",
  });

  const total = Number(totalPrescriptions || 0);

  const {
    data: prescriptionsData,
    isLoading: prescriptionsLoading,
    isError: prescriptionsError,
  } = useReadContracts({
    contracts:
      total > 0
        ? Array.from({ length: total }, (_, i) => ({
            address: CONTRACT_ADDRESS_PRESCRIPTION,
            abi: CONTRACT_ABI_PRESCRIPTION,
            functionName: "prescriptions",
            args: [BigInt(i + 1)],
          }))
        : [],
  });

  const prescriptions: Prescription[] =
    prescriptionsData?.map(p => {
      if (!p || p.error || !p.result) return null;
      const [doctor, patient, isValid, metadataURI] = p.result as [string, string, boolean, string];
      return { doctor, patient, isValid, metadataURI };
    }) || [];

  console.log("Total prescriptions:", total);
  console.log("Prescriptions data:", prescriptions);

  if (countLoading || prescriptionsLoading) {
    return <p>Carregando prescrições...</p>;
  }

  if (countError || prescriptionsError) {
    return <p className="text-red-600">Erro ao carregar prescrições. Verifique se o contrato está implantado.</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">PharmaLink</h1>
      <p className="mb-6 text-gray-600">Prescrições médicas transformadas em NFTs verificáveis.</p>

      <Link href="/create-prescription" className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
        Emitir Nova Prescrição
      </Link>

      <Link href="/authorize-doctor" className="text-white bg-green-600 px-4 py-2 rounded hover:bg-green-700">
        Autorizar / Revogar Médico
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {prescriptions.length === 0 ? (
          <p>Nenhuma prescrição encontrada.</p>
        ) : (
          prescriptions.map((p, index) => (
            <div key={index} className="border rounded-lg shadow p-4 bg-white hover:shadow-md transition">
              <h2 className="text-xl font-semibold mb-2">Prescrição #{index + 1}</h2>
              <p>
                <strong>Médico:</strong> {p?.doctor}
              </p>
              <p>
                <strong>Paciente:</strong> {p?.patient}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {p?.isValid ? (
                  <span className="text-green-600 font-semibold">Válida</span>
                ) : (
                  <span className="text-red-600 font-semibold">Invalidada</span>
                )}
              </p>
              <p className="truncate">
                <strong>URI:</strong>{" "}
                <a
                  href={p?.metadataURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline break-all"
                >
                  {p?.metadataURI}
                </a>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
