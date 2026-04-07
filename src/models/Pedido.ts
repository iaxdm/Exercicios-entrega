import { Result } from "pg";
import { pool } from "../db.js";

export interface IItemPedido {
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
  preco_un: number;
  nome: string;
}

export interface IPedido {
  // I antes da palavra pedido representa a interface
  id: number;
  data_criacao: Date;
  status: string;
  itens: IItemPedido[]; //itens vai guardar um array com todas as características de IItemPedido
}

export type INovoItemPedido = Pick<IItemPedido, "produto_id" | "quantidade">;

export interface IPedidoRow {
  pedido_id: number;
  data_criacao: Date;
  status: string;
  item_id: number | null;
  produto_id: number | null;
  quantidade: number | null;
  produto_nome: string | null;
  produto_preco: number | null;
}

export const PedidoModel = {
  async criar(itens: INovoItemPedido[]): Promise<{ id: number }> {
    const client = await pool.connect(); //conecta ao banco de dados
    try {
      await client.query("BEGIN");
      const pedido = await client.query(
        "INSERT INTO pedidos (status) VALUES ('pendente') RETURNING id"
      );
      const pedidoId = pedido.rows[0].id;
      for (const item of itens) {
        //Verifica todos os itens da lista
        const produtoSelecionado = await client.query(
          "SELECT estoque, nome, preco FROM produtos WHERE id = $1",
          [item.produto_id]
        );
        if (
          !produtoSelecionado.rows[0] ||
          produtoSelecionado.rows[0].estoque < item.quantidade
        ) {
          throw new Error(
            `Estoque insuficiente para o produto ${produtoSelecionado.rows[0].nome}!`
          );
        }
        await client.query(
          "UPDATE produtos set estoque = estoque - $1 WHERE id = $2",
          [item.quantidade, item.produto_id]
        );
        await client.query(
          "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_un) VALUES ($1, $2, $3, $4)",
          [
            pedidoId,
            item.produto_id,
            item.quantidade,
            produtoSelecionado.rows[0].preco,
          ]
        );
        await client.query("COMMIT");
      }

      return { id: pedidoId };
    } catch (error) {
      await client.query("ROLLBACK"); //caso de erro são desfeitas as ações de PedidosModel
      throw error;
    } finally {
      client.release(); //desconecta do banco de dados
    }
  },

  async listarTodos(): Promise<IPedido[]> {
    const query = `SELECT p.id as pedido_id, p.data_criacao, p.status, ip.id as item_id,
        ip.produto_id, ip.quantidade, pr.nome as produto_nome, pr.preco as prodduto_preco
        FROM pedidos p LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
        LEFT JOIN produtos pr ON ip.produto_id = p.id ORDER BY p.data_criacao DESC`;

    const { rows } = await pool.query<IPedidoRow>(query);
    const listaPedidos: IPedido[] = [];

    for (const row of rows) {
      let pedidoExistente = listaPedidos.find((p) => p.id === row.pedido_id);
      if (!pedidoExistente) {
        pedidoExistente = {
          id: row.pedido_id,
          data_criacao: row.data_criacao,
          status: row.status,
          itens: [],
        };
        listaPedidos.push(pedidoExistente);
      }

      if (row.item_id) {
        pedidoExistente.itens.push({
          id: row.item_id,
          produto_id: row.produto_id!,
          pedido_id: row.pedido_id!,
          quantidade: row.quantidade!,
          preco_un: row.produto_preco!,
          nome: row.produto_nome!,
        });
      }
    }
    return listaPedidos;
  },

  async deletarPedido(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const queryItens =
        "SELECT produto_id, quantidade FROM itens_pedido where pedido_id = $1";
      const { rows } = await client.query(queryItens, [id]);
      for (const row of rows) {
        await client.query(
          "UPDATE produtos SET estoque = estoque + $1 WHERE id = $2",
          [row.quantidade, row.produto_id]
        );
      }
      const result = await client.query("DELETE FROM pedidos WHERE id = $1", [
        id,
      ]);
      await client.query("COMMIT");
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async atualizar(id: number, novosItens: INovoItemPedido[]): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: itensAntigos } = await client.query(
        "SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1",
        [id]
      );
      if (itensAntigos.length === 0) {
        throw new Error("Pedido não encontrado ou sem itens");
      }
      for (const item of itensAntigos) {
        await client.query(
          "UPDATE produtos SET estoque = estoque + $1 WHERE id = $2",
          [item.quantidade, item.produto_id]
        );
      }
      await client.query("DELETE FROM itens_pedido WHERE pedido_id = $1", [id]);
      for (const item of novosItens) {
        const { rows: produto } = await client.query(
          "SELECT estoque, nome, preco FROM produtos WHERE id = $1",
          [item.produto_id]
        );
        const produtoSelecionado = produto[0];
        if (!produtoSelecionado) {
          throw new Error("Produto não encontrado");
        }
        if (produtoSelecionado.estoque < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para o produto: ${produtoSelecionado.nome}!`
          );
        }
        await client.query(
          "UPDATE produtos SET estoque = estoque - $1 WHERE id = $2",
          [item.quantidade, item.produto_id]
        );
        await client.query(
          "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_un) VALUES ($1, $2, $3, $4)",
          [id, item.produto_id, item.quantidade, produtoSelecionado.preco]
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async mudarStatus(id: number, novoStatus: string): Promise<boolean> {
    const query = "UPDATE pedidos SET status = $1 WHERE id = $2";
    const result = await pool.query(query, [novoStatus, id]);
    return (result.rowCount ?? 0) > 0;
  },
};
