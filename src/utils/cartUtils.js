const calculateCartSummary = (cart) => {
  let totalPrice = 0;
  let totalDiscount = 0;

  cart.forEach((item) => {
    const originalPrice = parseFloat(item.food_price);
    const discountPercent = parseFloat(item.food_discount_percent);
    const discountCap = parseFloat(item.food_discount_cap);

    const discountAmount = (originalPrice * discountPercent) / 100;
    const discount =
      discountAmount > discountCap ? discountCap : discountAmount;

    totalPrice += originalPrice * item.quantity;
    totalDiscount += discount * item.quantity;
  });

  const deliveryCharge = 30;
  const platformCharge = 5;
  const finalPrice =
    totalPrice - totalDiscount + deliveryCharge + platformCharge;

  return {
    totalPrice,
    totalDiscount,
    deliveryCharge,
    platformCharge,
    finalPrice,
  };
};

export { calculateCartSummary };
