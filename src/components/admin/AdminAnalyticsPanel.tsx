import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  HeartHandshake,
  Layers,
  Minus,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SlidingTabs } from '../SlidingTabs';
import type { AnalyticsEvent, Category, Product } from '../../types';

interface AdminAnalyticsPanelProps {
  events: AnalyticsEvent[];
  products: Product[];
  categories: Category[];
  profileCount?: number;
}

const PIE_COLORS = ['#101A35', '#1C3265', '#3156A5', '#6385CB', '#8AA6DB', '#B7C9ED'];

function getEventTimestamp(evt: AnalyticsEvent): number {
  if (typeof evt.createdAt === 'number' && evt.createdAt > 0) return evt.createdAt;
  if (evt.dateKey) {
    const parsed = Date.parse(evt.dateKey);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

export function AdminAnalyticsPanel({
  events,
  products,
  categories,
  profileCount = 0,
}: AdminAnalyticsPanelProps) {
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');

  const summary = useMemo(() => {
    let visits = 0;
    let views = 0;
    let clicks = 0;
    let profileEvents = 0;

    events.forEach((e) => {
      if (e.type === 'site_visit') visits += 1;
      else if (e.type === 'product_view') views += 1;
      else if (e.type === 'affiliate_click') clicks += 1;
      else if (e.type === 'profile_created') profileEvents += 1;
    });

    const totalProfiles = Math.max(profileCount, profileEvents);
    const ctrNum = views > 0 ? (clicks / views) * 100 : 0;
    const ctr = ctrNum.toFixed(1);
    return { visits, views, clicks, profileEvents, totalProfiles, ctr, ctrNum };
  }, [events, profileCount]);

  // Website Wellbeing & Health Index (0–100)
  const wellbeing = useMemo(() => {
    const published = products.filter((p) => p.isPublished);
    const catalogPool = published.length > 0 ? published : products;

    // 1. Catalog Completeness (max 25 pts)
    let completeCount = 0;
    catalogPool.forEach((p) => {
      const hasImg = Array.isArray(p.images) && p.images.length > 0;
      const hasDesc = Boolean(p.description && p.description.trim().length > 10);
      const hasLink = Boolean(p.affiliateUrl && p.affiliateUrl.trim().length > 0);
      if (hasImg && (hasDesc || hasLink)) completeCount += 1;
    });
    const catalogScore =
      catalogPool.length > 0 ? Math.round((completeCount / catalogPool.length) * 25) : 10;

    // 2. Conversion Efficiency (max 25 pts): 15%+ CTR hits full 25
    const conversionScore =
      summary.views === 0
        ? Math.min(18, catalogPool.length > 0 ? 15 : 8)
        : Math.min(25, Math.max(8, Math.round((summary.ctrNum / 15) * 25)));

    // 3. Customer Profile Adoption (max 25 pts)
    const profileRatio =
      summary.visits > 0
        ? (summary.totalProfiles / Math.max(1, summary.visits)) * 100
        : summary.totalProfiles > 0
          ? 20
          : 0;
    const profileScore =
      summary.totalProfiles === 0
        ? 6
        : Math.min(25, Math.max(12, Math.round(12 + Math.min(13, profileRatio * 1.2))));

    // 4. Category & Spotlight Coverage (max 25 pts)
    const populatedCats = categories.filter((c) =>
      catalogPool.some((p) => p.categoryId === c.id || p.categoryName === c.name)
    ).length;
    const catRatio = categories.length > 0 ? populatedCats / categories.length : 1;
    const pinnedBonus = catalogPool.some((p) => p.isPinned) ? 5 : 0;
    const coverageScore = Math.min(25, Math.round(catRatio * 20) + pinnedBonus);

    const total = Math.min(100, catalogScore + conversionScore + profileScore + coverageScore);
    const statusLabel =
      total >= 80 ? 'Thriving Storefront' : total >= 58 ? 'Healthy & Steady' : 'Building Momentum';

    const tip =
      summary.totalProfiles === 0
        ? 'Encourage shoppers to save a Customer Profile on /profile to boost repeat visits.'
        : summary.views > 0 && summary.ctrNum < 5
          ? 'Improve product descriptions & gallery photos to raise view-to-affiliate CTR.'
          : populatedCats < categories.length
            ? 'Some categories have zero published products—publish items to balance discovery.'
            : 'Strong balance across catalog richness, category spread, and customer profile retention.';

    return {
      total,
      statusLabel,
      tip,
      metrics: [
        { label: 'Catalog Richness', score: catalogScore, max: 25 },
        { label: 'Click Conversion Health', score: conversionScore, max: 25 },
        { label: 'Customer Profile Adoption', score: profileScore, max: 25 },
        { label: 'Category & Spotlight Spread', score: coverageScore, max: 25 },
      ],
    };
  }, [products, categories, summary]);

  const timeSeriesData = useMemo(() => {
    const bucket = new Map<
      string,
      { label: string; visits: number; views: number; clicks: number; profiles: number }
    >();

    events.forEach((evt) => {
      const key = granularity === 'daily' ? evt.dateKey : evt.monthKey;
      if (!key) return;
      const existing = bucket.get(key) || {
        label: key,
        visits: 0,
        views: 0,
        clicks: 0,
        profiles: 0,
      };
      if (evt.type === 'site_visit') existing.visits += 1;
      if (evt.type === 'product_view') existing.views += 1;
      if (evt.type === 'affiliate_click') existing.clicks += 1;
      if (evt.type === 'profile_created') existing.profiles += 1;
      bucket.set(key, existing);
    });

    return Array.from(bucket.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-14);
  }, [events, granularity]);

  // Product-by-product growth breakdown (recent 7d vs previous 7d)
  const productGrowth = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const recentCutoff = now - sevenDaysMs;
    const prevCutoff = now - 2 * sevenDaysMs;

    interface ProductPerf {
      id: string;
      title: string;
      categoryName: string;
      image?: string;
      views: number;
      clicks: number;
      recentInteractions: number;
      prevInteractions: number;
    }

    const map = new Map<string, ProductPerf>();

    // Seed from catalog so all products show up cleanly
    products.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        title: p.title,
        categoryName: p.categoryName || 'General',
        image: p.images?.[0],
        views: 0,
        clicks: 0,
        recentInteractions: 0,
        prevInteractions: 0,
      });
    });

    events.forEach((evt) => {
      if (!evt.productId) return;
      if (evt.type !== 'product_view' && evt.type !== 'affiliate_click') return;

      const existing = map.get(evt.productId) || {
        id: evt.productId,
        title: evt.productTitle || 'Product',
        categoryName: evt.categoryName || 'General',
        views: 0,
        clicks: 0,
        recentInteractions: 0,
        prevInteractions: 0,
      };

      if (evt.type === 'product_view') existing.views += 1;
      if (evt.type === 'affiliate_click') existing.clicks += 1;

      const ts = getEventTimestamp(evt);
      if (ts >= recentCutoff) {
        existing.recentInteractions += 1;
      } else if (ts >= prevCutoff && ts < recentCutoff) {
        existing.prevInteractions += 1;
      }

      map.set(evt.productId, existing);
    });

    const rows = Array.from(map.values()).map((item) => {
      const totalActivity = item.views + item.clicks;
      const ctr = item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(1) : '0.0';
      let trend: 'rising' | 'new' | 'steady' | 'cooling' = 'steady';
      let deltaLabel = 'Steady';

      if (item.recentInteractions > 0 && item.prevInteractions === 0) {
        trend = 'new';
        deltaLabel = `+${item.recentInteractions} this week`;
      } else if (item.prevInteractions > 0) {
        const pct = Math.round(
          ((item.recentInteractions - item.prevInteractions) / item.prevInteractions) * 100
        );
        if (pct > 5) {
          trend = 'rising';
          deltaLabel = `+${pct}%`;
        } else if (pct < -5) {
          trend = 'cooling';
          deltaLabel = `${pct}%`;
        } else {
          trend = 'steady';
          deltaLabel = 'Steady';
        }
      }

      return {
        ...item,
        totalActivity,
        ctr,
        trend,
        deltaLabel,
      };
    });

    return rows.sort((a, b) => b.totalActivity - a.totalActivity || b.clicks - a.clicks);
  }, [products, events]);

  const maxProductActivity = useMemo(
    () => Math.max(1, ...productGrowth.map((p) => p.totalActivity)),
    [productGrowth]
  );

  const categoryPerformance = useMemo(() => {
    const map = new Map<string, { name: string; views: number; clicks: number; total: number }>();

    events.forEach((evt) => {
      if (evt.type !== 'product_view' && evt.type !== 'affiliate_click') return;
      const catName = evt.categoryName || 'Uncategorized';
      const item = map.get(catName) || { name: catName, views: 0, clicks: 0, total: 0 };
      if (evt.type === 'product_view') item.views += 1;
      if (evt.type === 'affiliate_click') item.clicks += 1;
      item.total = item.views + item.clicks;
      map.set(catName, item);
    });

    // If no telemetry yet, show catalog distribution cleanly
    if (map.size === 0 && products.length > 0) {
      products.forEach((p) => {
        const catName = p.categoryName || 'Uncategorized';
        const item = map.get(catName) || { name: catName, views: 0, clicks: 0, total: 0 };
        item.total += 1;
        map.set(catName, item);
      });
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [events, products]);

  // Visual Journey Infographic Stages
  const journeyStages = useMemo(() => {
    const maxVal = Math.max(1, summary.visits, summary.views, summary.totalProfiles, summary.clicks);
    return [
      {
        label: 'Store Visits',
        value: summary.visits,
        pctOfTop: Math.round((summary.visits / maxVal) * 100),
        icon: Users,
        accent: '#6385CB',
        note: 'Unique storefront sessions',
      },
      {
        label: 'Product Views',
        value: summary.views,
        pctOfTop: Math.round((summary.views / maxVal) * 100),
        icon: Sparkles,
        accent: '#3156A5',
        note:
          summary.visits > 0
            ? `${Math.round((summary.views / summary.visits) * 100)}% visit-to-view rate`
            : 'Product page inspections',
      },
      {
        label: 'Customer Profiles Created',
        value: summary.totalProfiles,
        pctOfTop: Math.round((summary.totalProfiles / maxVal) * 100),
        icon: UserCheck,
        accent: '#1C3265',
        note: 'Saved shopper & client profiles',
      },
      {
        label: 'Outbound Affiliate Clicks',
        value: summary.clicks,
        pctOfTop: Math.round((summary.clicks / maxVal) * 100),
        icon: MousePointerClick,
        accent: '#101A35',
        note: `${summary.ctr}% view-to-click conversion`,
      },
    ];
  }, [summary]);

  // SVG gauge circumference calculation (radius = 52)
  const gaugeRadius = 52;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - wellbeing.total / 100);

  return (
    <div className="space-y-6">
      {/* Header Control Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/70 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-bold text-[#101A35]">
            Storefront Analytics, Profile Growth &amp; Wellbeing
          </h2>
          <p className="mt-0.5 text-xs text-[#1C3265]/80">
            Visual infographic of customer profile creations, product-by-product growth, and live
            website health.
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

      {/* 5-Card Executive KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            Website Visits
          </span>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#101A35]">
            {summary.visits.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#3156A5]">Tracked storefront sessions</p>
        </div>

        <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            Product Views
          </span>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#101A35]">
            {summary.views.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#3156A5]">Detail &amp; quick-view opens</p>
        </div>

        <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            Affiliate Clicks
          </span>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#1C3265]">
            {summary.clicks.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#3156A5]">Outbound merchant clicks</p>
        </div>

        <div className="rounded-2xl border border-[#B7C9ED]/65 bg-white p-5">
          <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
            View-to-Click CTR
          </span>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#3156A5]">
            {summary.ctr}%
          </p>
          <p className="mt-1 text-[11px] text-[#3156A5]">Conversion efficiency</p>
        </div>

        <div className="rounded-2xl border-2 border-[#3156A5]/45 bg-[#F1F4FC]/70 p-5">
          <span className="flex items-center gap-1.5 font-accent text-[11px] font-bold tracking-wider text-[#1C3265] uppercase">
            <UserCheck className="h-3.5 w-3.5 text-[#3156A5]" />
            <span>Customer Profiles</span>
          </span>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-[#101A35]">
            {summary.totalProfiles.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#1C3265]">
            {summary.profileEvents} created / synced
          </p>
        </div>
      </div>

      {/* Infographic Row 1: Website Wellbeing Score + Customer Journey Funnel */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Website Wellbeing & Health Infographic */}
        <div className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 font-accent text-[10px] font-bold tracking-[0.14em] text-[#3156A5] uppercase">
                <HeartHandshake className="h-3.5 w-3.5" />
                <span>Website Wellbeing Index</span>
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-[#101A35]">
                Overall Storefront Health
              </h3>
            </div>
            <span className="rounded-full bg-[#1C3265] px-3 py-1 text-[11px] font-semibold text-white">
              {wellbeing.statusLabel}
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
            {/* Radial Gauge */}
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r={gaugeRadius}
                  fill="none"
                  stroke="#F1F4FC"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={gaugeRadius}
                  fill="none"
                  stroke="url(#trtWellbeingGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                />
                <defs>
                  <linearGradient id="trtWellbeingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3156A5" />
                    <stop offset="100%" stopColor="#101A35" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-extrabold tabular-nums text-[#101A35]">
                  {wellbeing.total}
                </span>
                <span className="font-accent text-[10px] font-bold tracking-wider text-[#6385CB] uppercase">
                  / 100 Score
                </span>
              </div>
            </div>

            {/* 4 Sub-score Bars */}
            <div className="w-full flex-1 space-y-3">
              {wellbeing.metrics.map((m) => {
                const pct = Math.round((m.score / m.max) * 100);
                return (
                  <div key={m.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#101A35]">{m.label}</span>
                      <span className="font-accent tabular-nums font-bold text-[#3156A5]">
                        {m.score}/{m.max}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F4FC]">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#6385CB] to-[#1C3265] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#B7C9ED]/60 bg-[#F1F4FC]/60 px-4 py-3 text-xs text-[#1C3265]">
            <strong className="font-semibold text-[#101A35]">Health Insight: </strong>
            {wellbeing.tip}
          </div>
        </div>

        {/* Visual Customer Journey Funnel Infographic */}
        <div className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 font-accent text-[10px] font-bold tracking-[0.14em] text-[#3156A5] uppercase">
                <Activity className="h-3.5 w-3.5" />
                <span>Conversion Infographic</span>
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-[#101A35]">
                Customer Discovery Funnel
              </h3>
            </div>
            <span className="rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-3 py-1 font-accent text-[11px] font-bold text-[#1C3265]">
              4 Stages
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {journeyStages.map((stage, idx) => {
              const Icon = stage.icon;
              const widthPct = stage.value > 0 ? Math.max(8, stage.pctOfTop) : 4;
              return (
                <div
                  key={stage.label}
                  className="rounded-2xl border border-[#B7C9ED]/50 bg-[#F1F4FC]/45 p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{ backgroundColor: stage.accent }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-display text-xs font-bold text-[#101A35]">
                          {idx + 1}. {stage.label}
                        </p>
                        <p className="text-[11px] text-[#3156A5]">{stage.note}</p>
                      </div>
                    </div>

                    <span className="font-display text-xl font-extrabold tabular-nums text-[#101A35]">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white">
                    <div
                      style={{ width: `${widthPct}%`, backgroundColor: stage.accent }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Traffic & Profile Trend Area Chart */}
      <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-[#101A35]">
              {granularity === 'daily'
                ? 'Daily Traffic, Profiles & Outbound Clicks'
                : 'Monthly Traffic, Profiles & Outbound Clicks'}
            </h3>
            <p className="text-xs text-[#6385CB]">
              Tracks visits, product views, affiliate clicks, and customer profile creations over
              time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#1C3265]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6385CB]" /> Visits
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3156A5]" /> Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#101A35]" /> Clicks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Profiles
            </span>
          </div>
        </div>

        {timeSeriesData.length === 0 ? (
          <p className="py-12 text-center text-xs text-[#6385CB]">
            No traffic events recorded yet. Visits, profile creations, and product clicks will appear
            here in real time.
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
                    <stop offset="5%" stopColor="#101A35" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#101A35" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#1C3265' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#1C3265' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
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
                <Area
                  type="monotone"
                  dataKey="profiles"
                  name="Customer Profiles"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Product-by-Product Growth Intelligence */}
      <div className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F4FC] pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 font-accent text-[10px] font-bold tracking-[0.14em] text-[#3156A5] uppercase">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Product Growth Intelligence</span>
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-[#101A35]">
              How Each Product Is Growing (7-Day Momentum)
            </h3>
          </div>
          <span className="rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-3 py-1 font-accent text-[11px] font-semibold text-[#1C3265]">
            {productGrowth.length} Products Tracked
          </span>
        </div>

        {productGrowth.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#6385CB]">
            Add products and gather visitor views to see individual product growth trajectories.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-[#F1F4FC]">
            {productGrowth.slice(0, 12).map((item) => {
              const barPct = item.totalActivity > 0 ? Math.max(6, Math.round((item.totalActivity / maxProductActivity) * 100)) : 2;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#B7C9ED]/60 bg-[#F1F4FC]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-[#6385CB]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-display text-sm font-bold text-[#101A35]">
                          {item.title}
                        </p>
                        <span className="rounded-full bg-[#F1F4FC] px-2 py-0.5 text-[10px] font-semibold text-[#3156A5]">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 w-36 max-w-full overflow-hidden rounded-full bg-[#F1F4FC]">
                          <div
                            style={{ width: `${barPct}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-[#6385CB] to-[#101A35]"
                          />
                        </div>
                        <span className="font-accent text-[11px] tabular-nums text-[#6385CB]">
                          {item.views} views · {item.clicks} clicks · {item.ctr}% CTR
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
                    <span className="text-[11px] font-medium text-[#6385CB]">
                      7d: <strong className="text-[#101A35]">{item.recentInteractions}</strong>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                        item.trend === 'rising' || item.trend === 'new'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.trend === 'cooling'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#F1F4FC] text-[#1C3265]'
                      }`}
                    >
                      {item.trend === 'rising' || item.trend === 'new' ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : item.trend === 'cooling' ? (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      <span>{item.deltaLabel}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Row: Category Bar Chart + Category Share Donut Infographic */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Bar Performance */}
        <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#101A35]">
            <Layers className="h-4 w-4 text-[#3156A5]" />
            <span>Category Views vs Clicks</span>
          </h3>
          {categoryPerformance.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#6385CB]">
              Category view and click data will appear as visitors browse products.
            </p>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryPerformance}
                  margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                >
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
                  <Bar
                    dataKey="clicks"
                    name="Affiliate Clicks"
                    fill="#1C3265"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Share Donut Infographic */}
        <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6">
          <h3 className="font-display text-base font-bold text-[#101A35]">
            Category Demand Share
          </h3>
          {categoryPerformance.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#6385CB]">
              Add categories and products to visualize catalog demand distribution.
            </p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPerformance}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {categoryPerformance.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #B7C9ED',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full flex-1 space-y-2">
                {categoryPerformance.slice(0, 6).map((cat, idx) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between rounded-xl bg-[#F1F4FC]/55 px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[#101A35]">
                      <span
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        className="h-2.5 w-2.5 rounded-full"
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-accent tabular-nums font-bold text-[#1C3265]">
                      {cat.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
