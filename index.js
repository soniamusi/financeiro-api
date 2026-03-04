//Importações
const express = require("express");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "aYDK6JltL7yjIoUys4Qd4CeqfNAzj7ff9gVL63Oaafl"; // Pode ser qualquer frase
const app = express();

//Configurações (Middlewares Globais)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

let db;

// Middleware para verificar se o usuário está logado
const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Pega apenas o código após "Bearer"

  if (!token) {
    console.log("Tentativa de acesso sem token!"); // ADICIONE ISSO
    return res.status(401).json({ erro: "Acesso negado." });
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (err) {
    console.log("Token inválido ou expirado!"); // ADICIONE ISSO
    res.status(403).json({ erro: "Token inválido." });
  }
};

// Na inicialização do banco:
(async () => {
 db = await open({
  filename: path.join(__dirname, "database.db"), 
  driver: sqlite3.Database,
  });

  // Cria a tabela se ela não existir
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        senha TEXT
    );
  
    -- (Se deletar o database.db, rode isso):
    CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT,
        valor REAL,
        categoria TEXT,
        data TEXT,
        usuario_id INTEGER, 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
`);
  console.log("Banco de dados pronto! 🗄️");
})();

// Rota para Listar
// Buscar apenas as despesas DO USUÁRIO LOGADO
app.get("/api/despesas", verificarToken, async (req, res) => {
  const usuario_id = req.usuario.id;
  const despesas = await db.all("SELECT * FROM despesas WHERE usuario_id = ?", [
    usuario_id,
  ]);
  res.json(despesas);
});

// Rota para Salvar
// Salvar a despesa vinculada ao ID do usuário
app.post("/api/despesas", verificarToken, async (req, res) => {
  const { descricao, valor, categoria, data } = req.body;
  const usuario_id = req.usuario.id; // Pegamos o ID do token verificado

  await db.run(
    "INSERT INTO despesas (descricao, valor, categoria, data, usuario_id) VALUES (?, ?, ?, ?, ?)",
    [descricao, valor, categoria, data, usuario_id],
  );
  res.status(201).json({ mensagem: "Salvo com sucesso!" });
});

// Rota para Deletar
app.delete("/api/despesas/:id", verificarToken, async (req, res) => {
  console.log("Rota de DELETE acessada!"); // Adicione este log bem no início
  const { id } = req.params;
  const usuario_id = req.usuario.id; // ID vindo do Token
  console.log(`Tentando excluir despesa ID: ${id} do usuário: ${usuario_id}`);

  try {
    // SEGURANÇA: Deleta apenas se o ID da despesa E o ID do usuário foram encontrados juntos
    const resultado = await db.run(
      "DELETE FROM despesas WHERE id = ? AND usuario_id = ?",
      [id, usuario_id],
    );

    if (resultado.changes === 0) {
      console.log(
        "Nenhuma linha foi alterada. ID não existe ou pertence a outro usuário.",
      );
      return res
        .status(404)
        .json({ erro: "Despesa não encontrada ou permissão negada." });
    }
    console.log("Excluído com sucesso!");
    res.json({ mensagem: "Excluído com sucesso!" });
  } catch (error) {
    console.error("Erro no Banco:", error);
    res.status(500).json({ erro: "Erro ao excluir no banco de dados." });
  }
});

// Rota para Editar Despesa
app.put("/api/despesas/:id", verificarToken, async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, categoria, data } = req.body;
  const usuario_id = req.usuario.id; // Pegamos o ID de quem está logado

  try {
    // Só edita se o ID da despesa pertencer ao USUÁRIO logado
    const resultado = await db.run(
      "UPDATE despesas SET descricao = ?, valor = ?, categoria = ?, data = ? WHERE id = ? AND usuario_id = ?",
      [descricao, valor, categoria, data, id, usuario_id],
    );

    if (resultado.changes === 0) {
      return res
        .status(404)
        .json({ erro: "Despesa não encontrada ou sem permissão" });
    }

    res.json({ mensagem: "Atualizado com sucesso!" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar" });
  }
});

// Rota para Registrar Usuário
app.post("/api/auth/registrar", async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    // 1. Verificar se o e-mail já existe
    const usuarioExistente = await db.get(
      "SELECT * FROM usuarios WHERE email = ?",
      [email],
    );
    if (usuarioExistente)
      return res.status(400).json({ erro: "E-mail já cadastrado" });

    // 2. Embaralhar a senha (hash)
    const senhaHash = await bcrypt.hash(senha, 10);

    // 3. Salvar no banco
    await db.run("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", [
      nome,
      email,
      senhaHash,
    ]);

    res.status(201).json({ mensagem: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao registrar usuário" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Buscar usuário
    const usuario = await db.get("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (!usuario)
      return res.status(400).json({ erro: "E-mail ou senha incorretos" });

    // 2. Comparar a senha digitada com a do banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida)
      return res.status(400).json({ erro: "E-mail ou senha incorretos" });

    // 3. Gerar o Token (o "crachá")
    const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      nome: usuario.nome,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao fazer login" });
  }
});

/*
app.listen(3001, () =>
  console.log("Servidor rodando em http://localhost:3001"),
);*/

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
