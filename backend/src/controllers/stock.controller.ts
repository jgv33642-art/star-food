import { Request, Response, NextFunction } from 'express';
import { XMLParser } from 'fast-xml-parser';
import { queryWithRLS, pool } from '../config/db';
import { scrapeSefazUrl } from '../utils/sefazScraper';

export class StockController {
  importXml = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const { xmlContent } = req.body;

      if (!xmlContent) {
        return res.status(400).json({ message: 'Conteúdo XML é obrigatório.' });
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });

      const jsonObj = parser.parse(xmlContent);

      // Locate infNFe and key
      const infNFe = jsonObj.nfeProc?.NFe?.infNFe || jsonObj.NFe?.infNFe;
      if (!infNFe) {
        return res.status(400).json({ message: 'Arquivo XML inválido ou não correspondente a uma NF-e.' });
      }

      let accessKey = '';
      if (infNFe['@_Id']) {
        accessKey = infNFe['@_Id'].replace(/^NFe/, '');
      }
      const chNFe = jsonObj.nfeProc?.protNFe?.infProt?.chNFe || jsonObj.protNFe?.infProt?.chNFe;
      if (chNFe) {
        accessKey = String(chNFe);
      }

      // 1. Validação Prévia de Chave Duplicada
      if (accessKey) {
        const dupCheck = await queryWithRLS(
          companyId,
          'SELECT id FROM invoice_inputs WHERE access_key = $1 AND company_id = $2',
          [accessKey, companyId]
        );
        if (dupCheck.rows && dupCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Esta Nota Fiscal já foi importada anteriormente.' });
        }
      }

      // Extract Supplier (Emitente)
      const emit = infNFe.emit;
      const supplierCnpj = emit?.CNPJ || '';
      const supplierName = emit?.xNome || '';

      // Extract Total Value
      const totalValue = parseFloat(infNFe.total?.ICMSTot?.vNF || 0);

      // Extract Items
      let detList = infNFe.det;
      if (!detList) detList = [];
      if (!Array.isArray(detList)) {
        detList = [detList];
      }

      const parsedItems = [];
      for (const det of detList) {
        const prod = det?.prod;
        const supplierCode = String(prod?.cProd || '');
        const ean = String(prod?.cEAN || '');
        const name = String(prod?.xProd || '');
        const quantity = parseFloat(prod?.qCom || 0);
        const costPrice = parseFloat(prod?.vUnCom || 0);

        // Find internal product match (EAN or SKU match)
        let matchedProduct = null;
        
        // Match EAN
        if (ean && ean !== 'SEM GTIN') {
          const prodRes = await queryWithRLS(
            companyId,
            'SELECT id, name, price, cost, stock_quantity, sku FROM products WHERE sku = $1 AND company_id = $2',
            [ean, companyId]
          );
          if (prodRes.rows && prodRes.rows.length > 0) {
            matchedProduct = prodRes.rows[0];
          }
        }

        // Match supplier code if no EAN match
        if (!matchedProduct && supplierCode) {
          const prodRes = await queryWithRLS(
            companyId,
            'SELECT id, name, price, cost, stock_quantity, sku FROM products WHERE sku = $1 AND company_id = $2',
            [supplierCode, companyId]
          );
          if (prodRes.rows && prodRes.rows.length > 0) {
            matchedProduct = prodRes.rows[0];
          }
        }

        parsedItems.push({
          supplierCode,
          ean: ean === 'SEM GTIN' ? '' : ean,
          name,
          quantity,
          costPrice,
          matchedProduct: matchedProduct
            ? {
                id: matchedProduct.id,
                name: matchedProduct.name,
                price: parseFloat(matchedProduct.price || 0),
                cost: matchedProduct.cost ? parseFloat(matchedProduct.cost) : 0,
                stockQuantity: parseFloat(matchedProduct.stock_quantity || 0),
                sku: matchedProduct.sku || '',
              }
            : null,
        });
      }

      res.json({
        accessKey,
        supplierCnpj,
        supplierName,
        totalValue,
        items: parsedItems,
      });
    } catch (error: any) {
      res.status(550).json({ message: 'Erro ao processar o XML: ' + (error.message || error) });
    }
  };

  importQrCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const { qrcodeUrl } = req.body;

      if (!qrcodeUrl) {
        return res.status(400).json({ message: 'A URL do QR Code da NFC-e/SAT é obrigatória.' });
      }

      const scraped = await scrapeSefazUrl(qrcodeUrl);

      // Validação Prévia de Chave Duplicada
      if (scraped.accessKey) {
        const dupCheck = await queryWithRLS(
          companyId,
          'SELECT id FROM invoice_inputs WHERE access_key = $1 AND company_id = $2',
          [scraped.accessKey, companyId]
        );
        if (dupCheck.rows && dupCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Este Cupom Fiscal já foi importado anteriormente.' });
        }
      }

      // Automatically search for internal product matches by EAN or SKU
      const parsedItems = [];
      for (const item of scraped.items) {
        let matchedProduct = null;

        // Match EAN
        if (item.ean) {
          const prodRes = await queryWithRLS(
            companyId,
            'SELECT id, name, price, cost, stock_quantity, sku FROM products WHERE sku = $1 AND company_id = $2',
            [item.ean, companyId]
          );
          if (prodRes.rows && prodRes.rows.length > 0) {
            matchedProduct = prodRes.rows[0];
          }
        }

        // Match supplierCode (supplier product code) if no EAN match
        if (!matchedProduct && item.supplierCode) {
          const prodRes = await queryWithRLS(
            companyId,
            'SELECT id, name, price, cost, stock_quantity, sku FROM products WHERE sku = $1 AND company_id = $2',
            [item.supplierCode, companyId]
          );
          if (prodRes.rows && prodRes.rows.length > 0) {
            matchedProduct = prodRes.rows[0];
          }
        }

        parsedItems.push({
          supplierCode: item.supplierCode,
          ean: item.ean,
          name: item.name,
          quantity: item.quantity,
          costPrice: item.costPrice,
          matchedProduct: matchedProduct
            ? {
                id: matchedProduct.id,
                name: matchedProduct.name,
                price: parseFloat(matchedProduct.price || 0),
                cost: matchedProduct.cost ? parseFloat(matchedProduct.cost) : 0,
                stockQuantity: parseFloat(matchedProduct.stock_quantity || 0),
                sku: matchedProduct.sku || '',
              }
            : null,
        });
      }

      res.json({
        accessKey: scraped.accessKey,
        supplierCnpj: scraped.supplierCnpj,
        supplierName: scraped.supplierName,
        totalValue: scraped.totalValue,
        items: parsedItems,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Erro ao processar QR Code do Cupom Fiscal.' });
    }
  };

  confirmImport = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
      const companyId = req.user!.companyId;
      const { accessKey, supplierCnpj, supplierName, totalValue, items } = req.body;

      if (!supplierCnpj || !supplierName || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Dados incompletos para a importação.' });
      }

      await client.query('BEGIN');

      // Insert invoice header
      const headerRes = await client.query(
        `INSERT INTO invoice_inputs (company_id, access_key, supplier_cnpj, supplier_name, total_value, created_at)
         VALUES ($1, $2, $3, $4, $5, now()) RETURNING id`,
        [companyId, accessKey || null, supplierCnpj, supplierName, totalValue]
      );
      const invoiceInputId = headerRes.rows[0].id;

      for (const item of items) {
        const { productId, supplierCode, ean, name, quantity, costPrice } = item;

        // Insert invoice input item
        await client.query(
          `INSERT INTO invoice_input_items (invoice_input_id, product_id, supplier_code, ean, name, quantity, cost_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [invoiceInputId, productId || null, supplierCode || null, ean || null, name, quantity, costPrice]
        );

        if (productId) {
          // Fetch current product to update stock and cost
          const prodRes = await client.query(
            'SELECT id, cost, stock_quantity FROM products WHERE id = $1 AND company_id = $2 FOR UPDATE',
            [productId, companyId]
          );
          
          if (prodRes.rows && prodRes.rows.length > 0) {
            const product = prodRes.rows[0];
            const currentStock = parseFloat(product.stock_quantity || 0);
            const currentCost = product.cost ? parseFloat(product.cost) : 0;

            // Custo Médio Ponderado
            let newCost = costPrice;
            if (currentStock > 0) {
              newCost = ((currentStock * currentCost) + (quantity * costPrice)) / (currentStock + quantity);
            }

            // Update product stock and cost
            await client.query(
              `UPDATE products
               SET stock_quantity = stock_quantity + $1, cost = $2, updated_at = now()
               WHERE id = $3 AND company_id = $4`,
              [quantity, newCost, productId, companyId]
            );

            // Record stock movement
            await client.query(
              `INSERT INTO stock_movements (company_id, product_id, type, quantity, created_at)
               VALUES ($1, $2, 'invoice_input', $3, now())`,
              [companyId, productId, quantity]
            );
          }
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Entrada de estoque confirmada com sucesso.' });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await queryWithRLS(
        companyId,
        'SELECT * FROM invoice_inputs WHERE company_id = $1 ORDER BY created_at DESC',
        [companyId]
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  };
}
