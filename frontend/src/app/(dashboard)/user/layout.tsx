'use client'

import React from 'react'
import ClientLayout from './ClientLayout' 

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // 🔥 FIX: Removed hardcoded background. Now ClientLayout controls the theme.
    <ClientLayout>
      {children}
    </ClientLayout>
  )
}