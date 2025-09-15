import axios from "axios";

function CheckoutButton({ amount }) {
  const handlePayment = async () => {
    try {
      const { data: { order } } = await axios.post("http://localhost:4000/api/payment/checkout", { amount });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY, 
        amount: order.amount,
        currency: "INR",
        name: "E-Commerce Store",
        description: "Order Payment",
        order_id: order.id,
        handler: async (response) => {
        let userEmail = 'polampallisaivardhan1423@gmail.com';
        const authToken = localStorage.getItem('auth-token');
        
        if (authToken) {
          try {
            const userResponse = await axios.post("http://localhost:4000/getuser", {}, {
              headers: {
                'auth-token': authToken,
                'Content-Type': 'application/json'
              }
            });
            if (userResponse.data && userResponse.data.email) {
              userEmail = userResponse.data.email;
            }
          } catch (error) {
            console.error('Error fetching user email:', error);
          }
        }
        
        await axios.post("http://localhost:4000/api/payment/paymentverification", {
          ...response,
          email: userEmail,
          amount: amount
        });
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
