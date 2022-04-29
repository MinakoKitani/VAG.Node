// 转换时间格式
function formatDate() {
  const time = new Date();
  return `${time.getFullYear()}-${(time.getMonth() + 1).toString().padStart(2, 0)}-${(time.getDate()).toString().padStart(2, 0)}`;
}

module.exports = {
  formatDate: formatDate
};
