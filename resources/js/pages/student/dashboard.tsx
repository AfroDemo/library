"use client"
import { useState, useEffect } from "react"
import { usePage } from "@inertiajs/react"
import { Head } from "@inertiajs/react"
import AppLayout from "../../layouts/app-layout"
import { BookOpen, Calendar, Clock, CheckCircle, AlertTriangle, Search, User } from "lucide-react"
import axios from "axios"
import type { PageProps, Transaction, DashboardStats, BreadcrumbItem } from "../../types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "My Library", href: "/user" },
  { title: "Dashboard", href: "/user/dashboard" },
]

export default function UserDashboard() {
  const { auth } = usePage<PageProps>().props
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<DashboardStats>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const [transactionsResponse, statsResponse] = await Promise.all([
        axios.get("/api/user/transactions"),
        axios.get("/api/user/dashboard-stats"),
      ])

      setTransactions(transactionsResponse.data)
      setStats(statsResponse.data)
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !transactions.find((t) => t.due_date === dueDate)?.returned_at
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="My Dashboard" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {auth.user.name}!</h1>
              <p className="text-blue-100">{auth.user.role === "student" ? "Student" : "Staff"} • Library Member</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Books Borrowed</p>
                <p className="text-3xl font-bold text-gray-900">{isLoading ? "..." : stats.myBorrowedBooks || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : transactions.filter((t) => !t.returned_at).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : transactions.filter((t) => !t.returned_at && isOverdue(t.due_date)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Current Borrowed Books */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Currently Borrowed Books
            </h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading your books...</p>
              </div>
            ) : transactions.filter((t) => !t.returned_at).length > 0 ? (
              <div className="space-y-4">
                {transactions
                  .filter((t) => !t.returned_at)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 rounded-lg border ${
                        isOverdue(transaction.due_date) ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{transaction.book_title}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>Borrowed: {formatDate(transaction.borrowed_at)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Due: {formatDate(transaction.due_date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isOverdue(transaction.due_date) ? (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Overdue</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>You don't have any books currently borrowed.</p>
                <p className="text-sm mt-1">Visit the library to borrow some books!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/user/search"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <Search className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Search Books</h3>
                <p className="text-sm text-gray-600">Find books in the library catalog</p>
              </div>
            </div>
          </a>

          <a
            href="/user/history"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Borrowing History</h3>
                <p className="text-sm text-gray-600">View your complete borrowing history</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </AppLayout>
  )
}
