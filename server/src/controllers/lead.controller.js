const Lead = require('../models/Lead');
const Product = require('../models/Product');

exports.create = async (req, res) => {
  const { fullName, phone, email, message, source, productId } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại' });
  }

  let productSnapshot;
  let interestedProduct = null;
  if (productId) {
    const p = await Product.findById(productId);
    if (p) {
      interestedProduct = p._id;
      productSnapshot = {
        name: p.name,
        image: p.image,
        price: p.salePrice || p.price,
      };
    }
  }

  const lead = await Lead.create({
    fullName,
    phone,
    email,
    message,
    source: source || 'website',
    interestedProduct,
    productSnapshot,
  });

  res.status(201).json({
    message: 'Đã gửi thông tin liên hệ. Paw World sẽ liên hệ bạn sớm nhất!',
    lead,
  });
};
