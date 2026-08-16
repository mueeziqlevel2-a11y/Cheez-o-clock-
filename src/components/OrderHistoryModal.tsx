import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ShoppingBag, MapPin, Phone, RefreshCw, ChevronRight, CheckCircle2, Truck, AlertCircle, Package } from 'lucide-react';
import { Order, OrderItem, CustomerUser } from '../types';
import { fetchCustomerOrderHistory } from '../lib/api';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  customerUser: CustomerUser | null;
  onReorder: (items: OrderItem[]) => void;
  onTrackOrder: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  token,
  customerUser,
  onReorder,
  onTrackOrder
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!token && !customerUser) return;
    setLoading(true);
    try {
      const history = await fetchCustomerOrderHistory(token || '', customerUser);
      setOrders(history);
    } catch (e) {
      console.error('Failed loading order history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, token, customerUser]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Order Placed</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>Kitchen Baking</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
            <Truck className="w-3 h-3 animate-bounce" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="bg-gray-500/20 text-gray-300 border border-gray-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
            {status}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[#2C0202] rounded-3xl border border-[#FFB703]/30 overflow-hidden shadow-2xl my-6 text-[#FFFBEB] flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 bg-[#1A0101] border-b border-[#FFB703]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFB703] text-[#3B0202]">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wide text-[#FFFBEB]">
                  ORDER HISTORY
                </h2>
                <p className="text-xs text-[#FFD166] mt-0.5">
                  {customerUser ? `Past orders for ${customerUser.name}` : 'Your Cheez O\'Clock Order History'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadHistory}
                disabled={loading}
                className="p-2 rounded-xl bg-[#1A0101] hover:bg-[#3B0202] text-gray-300 hover:text-white transition-colors"
                title="Refresh order history"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[#3B0202] text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Orders List Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Customer Summary Bar */}
            {!loading && (
              <div className="p-4 rounded-2xl bg-[#1A0101] border border-[#FFB703]/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                    Customer Account Stats
                  </span>
                  <p className="font-bold text-sm text-white mt-0.5">
                    {customerUser ? customerUser.name : 'Guest Customer'}
                    {customerUser?.phone && <span className="text-gray-400 font-normal text-xs ml-1.5">({customerUser.phone})</span>}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#2C0202] border border-[#FFB703]/40 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Orders Placed</span>
                    <span className="font-black text-base text-[#FFB703]">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-[#2C0202] border border-[#FFB703]/40 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Spent</span>
                    <span className="font-black text-base text-[#FFD166]">
                      Rs. {orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#FFB703] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#FFD166]">Fetching your order history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#1A0101] border border-[#FFB703]/20 flex items-center justify-center text-gray-500">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg text-white">No previous orders found</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  When you place orders with Cheez O'Clock, they will appear here so you can track or reorder them anytime!
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-[#1A0101] border border-[#FFB703]/20 space-y-4 shadow-xl hover:border-[#FFB703]/40 transition-all"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-[#FFB703]">
                          Order #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-lg text-[#FFD166]">
                        Rs. {order.total.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-xl bg-[#2C0202]/60 border border-white/5"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-bold text-white truncate">{item.name}</p>
                            <p className="text-[11px] text-[#FFD166]">
                              {item.quantity}x • Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-white/5">
                    <div className="flex items-start gap-2 text-gray-300 max-w-sm">
                      <MapPin className="w-4 h-4 text-[#FFB703] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{order.address}</span>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                          onTrackOrder(order);
                          onClose();
                        }}
                        className="px-3 py-2 rounded-xl bg-[#2C0202] border border-[#FFB703]/30 text-[#FFB703] font-bold text-xs uppercase hover:bg-[#3B0202] transition-colors flex items-center gap-1"
                      >
                        <span>Track Order</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          onReorder(order.items);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
