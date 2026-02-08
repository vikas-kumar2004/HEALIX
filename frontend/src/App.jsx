import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "./Pages/HomePage"
import LoginPage from "./Pages/LoginPage"
import SignUpPage from "./Pages/SignUpPage"
import DashboardPage from "./Pages/DashboardPage"
import NavBar from "./components/NavBar"


const App = () => {
  return (
    <>
 
      <NavBar/>
        <div className="mt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path = "/dashboard" element= {<DashboardPage
            />} />

          </Routes>
        </div>
   
    
    </>
  )
}

export default App