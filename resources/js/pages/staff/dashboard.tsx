"use client"
import { useEffect } from "react"
import { usePage, router } from "@inertiajs/react"
import { Head } from "@inertiajs/react"
import AppLayout from "../../layouts/app-layout"
import type { BreadcrumbItem, PageProps } from "../../types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
]

export default function Dashboard() {
  const { auth } = usePage<PageProps>().props

  useEffect(() => {
    // Redirect based on user role
    switch (auth.user.role) {
      case "admin":
        router.visit("/admin/dashboard")
        break
      case "librarian":
        router.visit("/librarian/dashboard")
        break
      case "student":
      case "staff":
        router.visit("/user/dashboard")
        break
      default:
        router.visit("/login")
    }
  }, [auth.user.role])

  // Show loading while redirecting
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
