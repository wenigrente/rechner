export function sparkboxHTML(
  id:       string,
  label:    string,
  value:    string,
  bgColor:  string = '#F8F8F8',
): string {
  return `
    <div class="sparkbox" style="background:${bgColor}">
      <div class="sparkbox-value">${value}</div>
      <div class="sparkbox-label">${label}</div>
      <div id="spark-${id}" class="sparkbox-chart"></div>
    </div>
  `
}

export function metricCard(label: string, value: string, delta?: string): string {
  const deltaHTML = delta
    ? `<div class="metric-delta">${delta}</div>`
    : ''
  return `
    <div class="metric-card">
      <div class="metric-value">${value}</div>
      <div class="metric-label">${label}</div>
      ${deltaHTML}
    </div>
  `
}

export function alertHTML(type: 'success' | 'error' | 'info' | 'warning', text: string): string {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }
  return `<div class="alert alert-${type}">${icons[type]} ${text}</div>`
}

export function loadingHTML(text = 'Loading…'): string {
  return `<div class="loading"><div class="spinner"></div> ${text}</div>`
}
