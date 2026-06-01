export function getMealProductCartId(product) {
  const id = typeof product?._id === 'string' ? product._id.trim() : '';
  return /^[a-f\d]{24}$/i.test(id) ? id : null;
}
