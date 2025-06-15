"use client"
import { useState, useEffect } from "react"
import { usePage } from "@inertiajs/react"
import { Head } from "@inertiajs/react"
import AppLayout from "../../layouts/app-layout"
import { BookOpen, Users, BarChart3, AlertTriangle, TrendingUp, Calendar, Database, Activity } from "lucide-react"
import axios from "axios"
import type { PageProps, DashboardStats, BreadcrumbItem } from "../../types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Admin", href: "/admin" },
  { title: "Dashboard", href: "/admin/dashboard" },
]

export default function AdminDashboard() {
  const { auth } = usePage<PageProps>().props
  const [stats, setStats] = useState<DashboardStats>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/api/admin/dashboard-stats")
      setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks || 0,
      icon: BookOpen,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Total Students",
      value: stats.totalStudents || 0,
      icon: Users,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Active Transactions",
      value: stats.activeTransactions || 0,
      icon: Activity,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      title: "Overdue Books",
      value: stats.overdueBooks || 0,
      icon: AlertTriangle,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin Dashboard" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {auth.user.name}</h1>
          <p className="text-gray-600">
            Manage your library system, monitor performance, and oversee all operations from this central dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{isLoading ? "..." : card.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              System Management
            </h3>
            <div className="space-y-3">
              <a
                href="/admin/books"
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Manage Books</span>
                  <BookOpen className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Add, edit, and organize your book collection</p>
              </a>
              <a
                href="/admin/users"
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Manage Users</span>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Manage students, staff, and librarians</p>
              </a>
              <a
                href="/admin/transactions"
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">View Transactions</span>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Monitor all borrowing activities</p>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Reports & Analytics
            </h3>
            <div className="space-y-3">
              <a
                href="/admin/reports/popular-books"
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Popular Books</span>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Most borrowed books and trends</p>
              </a>
              <a
                href="/admin/reports/overdue"
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Overdue Reports</span>
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Track overdue books and notifications</p>
              </a>
              <a
                href="/admin/reports/usage"
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Usage Statistics</span>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Library usage patterns and metrics</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
