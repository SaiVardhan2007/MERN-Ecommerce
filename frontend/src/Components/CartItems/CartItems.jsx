import React, { useContext, useState, useEffect } from "react";
import "./CartItems.css";
import cross_icon from "../Assets/cart_cross_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";
import CheckoutButton from "../Payment/CheckoutButton";   // ✅ Correct import path

const CartItems = () => {
  const { products } = useContext(ShopContext);
  const { cartItems, removeFromCart, getTotalCartAmount } = useContext(ShopContext);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountedTotal, setDiscountedTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const originalTotal = getTotalCartAmount();

  useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  useEffect(() => {
    if (appliedCoupon) {
      setDiscountedTotal(appliedCoupon.finalTotal);
    } else {
      setDiscountedTotal(originalTotal);
    }
  }, [appliedCoupon, originalTotal]);

  const fetchAvailableCoupons = async () => {
    try {
      const response = await fetch(`${backend_url}/api/coupons`);
      const data = await response.json();

      if (data.success) {
        setAvailableCoupons(data.coupons);
      } else {
        setError('Failed to fetch coupons');
      }
    } catch (error) {
      setError('Error fetching coupons');
      console.error('Error:', error);
    }
  };

  const applyCoupon = async (couponCode) => {
    if (originalTotal === 0) {
      alert('Your cart is empty. Add some items to apply a coupon.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backend_url}/api/coupons/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: originalTotal
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(data.coupon);
        alert(`Coupon applied successfully! You saved ${currency}${data.coupon.discountAmount}`);
      } else {
        setError(data.message || 'Failed to apply coupon');
        alert(data.message || 'Failed to apply coupon');
      }
    } catch (error) {
      setError('Error applying coupon');
      alert('Error applying coupon');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountedTotal(originalTotal);
    alert('Coupon removed successfully!');
  };

  const formatCouponDescription = (coupon) => {
    const discountText = coupon.discountType === 'percentage'
      ? `${coupon.discountValue}% off`
      : `${currency}${coupon.discountValue} off`;

    const minCartText = coupon.minCartValue > 0
      ? ` (Min. cart value: ${currency}${coupon.minCartValue})`
      : '';

    return `${discountText}${minCartText}`;
  };

  return (
    <div className="cartitems">
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {products.map((e) => {
        if (cartItems[e.id] > 0) {
          return (
            <div key={e.id}>
              <div className="cartitems-format-main cartitems-format">
                <img className="cartitems-product-icon" src={backend_url + e.image} alt="" />
                <p cartitems-product-title>{e.name}</p>
                <p>{currency}{e.new_price}</p>
                <button className="cartitems-quantity">{cartItems[e.id]}</button>
                <p>{currency}{e.new_price * cartItems[e.id]}</p>
                <img
                  onClick={() => { removeFromCart(e.id); }}
                  className="cartitems-remove-icon"
                  src={cross_icon}
                  alt=""
                />
              </div>
              <hr />
            </div>
          );
        }
        return null;
      })}

      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>{currency}{originalTotal}</p>
            </div>
            <hr />
            {appliedCoupon && (
              <>
                <div className="cartitems-total-item">
                  <p>Discount ({appliedCoupon.code})</p>
                  <p>-{currency}{appliedCoupon.discountAmount}</p>
                </div>
                <hr />
              </>
            )}
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>{currency}{discountedTotal}</h3>
            </div>
          </div>

          {/* ✅ Razorpay Checkout */}
          {discountedTotal > 0 && (
            <CheckoutButton amount={discountedTotal} />
          )}
        </div>

        <div className="cartitems-promocode">
          <p>Available Coupons</p>
          {error && <p className="error-message">{error}</p>}

          {appliedCoupon ? (
            <div className="applied-coupon">
              <p>Applied Coupon: <strong>{appliedCoupon.code}</strong></p>
              <p>Discount: {currency}{appliedCoupon.discountAmount}</p>
              <button
                onClick={removeCoupon}
                className="remove-coupon-btn"
                disabled={loading}
              >
                Remove Coupon
              </button>
            </div>
          ) : (
            <div className="available-coupons">
              {availableCoupons.length === 0 ? (
                <p>No coupons available at the moment.</p>
              ) : (
                availableCoupons.map((coupon) => (
                  <div key={coupon._id} className="coupon-item">
                    <div className="coupon-info">
                      <h4>{coupon.code}</h4>
                      <p>{formatCouponDescription(coupon)}</p>
                      {coupon.expiryDate && (
                        <p className="expiry-date">
                          Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => applyCoupon(coupon.code)}
                      className="apply-coupon-btn"
                      disabled={loading || originalTotal < coupon.minCartValue}
                    >
                      {loading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;
