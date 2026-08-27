import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../custom/Header'

const UserLayout = () => {
  return (
    <div>
      <Header/>
      <main>
        <Outlet/>
      </main>
    </div>
  )
}

export default UserLayout
