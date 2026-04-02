import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  Download,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from 'recharts'

const STORAGE_KEYS = {
  transactions: 'finance_dashboard_transactions_v1',
  theme: 'finance_dashboard_theme_v1',
}

const DEFAULT_TRANSACTIONS = [
  { id: 1, date: '2026-01-05', amount: 5200, category: 'Salary', type: 'income', description: 'Monthly salary' },
  { id: 2, date: '2026-01-10', amount: 450, category: 'Groceries', type: 'expense', description: 'Weekly grocery shopping' },
  { id: 3, date: '2026-01-14', amount: 1200, category: 'Freelance', type: 'income', description: 'Landing page project' },
  { id: 4, date: '2026-01-17', amount: 95, category: 'Transport', type: 'expense', description: 'Fuel and tolls' },
  { id: 5, date: '2026-02-05', amount: 5200, category: 'Salary', type: 'income', description: 'Monthly salary' },
  { id: 6, date: '2026-02-08', amount: 180, category: 'Utilities', type: 'expense', description: 'Electricity bill' },
  { id: 7, date: '2026-02-16', amount: 620, category: 'Health', type: 'expense', description: 'Medical checkup and tests' },
  { id: 8, date: '2026-02-20', amount: 760, category: 'Investments', type: 'income', description: 'Mutual fund return' },
  { id: 9, date: '2026-03-05', amount: 5200, category: 'Salary', type: 'income', description: 'Monthly salary' },
  { id: 10, date: '2026-03-11', amount: 1400, category: 'Rent', type: 'expense', description: 'Apartment rent share' },
  { id: 11, date: '2026-03-21', amount: 320, category: 'Entertainment', type: 'expense', description: 'Streaming and movies' },
  { id: 12, date: '2026-03-25', amount: 450, category: 'Freelance', type: 'income', description: 'UI revamp task' },
]

const CHART_COLORS = ['#1d4ed8', '#059669', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2']

const money = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const toTitleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1)

const loadFromStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function transactionsReducer(state, action) {
  switch (action.type) {
    case 'add':
      return [{ ...action.payload, id: Date.now() }, ...state]
    case 'update':
      return state.map((item) => (item.id === action.payload.id ? action.payload : item))
    case 'delete':
      return state.filter((item) => item.id !== action.payload)
    default:
      return state
  }
}

