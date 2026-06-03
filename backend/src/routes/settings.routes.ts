import { Router } from 'express';
import { pool } from '../config/db';
import { authMiddleware, requirePlan } from '../middlewares/auth.middleware';

const router = Router();

// Buscar as configurações públicas da Loja (Usado pelo App do Cliente, sem token)
router.get('/:companyId/public', async (req, res) => {
  try {
    const { companyId } = req.params;
    const result = await pool.query(
      'SELECT logo_url, banner_url, primary_color, secondary_color, store_name, is_open_manual, opening_hours, fee_type FROM store_settings WHERE company_id = $1',
      [companyId]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public settings' });
  }
});

// Salvar/Atualizar configurações (Apenas ADMIN via Painel) - Exige Plano PRO
router.post('/save', authMiddleware, requirePlan('pro'), async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });
    const data = req.body;

    const result = await pool.query(`
      INSERT INTO store_settings (
        company_id, primary_color, secondary_color, logo_url, banner_url, 
        is_open_manual, opening_hours, fee_type, max_delivery_radius_km
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (company_id) DO UPDATE SET
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        logo_url = EXCLUDED.logo_url,
        banner_url = EXCLUDED.banner_url,
        is_open_manual = EXCLUDED.is_open_manual,
        opening_hours = EXCLUDED.opening_hours,
        fee_type = EXCLUDED.fee_type,
        max_delivery_radius_km = EXCLUDED.max_delivery_radius_km,
        updated_at = now()
      RETURNING *;
    `, [
      companyId, data.primary_color, data.secondary_color, data.logo_url, data.banner_url,
      data.is_open_manual, JSON.stringify(data.opening_hours), data.fee_type, data.max_delivery_radius_km
    ]);

    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
