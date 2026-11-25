function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function markdownToHtml(markdown) {
  const lines = String(markdown || '').split('\n')
  const out = []
  let inCode = false
  let codeBuf = []
  let inTable = false
  let tableRows = []

  function flushCode() {
    if (!codeBuf.length) return
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
    codeBuf = []
  }

  function flushTable() {
    if (!tableRows.length) return
    const [head, ...body] = tableRows
    const headCells = head.split('|').map((c) => c.trim()).filter(Boolean)
    if (headCells.length) {
      out.push('<table><thead><tr>')
      headCells.forEach((c) => out.push(`<th>${escapeHtml(c)}</th>`))
      out.push('</tr></thead><tbody>')
      body.forEach((row) => {
        if (/^\s*\|?[-:| ]+\|?\s*$/.test(row)) return
        const cells = row.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1 || a.length === 1)
        if (!cells.length) return
        out.push('<tr>')
        cells.forEach((c) => out.push(`<td>${escapeHtml(c)}</td>`))
        out.push('</tr>')
      })
      out.push('</tbody></table>')
    }
    tableRows = []
    inTable = false
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        inCode = false
        flushCode()
      } else {
        flushTable()
        inCode = true
      }
      continue
    }
    if (inCode) {
      codeBuf.push(line)
      continue
    }

    if (line.includes('|') && line.trim().startsWith('|')) {
      inTable = true
      tableRows.push(line)
      continue
    }
    if (inTable) flushTable()

    if (/^#\s+/.test(line)) {
      out.push(`<h1>${escapeHtml(line.replace(/^#\s+/, ''))}</h1>`)
    } else if (/^##\s+/.test(line)) {
      out.push(`<h2>${escapeHtml(line.replace(/^##\s+/, ''))}</h2>`)
    } else if (/^###\s+/.test(line)) {
      out.push(`<h3>${escapeHtml(line.replace(/^###\s+/, ''))}</h3>`)
    } else if (/^-\s+/.test(line)) {
      out.push(`<li>${escapeHtml(line.replace(/^-\s+/, ''))}</li>`)
    } else if (line.trim() === '') {
      out.push('')
    } else {
      let html = escapeHtml(line)
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
      out.push(`<p>${html}</p>`)
    }
  }

  if (inCode) flushCode()
  if (inTable) flushTable()

  return out.join('\n')
}