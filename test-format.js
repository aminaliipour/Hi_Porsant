const formatNumber = (num) => {
  if (num === 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

console.log('Test manual formatting:');
console.log('123456 -> ', formatNumber(123456));
console.log('1000000 -> ', formatNumber(1000000));
console.log('500 -> ', formatNumber(500));
console.log('375555 -> ', formatNumber(375555));
console.log('288055.05 -> ', formatNumber(288055.05));
