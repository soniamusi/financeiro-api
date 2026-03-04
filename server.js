const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Nossa "tabela" de despesas (em memória)
let despesas = [
  { id: 1, descricao: "Aluguel", valor: 120000, categoria: "Moradia" }, // 1200.00
];

// Rota para listar despesas
app.get("/despesas", (req, res) => {
  res.json(despesas);
});

// Rota para adicionar despesa
app.post("/despesas", (req, res) => {
  const { descricao, valor, categoria } = req.body;
  const novaDespesa = {
    id: Date.now(),
    descricao,
    valor,
    categoria,
  };
  despesas.push(novaDespesa);
  res.status(201).json(novaDespesa);
});

app.listen(3001, () => console.log("Servidor rodando na porta 3001 🚀"));
