import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldCheck, MapPin, Phone, User, FileText, ArrowRight } from 'lucide-react';
import { OrderItem, Order, CustomerUser } from '../types';
import { placeOrder } from '../lib/api';

interface CheckoutModalProps {
  isOpen: boolean;
  cartItems: OrderItem[];
  deliveryFee: number;
  customerUser: CustomerUser | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onError: (msg: string) => void;
  onRequireAuth: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cartItems,
  deliveryFee,
  customerUser,
  onClose,
  onOrderSuccess,
  onError,
  onRequireAuth
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [mapLocation, setMapLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setCustomerName(customerUser.name || '');
      setPhone(customerUser.phone || '');
      setAddress(customerUser.address || '');
    }
  }, [customerUser, isOpen]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerUser) {
      onRequireAuth();
      return;
    }

    if (!customerName.trim()) {
      onError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      onError('Please enter a valid mobile phone number.');
      return;
    }
    if (!address.trim()) {
      onError('Please enter your complete delivery address in Rawalpindi.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await placeOrder({
        customerId: customerUser.id,
        customerEmail: customerUser.email,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        mapLocation: mapLocation.trim(),
        notes: notes.trim(),
        items: cartItems.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          notes: i.notes
        }))
      });

      setSubmitting(false);
      onOrderSuccess(res.order);
    } catch (err: any) {
      setSubmitting(false);
      onError(err.message || 'We couldn\'t place your order. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[#2C0202] rounded-3xl border border-[#FFB703]/40 overflow-hidden shadow-2xl my-auto text-[#FFFBEB] flex flex-col max-h-[92vh]"
        >
          {/* Header (Sticky at top) */}
          <div className="p-5 sm:p-6 bg-[#1A0101] border-b border-[#FFB703]/20 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl tracking-wide text-[#FFFBEB]">
                CHECKOUT
              </h2>
              <p className="text-xs text-[#FFD166] mt-0.5">
                Fast doorstep delivery in Rawalpindi • Cash on Delivery
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#3B0202] text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form (Smoothly Scrollable Body) */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar overscroll-contain">
            
            {!customerUser && (
              <div className="p-4 bg-amber-500/15 border border-[#FFB703] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200">
                <div className="text-xs">
                  <span className="font-bold text-[#FFB703] text-sm block">🔒 Login or Sign Up Required</span>
                  <span>You must log in with your Phone Number or Google account to place an order.</span>
                </div>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FFB703] text-[#3B0202] font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all shrink-0 cursor-pointer shadow-lg"
                >
                  Sign Up / Log In Now
                </button>
              </div>
            )}
            
            {/* Customer Information Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[#FFB703] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#FFB703]" />
                <span>Customer Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Full Name <span className="text-[#C8102E]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ali Ahmed"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Mobile Phone Number <span className="text-[#C8102E]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Delivery Address in Rawalpindi <span className="text-[#C8102E]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House #12, Street 4, Dhamial Road, Rawalpindi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703] resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Share Delivery Location (Optional Google Maps Link)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#FFB703]" />
                  <input
                    type="text"
                    value={mapLocation}
                    onChange={(e) => setMapLocation(e.target.value)}
                    placeholder="e.g. https://maps.app.goo.gl/... or Google Maps coordinates"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Paste a Google Maps location link or live pin so our rider can find you faster.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Order Instructions (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Ring the doorbell or call upon arrival..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A0101] border border-[#FFB703]/30 text-white text-sm focus:outline-none focus:border-[#FFB703]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="p-4 rounded-2xl bg-[#1A0101] border border-[#FFB703]/30 space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Payment Method
              </span>
              <div className="flex items-center justify-between bg-[#2C0202] p-3 rounded-xl border border-[#FFB703]/40">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#FFB703]" />
                  <div>
                    <h4 className="font-bold text-sm text-[#FFD166]">
                      CASH ON DELIVERY
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Pay in cash to the rider upon delivery
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-[#1A0101] border border-[#FFB703]/20 space-y-2">
              <span className="text-xs font-bold text-[#FFB703] uppercase tracking-wider block">
                Order Summary ({cartItems.length} items)
              </span>

              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-300">
                    <span className="truncate max-w-[220px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold text-white">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery Fee</span>
                  <span>Rs. {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#FFB703] pt-1">
                  <span>TOTAL AMOUNT</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#3B0202] font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>PLACING YOUR ORDER...</span>
              ) : (
                <>
                  <span>PLACE ORDER — Rs. {total.toLocaleString()}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
