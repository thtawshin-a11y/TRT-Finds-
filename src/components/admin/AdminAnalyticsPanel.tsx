import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SlidingTabs } from '../SlidingTabs';
import type { AnalyticsEvent } from '../../types';

interface AdminAnalyticsPanelProps {
  events: AnalyticsEvent[];
}

export function AdminAnalyticsPanel({ events }: AdminAnalyticsPanelProps) {
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');

  const summary = useMemo(() => {
    let visits = 0;
    let views = 0;
    let clicks = 0;

    events.forEach((e) => {
      if (e.type === 'site_visit') visits += 1;
      else if (e.type === 'product_view') views += 1;
      else if (e.type === 'affiliate_click') clicks += 1;
    });

    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';
    return { visits, views, clicks, ctr };
  }, [events]);

  const timeSeriesData = useMemo(() => {
    const bucket = new Map<
      string,
      { label: string; visits: number; views: number; clicks: number }
    >();

    events.forEach((evt) => {
      const key = granularity === 'daily' ? evt.dateKey : evt.monthKey;
      if (!key) return;
      const existing = bucket.get(key) || {
        label: key,
        visits: 0,
        views: 0,
        clicks: 0,
      };
      if (evt.type === 'site_visit') existing.visits += 1;
      if (evt.type === 'product_view') existing.views += 1;
      if (evt.type === 'affiliate_click') existing.clicks += 1;
      bucket.set(key, existing);
    });

    return Array.from(bucket.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-14);
  }, [events, granularity]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; views: number; clicks: number }>();

    events.forEach((evt) => {
      if (!evt.productId || !evt.productTitle) return;
      if (evt.type !== 'product_view' && evt.type !== 'affiliate_click') return;
      const item = map.get(evt.productId) || {
        title: evt.productTitle,
        views: 0,
        clicks: 0,
      };
      if (evt.type === 'product_view') item.views += 1;
      if (evt.type === 'affiliate_click') item.clicks += 1;
      map.set(evt.productId, item);
    });

    const list = Array.from(map.values());
    return {
      mostViewed: [...list].sort((a, b) => b.views - a.views).slice(0, 6),
      mostClicked: [...list].sort((a, b) => b.clicks - a.clicks).slice(0, 6),
    };
  }, [events]);

  const categoryPerformance = useMemo(() => {
    const map = new Map<string, { name: string; views: number; clicks: number }>();

    events.forEach((evt) => {
      if (evt.type !== 'product_view' && evt.type !== 'affiliate_click') return;
      const catName = evt.categoryName || 'Uncategorized';
      const item = map.get(catName) || { name: catName, views: 0, clicks: 0 };
      if (evt.type === 'product_view') item.views += 1;
      if (evt.type === 'affiliate_click') item.clicks += 1;
      map.set(catName, item);
    });

    return Array.from(map.values()).sort((a, b) => b.clicks + b.views - (a.clicks + a.views));
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Metric Disclaimer */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/60 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#101A35]">
            Traffic & Outbound Affiliate Telemetry
          </h2>
          <p className="mt-0.5 text-xs text-[#1C3265]/75">
            Tracks storefront visits, product views, and outbound affiliate link clicks separately from third-party merchant checkouts.
          </p>
        </div>

        <SlidingTabs
          layoutId="analytics-granularity"
          size="sm"
          value={granularity}
          onChange={setGranularity}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            Website Visits
          </span>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-[#101A35]">
            {summary.visits.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            Product Page Views
          </span>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-[#101A35]">
            {summary.views.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            Outbound Affiliate Clicks
          </span>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-[#1C3265]">
            {summary.clicks.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            View-to-Click Rate
          </span>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-[#3156A5]">
            {summary.ctr}%
          </p>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-6">
        <h3 className="font-display text-base font-semibold text-[#101A35]">
          {granularity === 'daily' ? 'Daily Traffic & Outbound Clicks' : 'Monthly Traffic & Outbound Clicks'}
        </h3>
        {timeSeriesData.length === 0 ? (
          <p className="py-12 text-center text-xs text-[#6385CB]">
            No traffic events recorded yet. Visits and product clicks will appear here in real time.
          </p>
        ) : (
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="trtVisitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6385CB" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#6385CB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="trtClicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1C3265" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#1C3265" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#1C3265' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#1C3265' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #B7C9ED',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Site Visits"
                  stroke="#6385CB"
                  strokeWidth={2}
                  fill="url(#trtVisitsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Product Views"
                  stroke="#3156A5"
                  strokeWidth={2}
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  name="Affiliate Clicks"
                  stroke="#101A35"
                  strokeWidth={2}
                  fill="url(#trtClicksGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Product & Category Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Performance */}
        <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-[#101A35]">
            Category Performance
          </h3>
          {categoryPerformance.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#6385CB]">
              Category view and click data will appear as visitors browse products.
            </p>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#1C3265' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#1C3265' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #B7C9ED',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="views" name="Views" fill="#6385CB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Affiliate Clicks" fill="#1C3265" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Most Viewed & Most Clicked */}
        <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-[#101A35]">
            Top Viewed & Clicked Products
          </h3>
          {topProducts.mostViewed.length === 0 && topProducts.mostClicked.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#6385CB]">
              No product interactions recorded yet.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <p className="font-accent text-[11px] font-semibold tracking-wider text-[#3156A5] uppercase">
                  Most Clicked Affiliate Links
                </p>
                <div className="mt-2 divide-y divide-[#F1F4FC]">
                  {topProducts.mostClicked.map((item, idx) => (
                    <div key={`${item.title}-${idx}`} className="flex items-center justify-between py-2 text-xs">
                      <span className="truncate pr-3 font-medium text-[#101A35]">{item.title}</span>
                      <span className="shrink-0 font-accent tabular-nums font-semibold text-[#1C3265]">
                        {item.clicks} clicks
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                  Most Viewed Product Pages
                </p>
                <div className="mt-2 divide-y divide-[#F1F4FC]">
                  {topProducts.mostViewed.map((item, idx) => (
                    <div key={`${item.title}-${idx}`} className="flex items-center justify-between py-2 text-xs">
                      <span className="truncate pr-3 font-medium text-[#101A35]">{item.title}</span>
                      <span className="shrink-0 font-accent tabular-nums text-[#3156A5]">
                        {item.views} views
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
