import type { Request, Response } from "express";
import { ProdutoModel } from "../models/Produto.js";
import { error } from "node:console";

export const getProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await ProdutoModel.listarTodos();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

export const getProdutosPorId = async (req: Request, res: Response) =>{
  const id = Number(req.params.id);
  try {
    const produto =await ProdutoModel.buscarPorId(id);
    return res.json(produto)
  } catch {
    res.status(500).json({error: "Erro ao buscar o Produto"})
  }
}

export const criarProduto = async (req: Request, res: Response) => {
  if (!req.body.nome || !req.body.preco) {
    return res.status(400).json({ error: "Nome e preço são obrigatórios" });
  }
  try {
    const novoProduto = await ProdutoModel.criarProduto(req.body);
    res.status(201).json(novoProduto);
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar produto" });
  }
};

export const atualizarProduto = async (req: Request, res: Response) => {
  const id = Number (req.params.id)
  try {
    const produtoAtual = await ProdutoModel.buscarPorId(id);

    if(!produtoAtual){
      return res.status(404).json({error: "Produto não encontrado"})
    }

    const dados = {
      nome: req.body.nome ?? produtoAtual.nome,
      preco: req.body.preco ?? produtoAtual.preco,
      estoque: req. body.estoque ?? produtoAtual.estoque
    }

    const atualizado = await ProdutoModel.atualizar(id, dados);
    return res.json(atualizado)

  } catch {
    res.status(500).json({error: `Erro ao atualizar: ${error}`})
  }
}

export const deletarProduto = async (req: Request, res: Response) => {
  const id = Number (req.params.id)
  try {
    const deletado = await ProdutoModel.deletarProduto(id);

    if(!deletado){
      return res.status(404).json({message: "Produto não encontrado"})
    }
    res.status(204).send()

  }catch (error){
    res.status(500).json({error: `Erro ao deletar: ${error}`})
  }
}
