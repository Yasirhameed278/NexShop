const asyncHandler = require('express-async-handler');
const Anthropic = require('@anthropic-ai/sdk');
const Order = require('../models/Order');
const Product = require('../models/Product');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VELOCITY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function classifyRisk(stock, daysUntilStockout) {
  if (stock === 0) return 'critical';
  if (daysUntilStockout <= 7) return 'critical';
  if (daysUntilStockout <= 14) return 'high';
  if (daysUntilStockout <= 30) return 'medium';
  return 'low';
}

function computeProductMetrics(productId, salesByProduct, currentStock) {
  const entry = salesByProduct.get(productId.toString());

  if (!entry) {
    return {
      dailyVelocity7: 0, dailyVelocity30: 0, dailyVelocity90: 0,
      totalUnits90: 0,
      daysUntilStockout: currentStock > 0 ? 999 : 0,
      riskLevel: currentStock === 0 ? 'critical' : 'low',
      seasonalIndex: 1.0,
      reorderQty: 0,
    };
  }

  const now = Date.now();
  const cutoff7  = now - 7  * 86400000;
  const cutoff30 = now - 30 * 86400000;
  const daily = entry.dailySales;

  const units7  = daily.filter(d => new Date(d.date).getTime() >= cutoff7).reduce((s, d) => s + d.units, 0);
  const units30 = daily.filter(d => new Date(d.date).getTime() >= cutoff30).reduce((s, d) => s + d.units, 0);
  const units90 = entry.totalUnits;

  const vel7  = units7  / 7;
  const vel30 = units30 / 30;
  const vel90 = units90 / 90;

  // Weighted velocity: heavier weight on recent data
  const velocity = vel7 * 0.6 + vel30 * 0.3 + vel90 * 0.1;

  const daysUntilStockout = velocity > 0.01
    ? Math.round(currentStock / velocity)
    : (currentStock > 0 ? 999 : 0);

  // Seasonal index: ratio of current month's daily rate to overall velocity
  const currentMonth = new Date().getMonth() + 1;
  const thisMonthDays = daily.filter(d => new Date(d.date).getMonth() + 1 === currentMonth);
  const currentMonthDaily = thisMonthDays.length
    ? thisMonthDays.reduce((s, d) => s + d.units, 0) / thisMonthDays.length
    : 0;
  const seasonalIndex = velocity > 0.01
    ? parseFloat((currentMonthDaily / velocity).toFixed(2))
    : 1.0;

  const riskLevel = classifyRisk(currentStock, daysUntilStockout);
  // Recommend enough stock to cover 30 days above current
  const reorderQty = Math.max(0, Math.ceil(velocity * 30 - currentStock));

  return {
    dailyVelocity7:  parseFloat(vel7.toFixed(2)),
    dailyVelocity30: parseFloat(vel30.toFixed(2)),
    dailyVelocity90: parseFloat(vel90.toFixed(2)),
    totalUnits90: units90,
    daysUntilStockout,
    riskLevel,
    seasonalIndex,
    reorderQty,
  };
}

function buildVelocityChartData(topProducts, salesByProduct) {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates.map(date => {
    const point = { date };
    topProducts.forEach(p => {
      const entry = salesByProduct.get(p._id.toString());
      const shortName = p.name.length > 16 ? p.name.substring(0, 15) + '…' : p.name;
      point[shortName] = entry
        ? (entry.dailySales.find(d => d.date === date)?.units || 0)
        : 0;
    });
    return point;
  });
}

