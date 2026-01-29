import { Route, Routes } from "react-router"
import HomePage from "./Pages/HomePage"
import LoginPage from "./Pages/LoginPage"


const App = () => {
  return (
    <>
    <Routes>
      <Route path = "/" element= {<HomePage/>} />
      
      <Route path = "/login" element= {<LoginPage/>} />

    </Routes>
    </>
  )
}

export default App