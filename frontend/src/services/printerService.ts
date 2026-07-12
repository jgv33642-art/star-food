// Types for Web Serial API
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream;
  readable: ReadableStream;
}

interface SerialOptions {
  filters?: { usbVendorId?: number }[];
}

declare global {
  interface Navigator {
    serial: {
      requestPort(options?: SerialOptions): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
}

export class PrinterService {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter | null = null;

  async connect(): Promise<boolean> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API não é suportada neste navegador. Use o Google Chrome ou Edge.');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 }); // Default baud rate for most thermal printers
      this.writer = this.port.writable.getWriter();
      return true;
    } catch (err) {
      console.error('Erro ao conectar com a impressora:', err);
      return false;
    }
  }

  async disconnect() {
    if (this.writer) {
      await this.writer.close();
      this.writer.releaseLock();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  isConnected(): boolean {
    return this.port !== null && this.writer !== null;
  }

  // Basic ESC/POS Commands
  private readonly ESC = 0x1B;
  private readonly GS = 0x1D;

  private commands = {
    INIT: [this.ESC, 0x40], // Initialize printer
    BOLD_ON: [this.ESC, 0x45, 1], // Bold on
    BOLD_OFF: [this.ESC, 0x45, 0], // Bold off
    CENTER: [this.ESC, 0x61, 1], // Align center
    LEFT: [this.ESC, 0x61, 0], // Align left
    RIGHT: [this.ESC, 0x61, 2], // Align right
    DOUBLE_HEIGHT_WIDTH: [this.GS, 0x21, 0x11], // Double height & width
    NORMAL_SIZE: [this.GS, 0x21, 0x00], // Normal size
    CUT: [this.GS, 0x56, 0x41, 0x00], // Full cut
    BEEP: [this.ESC, 0x42, 0x03, 0x02], // Beep 3 times, 200ms
  };

  private textEncoder = new TextEncoder();

  private encodeText(text: string): Uint8Array {
    // Basic conversion. In a real scenario, you might need to map to Code Page 850 for Portuguese accents
    // For simplicity, we just remove accents or send as UTF-8 (some printers support it, some print garbage)
    const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return this.textEncoder.encode(normalizedText);
  }

  async printReceipt(contentLines: { text: string; bold?: boolean; align?: 'left' | 'center' | 'right'; size?: 'normal' | 'large' }[]) {
    if (!this.writer) {
      throw new Error('Impressora não conectada');
    }

    try {
      const payload: number[] = [];

      // Init
      payload.push(...this.commands.INIT);

      for (const line of contentLines) {
        // Alignment
        if (line.align === 'center') payload.push(...this.commands.CENTER);
        else if (line.align === 'right') payload.push(...this.commands.RIGHT);
        else payload.push(...this.commands.LEFT);

        // Size
        if (line.size === 'large') payload.push(...this.commands.DOUBLE_HEIGHT_WIDTH);
        else payload.push(...this.commands.NORMAL_SIZE);

        // Bold
        if (line.bold) payload.push(...this.commands.BOLD_ON);
        
        // Text
        const textBytes = this.encodeText(line.text + '\n');
        payload.push(...Array.from(textBytes));

        // Reset bold
        if (line.bold) payload.push(...this.commands.BOLD_OFF);
      }

      // Add space before cut
      payload.push(...Array.from(this.encodeText('\n\n\n\n')));

      // Cut
      payload.push(...this.commands.CUT);

      // Send to printer
      const data = new Uint8Array(payload);
      await this.writer.write(data);

    } catch (err) {
      console.error('Erro na impressão:', err);
      throw err;
    }
  }

  // Example wrapper for a standard POS receipt
  async printPosReceipt(orderInfo: { 
    storeName: string; 
    orderId: string; 
    items: { name: string; qty: number; price: number }[]; 
    total: number;
    paymentMethod: string;
  }) {
    const lines = [];
    
    // Header
    lines.push({ text: orderInfo.storeName, bold: true, align: 'center' as const, size: 'large' as const });
    lines.push({ text: 'RECIBO DE VENDA', align: 'center' as const });
    lines.push({ text: '================================', align: 'center' as const });
    lines.push({ text: `PEDIDO: #${orderInfo.orderId}`, bold: true, align: 'left' as const });
    lines.push({ text: `Data: ${new Date().toLocaleString()}`, align: 'left' as const });
    lines.push({ text: '================================', align: 'center' as const });
    
    // Items
    lines.push({ text: 'QTD  ITEM                PRECO', bold: true, align: 'left' as const });
    for (const item of orderInfo.items) {
      const qty = String(item.qty).padStart(3, ' ');
      const name = item.name.substring(0, 15).padEnd(15, ' ');
      const price = `R$ ${item.price.toFixed(2)}`.padStart(10, ' ');
      lines.push({ text: `${qty}x ${name}  ${price}`, align: 'left' as const });
    }
    
    lines.push({ text: '--------------------------------', align: 'center' as const });
    
    // Total
    lines.push({ text: `TOTAL: R$ ${orderInfo.total.toFixed(2)}`, bold: true, size: 'large' as const, align: 'right' as const });
    lines.push({ text: `Pagamento: ${orderInfo.paymentMethod}`, align: 'right' as const });
    
    // Footer
    lines.push({ text: '--------------------------------', align: 'center' as const });
    lines.push({ text: 'OBRIGADO PELA PREFERENCIA!', align: 'center' as const, bold: true });
    
    await this.printReceipt(lines);
  }
}

export const printerService = new PrinterService();
