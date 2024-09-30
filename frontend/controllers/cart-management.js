
//import schemas
const Cart = require("../../models/cartSchema") ;
const Product = require("../../models/product") ;
const Logo = require("../../models/logoSchema") ;
const GenderCategory = require("../../models/genderCategory");
const User = require("../../models/userSchema") ;
const Addresses = require("../../models/addressSchema"); 
const Order = require("../../models/orderSchema") ; 




//get my orders page
const myOrders = async ( req , res ) =>{ 
const logo = await Logo.findOne().sort({ updatedAt : -1 }) ; 
const genderCategory = await GenderCategory.find({ softDelete : false });

let user ;   
  if(req.session.userId){
    user = await User.findById(req.session.userId);  
  }else if(req.user){
    user = await User.findById( req.user._id ); 
  }else{
    return res.redirect("/userLogin") ;
  }

  let cartTotal ; 
     if(user){
     const cart = await Cart.findOne({user : user._id});
     if(cart){
      cartTotal = cart.items.reduce((total, item) => total + item.quantity, 0 ) ; 
     }
     }else{ 
     cartTotal = 0;
     }

const orderStatus = req.query.orderStatus || "" ; 

 
const currentYear = new Date().getFullYear();
const years = [];
 for (let i = 0; i <= 3; i++) {
     years.push(currentYear - i);
 } 
 
 let orders;
 if (!orderStatus) {
  orders = await Order.find({ userId: user._id }).populate("items.product");
} else {
  orders = await Order.find({ userId: user._id, orderStatus }).populate("items.product");
}

 
 res.render("orders" , { orders  , logo , genderCategory ,user , years , orderStatus , orderTime : "" , cartTotal }); 
}



// post add to cart 
const addToCart = async ( req , res ) =>{
   let { userId , productId , sizeId , size , price , discountedPrice , discountPercentage } = req.body ; 

  // Find the product and filter the specific size object   
  const product = await Product.findOne(
    { _id: productId },
    { sizes: { $elemMatch : { _id : sizeId } } } 
  );   

  const stockAvl = product.sizes[0].quantity ;  
  
   // Check if the user already has a cart
   let cart = await Cart.findOne({ user : userId }) ;

        
   let quantity = 1 ; //default


   // Create the new cart item  
   const cartItem = {
    product: productId,
    size: size,
    price: price,
    quantity: quantity,
    discountedPrice: discountedPrice,
    discountPercentage: discountPercentage 
  };

  
  
  if(cart){
     let existingItem = cart.items.find(
        item => item.product.toString() === productId && item.size === size 
     ) ;
     if(existingItem  &&  stockAvl > existingItem.quantity ){
        if(existingItem.quantity < 5){
          existingItem.quantity += quantity ; 

        }else{
          return res.status(422).json({
            message: "Maximum limit exeeds!" ,
            success : false ,
         });
        }
     }else if(!existingItem && stockAvl > 0){
        cart.items.push(cartItem);
     }else{
        console.log("item not available");
        return res.status(422).json({
           message: "This item is no more available",
           success : false ,
        });
     }
  }else{
    if(stockAvl > 0 ){

      cart = new Cart({
        user : userId ,
        items : [cartItem ] ,
      });

    }else{
      return res.status(422).json({
        message: "This item is out of stock",
        success : false ,
     });
    }
  }

  await cart.save().then(()=>{ 
    console.log("cart added");
    return res.status(200).json({ message : "product added to cart" , success : true });
  }).catch((error)=>console.log(error.message)) ;
}