async function generateAIInsights(predictions, summary, monthlyTrends) {
  const atRisk = predictions.filter(p => ['critical', 'high'].includes(p.riskLevel));

  if (atRisk.length === 0 && summary.medium === 0) {
    return {
      summary: 'All products have healthy inventory levels. No stockouts predicted in the next 30 days.',
      urgentActions: ['Continue monitoring sales velocity for seasonal shifts'],
      seasonalAlerts: [],
      recommendations: [],
      overallHealthScore: 95,
      forecastInsight: 'Inventory is well-stocked across all product categories.',
    };
  }

  const payload = {
    overview: summary,
    atRiskProducts: atRisk.slice(0, 10).map(p => ({
      name: p.name,
      category: p.category,
      stock: p.stock,
      dailySales: p.dailyVelocity30,
      daysLeft: p.daysUntilStockout,
      risk: p.riskLevel,
      seasonalIndex: p.seasonalIndex,
    })),
    recentTrend: monthlyTrends.slice(-3),
  };

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: `You are an inventory management AI for an e-commerce store. Return ONLY valid JSON — no markdown, no code fences, no extra text. Use exactly this schema:
{"summary":"string","urgentActions":["string"],"seasonalAlerts":["string"],"recommendations":[{"product":"string","action":"reorder|promote|discount","quantity":number,"reason":"string"}],"overallHealthScore":number,"forecastInsight":"string"}`,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    });

    const text = response.content[0].text.trim()
      .replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(text);
  } catch {
    const score = Math.max(10, 100 - (summary.critical * 15 + summary.high * 8 + summary.medium * 3));
    return {
      summary: `${summary.critical} critical and ${summary.high} high-risk products detected. Immediate restocking action required.`,
      urgentActions: atRisk.slice(0, 3).map(
        p => `Reorder "${p.name}" — ${p.daysUntilStockout >= 999 ? 'out of stock' : `${p.daysUntilStockout} days left`}`
      ),
      seasonalAlerts: [],
      recommendations: atRisk.slice(0, 5).map(p => ({
        product: p.name,
        action: 'reorder',
        quantity: p.reorderQty,
        reason: `${p.daysUntilStockout >= 999 ? 'Currently out of stock' : `${p.daysUntilStockout} days until stockout`} at current velocity`,
      })),
      overallHealthScore: score,
      forecastInsight: `At current sales velocity, ${summary.critical + summary.high} products will stock out within 14 days without restocking.`,
    };
  }
}

// GET /api/inventory/predictions
const getInventoryPredictions = asyncHandler(async (req, res) => {
  const [products, dailySalesAgg, monthlyTrendsAgg] = await Promise.all([
    Product.find({ isActive: { $ne: false } })
      .select('name category stock price brand thumbnail')
      .lean(),

    // Daily sales per product, last 90 days
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 90 * 86400000) },
          status: { $nin: ['cancelled', 'refunded'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            product: '$items.product',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          units: { $sum: '$items.quantity' },
        },
      },
      {
        $group: {
          _id: '$_id.product',
          dailySales: { $push: { date: '$_id.date', units: '$units' } },
          totalUnits: { $sum: '$units' },
        },
      },
    ]),

    // Monthly aggregates, last 12 months
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 86400000) },
          status: { $nin: ['cancelled', 'refunded'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          totalUnits: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderIds: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          totalUnits: 1,
          totalRevenue: 1,
          orderCount: { $size: '$orderIds' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const salesByProduct = new Map(dailySalesAgg.map(s => [s._id.toString(), s]));

  const enriched = products.map(p => ({
    ...p,
    ...computeProductMetrics(p._id, salesByProduct, p.stock),
  }));

  enriched.sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);

  const summary = {
    total:    enriched.length,
    critical: enriched.filter(p => p.riskLevel === 'critical').length,
    high:     enriched.filter(p => p.riskLevel === 'high').length,
    medium:   enriched.filter(p => p.riskLevel === 'medium').length,
    low:      enriched.filter(p => p.riskLevel === 'low').length,
  };

  const monthlyTrends = monthlyTrendsAgg.map(m => ({
    label:        `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
    month:        m._id.month,
    year:         m._id.year,
    totalUnits:   m.totalUnits,
    totalRevenue: parseFloat(m.totalRevenue.toFixed(2)),
    orderCount:   m.orderCount,
  }));

  // Velocity chart: top 5 products that actually have sales
  const top5 = enriched
    .filter(p => (salesByProduct.get(p._id.toString())?.totalUnits || 0) > 0)
    .slice(0, 5);
  const velocityData = buildVelocityChartData(top5, salesByProduct);
  const velocityKeys = top5.map(p => p.name.length > 16 ? p.name.substring(0, 15) + '…' : p.name);

  const aiInsights = await generateAIInsights(enriched, summary, monthlyTrends);

  res.json({
    success: true,
    data: {
      predictions: enriched,
      velocityData,
      velocityKeys,
      monthlyTrends,
      aiInsights,
      summary,
      lastUpdated: new Date(),
    },
  });
});

module.exports = { getInventoryPredictions };
