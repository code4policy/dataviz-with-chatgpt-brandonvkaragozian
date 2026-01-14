// script.js — renders a horizontal bar chart of the top 10 reasons using D3 v7

const csvFile = 'boston_311_2025_by_reason.csv';

// Utility: create a tooltip
const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('position', 'absolute')
  .style('pointer-events', 'none')
  .style('opacity', 0);

let loadedData = [];
let showAll = false;

function drawChart(data, showAllFlag = false) {
  // Convert Count to number and sort descending
  data.forEach(d => d.Count = +d.Count);
  data.sort((a, b) => b.Count - a.Count);
  const items = showAllFlag ? data : data.slice(0, 10);

  const container = document.getElementById('chart');
  container.innerHTML = '';

  const margin = { top: 20, right: 30, bottom: 60, left: 220 };
  const width = Math.min(1000, container.clientWidth || 900) - margin.left - margin.right;
  const innerHeight = Math.max(400, items.length * 36);

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', innerHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const y = d3.scaleBand()
    .domain(items.map(d => d.reason))
    .range([0, innerHeight])
    .padding(0.12);

  // Use the global maximum (across the full data) so bar lengths are comparable
  const globalMax = d3.max(data, d => d.Count) || 0;
  // Add a small padding so the largest bar does not touch the axis edge
  const upper = globalMax === 0 ? 1 : globalMax * 1.05;
  const x = d3.scaleLinear()
    .domain([0, upper]).nice()
    .range([0, width]);

  const color = d3.scaleSequential().domain([0, items.length]).interpolator(d3.interpolatePurples);

  svg.selectAll('rect')
    .data(items)
    .enter()
    .append('rect')
    .attr('y', d => y(d.reason))
    .attr('x', 0)
    .attr('height', y.bandwidth())
    .attr('width', d => x(d.Count))
    .attr('fill', (d, i) => color(i))
    .attr('fill-opacity', 0.95)
    .attr('stroke', '#4b0082')
    .attr('stroke-opacity', 0.9)
    .attr('stroke-width', 0.6)
    .on('mousemove', (event, d) => {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.reason}</strong><br/>Count: ${d.Count.toLocaleString()}`)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY + 12) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // x-axis: for small globalMax use integer ticks (show each integer up to max), otherwise use a few ticks with comma formatting
  const xAxis = d3.axisBottom(x)
    .tickFormat(globalMax <= 10 ? d3.format('d') : d3.format(','));

  if (globalMax <= 10) {
    // show integer ticks 0..globalMax
    xAxis.ticks(globalMax + 1);
  } else {
    xAxis.ticks(5);
  }

  svg.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis);

  // y-axis
  svg.append('g')
    .call(d3.axisLeft(y));

  // x-axis label
  svg.append('text')
    .attr('class', 'x-label')
    .attr('x', width / 2)
    .attr('y', innerHeight + margin.bottom - 18)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333')
    .style('font-size', '12px')
    .text('Call volume');

  // y-axis label
  svg.append('text')
    .attr('class', 'y-label')
    .attr('x', -margin.left + 40)
    .attr('y', innerHeight / 2)
    .attr('transform', `rotate(-90, ${-margin.left + 40}, ${innerHeight / 2})`)
    .attr('text-anchor', 'middle')
    .text('reason');
}

// Load data and draw

d3.csv(csvFile).then(data => {
  loadedData = data;
  const btn = d3.select('#toggle-btn');
  btn.on('click', () => {
    showAll = !showAll;
    btn.text(showAll ? 'Show top 10' : 'Show full chart');
    drawChart(loadedData, showAll);
  });

  drawChart(loadedData, showAll);
}).catch(err => {
  d3.select('#chart').text('Error loading data — check that "boston_311_2025_by_reason.csv" is present and served from a web server.');
});

// Optional: redraw on window resize for basic responsiveness
window.addEventListener('resize', () => {
  if (loadedData.length) drawChart(loadedData, showAll);
});
