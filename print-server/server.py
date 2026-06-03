import os
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Habilita CORS para permitir requisições do PWA rodando em qualquer domínio
CORS(app)

def format_item_line(qty: float, name: str, price: float) -> str:
    """
    Formata uma linha de item para bobina de 80mm (geralmente 48 colunas).
    Alinha a Quantidade à esquerda, o Preço à direita, e preenche o centro com o Nome.
    """
    qty_str = f"{qty:.0f}x" if qty.is_integer() else f"{qty:.2f}x"
    qty_part = f"{qty_str:<5}"  # Alinhado à esquerda com largura 5
    price_str = f"R$ {price:.2f}"
    price_part = f"{price_str:>9}"  # Alinhado à direita com largura 9
    
    # Espaço disponível para o nome do produto (48 - 5 - 9 = 34 colunas)
    max_name_len = 48 - len(qty_part) - len(price_part)
    
    if len(name) > max_name_len:
        name_part = name[:max_name_len - 3] + "..."
    else:
        name_part = name.ljust(max_name_len)
        
    return f"{qty_part}{name_part}{price_part}"

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "online", "message": "Servidor local de impressão Star Food ativo e ouvindo."}), 200

@app.route('/imprimir', methods=['POST'])
def imprimir():
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "JSON body é obrigatório"}), 400
        
        # Extração de dados do pedido
        estabelecimento = data.get("estabelecimento", "STAR FOOD")
        mesa = data.get("mesa")
        comanda = data.get("comanda")
        garcom = data.get("garcom", "Não informado")
        data_hora = data.get("data_hora", datetime.datetime.now().strftime("%d/%m/%Y %H:%M"))
        items = data.get("items", [])
        total = data.get("total", 0.0)
        
        # Configurações da impressora vinda do payload ou variáveis de ambiente
        printer_type = data.get("printer_type", os.environ.get("PRINTER_TYPE", "network")).lower()
        printer_address = data.get("printer_address", os.environ.get("PRINTER_ADDRESS", "192.168.1.100"))
        
        # Configurações adicionais para USB (Vendor ID e Product ID em hexadecimal, ex: '0x04b8')
        usb_vendor_str = data.get("usb_vendor_id", os.environ.get("PRINTER_USB_VENDOR", "0x04b8"))
        usb_product_str = data.get("usb_product_id", os.environ.get("PRINTER_USB_PRODUCT", "0x0202"))
        
        print(f"[IMPRESSÃO] Tentando imprimir via {printer_type} em {printer_address}")
        
        p = None
        is_dry_run = False
        
        # Tenta conectar à impressora física
        try:
            from escpos.printer import Network, Usb
            if printer_type == "network":
                # Conecta via rede TCP/IP na porta padrão de impressoras térmicas (9100)
                p = Network(printer_address, port=9100, timeout=5)
            elif printer_type == "usb":
                vendor_id = int(usb_vendor_str, 16)
                product_id = int(usb_product_str, 16)
                p = Usb(vendor_id, product_id)
            else:
                raise ValueError(f"Tipo de impressora inválido: {printer_type}")
        except Exception as conn_err:
            print(f"[AVISO] Não foi possível conectar à impressora ({str(conn_err)}). Executando em modo de teste (Dry-run).")
            is_dry_run = True
            
        print_lines = []
        
        # Funções utilitárias de formatação ESC/POS com fallback para Dry-run
        def write_bold_large(text):
            if p and not is_dry_run:
                p.set(align='center', font='a', width=2, height=2, bold=True)
                p.textln(text)
            else:
                print_lines.append(f"[NEGRITO GRANDE CENTRALIZADO] {text}")
                
        def write_header(text):
            if p and not is_dry_run:
                p.set(align='center', font='a', width=1, height=1, bold=True)
                p.textln(text)
            else:
                print_lines.append(f"[NEGRITO CENTRALIZADO] {text}")
                
        def write_normal(text, align='left', bold=False):
            if p and not is_dry_run:
                p.set(align=align, font='a', width=1, height=1, bold=bold)
                p.textln(text)
            else:
                bold_tag = "[NEGRITO] " if bold else ""
                print_lines.append(f"{bold_tag}{text} ({align})")
                
        def write_divider():
            divider = "-" * 48
            if p and not is_dry_run:
                p.set(align='center', font='a', width=1, height=1, bold=False)
                p.textln(divider)
            else:
                print_lines.append(divider)
                
        # --- Montagem do Cupom (Layout 80mm) ---
        
        # 1. Topo: Nome do Estabelecimento (Centralizado)
        write_header(estabelecimento.upper())
        write_normal("CONTROLE DE COZINHA / BAR", align='center')
        write_divider()
        
        # 2. Destaque Grande: Mesa ou Comanda
        if mesa:
            write_bold_large(f"MESA: {mesa}")
        elif comanda:
            write_bold_large(f"COMANDA: {comanda}")
        else:
            write_bold_large("PEDIDO")
            
        write_divider()
        
        # 3. Identificação de Atendimento e Data
        write_normal(f"Garçom: {garcom}")
        write_normal(f"Data/Hora: {data_hora}")
        write_divider()
        
        # 4. Cabeçalho dos Itens
        write_normal("Qtd  Produto                           Preço", bold=True)
        write_divider()
        
        # 5. Listagem de Itens com Alinhamento e Recuo para Observação
        for item in items:
            qty = float(item.get("qty", 1))
            name = item.get("name", "Item")
            price = float(item.get("price", 0.0))
            obs = item.get("obs", "")
            
            # Linha principal do item
            item_line = format_item_line(qty, name, price)
            write_normal(item_line)
            
            # Observação em nova linha recuada
            if obs:
                write_normal(f"  -> OBS: {obs}", bold=True)
                
        write_divider()
        
        # 6. Total do Pedido
        write_normal(f"TOTAL: R$ {total:.2f}", align='right', bold=True)
        
        # 7. Avanço de papel e Corte
        if p and not is_dry_run:
            p.ln(3)  # Avança 3 linhas
            p.cut()  # Comando de guilhotina corte automático
            p.close()
            print("[SUCESSO] Impressão enviada física.")
        else:
            print("\n=== CUPOM IMPRESSO (DRY-RUN) ===")
            print("\n".join(print_lines))
            print("================================\n")
            
        return jsonify({
            "status": "success",
            "message": "Impressão enviada com sucesso",
            "dry_run": is_dry_run,
            "printed_content": print_lines if is_dry_run else None
        }), 200
        
    except Exception as e:
        print(f"[ERRO] Erro na API de impressão: {str(e)}")
        return jsonify({"status": "error", "message": f"Erro interno: {str(e)}"}), 500

if __name__ == '__main__':
    # Roda o micro-serviço na porta 3001
    print("[INICIANDO] Servidor local de impressão térmica na porta 3001...")
    app.run(host='0.0.0.0', port=3001)
