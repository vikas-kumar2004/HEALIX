import { Route, Routes } from "react-router"
import HomePage from "./Pages/HomePage"
import LoginPage from "./Pages/LoginPage"
import SignUpPage from "./Pages/SignUpPage"


const App = () => {
  return (
    <>
    <Routes>
      <Route path = "/" element= {<HomePage/>} />
      
      <Route path = "/login" element= {<LoginPage/>} />
      <Route path = "/signup" element= {<SignUpPage/>} />

    </Routes>
    </>
  )
}

export default App