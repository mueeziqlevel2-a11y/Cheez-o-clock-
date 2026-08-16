import React from 'react';
import { Order } from '../../types';

interface ThermalReceiptProps {
  order: Order | null;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order }) => {
  if (!order) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  return (
    <div id="thermal-receipt-container" className="hidden print:block thermal-receipt">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-container,
          #thermal-receipt-container * {
            visibility: visible !important;
          }
          #thermal-receipt-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 3mm 2mm 8mm 2mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace, system-ui !important;
            font-size: 12px !important;
            line-height: 1.25 !important;
            box-sizing: border-box !important;
          }
          .dashed-divider {
            border-top: 1px dashed #000000 !important;
            margin: 4px 0 !important;
          }
          .double-divider {
            border-top: 2px solid #000000 !important;
            margin: 4px 0 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center font-bold">
        <h1 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
          CHEEZ O'CLOCK
        </h1>
        <p style={{ fontSize: '11px', margin: '2px 0 0 0', fontWeight: 'bold' }}>
          Rawalpindi, Pakistan
        </p>
        <p style={{ fontSize: '10px', margin: '1px 0 0 0' }}>
          Fast Food & Cheezy Delights
        </p>
        <p style={{ fontSize: '10px', margin: '1px 0 4px 0' }}>
          Tel: 0310-8507850
        </p>
      </div>

      <div className="double-divider" />

      {/* Order Info */}
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>ORDER #{order.id}</span>
          <span>COD</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span>Date: {formatDate(order.createdAt)}</span>
          <span>Time: {formatTime(order.createdAt)}</span>
        </div>
        <div>
          <span>Status: {order.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div className="dashed-divider" />

      {/* Customer Info */}
      <div style={{ fontSize: '11px', margin: '3px 0' }}>
        <div style={{ fontWeight: 'bold' }}>
          CUSTOMER: <span style={{ textTransform: 'uppercase' }}>{order.customerName}</span>
        </div>
        <div style={{ fontWeight: 'bold' }}>
          PHONE: {order.phone}
        </div>
        <div style={{ marginTop: '2px', wordBreak: 'break-word', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 'bold' }}>ADDR: </span>
          {order.address}
        </div>
        {order.notes && (
          <div style={{ marginTop: '2px', fontStyle: 'italic', fontWeight: 'bold' }}>
            NOTE: {order.notes}
          </div>
        )}
      </div>

      <div className="dashed-divider" />

      {/* Items Table */}
      <div style={{ fontSize: '11px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '3px' }}>
          <span style={{ flex: '0 0 20px' }}>QTY</span>
          <span style={{ flex: '1 1 auto', textAlign: 'left', paddingLeft: '4px' }}>ITEM</span>
          <span style={{ flex: '0 0 55px', textAlign: 'right' }}>PRICE</span>
        </div>

        {order.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ flex: '0 0 20px', fontWeight: 'bold' }}>{item.quantity}x</span>
              <span style={{ flex: '1 1 auto', textAlign: 'left', paddingLeft: '4px', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {item.name}
              </span>
              <span style={{ flex: '0 0 55px', textAlign: 'right', fontWeight: 'bold' }}>
                {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
            {item.notes && (
              <div style={{ fontSize: '9px', paddingLeft: '24px', fontStyle: 'italic' }}>
                * {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="dashed-divider" />

      {/* Totals */}
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>Rs. {order.subtotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
          <span>Delivery Charge:</span>
          <span>Rs. {order.deliveryFee.toLocaleString()}</span>
        </div>
        <div className="double-divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '15px', marginTop: '2px' }}>
          <span>NET TOTAL:</span>
          <span>Rs. {order.total.toLocaleString()}</span>
        </div>
        <div className="double-divider" />
      </div>

      {/* Payment & Footer */}
      <div className="text-center" style={{ fontSize: '10px', marginTop: '6px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '2px 0' }}>
          *** CASH ON DELIVERY ***
        </p>
        <p style={{ margin: '3px 0 0 0' }}>
          Thank you for choosing Cheez O'Clock!
        </p>
        <p style={{ margin: '1px 0 0 0' }}>
          It's Always Cheez O'Clock!
        </p>
        <p style={{ marginTop: '8px', fontSize: '9px' }}>
          . . . . . . . . . . . . . . . . . . . .
        </p>
      </div>
    </div>
  );
};
