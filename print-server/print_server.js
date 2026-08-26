const http = require('http');
const net = require('net');

const ESC = 0x1B;
const GS = 0x1D;

const commands = {
  INIT: [ESC, 0x40],
  BOLD_ON: [ESC, 0x45, 1],
  BOLD_OFF: [ESC, 0x45, 0],
  CENTER: [ESC, 0x61, 1],
  LEFT: [ESC, 0x61, 0],
  RIGHT: [ESC, 0x61, 2],
  LARGE: [GS, 0x21, 0x11],
  NORMAL: [GS, 0x21, 0x00],
  CUT: [GS, 0x56, 0x41, 0x00],
};

function encodeText(text) {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return Buffer.from(normalized, 'utf-8');
}

function formatItemLine(qty, name, price) {
  const qtyStr = Number.isInteger(qty) ? `${qty}x` : `${qty.toFixed(2)}x`;
  const qtyPart = qtyStr.padEnd(5, ' ');
  const priceStr = `R$ ${price.toFixed(2)}`;
  const pricePart = priceStr.padStart(9, ' ');
  
  const maxNameLen = 48 - qtyPart.length - pricePart.length;
  let namePart = name;
  if (name.length > maxNameLen) {
    namePart = name.substring(0, maxNameLen - 3) + "...";
  } else {
    namePart = name.padEnd(maxNameLen, ' ');
  }
  
  return `${qtyPart}${namePart}${pricePart}`;
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "online", message: "Servidor Star Food EXE ativo!" }));
    return;
  }

  if (req.method === 'POST' && req.url === '/imprimir') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const printerType = data.printer_type || 'network';
        const printerAddress = data.printer_address || '192.168.1.100';
        
        let payload = [];
        payload.push(...commands.INIT);
        
        // Helper
        const writeLine = (text, align = 'LEFT', bold = false, large = false) => {
          payload.push(...commands[align]);
          if (large) payload.push(...commands.LARGE);
          else payload.push(...commands.NORMAL);
          if (bold) payload.push(...commands.BOLD_ON);
          
          const buf = encodeText(text + '\n');
          for(let b of buf) payload.push(b);
          
          if (bold) payload.push(...commands.BOLD_OFF);
        };
        
        const writeDivider = () => {
          writeLine('-'.repeat(48), 'CENTER');
        };
        
        writeLine(data.estabelecimento || "STAR FOOD", 'CENTER', true, false);
        writeLine("CONTROLE DE COZINHA / BAR", 'CENTER');
        writeDivider();
        
        if (data.mesa) writeLine(`MESA: ${data.mesa}`, 'CENTER', true, true);
        else if (data.comanda) writeLine(`COMANDA: ${data.comanda}`, 'CENTER', true, true);
        else writeLine("PEDIDO", 'CENTER', true, true);
        
        writeDivider();
        writeLine(`Garcom: ${data.garcom || 'Nao informado'}`);
        writeLine(`Data/Hora: ${data.data_hora || new Date().toLocaleString()}`);
        writeDivider();
        
        writeLine("Qtd  Produto                           Preco", 'LEFT', true);
        writeDivider();
        
        for (let item of (data.items || [])) {
          const qty = parseFloat(item.qty || 1);
          const price = parseFloat(item.price || 0);
          writeLine(formatItemLine(qty, item.name || 'Item', price));
          if (item.obs) writeLine(`  -> OBS: ${item.obs}`, 'LEFT', true);
        }
        
        writeDivider();
        const total = parseFloat(data.total || 0);
        writeLine(`TOTAL: R$ ${total.toFixed(2)}`, 'RIGHT', true);
        
        payload.push(...encodeText('\n\n\n'));
        payload.push(...commands.CUT);

        const buffer = Buffer.from(payload);
        
        if (printerType === 'network') {
          console.log(`[NETWORK] Enviando impressao para ${printerAddress}:9100...`);
          const client = new net.Socket();
          client.setTimeout(5000);
          
          client.connect(9100, printerAddress, () => {
            client.write(buffer, () => {
              client.destroy();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: "success", message: "Impresso via Rede!" }));
            });
          });
          
          client.on('error', (err) => {
            console.error('Erro de conexao:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "error", message: err.message }));
          });
          
          client.on('timeout', () => {
            client.destroy();
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "error", message: "Timeout" }));
          });
        } else {
          console.log(`[DRY RUN] Impressora USB nao suportada no EXE nativo. Log:\n`, body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: "success", message: "Simulado no terminal" }));
        }
        
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "error", message: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('===================================================');
  console.log('  STAR FOOD - SERVIDOR DE IMPRESSAO DA COZINHA     ');
  console.log('===================================================');
  console.log(`Ouvindo na porta ${PORT}... (Deixe esta janela aberta)`);
});
