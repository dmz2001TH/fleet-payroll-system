import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editDriver, setEditDriver] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    employee_code: '', full_name: '', nickname: '', phone: '', vehicle_plate: '', unit_type: '30'
  })

  useEffect(() => { loadDrivers() }, [])

  async function loadDrivers() {
    setLoading(true)
    try {
      const data = search
        ? await api.searchDrivers(search)
        : await api.getDrivers()
      setDrivers(data)
    } catch (err) { showToast(err.message, 'error') }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(loadDrivers, 300)
    return () => clearTimeout(timer)
  }, [search])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openCreate() {
    setEditDriver(null)
    setForm({ employee_code: '', full_name: '', nickname: '', phone: '', vehicle_plate: '', unit_type: '30' })
    setShowForm(true)
  }

  function openEdit(driver) {
    setEditDriver(driver)
    setForm({
      employee_code: driver.employee_code,
      full_name: driver.full_name,
      nickname: driver.nickname || '',
      phone: driver.phone || '',
      vehicle_plate: driver.vehicle_plate || '',
      unit_type: driver.unit_type || '30'
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editDriver) {
        await api.updateDriver(editDriver.id, form)
        showToast('แก้ไขข้อมูลเรียบร้อย')
      } else {
        await api.createDriver(form)
        showToast('เพิ่มคนขับเรียบร้อย')
      }
      setShowForm(false)
      loadDrivers()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleDelete(driver) {
    if (!confirm(`ยืนยันลบ ${driver.full_name}?`)) return
    try {
      await api.deleteDriver(driver.id)
      showToast('ลบคนขับเรียบร้อย')
      loadDrivers()
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div>
      <div className="page-header">
        <h2>👥 รายชื่อคนขับ ({drivers.length})</h2>
        <div className="actions">
          <input type="text" className="form-control" placeholder="🔍 ค้นหาชื่อ/เบอร์โทร..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn btn-primary" onClick={openCreate}>+ เพิ่มคนขับ</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">⏳ กำลังโหลด...</div>
      ) : drivers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>{search ? 'ไม่พบคนขับที่ค้นหา' : 'ยังไม่มีรายชื่อคนขับ'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชื่อเล่น</th>
                  <th>เบอร์โทร</th>
                  <th>ทะเบียนรถ</th>
                  <th>ประเภท</th>
                  <th>LINE</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.employee_code}</strong></td>
                    <td>{d.full_name}</td>
                    <td>{d.nickname || '-'}</td>
                    <td>{d.phone || '-'}</td>
                    <td>{d.vehicle_plate || '-'}</td>
                    <td><span className="badge badge-draft">{d.unit_type} unit</span></td>
                    <td>{d.line_user_id ? '✅' : '❌'}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}>🗑️</button>
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
              <h3>{editDriver ? '✏️ แก้ไขข้อมูลคนขับ' : '➕ เพิ่มคนขับ'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>รหัสพนักงาน *</label>
                    <input type="text" className="form-control" value={form.employee_code}
                      onChange={e => setForm({ ...form, employee_code: e.target.value })}
                      placeholder="NPC24XXX" required disabled={!!editDriver} />
                  </div>
                  <div className="form-group">
                    <label>ชื่อ-นามสกุล *</label>
                    <input type="text" className="form-control" value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Mr.Firstname Lastname" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ชื่อเล่น</label>
                    <input type="text" className="form-control" value={form.nickname}
                      onChange={e => setForm({ ...form, nickname: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>เบอร์โทร</label>
                    <input type="text" className="form-control" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0XX-XXX-XXXX" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ทะเบียนรถ</label>
                    <input type="text" className="form-control" value={form.vehicle_plate}
                      onChange={e => setForm({ ...form, vehicle_plate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ประเภทรถ</label>
                    <select className="form-control" value={form.unit_type}
                      onChange={e => setForm({ ...form, unit_type: e.target.value })}>
                      <option value="30">30 Unit</option>
                      <option value="20">20 Unit</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">{editDriver ? 'บันทึก' : 'เพิ่ม'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
