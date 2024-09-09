
//import schemas
const Cart = require("../../models/cartSchema");
const Product = require("../../models/product");
const Logo = require("../../models/logoSchema");
const GenderCategory = require("../../models/genderCategory");
const User = require("../../models/userSchema");


//get my orders page
const myOrders =async ( req , res ) =>{ 
const logo = await Logo.findOne().sort({ updatedAt: -1 }) ; 
const genderCategory = await GenderCategory.find({softDelete : false});
const user = await User.findById(req.session.userId) || req.user  ;

const currentYear = new Date().getFullYear();
const years = [];
 for (let i = 0; i <= 3; i++) {
     years.push(currentYear - i);
 } 
 res.render("orders" , { orders : [] , logo , genderCategory ,user , years});
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
   let cart = await Cart.findOne({ user : userId });

        
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
            message: "Maximum limit exeeds!",
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
        items : [cartItem ] 
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
  const cart = await Cart.findOne({user : userId },{ items : {$elemMatch:{_id : itemId}}});
  
  const productId = cart.items[0].product; 
  const size = cart.items[0].size ;

  const product = await Product.findOne({_id : productId},{sizes : {$elemMatch:{size }}});
  
  if( cart.items[0].quantity < 5){
      if(cart.items[0].quantity < product.sizes[0].quantity ){
        cart.items[0].quantity += 1 ;
        cart.save().then(()=>console.log("item added")).catch((err)=>console.log(err.message));
        const productQuant = product.sizes[0].quantity;
        return res.status(200).json({ message : "product added to cart" , productQuant , success : true });
      }else{
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
      cart.items[0].quantity -= 1 ;
      cart.save().then(()=>console.log("one quantity removed")).catch((err)=>console.log(err.message));
      return res.status(200).json({ message : "one quantity removed" , productQuant, success : true });
    }else{
      cart.items[0].quantity = product.sizes[0].quantity;
      cart.save().then(()=>console.log("cart updated")).catch((err)=>console.log(err.message));
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
const checkout = async ( req , res ) =>{
  const logo = await Logo.findOne().sort({ updatedAt: -1 }) ; 
  const genderCategory = await GenderCategory.find({softDelete : false});
  const user = await User.findById(req.session.userId) || req.user  ;
    
  res.render("checkout.ejs" , { logo , genderCategory , user } );
}



module.exports = { myOrders , addToCart , checkout , increQuantity ,decreQuantity ,removeItem }