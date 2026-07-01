import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bot, Download, Filter, RefreshCw, Sparkles } from 'lucide-react';

import { adminApi } from '@/api/endpoints';
import { formatNumber } from '@/utils/format';

const COLORS = ['#ffca2d', '#ef927b', '#75d7a9', '#8f66ff', '#5a3a1b', '#b8b1c9'];
const RANGE_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last_7_days', label: '7 ngày qua' },
  { value: 'last_30_days', label: '30 ngày qua' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'custom', label: 'Tùy chọn' },
];
const DEVICE_LABELS = {
  desktop: 'Máy tính',
  mobile: 'Điện thoại',
  tablet: 'Máy tính bảng',
  unknown: 'Không rõ',
};
const KPI_GROUPS = [
  {
    title: 'Tổng quan traffic',
    items: [
      ['totalVisitors', 'Lượt truy cập', 'Tổng phiên vào web'],
      ['uniqueVisitors', 'Khách duy nhất', 'Theo user hoặc anonymous ID'],
      ['totalSessions', 'Phiên truy cập', 'Mỗi phiên hết hạn sau 30 phút'],
      ['totalPageViews', 'Lượt xem trang', 'Tổng page view đã ghi nhận'],
    ],
  },
  {
    title: 'Sử dụng AI',
    items: [
      ['aiUsers', 'Người dùng AI', 'Khách có dùng tính năng AI'],
      ['aiActions', 'Lượt AI', 'Tổng event AI đã ghi nhận'],
      ['aiOnlyUsers', 'Chỉ dùng AI', 'Dùng AI nhưng chưa mua'],
      ['aiToBuyerUsers', 'AI rồi mua', 'Dùng AI trước khi mua'],
    ],
  },
  {
    title: 'Mua hàng',
    items: [
      ['buyers', 'Khách mua hàng', 'Có purchase_success'],
      ['nonBuyers', 'Chưa mua', 'Khách chưa có đơn thành công'],
      ['buyerWithoutAIUsers', 'Mua không qua AI', 'Buyer không dùng AI trước đó'],
      ['purchaseConversionRate', 'Tỷ lệ mua hàng', 'Buyer / khách duy nhất', '%'],
    ],
  },
  {
    title: 'Chất lượng phiên',
    items: [
      ['aiToPurchaseRate', 'Tỷ lệ AI ra đơn', 'AI-to-buyer / người dùng AI', '%'],
      ['bounceRate', 'Tỷ lệ rời trang', 'Phiên chỉ xem 1 trang', '%'],
      ['topTrafficSource', 'Nguồn hiệu quả nhất', 'Nguồn đem lại nhiều traffic'],
    ],
  },
];

function pct(value) {
  return `${Number(value || 0).toFixed(1).replace('.0', '')}%`;
}

function metricValue(data, key, suffix) {
  const value = data?.[key];
  if (key === 'topTrafficSource') return sourceLabel(value || 'Direct');
  if (suffix === '%') return pct(value);
  return formatNumber(value || 0);
}

function sourceLabel(value) {
  if (!value || value === 'Direct') return 'Trực tiếp';
  return value;
}

function deviceLabel(value) {
  return DEVICE_LABELS[value] || value || DEVICE_LABELS.unknown;
}

function EmptyState({ label = 'Chưa có dữ liệu cho bộ lọc này.' }) {
  return <div className="grid h-56 place-items-center text-sm text-cocoa-300">{label}</div>;
}

