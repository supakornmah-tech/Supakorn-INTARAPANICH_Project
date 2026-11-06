export function getTypeLabel(type) {
  return type === 'found' ? 'พบของ' : 'ของหาย';
}

export function getStatusLabel(type, status) {
  if (status === 'resolved') {
    return type === 'found' ? 'ส่งคืนสำเร็จ' : 'ได้รับของคืนแล้ว';
  }
  return type === 'found' ? 'รอเจ้าของติดต่อมา' : 'กำลังตามหา';
}

export function getStatusBadgeClass(status) {
  return status === 'resolved' ? 'resolved' : 'pending';
}

export function getCloseActionLabel(type) {
  return type === 'found' ? '✅ ส่งคืนแล้ว' : '✅ ได้รับคืนแล้ว';
}
