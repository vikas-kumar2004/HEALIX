
// import { Route, Routes } from 'react-router'
import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import NavBar from './components/navbar'
import HomePage from './pages/homepage'
import SignUpPage from './pages/signuppage'
import DashboardPage from './pages/dashboard'
import LoginPage from './pages/loginpage'

function App() {


  return (
    <>
      <BrowserRouter>
      <NavBar/>
        <div className="h-full bg-gray-200 flex justify-center items-center">
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path = "/dashboard" element= {<DashboardPage/>} />

          </Routes>
        </div>
      </BrowserRouter>


    </>
  )
}

export default App
