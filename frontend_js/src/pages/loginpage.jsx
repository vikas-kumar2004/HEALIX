import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useUserStore } from "../fdb/store";
import { useEffect } from "react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { setUser } = useUserStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_URI + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Login successful");


        setUser(data)
        navigate("/dashboard"); // redirect after login
      } else {
        console.log(data.message)
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      console.log(err.message);
      toast.error("Network error");
    }
  };

  useEffect(() => {
    const loginViaToken = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URI + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Login successful");


          setUser(data)
          navigate("/dashboard"); // redirect after login
        } else {
          console.log(data.message)
          // toast.error(data.message || "Login failed");
        }
      } catch (err) {
        console.log(err.message);
        // toast.error("Network error");
      }
    }
    loginViaToken()
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Login</h2>

        <div className="flex items-center border-b border-gray-300 py-2">
          <Mail className="mr-2" />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full outline-none"
            required
          />
        </div>

        <div className="flex items-center border-b border-gray-300 py-2">
          <Lock className="mr-2" />
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="ml-2"
          >
            {showPass ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <div className="text-sm text-center mt-2">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
