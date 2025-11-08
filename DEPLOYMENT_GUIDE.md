# 🚀 Guia de Deployment - Zama FHE + Interface Web

Guia completo para fazer deploy dos contratos em Sepolia e da interface web.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deploy em Sepolia](#deploy-em-sepolia)
3. [Interface Web](#interface-web)
4. [Deploy da Interface](#deploy-da-interface)
5. [Testes](#testes)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Ferramentas Necessárias

- Node.js 18+
- Yarn ou npm
- MetaMask ou outra wallet Web3
- Conta em Infura ou Alchemy (para RPC)
- Sepolia ETH (testnet faucet)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/luizfolly/pharmalink.git
cd pharmalink

# Instalar dependências
yarn install

# Instalar dependências do Hardhat
cd packages/hardhat
yarn install
```

### Configurar Variáveis de Ambiente

Criar `.env.zama` em `packages/hardhat/`:

```env
# Network
NETWORK=sepolia
CHAIN_ID=11155111

# RPC (usar Infura ou Alchemy)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private Key do Deployer
__RUNTIME_DEPLOYER_PRIVATE_KEY=0x...

# Etherscan API (para verificação)
ETHERSCAN_V2_API_KEY=YOUR_ETHERSCAN_KEY
```

---

## 🌐 Deploy em Sepolia

### 1. Compilar Contratos

```bash
cd packages/hardhat
yarn hardhat:compile
```

### 2. Deploy dos Contratos

```bash
# Deploy com script customizado
yarn hardhat run scripts/zama/deploy-sepolia.ts --network sepolia
```

**Saída esperada:**

```
🚀 DEPLOY ZAMA FHE INTEGRATION - SEPOLIA TESTNET

1️⃣  Deployando PharmaLinkPrivacy...
✅ PharmaLinkPrivacy deployed: 0x...
   TX Hash: 0x...

2️⃣  Deployando ZamaIntegration...
✅ ZamaIntegration deployed: 0x...
   TX Hash: 0x...

✅ DEPLOYMENT EM SEPOLIA CONCLUÍDO COM SUCESSO!

📊 Resumo:
   Network: Sepolia Testnet
   Deployer: 0x...
   PharmaLinkPrivacy: 0x...
   ZamaIntegration: 0x...

🔗 Links Etherscan:
   PharmaLinkPrivacy: https://sepolia.etherscan.io/address/0x...
   ZamaIntegration: https://sepolia.etherscan.io/address/0x...
```

### 3. Validar Deployment

```bash
# Validar contratos em Sepolia
yarn hardhat run scripts/zama/validate-deployment.ts --network sepolia
```

### 4. Salvar Endereços

Os endereços são salvos automaticamente em:
- `packages/hardhat/deployments/sepolia-deployment.json`
- `.env.zama` (atualizado)

---

## 🎨 Interface Web

### 1. Instalar Dependências

```bash
cd packages/nextjs
yarn install

# Instalar ethers se não estiver
yarn add ethers
```

### 2. Configurar Variáveis de Ambiente

Criar `.env.local` em `packages/nextjs/`:

```env
# Contratos (do deployment)
NEXT_PUBLIC_ZAMA_INTEGRATION_ADDRESS=0x...
NEXT_PUBLIC_PRIVACY_CONTRACT_ADDRESS=0x...

# Network
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111

# RPC
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### 3. Estrutura de Arquivos

```
packages/nextjs/
├── app/
│   └── zama/
│       └── page.tsx          # Página principal
├── lib/
│   └── zama-client.ts        # Biblioteca cliente
├── hooks/
│   └── useZamaContract.ts    # Hook customizado
└── .env.local                # Variáveis de ambiente
```

### 4. Componentes Criados

**`app/zama/page.tsx`:**
- Interface para criptografia/descriptografia
- Conexão com wallet
- Operações FHE
- Interação com contratos

**`lib/zama-client.ts`:**
- Classe `ZamaEncryption`
- Classe `ZamaDecryption`
- Classe `FHEOperations`
- Compatível com navegador

**`hooks/useZamaContract.ts`:**
- Hook para interagir com contratos
- Gerenciamento de estado
- Tratamento de erros

---

## 🚀 Deploy da Interface

### Opção 1: Deploy em Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
cd packages/nextjs
vercel

# Seguir as instruções interativas
```

### Opção 2: Deploy em Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Build
yarn build

# Deploy
netlify deploy --prod --dir=.next
```

### Opção 3: Deploy Manual

```bash
# Build
cd packages/nextjs
yarn build

# Iniciar servidor
yarn start

# Acessar em http://localhost:3000/zama
```

---

## 🧪 Testes

### Testar Contratos

```bash
cd packages/hardhat

# Rodar todos os testes
yarn hardhat:test test/privacy/

# Rodar teste específico
yarn hardhat:test test/privacy/ZamaIntegration.test.ts

# Com cobertura
yarn hardhat:coverage test/privacy/
```

### Testar Interface

```bash
cd packages/nextjs

# Modo desenvolvimento
yarn dev

# Acessar http://localhost:3000/zama

# Testes (se configurado)
yarn test
```

### Fluxo Completo de Teste

1. **Conectar Wallet:**
   - Clicar em "Conectar MetaMask"
   - Selecionar Sepolia testnet
   - Confirmar conexão

2. **Criptografar Dados:**
   - Clicar em "Criptografar Dados"
   - Verificar dados criptografados

3. **Descriptografar:**
   - Clicar em "Descriptografar Dados"
   - Verificar dados descriptografados

4. **Operações FHE:**
   - Clicar em "Executar Operação (10 < 20)"
   - Verificar resultado

5. **Armazenar em Contrato:**
   - Implementar função para armazenar
   - Verificar em Etherscan

---

## 📊 Verificação de Deployment

### Verificar Contratos em Etherscan

```bash
cd packages/hardhat

# Verificar PharmaLinkPrivacy
yarn hardhat verify --network sepolia <PRIVACY_ADDRESS>

# Verificar ZamaIntegration
yarn hardhat verify --network sepolia <ZAMA_ADDRESS> <PRIVACY_ADDRESS> 0x0000000000000000000000000000000000000000 0x0000000000000000000000000000000000000000
```

### Verificar Interface

1. Acessar URL da interface
2. Conectar wallet
3. Testar funcionalidades
4. Verificar console do navegador (F12)

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] Private key não commitada
- [ ] `.env.zama` e `.env.local` no `.gitignore`
- [ ] Usar Sepolia para testes (não mainnet)
- [ ] Validar endereços antes de usar
- [ ] Testar com pequenas quantidades primeiro
- [ ] Verificar contratos em Etherscan
- [ ] Usar HTTPS para interface web

### Boas Práticas

```bash
# ❌ NUNCA fazer isso
git add .env.zama
export PRIVATE_KEY=0x...

# ✅ Fazer isso
echo ".env.zama" >> .gitignore
source .env.zama  # Carregar localmente
```

---

## 🔧 Troubleshooting

### Erro: "RPC URL não configurado"

**Solução:**
```bash
# Verificar .env.zama
cat packages/hardhat/.env.zama

# Adicionar RPC URL
echo "SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" >> .env.zama
```

### Erro: "Insufficient funds"

**Solução:**
1. Ir para https://sepoliafaucet.com
2. Colar endereço da wallet
3. Solicitar Sepolia ETH
4. Aguardar alguns minutos

### Erro: "Contract not found"

**Solução:**
```bash
# Verificar endereço
cat packages/hardhat/deployments/sepolia-deployment.json

# Verificar em Etherscan
https://sepolia.etherscan.io/address/0x...
```

### Erro: "MetaMask not found"

**Solução:**
1. Instalar MetaMask: https://metamask.io
2. Criar conta
3. Adicionar rede Sepolia
4. Recarregar página

### Erro: "Wrong network"

**Solução:**
1. Abrir MetaMask
2. Clicar na rede atual
3. Selecionar "Sepolia"
4. Recarregar página

---

## 📚 Recursos

- **Documentação Zama:** https://docs.zama.ai/
- **Sepolia Faucet:** https://sepoliafaucet.com
- **Etherscan Sepolia:** https://sepolia.etherscan.io
- **Hardhat Docs:** https://hardhat.org/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 🎯 Próximos Passos

1. ✅ Deploy em Sepolia
2. ✅ Interface web funcional
3. ⏳ Integração com Chainlink Functions
4. ⏳ Deploy em mainnet
5. ⏳ Interface avançada

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar [Troubleshooting](#troubleshooting)
2. Consultar documentação oficial
3. Abrir issue no GitHub
4. Contatar time de desenvolvimento

---

**Última atualização:** Novembro 2025
**Versão:** 1.0.0
