import { useState } from "react";
import { MessageSquare, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useUserStore } from "../fdb/store";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", kitid: ""});
  const [showPass, setShowPass] = useState(false);
  const {setUser} = useUserStore();

//   const problemsList = [
//   "Skin Problem",
//   "Allergic Problem",
//   "Respiratory Problem",
//   "Heart Problem",
//   "Blood Pressure Issue",
//   "Eye Problem",
//   "Sleep Disorder",
//   "Stress/Anxiety",
//   "Obesity",
//   "Diabetes",
//   "Cold & Flu",
//   "Muscle Pain",
//   "Joint Pain",
//   "Digestive Problem",
//   "Headache/Migraine"
// ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    // if (name === "problems") {
    //   setForm((prev) => ({
    //     ...prev,
    //     problems: checked
    //       ? [...prev.problems, value]
    //       : prev.problems.filter((p) => p !== value),
    //   }));
    // } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    // }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_URI+"/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Signup successful");
        
        setUser(data)
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4"
      >
        <div className="flex items-center border-b border-gray-300 py-2">
          <MessageSquare className="mr-2" />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full outline-none"
            required
          />
        </div>

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
          <Mail className="mr-2" />
          <input
            type="name"
            name="kitid"
            placeholder="KIT_ID"
            value={form.kitid}
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
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;