//increment cart product quanity
const increQuantity = async ( req,res ) =>{
  const {userId , itemId } = req.body ;
  const cart = await Cart.findOne({ user : userId },{ items : { $elemMatch : {  _id : itemId }}}) ;
  
  const productId = cart.items[0].product; 
  const size = cart.items[0].size ;

   
  /////////////////////////
  let totalItems =0 ;
  cart.items.forEach(item =>{
    totalItems += item.quantity ;
  })

  let totalPrice = 0;  
  const discount = 0;   //default  -->  pass coupon code as query and 

  for(let i=0 ; i< cart.items.length ; i++){
      for(let m =0 ; m < cart.items[i].quantity ; m++ ){
          totalPrice += cart.items[i].discountedPrice ;
      }
  }

  let totalAmount = totalPrice - discount ; 
  ///////////////////////// 


  const product = await Product.findOne({_id : productId},{sizes : {$elemMatch:{size }}});
  
  if( cart.items[0].quantity < 5){
      if(cart.items[0].quantity < product.sizes[0].quantity ){
        //cart.items[0].quantity += 1 ;
        
        await Cart.findOneAndUpdate(
          { user: userId, 'items._id': itemId },
          {
            $set: {
              'items.$.quantity': cart.items[0].quantity + 1,
              'items.$.status': 'Available',
            },
          }
        );
       
        
        //await cart.save().then(()=>console.log("item added")).catch((err)=>console.log(err.message));
        const productQuant = product.sizes[0].quantity;
        return res.status(200).json({ message : "product added to cart" , productQuant , totalItems , totalAmount , success : true });
      }else{

        if(product.sizes[0].quantity >0){
          await Cart.findOneAndUpdate(
            { user: userId, 'items._id': itemId },
            {
              $set: {
                'items.$.quantity': product.sizes[0].quantity,
                'items.$.status': 'Available',
              },
            }
          );
        }else{
          await Cart.findOneAndUpdate(
            { user: userId, 'items._id': itemId },
            {
              $set: {
                'items.$.quantity': product.sizes[0].quantity,
                'items.$.status': 'Unavailable',
              },
            }
          );
        }
       
        return res.status(400).json({ message : `Product unavailable .Only ${product.sizes[0].quantity} are left! ` , success : false });
      }
  }else{
    if(cart.items[0].quantity >= product.sizes[0].quantity ){
      const productQuant =  product.sizes[0].quantity; 
      const quanity = cart.items[0].quantity;
      cart.items[0].quantity = product.sizes[0].quantity ; 
      cart.save().then(()=>console.log("Cart updated")).catch((err)=>console.log(err.message));
      return res.status(400).json({ message : `Product unavailable .Only ${product.sizes[0].quantity} are left! `,productQuant,quanity , success : false });
    }else{
       return res.status(400).json({ message : "Maximum limit exeeds" , success : false });
  }
}
}



//decrement cart product quantity
const decreQuantity = async ( req,res ) =>{
  const {userId , itemId} = req.body ; 
  const cart = await Cart.findOne({user : userId },{ items : {$elemMatch:{_id : itemId}}});

  const productId = cart.items[0].product ;
  const size = cart.items[0].size ; 
  
  const product = await Product.findOne({_id : productId}, {sizes : { $elemMatch : {size} }}) ;

  if(cart.items[0].quantity > 1){
     const productQuant = product.sizes[0].quantity; 

    if(cart.items[0].quantity <= product.sizes[0].quantity+1 ){

      await Cart.findOneAndUpdate(
        { user: userId, 'items._id': itemId },
        {
          $set: {
            'items.$.quantity': cart.items[0].quantity -1,
            'items.$.status': 'Available',
          },
        }
      );


      return res.status(200).json({ message : "one quantity removed" , productQuant , success : true });
    }else{

      await Cart.findOneAndUpdate(
        { user: userId, 'items._id': itemId },
        {
          $set: {
            'items.$.quantity' : product.sizes[0].quantity, 
            'items.$.status': 'Unavailable',
          },
        }
      );

    return res.status(400).json({ message : `Product unavailable .Only ${product.sizes[0].quantity} are left! ` , productQuant , success : false });
    }
  }else{
    return res.status(400).json({ message : "Quantity must be minimum One" , success : false }) ;
  }

}


//remove item
const removeItem = async (req,res) =>{
  const {userId , itemId} = req.body ; 
  const cart = await Cart.findOneAndUpdate({ user: userId} ,{ $pull: { items: { _id: itemId } } } )
  cart.save().then(()=>{
    return res.status(200).json({message : "Item remove Successfully"} );
  }).catch((err)=>console.log(err.message));
}
   

//get checkout delivery address
const checkout = async ( req , res ) =>{                     // update the price of cart product whenever prices of product changed
  const logo = await Logo.findOne().sort({ updatedAt : -1 }) ; 
  const genderCategory = await GenderCategory.find({ softDelete : false });
 
  let user ;   
  if(req.session.userId){
    user = await User.findById(req.session.userId);  
  }else if(req.user){
    user = await User.findById( req.user._id ); 
  }else{
    return res.redirect("/userLogin") ;
  }

  let cartTotal ; 
     if(user){
     const cart = await Cart.findOne({user : user._id});
     if(cart){
     cartTotal = cart.items.reduce((total, item) => total + item.quantity, 0);  
     }
     }else{
     cartTotal = 0;
     }
    
  const userAddresses = await Addresses.find({ userId : user._id , softDelete : false });    
   
  const cart = await Cart.findOne({ user : user._id}).populate('items.product') ; 

  const availableItems = cart.items.filter(item => item.status === 'Available');
  cart.items = availableItems;

 
 

  let totalItems =0 ;
    cart.items.forEach(item =>{
      totalItems += item.quantity ; 
    })

    let totalPrice = 0;  
    

    for(let i=0 ; i< cart.items.length ; i++){
        for(let m =0 ; m < cart.items[i].quantity ; m++ ){
            totalPrice += cart.items[i].discountedPrice ;
        }
    }  

    let totalAmount = totalPrice - ( cart.couponBalance + cart.walletBalance ); 

  res.render("checkout.ejs" , { logo , genderCategory , user , userAddresses , cart , totalItems , totalAmount , totalPrice , cartTotal} );   
}




