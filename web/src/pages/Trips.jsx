import { useState, useEffect } from 'react'
import { api } from '../api'

const PRICE_TIERS = [400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100]

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [periods, setPeriods] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTrip, setEditTrip] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    trip_date: new Date().toISOString().split('T')[0],
    customer: '', bl_number: '', container_no: '',
    driver_id: '', price: '', unit_type: '30', notes: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [p, d] = await Promise.all([api.getPeriods(), api.getDrivers()])
      setPeriods(p)
      setDrivers(d)
      if (p.length > 0 && !selectedPeriod) setSelectedPeriod(String(p[0].id))
    } catch (err) { showToast(err.message, 'error') }
  }

  useEffect(() => { if (selectedPeriod) loadTrips() }, [selectedPeriod])

  async function loadTrips() {
    setLoading(true)
    try {
      const data = await api.getTrips(selectedPeriod)
      setTrips(data)
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openCreate() {
    setEditTrip(null)
    setForm({
      trip_date: new Date().toISOString().split('T')[0],
      customer: '', bl_number: '', container_no: '',
      driver_id: drivers.length > 0 ? String(drivers[0].id) : '',
      price: '', unit_type: '30', notes: ''
    })
    setShowForm(true)
  }

  function openEdit(trip) {
    setEditTrip(trip)
    setForm({
      trip_date: trip.trip_date,
      customer: trip.customer || '',
      bl_number: trip.bl_number || '',
      container_no: trip.container_no || '',
      driver_id: String(trip.driver_id),
      price: String(trip.price),
      unit_type: trip.unit_type || '30',
      notes: trip.notes || ''
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const data = {
      ...form,
      period_id: Number(selectedPeriod),
      driver_id: Number(form.driver_id),
      price: Number(form.price)
    }
    try {
      if (editTrip) {
        await api.updateTrip(editTrip.id, data)
        showToast('แก้ไขเที่ยววิ่งเรียบร้อย')
      } else {
        await api.createTrip(data)
        showToast('เพิ่มเที่ยววิ่งเรียบร้อย')
      }
      setShowForm(false)
      loadTrips()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleDelete(trip) {
    if (!confirm('ยืนยันลบเที่ยววิ่งนี้?')) return
    try {
      await api.deleteTrip(trip.id)
      showToast('ลบเที่ยววิ่งเรียบร้อย')
      loadTrips()
    } catch (err) { showToast(err.message, 'error') }
  }

  const totalIncome = trips.reduce((sum, t) => sum + (t.price || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h2>🚛 บันทึกเที่ยววิ่ง</h2>
        <div className="actions">
          <select className="form-control" value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)} style={{ width: 'auto' }}>
            <option value="">-- เลือกรอบ --</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.title || `${p.start_date} - ${p.end_date}`} ({p.status})
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!selectedPeriod}>
            + เพิ่มเที่ยว
          </button>
        </div>
      </div>

      {selectedPeriod && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">จำนวนเที่ยวทั้งหมด</div>
            <div className="stat-value">{trips.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">รายได้รวม</div>
            <div className="stat-value text-success">{totalIncome.toLocaleString()} ฿</div>
          </div>
        </div>
      )}

      {!selectedPeriod ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>กรุณาเลือกรอบจ่ายเงิน หรือสร้างรอบใหม่ที่หน้า "รอบจ่ายเงิน"</p>
        </div>
      ) : loading ? (
        <div className="loading">⏳ กำลังโหลด...</div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <p>ยังไม่มีเที่ยววิ่งในรอบนี้ กด "+ เพิ่มเที่ยว" เพื่อเริ่มบันทึก</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>วันที่</th>
                  <th>ลูกค้า</th>
                  <th>BL</th>
                  <th>Container</th>
                  <th>คนขับ</th>
                  <th>ราคา</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t, i) => (
                  <tr key={t.id}>
                    <td>{trips.length - i}</td>
                    <td>{t.trip_date}</td>
                    <td>{t.customer || '-'}</td>
                    <td>{t.bl_number || '-'}</td>
                    <td>{t.container_no || '-'}</td>
                    <td>
                      <strong>{t.driver_nickname || t.driver_name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.employee_code}</div>
                    </td>
                    <td><strong>{t.price?.toLocaleString()}</strong> ฿</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>🗑️</button>
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
              <h3>{editTrip ? '✏️ แก้ไขเที่ยววิ่ง' : '➕ เพิ่มเที่ยววิ่ง'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>วันที่ *</label>
                    <input type="date" className="form-control" value={form.trip_date}
                      onChange={e => setForm({ ...form, trip_date: e.target.value })} required />
                  </div>
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
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ราคาต่อเที่ยว *</label>
                    <select className="form-control" value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })} required>
                      <option value="">-- เลือกราคา --</option>
                      {PRICE_TIERS.map(p => (
                        <option key={p} value={p}>{p.toLocaleString()} ฿</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ลูกค้า</label>
                    <input type="text" className="form-control" value={form.customer}
                      onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="ชื่อลูกค้า" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>BL Number</label>
                    <input type="text" className="form-control" value={form.bl_number}
                      onChange={e => setForm({ ...form, bl_number: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Container No.</label>
                    <input type="text" className="form-control" value={form.container_no}
                      onChange={e => setForm({ ...form, container_no: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>หมายเหตุ</label>
                  <input type="text" className="form-control" value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">{editTrip ? 'บันทึก' : 'เพิ่ม'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
