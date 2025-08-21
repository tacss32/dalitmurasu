const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: String,
  author: String,
  imageUrl: String,
  actualPrice: Number,
  sellingPrice: Number,
  // coupon: String,
  inStock: Boolean,
  description: String, 
  deliveryFee: Number, 
  category: {
    type: String,
    default: "shop"
  },
  showOnHome: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Book', bookSchema);
