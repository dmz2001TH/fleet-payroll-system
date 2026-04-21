import { useState, useEffect } from 'react'
import { api } from '../api'

const PRICE_TIERS = [400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100]

export default function Summary() {
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [expandedDriver, setExpandedDriver] = useState(null)

  useEffect(() => { api.getPeriods().then(setPeriods) }, [])

  useEffect(() => {
    if (selectedPeriod) loadSummary()
  }, [selectedPeriod])

  async function loadSummary() {
    setLoading(true)
    try {
      const data = await api.getSummary(selectedPeriod)
      setSummary(data)
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleRecalc() {
    try {
      await api.recalculateSummary(selectedPeriod)
      showToast('คำนวณใหม่เรียบร้อย')
      loadSummary()
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div>
      <div className="page-header">
        <h2>📊 สรุปเงินเดือน</h2>
        <div className="actions">
          <select className="form-control" value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)} style={{ width: 'auto' }}>
            <option value="">-- เลือกรอบ --</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.title || `${p.start_date} - ${p.end_date}`}
              </option>
            ))}
          </select>
          {selectedPeriod && (
            <button className="btn btn-outline" onClick={handleRecalc}>🔄 คำนวณใหม่</button>
          )}
        </div>
      </div>

      {!selectedPeriod ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>กรุณาเลือกรอบจ่ายเงินเพื่อดูสรุป</p>
        </div>
      ) : loading ? (
        <div className="loading">⏳ กำลังคำนวณ...</div>
      ) : !summary ? (
        <div className="loading">ไม่พบข้อมูล</div>
      ) : (
        <>
          {summary.period && (
            <div className="card" style={{ marginBottom: 16, background: 'var(--primary-light)', border: 'none' }}>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--primary-dark)' }}>
                  {summary.period.title || `CUT OFF ${summary.period.start_date} - ${summary.period.end_date}`}
                </h3>
                <span className={`badge badge-${summary.period.status}`}>{summary.period.status}</span>
              </div>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">เที่ยวทั้งหมด</div>
              <div className="stat-value">{summary.grandTotal.trips}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">รายได้รวม</div>
              <div className="stat-value text-success">{summary.grandTotal.income.toLocaleString()} ฿</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">เพิ่มพิเศษ</div>
              <div className="stat-value text-primary">+{summary.grandTotal.allowances.toLocaleString()} ฿</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">หัก</div>
              <div className="stat-value text-danger">-{summary.grandTotal.deductions.toLocaleString()} ฿</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">สุทธิรวม</div>
              <div className="stat-value text-success">{summary.grandTotal.net.toLocaleString()} ฿</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              สรุปรายคน
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>รหัส</th>
                    <th>ชื่อ</th>
                    {PRICE_TIERS.map(p => <th key={p} style={{ textAlign: 'center', fontSize: 10 }}>{p}</th>)}
                    <th style={{ textAlign: 'center' }}>เที่ยว</th>
                    <th style={{ textAlign: 'right' }}>รายได้</th>
                    <th style={{ textAlign: 'right' }}>เพิ่ม</th>
                    <th style={{ textAlign: 'right' }}>หัก</th>
                    <th style={{ textAlign: 'right' }}>สุทธิ</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.summaries.filter(s => s.total_trips > 0 || s.total_allowances > 0 || s.total_deductions > 0).map((s, i) => (
                    <tr key={s.driver_id}>
                      <td>{i + 1}</td>
                      <td>{s.employee_code}</td>
                      <td><strong>{s.nickname || s.full_name}</strong></td>
                      {PRICE_TIERS.map(p => (
                        <td key={p} style={{ textAlign: 'center' }}>
                          {s.trip_counts[p] > 0 ? s.trip_counts[p] : '-'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{s.total_trips}</td>
                      <td style={{ textAlign: 'right' }}>{s.total_income.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                        {s.total_allowances > 0 ? `+${s.total_allowances.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                        {s.total_deductions > 0 ? `-${s.total_deductions.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                        {s.net_income.toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--gray-100)', fontWeight: 700 }}>
                    <td colSpan={3}>รวมทั้งหมด</td>
                    {PRICE_TIERS.map(p => {
                      const total = summary.summaries.reduce((sum, s) => sum + (s.trip_counts[p] || 0), 0)
                      return <td key={p} style={{ textAlign: 'center' }}>{total > 0 ? total : '-'}</td>
                    })}
                    <td style={{ textAlign: 'center' }}>{summary.grandTotal.trips}</td>
                    <td style={{ textAlign: 'right' }}>{summary.grandTotal.income.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--primary)' }}>+{summary.grandTotal.allowances.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{summary.grandTotal.deductions.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{summary.grandTotal.net.toLocaleString()} ฿</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
