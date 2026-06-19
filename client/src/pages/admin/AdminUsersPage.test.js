import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const appSource = readFileSync(new URL('../../App.jsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../../layouts/AdminLayout.jsx', import.meta.url), 'utf8');
const endpointsSource = readFileSync(new URL('../../api/endpoints.js', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('./AdminDashboardPage.jsx', import.meta.url), 'utf8');
const usersSource = readFileSync(new URL('./AdminUsersPage.jsx', import.meta.url), 'utf8');

test('admin users route and sidebar entry exist', () => {
  assert.match(appSource, /import AdminUsersPage from '@\/pages\/admin\/AdminUsersPage'/);
  assert.match(appSource, /<Route path="users" element=\{<AdminUsersPage \/>\}/);
  assert.match(layoutSource, /to: '\/admin\/users'/);
  assert.match(layoutSource, /label: 'Khách hàng'/);
});

test('adminApi exposes customer management methods', () => {
  assert.match(endpointsSource, /listCustomers:\s*\(params\)\s*=>\s*api\.get\('\/admin\/customers',\s*\{\s*params\s*\}\)/);
  assert.match(endpointsSource, /getCustomer:\s*\(id\)\s*=>\s*api\.get\(`\/admin\/customers\/\$\{id\}`\)/);
  assert.match(endpointsSource, /updateCustomerStatus:\s*\(id,\s*payload\)\s*=>\s*api\.patch\(`\/admin\/customers\/\$\{id\}\/status`,\s*payload\)/);
});

test('AdminUsersPage supports search filters details and lock unlock actions', () => {
  assert.match(usersSource, /adminApi\.listCustomers\(\{\s*q,\s*status,\s*provider,\s*limit:\s*50\s*\}\)/);
  assert.match(usersSource, /adminApi\.getCustomer\(customer\.id\)/);
  assert.match(usersSource, /adminApi\.updateCustomerStatus\(active\.customer\.id,\s*\{\s*isActive:\s*!active\.customer\.isActive\s*\}\)/);
  assert.match(usersSource, /Tìm theo tên, email, SĐT/);
  assert.match(usersSource, /Tất cả trạng thái/);
  assert.match(usersSource, /Tất cả nguồn đăng nhập/);
  assert.match(usersSource, /Tổng chi tiêu/);
  assert.match(usersSource, /Đơn gần đây/);
});

test('AdminDashboardPage renders customer report cards and top customers', () => {
  assert.match(dashboardSource, /key: 'customers'/);
  assert.match(dashboardSource, /key: 'newCustomersThisMonth'/);
  assert.match(dashboardSource, /key: 'lockedCustomers'/);
  assert.match(dashboardSource, /topCustomers/);
  assert.match(dashboardSource, /Top khách hàng/);
});
