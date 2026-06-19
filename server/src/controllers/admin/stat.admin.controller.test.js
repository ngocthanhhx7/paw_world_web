const assert = require('node:assert/strict');
const test = require('node:test');

const statAdmin = require('./stat.admin.controller');

test('buildCustomerTotals preserves dashboard fields while adding customer metrics', () => {
  const totals = statAdmin.buildDashboardTotals({
    totalOrders: 8,
    completedOrders: 3,
    pendingLeads: 2,
    totalProducts: 11,
    revenueThisMonth: 900000,
    totalCustomers: 7,
    activeCustomers: 5,
    lockedCustomers: 2,
    newCustomersThisMonth: 4,
  });

  assert.deepEqual(totals, {
    orders: 8,
    completedOrders: 3,
    pendingLeads: 2,
    products: 11,
    revenueThisMonth: 900000,
    customers: 7,
    activeCustomers: 5,
    lockedCustomers: 2,
    newCustomersThisMonth: 4,
  });
});
