# ImobCore

Aplicativo desktop (Electron) para controle de imoveis residenciais/comerciais, contratos, recibos e relatorios.

## Funcoes principais

- Cadastro de proprietarios
- Cadastro de locatarios
- Cadastro de imoveis (residencial/comercial)
- Controle de status do imovel (alugado/livre)
- Cadastro de contratos com periodo, vencimento e composicao de valores
- Alerta de vencimento de contrato em ate 60 dias
- Geracao e impressao de recibo de aluguel
- Historico de recibos salvos
- Relatorio consolidado com filtros (tipo, status, mes/ano e pago)
- Funciona 100% offline com dados locais

## Estrutura de dados local

Os dados sao salvos em:

- `%APPDATA%/ImobCore/data/imobflow_db.json`

## Como rodar em desenvolvimento

1. Instalar Node.js 18+
2. No terminal, dentro da pasta do projeto:

```bash
npm install
npm run start
```

## Gerar instalador Windows

```bash
npm run build
```

Saida esperada:

- Pasta: `dist_installer`
- Instalador NSIS `.exe`

## Observacoes

- O app usa uma base visual no mesmo estilo dos apps MedCore/PetFlow/FolhaUp.
- A barra superior do Windows foi ajustada para combinar com o tema do app.
