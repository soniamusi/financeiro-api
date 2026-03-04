# 💰 Minhas Despesas - API (Backend)

Esta é a API REST que gerencia o sistema de finanças pessoais. Ela lida com a autenticação de usuários e o armazenamento de despesas em um banco de dados SQLite.

## 🚀 Tecnologias Utilizadas

- **Node.js** (Ambiente de execução)
- **Express** (Framework web)
- **SQLite** (Banco de dados relacional leve)
- **JWT (JSON Web Token)** (Autenticação segura)
- **Bcrypt** (Criptografia de senhas)
- **Cors** (Permissão de acesso para o Frontend)

## 🛠️ Como rodar o projeto localmente

1.  **Instale as dependências:**
    ```bash
    npm install
    ```
2.  **Inicie o servidor:**
    ```bash
    node index.js
    ```
    O servidor iniciará por padrão na porta `3001`.

## 📌 Rotas da API

### Autenticação

- `POST /api/auth/registrar`: Cria um novo usuário.
- `POST /api/auth/login`: Autentica o usuário e retorna um Token JWT.

### Despesas (Requer Token no Header)

- `GET /api/despesas`: Lista as despesas do usuário logado.
- `POST /api/despesas`: Salva uma nova despesa.
- `PUT /api/despesas/:id`: Edita uma despesa existente.
- `DELETE /api/despesas/:id`: Remove uma despesa.

## 🔐 Segurança

As rotas de despesas são protegidas pelo middleware `verificarToken`. É necessário enviar o cabeçalho:
`Authorization: Bearer <seu_token>`

## 🌐 Deploy

Esta API está configurada para deploy automático no **Render**.
