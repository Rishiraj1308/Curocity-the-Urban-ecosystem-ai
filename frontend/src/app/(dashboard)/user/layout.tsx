'use client'
import React from 'react'
import ClientLayout from './ClientLayout' 

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientLayout>{children}</ClientLayout>
    </>
  )
}