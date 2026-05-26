export const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(n) || 0)
    .replace('₫', 'đ');

export const formatNumber = (n) =>
  new Intl.NumberFormat('vi-VN').format(Number(n) || 0);

export const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString('vi-VN');
};

export const cx = (...args) => args.filter(Boolean).join(' ');
