import { Request, Response } from 'express';
import { pool, queryWithRLS } from '../config/db';

export const createCourier = async (req: Request, res: Response) => {
  try {
    const { name, phone, vehicle, active } = req.body;
    const companyId = req.user?.companyId;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const result = await queryWithRLS(
      companyId,
      `INSERT INTO couriers (company_id, name, phone, vehicle, active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, name, phone, vehicle, active ?? true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar motoboy:', error);
    res.status(500).json({ error: 'Erro ao criar motoboy' });
  }
};

export const getCouriers = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    const result = await queryWithRLS(
      companyId,
      `SELECT * FROM couriers WHERE company_id = $1 ORDER BY name ASC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar motoboys:', error);
    res.status(500).json({ error: 'Erro ao buscar motoboys' });
  }
};

export const updateCourier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicle, active } = req.body;
    const companyId = req.user?.companyId;

    const result = await queryWithRLS(
      companyId,
      `UPDATE couriers 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           vehicle = COALESCE($3, vehicle),
           active = COALESCE($4, active),
           updated_at = NOW()
       WHERE id = $5 AND company_id = $6
       RETURNING *`,
      [name, phone, vehicle, active, id, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Motoboy não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar motoboy:', error);
    res.status(500).json({ error: 'Erro ao atualizar motoboy' });
  }
};

export const deleteCourier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const result = await queryWithRLS(
      companyId,
      `DELETE FROM couriers WHERE id = $1 AND company_id = $2 RETURNING *`,
      [id, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Motoboy não encontrado' });
    }

    res.json({ message: 'Motoboy removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover motoboy:', error);
    res.status(500).json({ error: 'Erro ao remover motoboy' });
  }
};
