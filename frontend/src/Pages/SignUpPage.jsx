import { useState } from "react";
import {
  MessageSquare,
  User,
  Mail,
  Lock,
  EyeOff,
  Eye,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    email: "",
    password: "",
  });

  const validateForm = () => {
    if (!formData.Name.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const signup = async (userData) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Signup failed");
        return;
      }

      toast.success("Signup successful!");
      navigate("/dashboard"); // ✅ redirect
    } catch {
      toast.error("Server error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await signup(formData);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-full max-w-md p-6 space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="size-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-base-content/60">Get started for free</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type="text"
              className="input input-bordered w-full pl-10"
              placeholder="Full Name"
              value={formData.Name}
              onChange={(e) =>
                setFormData({ ...formData, Name: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type="email"
              className="input input-bordered w-full pl-10"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              className="input input-bordered w-full pl-10"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="size-5 text-gray-400" />
              ) : (
                <Eye className="size-5 text-gray-400" />
              )}
            </button>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="link link-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