//place order
const placeorder = async (req,res) =>{
  try{
  const {userId , cartId , addressId ,paymentMethod } = req.body ;
  const cart = await Cart.findById(cartId);
  
  const cartItems = cart.items
  .filter(item => item.status === "Available") // filter items by status
  .map( item =>{
   
    const itemDiscount = (item.price * item.quantity) - (item.discountedPrice * item.quantity);

    return {
    product : item.product._id ,
    size : item.size ,
    price : item.discountedPrice ,
    quantity : item.quantity ,
    totalPrice : item.discountedPrice * item.quantity ,
    discount :itemDiscount , }
  })

  

  // Calculate total price
  const productsPrice = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity) ;
  }, 0);

  //calculate total discount
  const totalDiscount = cartItems.reduce((total, item) => {
    return total + (item.discount) ;
  }, 0); 
  
  console.log(totalDiscount)
 
  const newOrder = new Order({
    userId,
    shippingAddress : addressId,
    items : cartItems , 
    paymentMethod,
    totalPrice : (productsPrice - cart.walletBalance - cart.couponBalance),
    appliedWallet : cart.walletBalance ,
    appliedCoupon : cart.couponBalance ,
    totalDiscount 
  })

  const savedOrder = await newOrder.save() ; 

  await User.findByIdAndUpdate(userId , {coupon : null})
  //delete the existing cart after the successfull order place
  await Cart.findByIdAndDelete(cartId);

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
      itemToUpdate.quantity -= orderQuantity ;

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
  
}


//get view order
const viewOrder = async (req,res) =>{
  const logo = await Logo.findOne().sort({ updatedAt : -1 }) ; 
  const genderCategory = await GenderCategory.find({ softDelete : false});
  const order = await Order.findById(req.params.orderId).populate("shippingAddress").populate("items.product");

  // Format order date
  const orderDate = new Date(order.createdAt).toLocaleString();


  let user ;   
  if(req.session.userId){
    user = await User.findById(req.session.userId) ;  
  }else if(req.user){
    user = await User.findById( req.user._id ) ;  
  }else{
    return res.redirect("/userLogin") ;   
  }

  let cartTotal ; 
     if(user){
     const cart = await Cart.findOne({user : user._id});
     if(cart){
      cartTotal = cart.items.reduce((total, item) => total + item.quantity , 0); 
     } 
     }else{
     cartTotal = 0 ;
     }
  
  res.render("viewOrder.ejs" ,{ logo , genderCategory , user , order , orderDate , cartTotal }) ; 
}



//post cancel order
const cancelOrder = async (req,res) =>{
  try{
    const orderId = req.body.id ;
    
    const savedOrder = await Order.findByIdAndUpdate(orderId, {
      orderStatus: "cancelled",
    });

     //increase the quantity of products in the database . 
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
      itemToUpdate.quantity += orderQuantity;

      // Save the updated product back to the database
      await product.save();
  }}}



   //add to wallet
   const userId = req.session.userId ||  req.user._id 
   const user = await User.findById(userId) ; 
   
   let amountPayable = savedOrder.paymentMethod != "cash-on-delivery" ? savedOrder.totalPrice : 0 ;
   user.walletBalance += (savedOrder.appliedWallet +  amountPayable); 

   let wallet = savedOrder.appliedWallet > 0 ? savedOrder.appliedWallet+amountPayable : false ;  

   await user.save();
 
    res.status(200).json({ status : true , wallet  });  

  }catch(err){
    res.status(500).json({ status : false } ) ;
    console.log(err);
  }  
}
 

module.exports = { myOrders , addToCart , checkout , increQuantity , decreQuantity , removeItem , placeorder , viewOrder , cancelOrder } 

