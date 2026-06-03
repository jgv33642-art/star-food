import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Users, Plus, Minus, CreditCard, 
  QrCode, Banknote, Trash2, CheckCircle2, 
  Loader2, AlertTriangle, Printer 
} from 'lucide-react';
import { api } from '../lib/api';

function formatBRL(value: number | string | undefined) {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface PaymentItem {
  id: string;
  method: 'cash' | 'credit' | 'debit' | 'pix';
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
}

interface PaymentSummaryResponse {
  order: {
    id: string;
    table_id: string | null;
    table_number: number | null;
    status: string;
  };
  items: OrderItem[];
  payments: Array<{
    id: string;
    method: string;
    amount: string;
    change_amount: string;
  }>;
  subtotal: number;
  paid: number;
  remaining: number;
}

export const PaymentCheckout = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Order data from API
  const [orderSummary, setOrderSummary] = useState<PaymentSummaryResponse | null>(null);

  // Local payment states
  const [splitCount, setSplitCount] = useState(1);
  const [localPayments, setLocalPayments] = useState<PaymentItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'credit' | 'debit' | 'pix' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaymentSummaryResponse>(`/orders/${orderId}/payment-summary`);
      setOrderSummary(data);
      // Pre-fill amount field with remaining value
      setPaymentAmount(data.remaining.toFixed(2));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados de pagamento: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadSummary();
  }, [orderId]);

  if (loading) {
    return (
      <Layout title="Fechamento de Conta">
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-bold font-mono">Processando dados do pedido...</span>
        </div>
      </Layout>
    );
  }

  if (error || !orderSummary) {
    return (
      <Layout title="Fechamento de Conta">
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Erro</h3>
          <p className="text-slate-400 text-sm mb-6">{error || 'Pedido não encontrado.'}</p>
          <button 
            onClick={() => navigate('/caixa')}
            className="bg-slate-850 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all"
          >
            Voltar ao Caixa
          </button>
        </div>
      </Layout>
    );
  }

  const { order, items, subtotal, paid: alreadyPaid, remaining: initialRemaining } = orderSummary;

  // Real-time calculations taking into account local payments
  const localTotalPaid = localPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = alreadyPaid + localTotalPaid;
  const currentRemaining = Math.max(0, subtotal - totalPaid);
  const splitAmount = currentRemaining / splitCount;

  // Calculation of change for current payment input
  const changeValue = selectedMethod === 'cash' && receivedAmount
    ? Math.max(0, parseFloat(receivedAmount) - parseFloat(paymentAmount))
    : 0;

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }
    if (amount > currentRemaining + 0.01) {
      alert('O valor excede o saldo restante.');
      return;
    }

    const newPayment: PaymentItem = {
      id: Math.random().toString(36).substring(2, 9),
      method: selectedMethod || 'credit',
      amount,
    };

    if (selectedMethod === 'cash' && receivedAmount) {
      const received = parseFloat(receivedAmount);
      if (received < amount) {
        alert('O valor recebido em dinheiro deve ser maior ou igual ao valor a ser pago.');
        return;
      }
      newPayment.receivedAmount = received;      newPayment.changeAmount = changeValue;
    }

    setLocalPayments(prev => [...prev, newPayment]);
    
    // Clear inputs and set amount to next remaining value
    setSelectedMethod(null);
    setReceivedAmount('');
    const nextRemaining = Math.max(0, currentRemaining - amount);
    setPaymentAmount(nextRemaining.toFixed(2));
  };

  const handleRemoveLocalPayment = (id: string) => {
    const pmt = localPayments.find(p => p.id === id);
    if (!pmt) return;
    setLocalPayments(prev => prev.filter(p => p.id !== id));
    setPaymentAmount((currentRemaining + pmt.amount).toFixed(2));
  };

  const handleConfirmPayments = async () => {
    if (localPayments.length === 0) {
      alert('Por favor, adicione ao menos um pagamento.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        payments: localPayments.map(p => ({
          method: p.method,
          amount: p.amount,
          receivedAmount: p.receivedAmount,
        }))
      };

      const res = await api.post<any>(`/orders/${order.id}/pay`, payload);
      setSuccessData(res);
    } catch (err: any) {
      alert('Erro ao finalizar pagamento: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro 💵';
      case 'pix': return 'PIX 📲';
      case 'credit': return 'Crédito 💳';
      case 'debit': return 'Débito 💳';
      default: return method;
    }
  };

  if (successData) {
    return (
      <Layout title="Conta Fechada!">
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Pagamento Realizado!</h3>
          <p className="text-slate-400 text-sm mb-6">
            Comanda #{order.id.slice(0, 4)} foi encerrada com sucesso.
          </p>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 w-full mb-6 text-left space-y-3.5">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Faturamento Total:</span>
              <span className="font-bold text-white font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Valor Pago nesta Transação:</span>
              <span className="font-bold text-emerald-400 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(successData.totalPaid)}</span>
            </div>
            {successData.change > 0 && (
              <div className="flex justify-between text-sm text-slate-400 border-t border-slate-800 pt-3">
                <span className="text-amber-500 font-bold">Troco a Devolver:</span>
                <span className="font-bold text-amber-500 font-mono text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(successData.change)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={() => alert('Imprimindo via do cliente via ESC/POS...')}
              className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-800 text-sm"
            >
              <Printer className="w-4 h-4" /> Via Cliente
            </button>
            <button 
              onClick={() => navigate('/caixa')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              Voltar ao Caixa
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Checkout Unificado">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
        
        {/* Left Side: Summary & Items (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-850">
              <button 
                onClick={() => navigate('/caixa')} 
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-white">Comanda #{order.id.slice(0, 4)}</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {order.table_number ? `Mesa ${order.table_number}` : 'Avulsa / Balcão'}
                </p>
              </div>
            </div>

            {/* List items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">{item.quantity}x {item.product_name}</span>
                  <span className="text-white font-bold font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Finance Details */}
            <div className="pt-6 border-t border-slate-850 mt-6 space-y-3.5">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal:</span>
                <span className="font-bold text-white font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-455">
                <span>Já Pago:</span>
                <span className="font-bold text-emerald-400 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alreadyPaid)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-bold">A Pagar Restante:</span>
                <span className="font-bold text-amber-500 font-mono text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialRemaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Splitting & Payment Methods (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bill splitting control */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white">Dividir Conta</h4>
                <p className="text-xs text-slate-400 mt-0.5">Defina em quantas pessoas deseja dividir o saldo restante</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3.5 bg-slate-950 p-1.5 border border-slate-850 rounded-2xl">
                <button 
                  onClick={() => setSplitCount(prev => Math.max(1, prev - 1))}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-white w-8 text-center">{splitCount}</span>
                <button 
                  onClick={() => setSplitCount(prev => prev + 1)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Valor por Pessoa</span>
                <span className="text-2xl font-black text-indigo-400 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(splitAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Add Payment Form */}
          {currentRemaining > 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <h3 className="text-lg font-bold text-white">Lançar Pagamento Parcial ou Integral</h3>
              
              {/* Payment Methods Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => { setSelectedMethod('cash'); setReceivedAmount(''); }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    selectedMethod === 'cash'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Dinheiro</span>
                </button>

                <button
                  onClick={() => { setSelectedMethod('pix'); setReceivedAmount(''); }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    selectedMethod === 'pix'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">PIX</span>
                </button>

                <button
                  onClick={() => { setSelectedMethod('credit'); setReceivedAmount(''); }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    selectedMethod === 'credit'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Crédito</span>
                </button>

                <button
                  onClick={() => { setSelectedMethod('debit'); setReceivedAmount(''); }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    selectedMethod === 'debit'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Débito</span>
                </button>
              </div>

              {selectedMethod && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Valor a Pagar (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
                    />
                  </div>

                  {selectedMethod === 'cash' ? (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Valor Recebido (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={receivedAmount}
                        onChange={e => setReceivedAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
                      />
                      {changeValue > 0 && (
                        <span className="text-xs text-amber-500 font-bold block mt-1">
                          Troco: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(changeValue)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-end">
                      <span className="text-xs text-slate-500 font-medium">Método de pagamento digital ativo. Sem necessidade de troco.</span>
                    </div>
                  )}

                  <div className="md:col-span-2 pt-2 flex justify-end">
                    <button
                      onClick={handleAddPayment}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-500/10 transition-all text-sm cursor-pointer"
                    >
                      Confirmar {formatMethodLabel(selectedMethod)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-white text-lg">Conta Pronta para Fechamento!</h4>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">O valor integral da comanda já está coberto pelos pagamentos registrados abaixo.</p>
            </div>
          )}

          {/* List of accumulated payments */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Pagamentos da Transação Atual</h3>
            
            <div className="space-y-4">
              {localPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Nenhum pagamento adicionado para esta transação ainda.</div>
              ) : (
                localPayments.map((pmt) => (
                  <div key={pmt.id} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{formatMethodLabel(pmt.method)}</span>
                      {pmt.receivedAmount !== undefined && (
                        <span className="text-xs text-slate-500 font-mono">
                          (Rec: {formatBRL(pmt.receivedAmount)} / Troco: {formatBRL(pmt.changeAmount)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white font-mono">{formatBRL(pmt.amount)}</span>
                      <button 
                        onClick={() => handleRemoveLocalPayment(pmt.id)}
                        className="text-red-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {localPayments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Lançado Nesta Transação</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{formatBRL(localTotalPaid)}</span>
                </div>
                <button
                  onClick={handleConfirmPayments}
                  disabled={actionLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-slate-950 font-black text-base px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Fechar Conta
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};
