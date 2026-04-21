import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([])
  const [periods, setPeriods] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editAdj, setEditAdj] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    driver_id: '', type: 'allowance', amount: '', reason: ''
  })

  useEffect(() => {
    Promise.all([api.getPeriods(), api.getDrivers()]).then(([p, d]) => {
      setPeriods(p)
      setDrivers(d)
      if (p.length > 0 && !selectedPeriod) setSelectedPeriod(String(p[0].id))
    })
  }, [])

  useEffect(() => {
    if (selectedPeriod) loadAdjustments()
  }, [selectedPeriod])

  async function loadAdjustments() {
    setLoading(true)
    try {
      const data = await api.getAdjustments(selectedPeriod)
      setAdjustments(data)
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openCreate(type = 'allowance') {
    setEditAdj(null)
    setForm({
      driver_id: drivers.length > 0 ? String(drivers[0].id) : '',
      type, amount: '', reason: ''
    })
    setShowForm(true)
  }

  function openEdit(adj) {
    setEditAdj(adj)
    setForm({
      driver_id: String(adj.driver_id),
      type: adj.type,
      amount: String(adj.amount),
      reason: adj.reason || ''
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const data = {
      period_id: Number(selectedPeriod),
      driver_id: Number(form.driver_id),
      type: form.type,
      amount: Number(form.amount),
      reason: form.reason || null
    }
    try {
      if (editAdj) {
        await api.updateAdjustment(editAdj.id, data)
        showToast('แก้ไขเรียบร้อย')
      } else {
        await api.createAdjustment(data)
        showToast('เพิ่มรายการเรียบร้อย')
      }
      setShowForm(false)
      loadAdjustments()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleDelete(adj) {
    if (!confirm('ยืนยันลบรายการนี้?')) return
    try {
      await api.deleteAdjustment(adj.id)
      showToast('ลบรายการเรียบร้อย')
      loadAdjustments()
    } catch (err) { showToast(err.message, 'error') }
  }

  const allowances = adjustments.filter(a => a.type === 'allowance')
  const deductions = adjustments.filter(a => a.type === 'deduction')
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0)
  const totalDeductions = deductions.reduce((sum, a) => sum + a.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h2>💰 เงินพิเศษ (เพิ่ม/หัก)</h2>
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
          <button className="btn btn-success" onClick={() => openCreate('allowance')} disabled={!selectedPeriod}>
            + เพิ่มเงิน
          </button>
          <button className="btn btn-danger" onClick={() => openCreate('deduction')} disabled={!selectedPeriod}>
            - หักเงิน
          </button>
        </div>
      </div>

      {selectedPeriod && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">รวมเพิ่ม</div>
            <div className="stat-value text-primary">+{totalAllowances.toLocaleString()} ฿</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">รวมหัก</div>
            <div className="stat-value text-danger">-{totalDeductions.toLocaleString()} ฿</div>
          </div>
        </div>
      )}

      {!selectedPeriod ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <p>กรุณาเลือกรอบจ่ายเงิน</p>
        </div>
      ) : loading ? (
        <div className="loading">⏳ กำลังโหลด...</div>
      ) : (
        <>
          {allowances.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ color: 'var(--primary)' }}>
                💵 เงินเพิ่มพิเศษ (Allowance)
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>รหัส</th>
                      <th>ชื่อ</th>
                      <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                      <th>เหตุผล</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowances.map((a, i) => (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td>{a.employee_code}</td>
                        <td><strong>{a.nickname || a.full_name}</strong></td>
                        <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>
                          +{a.amount.toLocaleString()} ฿
                        </td>
                        <td>{a.reason || '-'}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {deductions.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ color: 'var(--danger)' }}>
                💸 หักเงิน (Deduction)
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>รหัส</th>
                      <th>ชื่อ</th>
                      <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                      <th>เหตุผล</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductions.map((a, i) => (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td>{a.employee_code}</td>
                        <td><strong>{a.nickname || a.full_name}</strong></td>
                        <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>
                          -{a.amount.toLocaleString()} ฿
                        </td>
                        <td>{a.reason || '-'}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adjustments.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <p>ยังไม่มีรายการในรอบนี้</p>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editAdj ? '✏️ แก้ไขรายการ' : (form.type === 'allowance' ? '💵 เพิ่มเงินพิเศษ' : '💸 หักเงิน')}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>คนขับ *</label>
                    <select className="form-control" value={form.driver_id}
                      onChange={e => setForm({ ...form, driver_id: e.target.value })} required>
                      <option value="">-- เลือกคนขับ --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.employee_code} - {d.nickname || d.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ประเภท *</label>
                    <select className="form-control" value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="allowance">เพิ่ม (Allowance)</option>
                      <option value="deduction">หัก (Deduction)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>จำนวนเงิน (บาท) *</label>
                  <input type="number" className="form-control" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} required min="1" />
                </div>
                <div className="form-group">
                  <label>เหตุผล</label>
                  <input type="text" className="form-control" value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    placeholder="เช่น ค่าน้ำมัน, หักประกันสังคม" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">{editAdj ? 'บันทึก' : 'เพิ่ม'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
