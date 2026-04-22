const fmt = (n) => {
  n = Number(n || 0);
  if (Math.abs(n) >= 1e6) return "$" + (n/1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return "$" + (n/1e3).toFixed(1) + "k";
  return "$" + n.toFixed(0);
};
const short = (a) => a ? a.slice(0,6) + "..." + a.slice(-4) : "—";

let traders = [];

async function load() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("content").style.display = "none";
  document.getElementById("error").style.display = "none";
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error("Server error " + res.status);
    const raw = await res.json();
    const list = (raw.data || raw || []).slice(0, 30);
    traders = list.map((u, i) => ({
      rank: i + 1,
      address: u.proxyWallet || u.address || "—",
      displayName: u.userName || u.pseudonym || null,
      profit: Number(u.pnl || u.profit || 0),
      volume: Number(u.vol || u.volume || 0),
      verified: !!u.verifiedBadge,
      xHandle: u.xUsername || null,
    }));
    render();
  } catch (e) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMsg").textContent = e.message;
  }
}

function render() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("content").style.display = "block";
  const stats = document.getElementById("stats");
  const totalProfit = traders.reduce((s,t) => s + t.profit, 0);
  const totalVolume = traders.reduce((s,t) => s + t.volume, 0);
  stats.innerHTML = `
    <div class="stat"><div class="stat-label">WHALES</div><div class="stat-value">${traders.length}</div></div>
    <div class="stat"><div class="stat-label">TOTAL PROFIT</div><div class="stat-value">${fmt(totalProfit)}</div></div>
    <div class="stat"><div class="stat-label">TOTAL VOLUME</div><div class="stat-value">${fmt(totalVolume)}</div></div>
  `;
  const container = document.getElementById("traders");
  container.innerHTML = traders.map(t => `
    <div class="trader" onclick="select('${t.address}')">
      <span class="rank ${t.rank<=3?'gold':''}">${t.rank<=3?['🥇','🥈','🥉'][t.rank-1]:'#'+t.rank}</span>
      <span class="wallet">${t.displayName ? '<strong style="color:#e8eaf0">'+t.displayName+'</strong>'+(t.verified?' ✓':'')+'<br>' : ''}<small>${short(t.address)}</small></span>
      <span class="profit ${t.profit>=0?'pos':'neg'}">${t.profit>=0?'+':''}${fmt(t.profit)}</span>
      <span style="color:#7a8fa8">${fmt(t.volume)}</span>
      <span style="color:#7a8fa8">${t.xHandle?'@'+t.xHandle:'—'}</span>
    </div>
    <div id="pos-${t.address}" class="positions" style="display:none"></div>
  `).join("");
}

async function select(address) {
  const box = document.getElementById("pos-" + address);
  if (box.style.display === "block") { box.style.display = "none"; return; }
  document.querySelectorAll(".positions").forEach(el => el.style.display = "none");
  box.style.display = "block";
  box.innerHTML = '<div style="color:#4a6080;text-align:center;padding:20px">Loading...</div>';
  try {
    const r = await fetch("/api/positions/" + address);
    const raw = await r.json();
    const positions = (raw.data || raw || []).slice(0, 20);
    if (!positions.length) { box.innerHTML = '<div style="color:#4a6080;text-align:center;padding:20px">No open positions</div>'; return; }
    box.innerHTML = positions.map(p => {
      const side = p.outcome || "YES";
      const price = Number(p.curPrice || p.avgPrice || 0);
      const size = Number(p.currentValue || p.size || 0);
      const pnl = Number(p.cashPnl || p.pnl || 0);
      const url = p.marketSlug ? `https://polymarket.com/event/${p.marketSlug}` : "https://polymarket.com";
      return `
        <div class="position">
          <div class="position-title">${p.title || p.market || '—'}</div>
          <div class="position-meta">
            <span class="pill ${side==='YES'?'yes':'no'}">${side}</span>
            <span>PRICE: ${(price*100).toFixed(0)}¢</span>
            <span>SIZE: ${fmt(size)}</span>
            <span>P&L: ${pnl>=0?'+':''}${fmt(pnl)}</span>
          </div>
          <a class="copy-btn" href="${url}" target="_blank">↗ COPY TRADE</a>
        </div>
      `;
    }).join("");
  } catch {
    box.innerHTML = '<div style="color:#ff4d6d;text-align:center;padding:20px">Failed to load</div>';
  }
}

load();
setInterval(load, 60000);
