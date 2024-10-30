import React from "react";
import { useSelector } from "react-redux";
import CartProduct from "../component/cartProduct";
import emptyCartImage from "../assest/empty.gif";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const productCartItem = useSelector((state) => state.product.cartItem);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  // Calculate total price and quantity
  const totalPrice = productCartItem.reduce((acc, curr) => acc + parseInt(curr.total), 0);
  const totalQty = productCartItem.reduce((acc, curr) => acc + parseInt(curr.qty), 0);

  // Stripe payment handler
  
  const handlePayment = async()=>{

    if(user.email){
        
        const stripePromise = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || "pk_test_51Q8yqRP3U17uDjq87GrpZbeXgaKGkrOdJ4tWW6MqK0VxnNpmmFsk5rywy5sKJxtqJsgdXh6eyVkrwthtHuu5pbz500KBjYGuOj");
        const res = await fetch(`${process.env.REACT_APP_SERVER_DOMIN || "http://localhost:8080"}/create-checkout-session`,{
          method : "POST",
          headers  : {
            "content-type" : "application/json"
          },
          body  : JSON.stringify(productCartItem)
        })
        if(res.statusCode === 500) return;

        const data = await res.json()
        console.log(data)

        toast("Redirect to payment Gateway...!")
        stripePromise.redirectToCheckout({sessionId : data}) 
    }
    else{
      toast("You have not Login!")
      setTimeout(()=>{
        navigate("/login")
      },1000)
    }
  
}

  return (
    <div className="p-2 md:p-4">
      <h2 className="text-lg md:text-2xl font-bold text-slate-600">Your Cart Items</h2>

      {productCartItem.length > 0 ? (
        <div className="my-4 flex gap-3">
          {/* Display cart items */}
          <div className="w-full max-w-3xl">
            {productCartItem.map((el) => (
              <CartProduct
                key={el._id}
                id={el._id}
                name={el.name}
                image={el.image}
                category={el.category}
                qty={el.qty}
                total={el.total}
                price={el.price}
              />
            ))}
          </div>

          {/* Total cart summary */}
          <div className="w-full max-w-md ml-auto">
            <h2 className="bg-blue-500 text-white p-2 text-lg">Summary</h2>
            <div className="flex w-full py-2 text-lg border-b">
              <p>Total Qty :</p>
              <p className="ml-auto w-32 font-bold">{totalQty}</p>
            </div>
            <div className="flex w-full py-2 text-lg border-b">
              <p>Total Price</p>
              <p className="ml-auto w-32 font-bold">
                <span className="text-red-500">₹</span> {totalPrice}
              </p>
            </div>
            <button
              className="bg-red-500 w-full text-lg font-bold py-2 text-white"
              onClick={handlePayment}
            >
              Payment
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full justify-center items-center flex-col">
          <img src={emptyCartImage} alt="Empty Cart" className="w-full max-w-sm" />
          <p className="text-slate-500 text-3xl font-bold">Empty Cart</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
