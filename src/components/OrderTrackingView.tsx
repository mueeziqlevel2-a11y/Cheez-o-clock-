import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, ChefHat, Bike, PackageCheck, Search, Phone, MapPin, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { trackOrder } from '../lib/api';

interface OrderTrackingViewProps {
  initialOrder: Order | null;
  onContinueOrdering: () => void;
}

const STAGES: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'NEW', label: 'ORDER RECEIVED', icon: Clock },
  { status: 'CONFIRMED', label: 'ORDER CONFIRMED', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'PREPARING', icon: ChefHat },
  { status: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY', icon: Bike },
  { status: 'DELIVERED', label: 'DELIVERED', icon: PackageCheck },
];

function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case 'NEW': return 0;
    case 'CONFIRMED': return 1;
    case 'PREPARING': return 2;
    case 'OUT_FOR_DELIVERY': return 3;
    case 'DELIVERED': return 4;
    case 'CANCELLED': return -1;
    default: return 0;
  }
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrder,
  onContinueOrdering
}) => {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if initialOrder changes
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
    }
  }, [initialOrder]);

  // Polling & SSE for live real-time status synchronization
  useEffect(() => {
    if (!order) return;

    let isMounted = true;

    // Polling function
    const fetchLatest = async () => {
      try {
        const updated = await trackOrder(order.id);
        if (isMounted) {
          setOrder(updated);
        }
      } catch (err) {
        // quiet error on background poll
      }
    };

    const intervalId = setInterval(fetchLatest, 3000);

    // SSE connection for real-time push
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'ORDER_UPDATED' && parsed.data && parsed.data.id === order.id) {
            if (isMounted) setOrder(parsed.data);
          }
        } catch (e) {
          // JSON parse err
        }
      };
    } catch (e) {
      // EventSource failover
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (eventSource) eventSource.close();
    };
  }, [order?.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const found = await trackOrder(searchQuery.trim());
      setOrder(found);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Order not found. Please check your order number or phone number.');
    }
  };

  const currentStageIndex = order ? getStageIndex(order.status) : 0;

  return (
    <section className="pt-8 sm:pt-12 pb-20 bg-[#3B0202] text-[#FFFBEB] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Search Bar for Order Lookup */}
        <div className="bg-[#2C0202] rounded-3xl p-6 border border-[#FFB703]/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl tracking-wide text-[#FFFBEB]">
                TRACK YOUR ORDER
              </h2>
              <p className="text-xs text-gray-300">
                Enter your Order Number (e.g. COC-1024) or Phone Number
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order # or Phone..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shrink-0"
              >
                {loading ? 'SEARCHING...' : 'TRACK'}
              </button>
            </form>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-[#C8102E]/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Content */}
        {order ? (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2C0202] rounded-3xl p-6 sm:p-8 border border-[#FFB703]/30 shadow-2xl space-y-8"
          >
            {/* Header / Success Banner */}
            <div className="text-center space-y-3 pb-6 border-b border-white/10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ORDER CONFIRMED & ACTIVE</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl text-[#FFB703] tracking-wide">
                ORDER PLACED! 🎉
              </h1>

              <div className="inline-block bg-[#1A0101] px-6 py-2 rounded-2xl border border-[#FFB703]/40">
                <span className="text-xs text-gray-400 uppercase tracking-widest block">ORDER NUMBER</span>
                <span className="font-display text-3xl text-white tracking-widest">{order.id}</span>
              </div>

              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Your order has been received by <strong className="text-[#FFB703]">Cheez O'Clock</strong>.
              </p>
            </div>

            {/* Timeline Progress */}
            {order.status === 'CANCELLED' ? (
              <div className="p-6 rounded-2xl bg-[#C8102E]/20 border border-red-500 text-center space-y-2">
                <h3 className="text-xl font-bold text-red-300">ORDER CANCELLED</h3>
                <p className="text-xs text-gray-300">
                  This order was cancelled by the store. Please call 0323-2444123 for assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-[#FFB703] uppercase tracking-wider">
                  <span>LIVE STATUS TRACKER</span>
                  <span className="flex items-center gap-1 text-gray-400 font-normal">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Live syncing
                  </span>
                </div>

                {/* Desktop/Tablet Horizontal Timeline */}
                <div className="hidden md:grid grid-cols-5 gap-2 relative">
                  {STAGES.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isCompleted = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div key={stage.status} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
                            isCurrent
                              ? 'bg-[#FFB703] text-[#3B0202] scale-110 ring-4 ring-[#FFB703]/30'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#1A0101] text-gray-600 border border-white/10'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>

                        <span
                          className={`mt-3 text-[11px] font-bold tracking-tight uppercase leading-tight ${
                            isCurrent
                              ? 'text-[#FFB703]'
                              : isCompleted
                              ? 'text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Vertical Timeline */}
                <div className="md:hidden space-y-4">
                  {STAGES.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isCompleted = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div
                        key={stage.status}
                        className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${
                          isCurrent
                            ? 'bg-[#FFB703] text-[#3B0202] shadow-lg'
                            : isCompleted
                            ? 'bg-[#1A0101] text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#1A0101] text-gray-500 border border-white/5'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-[#3B0202] text-[#FFB703]'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#2C0202] text-gray-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider">
                            {stage.label}
                          </h4>
                          {isCurrent && (
                            <p className="text-[11px] font-medium text-[#3B0202]/80 mt-0.5">
                              Current Progress Stage
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
              
              {/* Customer Info */}
              <div className="p-5 rounded-2xl bg-[#1A0101] border border-[#FFB703]/20 space-y-3">
                <h3 className="font-bold text-sm text-[#FFB703] uppercase tracking-wider">
                  Delivery Details
                </h3>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Customer:</span>
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#FFB703]" />
                    <span>{order.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FFB703] shrink-0 mt-0.5" />
                    <span>{order.address}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 text-gray-400">
                    <span className="font-bold text-white">Payment Method: </span>
                    <span className="text-[#FFD166]">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Items & Total Summary */}
              <div className="p-5 rounded-2xl bg-[#1A0101] border border-[#FFB703]/20 space-y-3">
                <h3 className="font-bold text-sm text-[#FFB703] uppercase tracking-wider">
                  Ordered Items ({order.items.length})
                </h3>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {order.items.map((i, index) => (
                    <div key={index} className="flex justify-between text-xs text-gray-300">
                      <span>{i.quantity}x {i.name}</span>
                      <span className="font-semibold text-white">
                        Rs. {(i.price * i.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>Rs. {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Delivery Fee</span>
                    <span>Rs. {order.deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#FFB703] pt-1">
                    <span>TOTAL</span>
                    <span>Rs. {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onContinueOrdering}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:brightness-110"
              >
                <span>CONTINUE ORDERING</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="tel:03232444123"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#2C0202] hover:bg-[#520606] text-white font-bold text-xs border border-[#FFB703]/30 flex items-center justify-center gap-2 text-center"
              >
                <Phone className="w-4 h-4 text-[#FFB703]" />
                <span>Call Store: 0323-2444123</span>
              </a>
            </div>

          </motion.div>
        ) : (
          <div className="bg-[#2C0202] rounded-3xl p-12 text-center border border-[#FFB703]/30 shadow-2xl space-y-4">
            <Clock className="w-12 h-12 mx-auto text-[#FFB703]" />
            <h3 className="font-bold text-xl text-white">No active order selected</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Please enter your Order Number above to track your live status.
            </p>
          </div>
        )}

      </div>
    </section>
  );
};
