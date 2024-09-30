

const Razorpay = require('razorpay');
const crypto = require('crypto');

const Order = require("../../models/orderSchema") ;
const Cart = require("../../models/cartSchema") ;
const Product = require("../../models/product") ;
const User = require("../../models/userSchema") ; 
const { findById } = require('../../models/couponSchema');



const razorpayInstance = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID ,
    key_secret: process.env.RAZOR_SECRET_ID , 
});



// create an order
const createOrder =  async (req, res) => {
    const { amount, currency  } = req.body;
  
    // Create an order with Razorpay
    const options = {
        amount: amount * 100,  // Amount in paise (smallest unit of currency)
        currency: currency,
        receipt: `receipt_order_${Math.floor(Math.random() * 1000)}` 
    };

    try {
        const order = await razorpayInstance.orders.create(options);
       
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId : process.env.RAZOR_KEY_ID
        });
        
    } catch (error) {
        res.status(500).send('Something went wrong with order creation');
    }
   
} ;



// Endpoint to verify payment
const verifyPayment =  async (req, res) => {
   
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ;
   
    const secret = process.env.RAZOR_SECRET_ID;   

    const hash = crypto.createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)  
        .digest('hex');

    if (hash === razorpay_signature) {
       // res.send('Payment verified successfully');
       try{
        const {userId , cartId , addressId ,paymentMethod} = req.body ;
        const cart = await Cart.findById(cartId) ; 
        
        const cartItems = cart.items
        .filter(item => item.status === "Available") // filter items by status
        .map( item =>({
         
          product : item.product._id , 
          size : item.size ,
          price : item.discountedPrice ,
          quantity : item.quantity ,
          totalPrice : item.discountedPrice * item.quantity ,
        
        })) 
      
        // Calculate total price
        const totalProductPrice = cartItems.reduce((total, item) => {
          return total + (item.price * item.quantity) ;
        }, 0);
       
        const newOrder = new Order({
          userId,
          shippingAddress : addressId,
          items : cartItems , 
          paymentMethod,
          totalPrice : totalProductPrice - cart.walletBalance - cart.couponBalance ,             
          appliedWallet : cart.walletBalance ,
          paymentStatus : "completed" , 
          razorpayOrderId : razorpay_order_id ,                                          
          razorpayPaymentId : razorpay_payment_id ,
        })
       
        const savedOrder = await newOrder.save() ; 
       
        await User.findByIdAndUpdate(userId , { coupon : null }) ;

        //delete the existing cart after the successfull order place
        await Cart.findByIdAndDelete( cartId ) ; 
 
 //decrease the quantity of products in the database . 
  for(let i=0 ; i<savedOrder.items.length ; i++){
    let productId  = savedOrder.items[i].product ; 
    let size = savedOrder.items[i].size ;
    let orderQuantity = savedOrder.items[i].quantity ; 

    // Find the product by its ID
  let product = await Product.findById(productId);

  if (product) {
    // Find the item in the product.items array with the matching size
    let itemToUpdate =  product.sizes.find(item => item.size === size);

    if (itemToUpdate) {
      // Decrease the quantity by the order's quantity
      itemToUpdate.quantity -= orderQuantity;

      // Ensure quantity doesn't go below 0
      if (itemToUpdate.quantity < 0) {
        itemToUpdate.quantity = 0;
      }

      // Save the updated product back to the database
      await product.save();
  }}}


      res.status(200).json({ status : true , orderId : savedOrder._id}) ; 
     }catch(err){
      console.log(err)
        res.status(500).json({ status : false }) ; 
     }
 } else {
     res.status(400).send( 'Payment verification failed' ) ; 
 }
} ;



module.exports = { createOrder ,verifyPayment } ; 
