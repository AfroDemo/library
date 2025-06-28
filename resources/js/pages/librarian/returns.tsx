"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Head, useForm } from "@inertiajs/react"
import AppLayout from "../../layouts/app-layout"
import { BookOpen, User, Calendar, Clock, AlertTriangle, Scan, Search } from "lucide-react"
import axios from "axios"
import type { Transaction, BreadcrumbItem } from "../../types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Librarian", href: "/librarian" },
  { title: "Returns", href: "/librarian/returns" },
]

export default function LibrarianReturns() {
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [scanInput, setScanInput] = useState("")

  const { data, setData, post, processing, reset } = useForm({
    transaction_id: "",
    return_method: "scan", // scan or manual
  })

  useEffect(() => {
    fetchActiveTransactions()
  }, [])

  const fetchActiveTransactions = async () => {
    try {
      const response = await axios.get("/api/librarian/active-transactions")
      setActiveTransactions(response.data)
    } catch (error) {
      console.error("Failed to fetch active transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim()) return

    // Try to find transaction by book ISBN or student ID
    const transaction = activeTransactions.find(
      (t) => t.book_isbn === scanInput || t.member_id === scanInput || t.id.toString() === scanInput,
    )

    if (transaction) {
      handleReturn(transaction.id)
    } else {
      alert("No active transaction found for this scan.")
    }
    setScanInput("")
  }

  const handleReturn = async (transactionId: number) => {
    if (confirm("Are you sure you want to process this return?")) {
      try {
        await axios.post(`/api/librarian/returns/${transactionId}`)
        await fetchActiveTransactions() // Refresh the list
        alert("Book returned successfully!")
      } catch (error) {
        console.error("Failed to process return:", error)
        alert("Failed to process return. Please try again.")
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = (transaction: Transaction) => {
    return new Date(transaction.due_date) < new Date()
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const filteredTransactions = activeTransactions.filter(
    (transaction) =>
      transaction.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.book_isbn?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Process Returns" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Process Returns</h1>
          <p className="text-gray-600">Scan books or manually process returns for borrowed items</p>
        </div>

        {/* Quick Scan Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Scan className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Return</h2>
          </div>

          <form onSubmit={handleScanReturn} className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan book ISBN, student ID, or enter manually..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!scanInput.trim() || processing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process Return
            </button>
          </form>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search active transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Active Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Transactions ({filteredTransactions.length})</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading active transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Student Info */}
                      <div className="flex items-center space-x-3">
                        <User className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{transaction.student_name}</div>
                          <div className="text-sm text-gray-500">{transaction.member_id}</div>
                        </div>
                      </div>

                      {/* Book Info */}
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{transaction.book_title}</div>
                          <div className="text-sm text-gray-500">{transaction.book_isbn}</div>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Borrowed: {formatDate(transaction.borrowed_at)}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className={isOverdue(transaction) ? "text-red-600" : "text-gray-600"}>
                            Due: {formatDate(transaction.due_date)}
                            {isOverdue(transaction) && (
                              <span className="ml-2 font-medium">
                                ({getDaysOverdue(transaction.due_date)} days overdue)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center space-x-4">
                      {isOverdue(transaction) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      )}

                      <button
                        onClick={() => handleReturn(transaction.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Process Return
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No active transactions found.</p>
              <p className="text-sm mt-1">All books have been returned!</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
