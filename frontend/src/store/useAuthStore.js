// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios.js";
// import toast from "react-hot-toast";

// const BASE_URL =
//   import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

// export const useAuthStore = create((set, get) => ({
//   authUser: null,
//   isSigningUp: false,
//   isLoggingIn: false,
//   isUpdatingProfile: false,

//   isCheckingAuth: true,
//   onlineUsers: [],
//   socket: null,

//   checkAuth: async () => {
//     try {
//       const res = await axiosInstance.get("/auth/check");
//       set({ authUser: res.data });
//       get().connectSocket();
//     } catch (error) {
//       console.log("Error in checkAuth ", error);
//       set({ authUser: null });
//     } finally {
//       set({ isCheckingAuth: false });
//     }
//   },
//   signup: async (data) => {
//     set({ isSigningUp: true });
//     try {
//       const res = await axiosInstance.post("/auth/signup", data);
//       toast.success("Account Created Succesfully");
//       set({ authUser: res.data });
//     } catch (error) {
//       console.log("Error in signup ", error);
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isSigningUp: false });
//     }
//   },
//   logout: async () => {
//     try {
//       const res = await axiosInstance.post("/auth/logout");
//       toast.success("Logged Out Succefully");
//       set({ authUser: null });
//       get().disconnectSocket();
//     } catch (error) {
//       console.log("Erron in Logout ", error);
//       toast.error(error.response.data.message);
//     }
//   },
//   login: async (data) => {
//     set({ isLoggingIn: true });
//     try {
//       const res = await axiosInstance.post("/auth/login", data);
//       toast.success("Logged In Successfully");
//       set({ authUser: res.data });
//       get().connectSocket();
//     } catch (error) {
//       console.log("Error in login ", error);
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isLoggingIn: false });
//     }
//   },
//   updateProfile: async (data) => {
//     set({ isUpdatingProfile: true });
//     try {
//       const res = await axiosInstance.put("/auth/update-profile", data);
//       set({ authUser: res.data });
//       toast.success("Profile update Successfully");
//     } catch (error) {
//       console.log("Error in updateProfile", error);
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUpdatingProfile: false });
//     }
//   },
// }));
