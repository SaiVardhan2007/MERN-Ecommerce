import React, { useEffect, useState } from "react";
import "./Payments.css";
import { backend_url, currency } from "../../App";

const Payments = () => {
  const [allpayments, setAllPayments] = useState([]);

  const fetchInfo = () => {
    fetch(`${backend_url}/allpayments`)
      .then((res) => res.json())
      .then((data) => setAllPayments(data))
  }

  useEffect(() => {
    fetchInfo();
  }, [])

  return (
    <div className="listproduct">
      <h1>All Payments List</h1>
      <div className="listproduct-format-main">
        <p>Email</p> <p>Amount</p> <p>Payment ID</p> <p>Date</p> <p>Status</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {allpayments.map((payment, index) => (
          <div key={index}>
            <div className="listproduct-format-main listproduct-format">
              <p className="cartitems-product-title">{payment.email}</p>
              <p>{currency}{payment.amount}</p>
              <p>{payment.razorpay_payment_id}</p>
              <p>{new Date(payment.date).toLocaleDateString()}</p>
              <p>{payment.status}</p>
            </div>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payments;
