import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router"; // ← Fixed import
import toast from "react-hot-toast";

const LoginPage = () => {

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate(); // ← This was missing!

  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

  const loginjwt = async ()=>{
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true }); // replace: true → better UX
        
      } else {

      }


    } catch (err) {
      console.error("Login fetch error:", err);
      // toast.error("Server error. Please try again later.");
    } 
  };
  

  useEffect(()=>{
    loginjwt()
  },[]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-4xl shadow-2xl bg-base-100 overflow-hidden grid lg:grid-cols-2">
        {/* Left - Form */}
        <div className="card-body p-8 lg:p-12 flex flex-col justify-center">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-base-content/60 mt-2">Sign in to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/40 pointer-events-none" />
                <input
                  type="email"
                  className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/40 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10 focus:input-primary transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/60" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/60" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-base-content/70">
              Don't have an account?{" "}
              <Link to="/signup" className="link link-primary font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Right - Visual / Branding (optional - can be removed or replaced) */}
        <div className="hidden lg:flex bg-gradient-to-br from-primary/20 to-secondary/20 items-center justify-center p-12">
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-4xl font-bold text-primary">ChatSphere</h2>
            <p className="text-lg opacity-80">
              Join conversations, share moments, connect instantly.
            </p>
            <div className="text-6xl">✨</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;