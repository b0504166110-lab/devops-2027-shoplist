// ShopList stats service — Node.js, no external packages.
// It does not touch the database. It asks the backend for the product list
// over HTTP and calculates statistics from it: one service calling another.
const http = require('http');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5000';

async function getStats() {
  const response = await fetch(`${BACKEND_URL}/products`);
  if (!response.ok) {
    throw new Error(`backend returned ${response.status}`);
  }
  const products = await response.json();
  const round = n => Number(n.toFixed(2));
  // An item costs price × quantity (3 bottles of milk at $5 = $15)
  const cost = p => Number(p.price) * (p.quantity || 1);
  const total = products.reduce((sum, p) => sum + cost(p), 0);
  const left = products.filter(p => !p.bought);
  const top = products.reduce((a, p) => (!a || Number(p.price) > Number(a.price) ? p : a), null);

  const byCategory = {};
  for (const p of products) {
    const c = p.category || 'Other';
    byCategory[c] = byCategory[c] || { category: c, count: 0, total: 0 };
    byCategory[c].count += 1;
    byCategory[c].total += cost(p);
  }

  return {
    count: products.length,
    bought: products.length - left.length,
    total: round(total),
    leftToSpend: round(left.reduce((sum, p) => sum + cost(p), 0)),
    average: products.length ? round(total / products.length) : 0,
    max: top ? Number(top.price) : 0,
    mostExpensive: top ? { name: top.name, price: Number(top.price) } : null,
    byCategory: Object.values(byCategory)
      .map(c => ({ ...c, total: round(c.total) }))
      .sort((a, b) => b.total - a.total)
  };
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { status: 'ok' });
  }
  if (req.method === 'GET' && req.url === '/stats') {
    try {
      return send(res, 200, await getStats());
    } catch (err) {
      return send(res, 502, { error: 'backend unavailable', detail: err.message });
    }
  }
  send(res, 404, { error: 'not found' });
});

// 0.0.0.0, not localhost: inside a container, localhost is the container itself.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`stats service listening on 0.0.0.0:${PORT}, backend at ${BACKEND_URL}`);
});
