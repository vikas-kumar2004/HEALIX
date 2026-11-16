import { useEffect } from "react";
import { useUserStore } from "../fdb/store"

import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import TotalRiskGraph from "../components/totalRiskGraph.jsx";



function DashboardPage() {
  const { user, setUser } = useUserStore();
  //  BELOW I AM CREATING FETCH REQUEST TO MY SERVER INSTEAD OF REAL MQTT BECAUSE I DONT HAVE MADE IT THE REAL MQTT


  const navigate = useNavigate();
  const logout = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_URI + "/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Logout successful");


        setUser(null)
        navigate("/login"); // redirect after login
      } else {
        console.log(data.message)
        toast.error(data.message || "Logout failed");
      }
    } catch (err) {
      console.log(err.message);
      // toast.error("Network error");
    }
  }


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="font-bold text-gray-600 mt-2">KIT ID: {user?.KIT_ID}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">

          <TotalRiskGraph />
        </div>

        {/* Medical Parameters Threshold Box */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Medical Threshold Configurations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-bold text-red-600 uppercase">Severity Score</p>
              <p className="text-2xl font-black text-red-800 mt-1">
                {user?.SEVERITY_SCORE ?? 8.0}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-bold text-blue-600 uppercase">Optimum SpO2 Min</p>
              <p className="text-2xl font-black text-blue-800 mt-1">
                {user?.OPTIMUM_SPO2_MIN ?? 95.0}%
              </p>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs font-bold text-indigo-600 uppercase">Sub Optimum SpO2 Min</p>
              <p className="text-2xl font-black text-indigo-800 mt-1">
                {user?.SUB_OPTIMUM_SPO2_MIN ?? 85.0}%
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs font-bold text-emerald-600 uppercase">Optimum HR Max</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {user?.OPTIMUM_HEART_RATE_MAX ?? 100.0} <span className="text-sm font-normal">BPM</span>
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-bold text-amber-600 uppercase">Sub Optimum HR Max</p>
              <p className="text-2xl font-black text-amber-800 mt-1">
                {user?.SUB_OPTIMUM_HEART_RATE_MAX ?? 140.0} <span className="text-sm font-normal">BPM</span>
              </p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-bold text-orange-600 uppercase">Temp Range (Min / Max)</p>
              <p className="text-2xl font-black text-orange-800 mt-1">
                {user?.OPTIMUM_TEMP_MIN ?? 18.0}° - {user?.OPTIMUM_TEMP_MAX ?? 32.0}°C
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs font-bold text-purple-600 uppercase">Optimum Humidity Max</p>
              <p className="text-2xl font-black text-purple-800 mt-1">
                {user?.OPTIMUM_HUMID_MAX ?? 70.0}%
              </p>
            </div>

          </div>
        </div>
        

        
      
        

      </div>
    </div>
  );
}

export default DashboardPage;