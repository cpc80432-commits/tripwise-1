'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export function ExportPDFButton({ trip, days }: { trip: any; days: any[] }) {
  const [loading, setLoading] = useState(false)

  const exportPDF = () => {
    setLoading(true)
    try {
      const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
  .header { background: linear-gradient(135deg, #2d7a5f, #4F9B7F); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; }
  .header h1 { margin: 0 0 8px; font-size: 24px; }
  .header p { margin: 0; opacity: 0.85; font-size: 14px; }
  .day { margin-bottom: 24px; break-inside: avoid; }
  .day-title { color: #4F9B7F; font-size: 16px; font-weight: bold; border-bottom: 2px solid #4F9B7F; padding-bottom: 6px; margin-bottom: 12px; }
  .place { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
  .place-time { font-size: 13px; color: #888; min-width: 50px; }
  .place-info { flex: 1; }
  .place-name { font-weight: bold; font-size: 14px; margin-bottom: 2px; }
  .place-addr { font-size: 12px; color: #888; }
  .place-transit { font-size: 12px; color: #4F9B7F; margin-top: 4px; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
<div class="header">
  <h1>${trip.title}</h1>
  <p>${trip.startDate} ~ ${trip.endDate} &nbsp;|&nbsp; ${trip.travelers} 人 &nbsp;|&nbsp; ${trip.currency} ${trip.budget?.toLocaleString()}</p>
</div>
${days.map(d => `
<div class="day">
  <div class="day-title">Day ${d.day}　${d.date || ""}</div>
  ${(d.itinerary || []).map((p: any) => `
  <div class="place">
    <div class="place-time">${p.time || ""}</div>
    <div class="place-info">
      <div class="place-name">${p.emoji || ""} ${p.name}</div>
      ${p.address ? `<div class="place-addr">📍 ${p.address}</div>` : ""}
      ${p.transitToNext ? `<div class="place-transit">→ ${p.transitToNext}</div>` : ""}
    </div>
  </div>`).join("")}
</div>`).join("")}
<div class="footer">由 旅智 Tripwise AI 規劃</div>
</body></html>`

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${trip.title}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('行程已下載！用瀏覽器開啟後可列印為 PDF')
    } catch(e) {
      toast.error('下載失敗')
    }
    setLoading(false)
  }

  return (
    <button onClick={exportPDF} disabled={loading}
      className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-sm hover:bg-white/30 active:scale-95 transition-all">
      <Download size={15} />
      {loading ? '處理中...' : '匯出行程'}
    </button>
  )
}
