import axios from "axios";

function CheckoutButton({ amount }) {
  const handlePayment = async () => {
    try {
      // Step 1: Create Razorpay order from backend
      const { data: { order } } = await axios.post("http://localhost:4000/api/payment/checkout", { amount });

      // Step 2: Setup options for Razorpay popup
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY, // frontend key
        amount: order.amount,
        currency: "INR",
        name: "E-Commerce Store",
        description: "Order Payment",
        order_id: order.id,
        handler: async (response) => {
        await axios.post("http://localhost:4000/api/payment/paymentverification", response);
        alert("Payment Successful!");
        },

        theme: { color: "#3399cc" },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <button onClick={handlePayment} className="btn btn-primary">
      Pay Now
    </button>
  );
}

export default CheckoutButton;
