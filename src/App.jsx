
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const emptyForm = {
  food_name: '',
  description: '',
  quantity: '1',
  unit: 'pieces',
  pickup_location: '',
  expiry_date: '',
}

export default function App() {
  const [donations, setDonations] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadDonations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Unable to load donations: ' + error.message)
    } else {
      setDonations(data || [])
      setMessage('')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDonations()
  }, [])

  async function addDonation(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('donations').insert([{
      food_name: form.food_name.trim(),
      description: form.description.trim() || null,
      quantity: Number(form.quantity),
      unit: form.unit,
      pickup_location: form.pickup_location.trim(),
      expiry_date: form.expiry_date || null,
      status: 'available',
    }])

    if (error) {
      setMessage('Unable to add donation: ' + error.message)
    } else {
      setForm(emptyForm)
      setMessage('Food donation added successfully!')
      await loadDonations()
    }

    setSaving(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('donations')
      .update({ status })
      .eq('id', id)

    if (error) {
      setMessage('Unable to update status: ' + error.message)
    } else {
      setMessage('Donation status updated.')
      await loadDonations()
    }
  }

  
  async function deleteDonation(id, foodName) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${foodName}"?`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage('Unable to delete donation: ' + error.message)
    } else {
      setMessage('Donation deleted successfully.')
      await loadDonations()
    }
  }
  
  const visibleDonations = donations.filter((item) => {
    const term = search.toLowerCase()
    const matchesSearch =
      (item.food_name || '').toLowerCase().includes(term) ||
      (item.pickup_location || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term)

    return matchesSearch &&
      (filter === 'all' || item.status === filter)
  })

  const available = donations.filter(d => d.status === 'available').length
  const reserved = donations.filter(d => d.status === 'reserved').length
  const completed = donations.filter(d => d.status === 'completed').length

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600'

  const buttonClass =
    'rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-emerald-800 px-5 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Surplus Food</h1>
          <p className="mt-2 text-emerald-100">
            Food Donation Management System
          </p>
          <span className="mt-3 inline-block rounded-full bg-emerald-700 px-3 py-1 text-sm">
            Community Demo
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['Available', available],
            ['Reserved', reserved],
            ['Completed', completed],
          ].map(([label, count]) => (
            <div key={label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label} Donations</p>
              <p className="mt-2 text-3xl font-bold">{count}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Add Food Donation</h2>

          <form onSubmit={addDonation} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Food Name *</span>
              <input
                required
                className={inputClass}
                value={form.food_name}
                onChange={e => setForm({ ...form, food_name: e.target.value })}
                placeholder="e.g. Bread"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Quantity *</span>
              <input
                required
                min="1"
                type="number"
                className={inputClass}
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Unit</span>
              <select
                className={inputClass}
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
              >
                <option value="pieces">Pieces</option>
                <option value="packs">Packs</option>
                <option value="boxes">Boxes</option>
                <option value="kilograms">Kilograms</option>
                <option value="meals">Meals</option>
                <option value="bottles">Bottles</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Pickup Location *</span>
              <input
                required
                className={inputClass}
                value={form.pickup_location}
                onChange={e => setForm({ ...form, pickup_location: e.target.value })}
                placeholder="Barangay or street"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Expiry Date</span>
              <input
                type="date"
                className={inputClass}
                value={form.expiry_date}
                onChange={e => setForm({ ...form, expiry_date: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Description</span>
              <textarea
                rows="2"
                className={inputClass}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the food"
              />
            </label>

            <div className="sm:col-span-2">
              <button className={buttonClass} disabled={saving}>
                {saving ? 'Adding...' : 'Add Donation'}
              </button>
            </div>
          </form>

          {message && (
            <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
              {message}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Food Donations</h2>

          <input
            type="search"
            className={`${inputClass} mb-4`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search food, description, or pickup location..."
          />

          <div className="mb-5 flex flex-wrap gap-2">
            {[
              ['all', 'All'],
              ['available', 'Available'],
              ['reserved', 'Reserved'],
              ['completed', 'Completed'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  filter === value
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="rounded-xl bg-white p-6">Loading donations...</p>
          ) : visibleDonations.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
              No donations found. Try another search or add a donation.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleDonations.map(item => (
                <article key={item.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{item.food_name}</h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Quantity: {item.quantity} {item.unit}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pickup: {item.pickup_location}
                  </p>

                  {item.expiry_date && (
                    <p className="mt-1 text-sm text-slate-600">
                      Expiry: {item.expiry_date}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-3 text-sm">{item.description}</p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.status === 'available' && (
                      <button
                        className={buttonClass}
                        onClick={() => updateStatus(item.id, 'reserved')}
                      >
                        Reserve Food
                      </button>
                    )}

                    {item.status === 'reserved' && (
                      <button
                        className={buttonClass}
                        onClick={() => updateStatus(item.id, 'completed')}
                      >
                        Mark Completed
                      </button>
                    )}

                    {item.status === 'reserved' && (
                      <button
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                        onClick={() => updateStatus(item.id, 'available')}
                      >
                        Mark Available
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="pb-4 text-center text-sm text-slate-500">
          Surplus Food Donation Management System
        </footer>
      </main>
    </div>
  )
}
