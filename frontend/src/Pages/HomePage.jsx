// HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router';



  

const HomePage = () => {
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        console.error("Login error:", data);
        return;
      }

      // Optional: save token / user data
      // localStorage.setItem("token", data.token);
      // or use your auth store / context here

      toast.success("Login successful!");
      navigate("/dashboard", { replace: true }); // replace: true → better UX
    } catch (err) {
      console.error("Login fetch error:", err);
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">

      {/* Hero Section - Attractive with big headline + voice focus */}
      <section className="relative pt-20 pb-32 md:pt-28 md:pb-40 overflow-hidden">
        {/* Subtle background blobs */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-8">
            <span className="text-slate-800">HEALIX</span>
            <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              AI
            </span>
            <br />
            <span className="text-5xl md:text-6xl lg:text-7xl font-black mt-2 block">
              Boliye, Hum Sunte Hain
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-600 mb-10 font-light">
            Apni awaaz se symptoms batayein – hum samajhkar <strong>preliminary guidance</strong> dete hain.  
            Hindi mein, simple bhasha mein, doctor ki tarah madad karte hain (lekin doctor nahi hain).
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="px-10 py-5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white text-xl font-semibold rounded-2xl shadow-2xl shadow-blue-300/40 transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3">
              <span className="text-2xl">🎤</span> Voice Se Shuru Karein
            </button>

            <button className="px-10 py-5 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 text-xl font-semibold rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
              Chat Se Baat Karein
            </button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-lg text-slate-600">
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-2xl">✓</span> Hindi + English
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-2xl">✓</span> Private & Secure
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-2xl">✓</span> Emergency Alerts
            </div>
          </div>
        </div>
      </section>

      {/* Voice Processing Showcase Section with Photos */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-16">
            Aapki Awaaz Sunke Hum Yeh Karte Hain
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature 1 - Speak Symptoms */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                🎤
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                Symptoms Boliye
              </h3>
              <p className="text-slate-600 text-center text-lg leading-relaxed">
                "Mujhe 4 din se bukhar, sar dard aur khansi hai..." – bas itna hi bolna hai.
              </p>
              {/* Placeholder for real photo */}
              <div className="mt-6 rounded-2xl overflow-hidden shadow-lg border border-blue-200">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Patient speaking to AI assistant"
                  className="w-full h-56 object-cover"
                />
              </div>
            </div>

            {/* Feature 2 - Smart Follow-up Questions */}
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-3xl p-8 shadow-xl border border-teal-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                ❓
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                Smart Follow-up
              </h3>
              <p className="text-slate-600 text-center text-lg leading-relaxed">
                Hum poochte hain: "Kya bukhar raat mein badhta hai? Saans mein dikkat hai?"
              </p>
              <div className="mt-6 rounded-2xl overflow-hidden shadow-lg border border-teal-200">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="AI chatbot asking questions"
                  className="w-full h-56 object-cover"
                />
              </div>
            </div>

            {/* Feature 3 - Guidance + Emergency Alert */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 shadow-xl border border-indigo-100 hover:shadow-2xl transition-all duration-300 group md:col-span-2 lg:col-span-1">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                🩺
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                Sahi Guidance
              </h3>
              <p className="text-slate-600 text-center text-lg leading-relaxed">
                "Yeh flu jaisa lag raha hai – rest karein, paani piyein. Agar saans phool rahi hai to turant hospital jayein."
              </p>
              <div className="mt-6 rounded-2xl overflow-hidden shadow-lg border border-indigo-200">
                <img 
                  src="https://images.unsplash.com/photo-1586776976034-5e1a9e2f4c4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Doctor giving advice"
                  className="w-full h-56 object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-16 text-center text-slate-500 italic text-lg">
            <strong>Yeh sirf preliminary guidance hai</strong> – final diagnosis ke liye doctor se milein.  
            Serious symptoms mein turant emergency number (108) call karein.
          </div>
        </div>
      </section>

      {/* Final Big CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Abhi Shuru Karein – Aapki Sehat Humari Priority Hai
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90">
            Free mein try karein – koi subscription nahi, bas apni awaaz se madad lein.
          </p>

          <button className="px-12 py-6 bg-white text-blue-700 text-2xl font-bold rounded-2xl shadow-2xl hover:bg-gray-100 transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-4 mx-auto">
            <span className="text-3xl" onClick={handleSubmit}>🎙️</span> Voice Assistant Launch Karein
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 bg-white border-t border-slate-100 text-center text-slate-500">
        <p>HEALIX AI • © 2026</p>
      </footer>
    </div>
  );
};

export default HomePage;