"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { Head } from "@inertiajs/react"
import AppLayout from "../../layouts/app-layout"
import { User, Scan, RefreshCw, CheckCircle, AlertCircle, BookOpen, Clock, TrendingUp } from "lucide-react"
import axios from "axios"
import type { Student, Book, ToastMessage, PageProps, DashboardStats, BreadcrumbItem } from "../../types"

type ScanStep = "student" | "book"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Librarian", href: "/librarian" },
  { title: "Dashboard", href: "/librarian/dashboard" },
]

export default function LibrarianDashboard() {
  const { auth } = usePage<PageProps>().props

  // Scanning state
  const [scanStep, setScanStep] = useState<ScanStep>("student")
  const [scanInput, setScanInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({})
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDashboardStats()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanStep])

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/api/librarian/dashboard-stats")
      setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  const showToast = (type: ToastMessage["type"], message: string) => {
    const id = Date.now().toString()
    const toast: ToastMessage = { type, message, id }

    setToasts((prev) => [...prev, toast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim() || isLoading) return

    setIsLoading(true)

    try {
      if (scanStep === "student") {
        const response = await axios.get(`/students/${scanInput.trim()}`)
        setStudent(response.data)
        setScanStep("book")
        setScanInput("")
        showToast("success", `Student ${response.data.name} loaded successfully`)
      } else {
        const bookResponse = await axios.get(`/books/${scanInput.trim()}`)
        const bookData: Book = bookResponse.data

        if (!bookData.available) {
          showToast("error", "This book is currently unavailable")
          setScanInput("")
          return
        }

        setBook(bookData)

        await axios.post("/transactions", {
          student_id: student?.student_id,
          isbn: bookData.isbn,
        })

        showToast("success", `Book "${bookData.title}" borrowed successfully`)
        handleReset()
        fetchDashboardStats() // Refresh stats after transaction
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || (scanStep === "student" ? "Student not found" : "Book not found")
      showToast("error", errorMessage)
      setScanInput("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setScanStep("student")
    setScanInput("")
    setStudent(null)
    setBook(null)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Librarian Dashboard" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Welcome & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome, {auth.user.name}</h1>
            <p className="text-gray-600">
              Manage book transactions and assist library users with their borrowing needs.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isStatsLoading ? "..." : stats.totalTransactions || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                <p className="text-2xl font-bold text-gray-900">{isStatsLoading ? "..." : stats.overdueBooks || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Scanning Interface */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scanner Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Scan className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {scanStep === "student" ? "Scan Student ID" : "Scan Book ISBN"}
                  </h2>
                </div>

                <form onSubmit={handleScanSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder={
                        scanStep === "student" ? "Scan or enter student ID..." : "Scan or enter book ISBN..."
                      }
                      className="w-full px-4 py-3 text-lg font-mono border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={!scanInput.trim() || isLoading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Processing..." : "Scan"}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                {/* Step Indicator */}
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <div
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                      scanStep === "student" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${scanStep === "student" ? "bg-blue-600" : "bg-green-600"}`}
                    ></span>
                    <span>Step 1: Student ID</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                      scanStep === "book" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${scanStep === "book" ? "bg-blue-600" : "bg-gray-400"}`}
                    ></span>
                    <span>Step 2: Book ISBN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Cards Section */}
            <div className="space-y-6">
              {/* Student Information Card */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                </div>

                {student ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student ID:</span>
                      <span className="font-medium">{student.student_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{student.email}</span>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Student verified</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Scan a student ID to view information</p>
                  </div>
                )}
              </div>

              {/* Book Information Card */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Book Information</h3>
                </div>

                {book ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ISBN:</span>
                      <span className="font-medium">{book.isbn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-medium">{book.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Author:</span>
                      <span className="font-medium">{book.author}</span>
                    </div>
                    <div className="mt-4">
                      <div
                        className={`p-3 rounded-lg border ${
                          book.available ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {book.available ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${book.available ? "text-green-800" : "text-red-800"}`}>
                            {book.available ? "Available for borrowing" : "Currently unavailable"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Scan a book ISBN to view information</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/librarian/transactions"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">View Transactions</h3>
                <p className="text-sm text-gray-600">Browse all borrowing records</p>
              </div>
            </div>
          </a>

          <a
            href="/librarian/returns"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Process Returns</h3>
                <p className="text-sm text-gray-600">Handle book returns</p>
              </div>
            </div>
          </a>

          <a
            href="/librarian/overdue"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Overdue Books</h3>
                <p className="text-sm text-gray-600">Manage overdue items</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            {toast.type === "info" && <AlertCircle className="h-5 w-5 text-blue-600" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
