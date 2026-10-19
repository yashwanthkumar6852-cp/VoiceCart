import React from 'react';
import { X, Truck, ShieldCheck, ShoppingCart, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { ProductHighlights } from './ProductHighlights';
import { ProductImage } from './ProductImage';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  const totalCost = product.price + (product.shippingFee || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-pill)',
            border: 'none',
            color: 'var(--text-main)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Product Image */}
        <div
          style={{
            height: '240px',
            background: '#ffffff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
            padding: '12px',
            overflow: 'hidden'
          }}
        >
          <ProductImage
            src={product.imageUrl}
            images={product.images}
            thumbnail={(product as any).thumbnail}
            serpapi_thumbnail={(product as any).serpapi_thumbnail}
            alt={product.title}
            store={product.store}
            productId={product.productId}
            variantText={product.variantText}
            isPriority={true}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Store & Badges */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: product.store === 'amazon' ? '#ff9900' : product.store === 'flipkart' ? '#2874f0' : '#f43397',
              color: product.store === 'amazon' ? '#000' : '#fff'
            }}
          >
            {product.store === 'amazon' ? 'Amazon India' : product.store === 'flipkart' ? 'Flipkart' : 'Meesho'}
          </span>
          {product.badges?.map((b, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary)'
              }}
            >
              {b}
            </span>
          ))}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.3, color: 'var(--text-main)' }}>
          {product.title}
        </h3>

        {/* Price Breakdown */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.mrp > product.price && (
              <span style={{ color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                ₹{product.mrp.toLocaleString()}
              </span>
            )}
            {product.discountPct > 0 && (
              <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.85rem' }}>
                Save {product.discountPct}%
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Shipping: {product.shippingFee > 0 ? `₹${product.shippingFee}` : 'FREE Delivery'}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Payable: ₹{totalCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Highlights */}
        <ProductHighlights product={product} />

        {/* Delivery & Seller Signals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '2px' }}>
              <Truck size={14} /> Delivery Speed
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {product.deliveryDays} {product.deliveryDays === 1 ? 'Day' : 'Days'} ({product.fulfilledByStore ? 'Fulfilled by Store' : 'Standard Delivery'})
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-green)', marginBottom: '2px' }}>
              <ShieldCheck size={14} /> Return Policy
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {product.returnPolicy || '7 Days Replacement'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ShoppingCart size={16} /> Add to Cart
          </button>

          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <ExternalLink size={16} /> Buy on {product.store.toUpperCase()}
          </a>
        </div>
      </div>
    </div>
  );
};
