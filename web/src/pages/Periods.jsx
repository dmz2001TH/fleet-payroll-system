import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Periods() {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPeriod, setEditPeriod] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ start_date: '', end_date: '', title: '', status: 'draft' })

  useEffect(() => { loadPeriods() }, [])

  async function loadPeriods() {
    setLoading(true)
    try {
      const data = await api.getPeriods()
      setPeriods(data)
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openCreate() {
    setEditPeriod(null)
    // Default to current 10-day period
    const today = new Date()
    const day = today.getDate()
    let start, end
    if (day <= 10) {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 21)
      end = new Date(today.getFullYear(), today.getMonth(), 10)
    } else if (day <= 20) {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth(), 10)
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 11)
      end = new Date(today.getFullYear(), today.getMonth(), 20)
    }
    const fmt = d => d.toISOString().split('T')[0]
    setForm({
      start_date: fmt(start), end_date: fmt(end),
      title: `CUT OFF ${fmt(start)} - ${fmt(end)}`, status: 'draft'
    })
    setShowForm(true)
  }

  function openEdit(period) {
    setEditPeriod(period)
    setForm({
      start_date: period.start_date,
      end_date: period.end_date,
      title: period.title || '',
      status: period.status || 'draft'
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editPeriod) {
        await api.updatePeriod(editPeriod.id, form)
        showToast('แก้ไขรอบเรียบร้อย')
      } else {
        await api.createPeriod(form)
        showToast('สร้างรอบใหม่เรียบร้อย')
      }
      setShowForm(false)
      loadPeriods()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleStatusChange(period, newStatus) {
    try {
      await api.updatePeriod(period.id, { status: newStatus })
      showToast(`เปลี่ยนสถานะเป็น ${newStatus} แล้ว`)
      loadPeriods()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleDelete(period) {
    if (!confirm('ยืนยันลบรอบนี้? เที่ยววิ่งที่เกี่ยวข้องจะถูกลบด้วย')) return
    try {
      await api.deletePeriod(period.id)
      showToast('ลบรอบเรียบร้อย')
      loadPeriods()
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div>
      <div className="page-header">
        <h2>📅 รอบจ่ายเงิน (Cut-off Periods)</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ สร้างรอบใหม่</button>
      </div>

      {loading ? (
        <div className="loading">⏳ กำลังโหลด...</div>
      ) : periods.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>ยังไม่มีรอบจ่ายเงิน กด "สร้างรอบใหม่" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อรอบ</th>
                  <th>วันเริ่ม</th>
                  <th>วันสิ้นสุด</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td><strong>{p.title || `${p.start_date} - ${p.end_date}`}</strong></td>
                    <td>{p.start_date}</td>
                    <td>{p.end_date}</td>
                    <td>
                      <select className={`badge badge-${p.status}`}
                        value={p.status}
                        onChange={e => handleStatusChange(p, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}
                      >
                        <option value="draft">draft</option>
                        <option value="submitted">submitted</option>
                        <option value="approved">approved</option>
                        <option value="finalized">finalized</option>
                      </select>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editPeriod ? '✏️ แก้ไขรอบ' : '➕ สร้างรอบใหม่'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>ชื่อรอบ</label>
                  <input type="text" className="form-control" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="CUT OFF 11 MAR - 20 MAR 2026" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>วันเริ่ม *</label>
                    <input type="date" className="form-control" value={form.start_date}
                      onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>วันสิ้นสุด *</label>
                    <input type="date" className="form-control" value={form.end_date}
                      onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                  </div>
                </div>
                {editPeriod && (
                  <div className="form-group">
                    <label>สถานะ</label>
                    <select className="form-control" value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="finalized">Finalized</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">{editPeriod ? 'บันทึก' : 'สร้าง'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
