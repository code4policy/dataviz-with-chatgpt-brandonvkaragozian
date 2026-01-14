// dashboard.js — aggregate boston_311_2025_raw.csv by month (open_dt) and draw a monthly bar chart

const CSV = 'boston_311_2025_raw.csv';

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

function parseRow(d) {
  // parse open_dt using common format
  const parse = d3.utcParse('%Y-%m-%d %H:%M:%S');
  let dt = parse(d.open_dt);
  if (!dt) {
    // fallback: try Date.parse
    dt = d.open_dt ? new Date(d.open_dt) : null;
  }

  return { date: dt };
}

function aggregateMonthly(rows) {
  // Create months Jan..Dec 2025 to ensure consistent ordering
  const months = d3.timeMonth.range(new Date(2025, 0, 1), new Date(2026, 0, 1));
  const monthKeys = months.map(m => +m);

  const counts = new Map();
  // initialize zeros
  monthKeys.forEach(k => counts.set(k, 0));

  rows.forEach(r => {
    if (!r.date) return;
    const m = d3.timeMonth.floor(r.date);
    const key = +m;
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  });

  // convert to array of {month: Date, count}
  return months.map(m => ({ month: m, count: counts.get(+m) || 0 }));
}

function draw(data) {
  const container = document.getElementById('chart');
  container.innerHTML = '';

  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const width = Math.min(1000, container.clientWidth || 900) - margin.left - margin.right;
  const height = 420 - margin.top - margin.bottom;

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const months = data.map(d => d.month);
  const counts = data.map(d => d.count);

  const x = d3.scaleBand()
    .domain(months.map(d => +d))
    .range([0, width])
    .padding(0.12);

  const y = d3.scaleLinear()
    .domain([0, d3.max(counts) || 1]).nice()
    .range([height, 0]);

  // Bars
  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => x(+d.month))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', '#6a1b9a')
    .attr('fill-opacity', 0.95)
    .on('mousemove', (event, d) => {
      tooltip.style('opacity', 1)
        .html(`<strong>${d3.timeFormat('%b')(d.month)} ${d.month.getFullYear()}</strong><br/>Count: ${d.count.toLocaleString()}`)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY + 12) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // x-axis (month names)
  const xAxis = d3.axisBottom(x).tickFormat(d => d3.timeFormat('%b')(new Date(+d)));
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('text-anchor', 'middle');

  // y-axis
  svg.append('g').call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(',')));

  // labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .style('font-size', '12px')
    .text('Number of complaints');

  svg.append('text')
    .attr('x', -margin.left + 12)
    .attr('y', -6)
    .attr('text-anchor', 'start')
    .attr('fill', '#333')
    .style('font-size', '12px')
    .text('Month');
}

// Load and process CSV

d3.csv(CSV, parseRow).then(rows => {
  const series = aggregateMonthly(rows);
  draw(series);
}).catch(err => {
  d3.select('#chart').text('Error loading or parsing CSV. Make sure the file exists and is served over HTTP.');
});

// redraw on resize
window.addEventListener('resize', () => {
  d3.csv(CSV, parseRow).then(rows => {
    draw(aggregateMonthly(rows));
  });
});