function App() {
  const formSectionRef = useRef(null)
  const dateInputRef = useRef(null)
  const [transactions, dispatch] = useReducer(
    transactionsReducer,
    DEFAULT_TRANSACTIONS,
    (initial) => loadFromStorage(STORAGE_KEYS.transactions, initial),
  )
  const [role, setRole] = useState('viewer')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [theme, setTheme] = useState(() => loadFromStorage(STORAGE_KEYS.theme, 'light'))
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [formState, setFormState] = useState({
    date: '2026-03-30',
    amount: '',
    category: '',
    type: 'expense',
    description: '',
  })

  const isAdmin = role === 'admin'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme))
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map((item) => item.category))]
    return uniqueCategories.sort((a, b) => a.localeCompare(b))
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((item) => {
      const searchValue = `${item.description} ${item.category} ${item.amount}`.toLowerCase()
      const matchesSearch = searchText ? searchValue.includes(searchText.toLowerCase()) : true
      const matchesCategory = categoryFilter === 'all' ? true : item.category === categoryFilter
      const matchesType = typeFilter === 'all' ? true : item.type === typeFilter

      return matchesSearch && matchesCategory && matchesType
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date)
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date)
      if (sortBy === 'amount-asc') return a.amount - b.amount
      return b.amount - a.amount
    })
  }, [transactions, searchText, categoryFilter, typeFilter, sortBy])

  const totalIncome = useMemo(
    () => transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
    [transactions],
  )
  const totalExpense = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    [transactions],
  )
  const totalBalance = totalIncome - totalExpense

  const monthlyTrendData = useMemo(() => {
    const grouped = transactions.reduce((acc, transaction) => {
      const key = transaction.date.slice(0, 7)
      const month = new Date(`${key}-01`).toLocaleDateString('en-US', { month: 'short' })
      if (!acc[key]) acc[key] = { month, income: 0, expense: 0, balance: 0 }

      if (transaction.type === 'income') acc[key].income += transaction.amount
      if (transaction.type === 'expense') acc[key].expense += transaction.amount
      acc[key].balance = acc[key].income - acc[key].expense

      return acc
    }, {})

    return Object.keys(grouped)
      .sort()
      .map((key) => grouped[key])
  }, [transactions])

  const expenseCategoryData = useMemo(() => {
    const grouped = transactions
      .filter((item) => item.type === 'expense')
      .reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount
        return acc
      }, {})

    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const insights = useMemo(() => {
    const highestSpending = [...expenseCategoryData].sort((a, b) => b.value - a.value)[0]
    const currentMonth = monthlyTrendData[monthlyTrendData.length - 1]
    const previousMonth = monthlyTrendData[monthlyTrendData.length - 2]

    const expenseDelta = previousMonth
      ? currentMonth?.expense - previousMonth.expense
      : 0

    return {
      highestSpendingCategory: highestSpending
        ? `${highestSpending.name} (${money(highestSpending.value)})`
        : 'No expense data',
      monthComparison: previousMonth
        ? `${expenseDelta >= 0 ? 'Up' : 'Down'} ${money(Math.abs(expenseDelta))} vs last month`
        : 'Not enough monthly data',
      observation:
        totalBalance >= 0
          ? 'You are in a positive net balance. Consider investing surplus wisely.'
          : 'Expenses are above income. Review high-spend categories.',
    }
  }, [expenseCategoryData, monthlyTrendData, totalBalance])

  const resetForm = () => {
    setEditingTransaction(null)
    setFormState({
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      category: '',
      type: 'expense',
      description: '',
    })
  }

  const startAddTransaction = () => {
    if (!isAdmin) return
    resetForm()

    // Make the Add button action obvious by taking the user to the form.
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      dateInputRef.current?.focus()
    })
  }

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction)
    setFormState({
      date: transaction.date,
      amount: String(transaction.amount),
      category: transaction.category,
      type: transaction.type,
      description: transaction.description,
    })
  }

  const handleSubmitTransaction = (event) => {
    event.preventDefault()

    if (!isAdmin) return

    const payload = {
      id: editingTransaction?.id,
      date: formState.date,
      amount: Number(formState.amount),
      category: formState.category.trim(),
      type: formState.type,
      description: formState.description.trim(),
    }

    if (!payload.date || !payload.amount || !payload.category || !payload.description) return

    if (editingTransaction) {
      dispatch({ type: 'update', payload })
    } else {
      dispatch({ type: 'add', payload })
    }

    resetForm()
  }

  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'transactions.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportAsCsv = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description']
    const rows = filteredTransactions.map((item) => [item.date, item.type, item.category, item.amount, item.description])
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'transactions.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 dark:bg-blue-900/30">
              <Wallet className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Finance Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track income, expenses, and insights</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Total Balance" value={money(totalBalance)} highlight={totalBalance >= 0} />
        <SummaryCard label="Total Income" value={money(totalIncome)} positive />
        <SummaryCard label="Total Expenses" value={money(totalExpense)} negative />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold">Balance Trend (Time Based)</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Income vs expense trend by month</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} />
                <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold">Spending Breakdown (Categorical)</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Expense distribution by category</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseCategoryData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportAsCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={exportAsJson}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Download size={16} />
              JSON
            </button>
            <button
              onClick={startAddTransaction}
              disabled={!isAdmin}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              <Plus size={16} />
              Add Transaction
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              type="text"
              placeholder="Search category, description or amount"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">Date</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                  >
                    <td className="py-3">{transaction.date}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        }`}
                      >
                        {toTitleCase(transaction.type)}
                      </span>
                    </td>
                    <td className="py-3">{transaction.category}</td>
                    <td className={`py-3 font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-600'}`}>
                      {money(transaction.amount)}
                    </td>
                    <td className="py-3">{transaction.description}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(transaction)}
                          disabled={!isAdmin}
                          className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'delete', payload: transaction.id })}
                          disabled={!isAdmin}
                          className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 dark:text-slate-400">
                    No transactions found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InsightCard title="Highest Spending Category" value={insights.highestSpendingCategory} />
        <InsightCard title="Monthly Comparison" value={insights.monthComparison} />
        <InsightCard title="Observation" value={insights.observation} />
      </section>

      <section
        ref={formSectionRef}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="mb-3 text-lg font-semibold">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
        {!isAdmin && (
          <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            Viewer role is read-only. Switch to Admin to add or edit transactions.
          </p>
        )}
        <form onSubmit={handleSubmitTransaction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            ref={dateInputRef}
            type="date"
            value={formState.date}
            onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Amount"
            value={formState.amount}
            onChange={(e) => setFormState((prev) => ({ ...prev, amount: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="text"
            placeholder="Category"
            value={formState.category}
            onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <select
            value={formState.type}
            onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="text"
            placeholder="Description"
            value={formState.description}
            onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-950"
          />
          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={!isAdmin}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              {editingTransaction ? 'Update' : 'Save'} transaction
            </button>
            {editingTransaction && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}

function SummaryCard({ label, value, highlight, positive, negative }) {
  const valueColor = highlight
    ? 'text-blue-600 dark:text-blue-400'
    : positive
      ? 'text-green-600 dark:text-green-400'
      : negative
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-900 dark:text-slate-100'

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </article>
  )
}

function InsightCard({ title, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-slate-800 dark:text-slate-100">{value}</p>
    </article>
  )
}

export default App