function ChartShell({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-extrabold text-cocoa-700">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-cream-100 text-xs uppercase tracking-wide text-cocoa-300">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-3 py-2 font-extrabold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-100">
          {(rows || []).map((row, index) => (
            <tr key={row.id || row.pagePath || row.source || row.step || row.aiFeature || index}>
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-3 py-3 text-cocoa-500">
                  {column.render ? column.render(row[column.key], row) : row[column.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
          {(!rows || rows.length === 0) && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-cocoa-300">
                Chưa có dữ liệu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [filters, setFilters] = useState({
    preset: 'last_7_days',
    startDate: '',
    endDate: '',
    source: '',
    campaign: '',
    device: '',
    eventType: '',
    aiStatus: '',
    buyerStatus: '',
  });
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) cleaned[key] = value;
    });
    return cleaned;
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, traffic, funnel, aiUsage, pages] = await Promise.all([
        adminApi.analyticsOverview(params),
        adminApi.analyticsTrafficSources(params),
        adminApi.analyticsFunnel(params),
        adminApi.analyticsAiUsage(params),
        adminApi.analyticsPages(params),
      ]);
      setData({ overview, traffic, funnel, aiUsage, pages });
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa tải được dữ liệu phân tích.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params]);

  const generateReport = async () => {
    setReportLoading(true);
    setReport(null);
    try {
      const response = await adminApi.generateAnalyticsReport(params);
      setReport(response.report);
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa tạo được báo cáo AI.');
    } finally {
      setReportLoading(false);
    }
  };

  const overview = data?.overview?.overview || {};
  const trafficRows = (data?.traffic?.rows || []).map((row) => ({
    ...row,
    sourceLabel: sourceLabel(row.source),
  }));
  const funnelRows = data?.funnel?.steps || [];
  const aiRows = data?.aiUsage?.rows || [];
  const pageRows = data?.pages?.rows || [];
  const deviceSplitRows = (data?.overview?.deviceSplit || []).map((row) => ({
    ...row,
    deviceLabel: deviceLabel(row.deviceType),
  }));
  const buyerStackRows = trafficRows.map((row) => ({
    source: row.sourceLabel,
    buyers: row.buyers || 0,
    nonBuyers: Math.max(0, (row.visitors || 0) - (row.buyers || 0)),
  }));
  const worstFunnelStep = funnelRows.reduce(
    (current, step) => (Number(step.dropOffRate || 0) > Number(current.dropOffRate || 0) ? step : current),
    { step: 'Chưa có dữ liệu', dropOffRate: 0 },
  );
  const topBouncePage = pageRows.reduce(
    (current, page) => (Number(page.bounceRate || 0) > Number(current.bounceRate || 0) ? page : current),
    { pagePath: 'Chưa có dữ liệu', bounceRate: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-cocoa-700">Phân tích kinh doanh</h1>
          <p className="mt-1 text-sm text-cocoa-400">Theo dõi nguồn truy cập, hành vi dùng AI, phễu mua hàng và chất lượng phiên.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary">
            <RefreshCw size={16} /> Làm mới
          </button>
          <button type="button" onClick={generateReport} disabled={reportLoading} className="btn-primary">
            <Sparkles size={16} /> {reportLoading ? 'Đang tạo...' : 'Báo cáo AI'}
          </button>
        </div>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-cocoa-600">
          <Filter size={16} /> Bộ lọc
        </div>
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <select className="input" value={filters.preset} onChange={(e) => setFilters({ ...filters, preset: e.target.value })}>
            {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="input" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} disabled={filters.preset !== 'custom'} />
          <input className="input" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} disabled={filters.preset !== 'custom'} />
          <input className="input" placeholder="Nguồn truy cập" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} />
          <input className="input" placeholder="Chiến dịch" value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} />
          <select className="input" value={filters.device} onChange={(e) => setFilters({ ...filters, device: e.target.value })}>
            <option value="">Tất cả thiết bị</option>
            <option value="desktop">Máy tính</option>
            <option value="mobile">Điện thoại</option>
            <option value="tablet">Máy tính bảng</option>
          </select>
          <select className="input" value={filters.eventType} onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}>
            <option value="">Tất cả sự kiện</option>
            <option value="navigation">Điều hướng</option>
            <option value="engagement">Tương tác</option>
            <option value="ai">AI</option>
            <option value="commerce">Mua hàng</option>
          </select>
          <button type="button" className="btn-ghost" onClick={() => setFilters({ preset: 'last_7_days', startDate: '', endDate: '', source: '', campaign: '', device: '', eventType: '', aiStatus: '', buyerStatus: '' })}>
            Xóa lọc
          </button>
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-coral-500 px-4 py-3 text-sm font-semibold text-white">{error}</div> : null}
      {loading ? <div className="text-cocoa-400">Đang tải dữ liệu phân tích...</div> : null}

      {!loading && (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wider text-cocoa-300">Nguồn tốt nhất</div>
              <div className="mt-2 font-display text-3xl text-cocoa-700">{metricValue(overview, 'topTrafficSource')}</div>
              <div className="mt-1 text-sm text-cocoa-400">Nguồn đang đem lại nhiều traffic nhất trong kỳ lọc.</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wider text-cocoa-300">Rơi nhiều nhất trong phễu</div>
              <div className="mt-2 font-display text-3xl text-coral-500">{pct(worstFunnelStep.dropOffRate)}</div>
              <div className="mt-1 text-sm text-cocoa-400">{worstFunnelStep.step}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wider text-cocoa-300">Trang cần chú ý</div>
              <div className="mt-2 truncate font-display text-2xl text-cocoa-700">{topBouncePage.pagePath}</div>
              <div className="mt-1 text-sm text-cocoa-400">Tỷ lệ rời trang {pct(topBouncePage.bounceRate)}</div>
            </div>
          </div>

          <div className="grid gap-5">
            {KPI_GROUPS.map((group) => (
              <section key={group.title} className="card p-5">
                <h2 className="text-base font-extrabold text-cocoa-700">{group.title}</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {group.items.map(([key, label, description, suffix]) => (
                    <div key={key} className="rounded-2xl border border-cream-100 bg-cream-50 p-4">
                      <div className="text-xs uppercase tracking-wider text-cocoa-300">{label}</div>
                      <div className="mt-2 font-display text-2xl text-cocoa-700">{metricValue(overview, key, suffix)}</div>
                      <div className="mt-1 text-xs text-cocoa-400">{description}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartShell title="Lượt truy cập theo thời gian">
              {data?.overview?.trafficSeries?.length ? (
                <ResponsiveContainer>
                  <LineChart data={data.overview.trafficSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visitors" name="Khách" stroke="#ef927b" strokeWidth={2} />
                    <Line type="monotone" dataKey="sessions" name="Phiên" stroke="#8f66ff" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </ChartShell>
            <ChartShell title="So sánh nguồn truy cập">
              {trafficRows.length ? (
                <ResponsiveContainer>
                  <BarChart data={trafficRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sourceLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visitors" name="Khách" fill="#ffca2d" />
                    <Bar dataKey="buyers" name="Người mua" fill="#75d7a9" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </ChartShell>
            <ChartShell title="Tỷ trọng thiết bị">
              {deviceSplitRows.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={deviceSplitRows} dataKey="sessions" nameKey="deviceLabel" outerRadius={100} label>
                      {deviceSplitRows.map((entry, index) => <Cell key={entry.deviceLabel} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </ChartShell>
            <ChartShell title="Xu hướng sử dụng AI">
              {aiRows.length ? (
                <ResponsiveContainer>
                  <AreaChart data={aiRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="aiFeature" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalUses" name="Lượt dùng AI" fill="#8f66ff" stroke="#6b43ee" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </ChartShell>
            <ChartShell title="Phễu chuyển đổi">
              {funnelRows.length ? (
                <div className="flex h-full items-center gap-3 overflow-x-auto">
                  {funnelRows.map((step, index) => (
                    <div key={step.step} className="min-w-[170px] rounded-2xl border border-cream-100 bg-cream-50 p-4">
                      <div className="text-xs font-extrabold uppercase text-cocoa-300">Bước {index + 1}</div>
                      <div className="mt-1 font-extrabold text-cocoa-700">{step.step}</div>
                      <div className="mt-3 font-display text-3xl text-coral-500">{formatNumber(step.users)}</div>
                      <div className="mt-1 text-xs text-cocoa-400">Rơi rớt {pct(step.dropOffRate)}</div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </ChartShell>
            <ChartShell title="Người mua và chưa mua theo nguồn">
              {buyerStackRows.length ? (
                <ResponsiveContainer>
                  <BarChart data={buyerStackRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="buyers" name="Đã mua" stackId="a" fill="#75d7a9" />
                    <Bar dataKey="nonBuyers" name="Chưa mua" stackId="a" fill="#ef927b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </ChartShell>
          </div>

          {report ? (
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl text-cocoa-700"><Bot size={20} /> Báo cáo AI</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-cocoa-500">
                  <Download size={14} /> {report.provider}
                </span>
              </div>
              <pre className="whitespace-pre-wrap rounded-2xl bg-cream-50 p-4 text-sm leading-7 text-cocoa-600">{report.markdown}</pre>
            </section>
          ) : null}

          <div className="grid gap-6">
            <section className="card p-5">
              <h2 className="mb-4 text-base font-extrabold text-cocoa-700">Bảng nguồn truy cập</h2>
              <DataTable rows={trafficRows} columns={[
                { key: 'sourceLabel', label: 'Nguồn' },
                { key: 'medium', label: 'Kênh' },
                { key: 'campaign', label: 'Chiến dịch' },
                { key: 'visitors', label: 'Khách', render: formatNumber },
                { key: 'sessions', label: 'Phiên', render: formatNumber },
                { key: 'aiUsers', label: 'Người dùng AI', render: formatNumber },
                { key: 'buyers', label: 'Người mua', render: formatNumber },
                { key: 'conversionRate', label: 'Tỷ lệ mua', render: pct },
                { key: 'aiToPurchaseRate', label: 'AI ra đơn', render: pct },
              ]} />
            </section>
            <section className="card p-5">
              <h2 className="mb-4 text-base font-extrabold text-cocoa-700">Bảng trang nổi bật</h2>
              <DataTable rows={pageRows} columns={[
                { key: 'pagePath', label: 'Trang' },
                { key: 'views', label: 'Lượt xem', render: formatNumber },
                { key: 'uniqueVisitors', label: 'Khách duy nhất', render: formatNumber },
                { key: 'averageTimeOnPage', label: 'Thời gian TB', render: (value) => `${Math.round(value || 0)} giây` },
                { key: 'bounceRate', label: 'Rời trang', render: pct },
                { key: 'exitRate', label: 'Thoát', render: pct },
              ]} />
            </section>
            <section className="card p-5">
              <h2 className="mb-4 text-base font-extrabold text-cocoa-700">Bảng sử dụng AI</h2>
              <DataTable rows={aiRows} columns={[
                { key: 'aiFeature', label: 'Tính năng AI' },
                { key: 'users', label: 'Người dùng', render: formatNumber },
                { key: 'totalUses', label: 'Lượt dùng', render: formatNumber },
                { key: 'successCount', label: 'Thành công', render: formatNumber },
                { key: 'failedCount', label: 'Thất bại', render: formatNumber },
                { key: 'successRate', label: 'Tỷ lệ thành công', render: pct },
                { key: 'averageDuration', label: 'Thời gian TB', render: (value) => `${Math.round(value || 0)}ms` },
                { key: 'purchaseAfterAI', label: 'Mua sau AI', render: formatNumber },
              ]} />
            </section>
            <section className="card p-5">
              <h2 className="mb-4 text-base font-extrabold text-cocoa-700">Bảng phễu chuyển đổi</h2>
              <DataTable rows={funnelRows} columns={[
                { key: 'step', label: 'Bước' },
                { key: 'users', label: 'Người dùng', render: formatNumber },
                { key: 'conversionFromPrevious', label: 'Chuyển đổi từ bước trước', render: pct },
                { key: 'dropOffRate', label: 'Rơi rớt', render: pct },
              ]} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
