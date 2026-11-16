import User from "../models/user.models.js";



export const personalDetailsUpdate = async(req,res) => {
      const { email, kitid } = req.body;
        if (!kitid || !email) {
            console.log("All fields are required")
            return res.status(400).json({ message: "kitid and email are required" });
        }
        try {
            const updatedUser = await User.findOneAndUpdate(
                { kitid }, 
                { email: email },
                { new: true, runValidators: true }
            );
            if (!updatedUser) {
                return res.status(404).json({ message: "User with this kitid not found" });
            }
            return res.status(200).json({
                message: "Personal details updated successfully",
                user: updatedUser
            });
        } catch (error) {
            console.error("Error in personalDetailsUpdate controller:", error.message);
            return res.status(500).json({ message: "Internal server error" });
        }


}
export const medicalDetailsUpdate = async(req,res) => {
    const { 
        kitid, 
        SEVERITY_SCORE, 
        OPTIMUM_SPO2_MIN, 
        SUB_OPTIMUM_SPO2_MIN, 
        OPTIMUM_HEART_RATE_MAX, 
        SUB_OPTIMUM_HEART_RATE_MAX, 
        OPTIMUM_TEMP_MIN, 
        OPTIMUM_TEMP_MAX, 
        OPTIMUM_HUMID_MAX 
    } = req.body;

    if (!kitid) {
        return res.status(400).json({ message: "kitid is required" });
    }
    const updateData = {};
        if (SEVERITY_SCORE !== undefined) updateData.SEVERITY_SCORE = SEVERITY_SCORE;
        if (OPTIMUM_SPO2_MIN !== undefined) updateData.OPTIMUM_SPO2_MIN = OPTIMUM_SPO2_MIN;
        if (SUB_OPTIMUM_SPO2_MIN !== undefined) updateData.SUB_OPTIMUM_SPO2_MIN = SUB_OPTIMUM_SPO2_MIN;
        if (OPTIMUM_HEART_RATE_MAX !== undefined) updateData.OPTIMUM_HEART_RATE_MAX = OPTIMUM_HEART_RATE_MAX;
        if (SUB_OPTIMUM_HEART_RATE_MAX !== undefined) updateData.SUB_OPTIMUM_HEART_RATE_MAX = SUB_OPTIMUM_HEART_RATE_MAX;
        if (OPTIMUM_TEMP_MIN !== undefined) updateData.OPTIMUM_TEMP_MIN = OPTIMUM_TEMP_MIN;
        if (OPTIMUM_TEMP_MAX !== undefined) updateData.OPTIMUM_TEMP_MAX = OPTIMUM_TEMP_MAX;
        if (OPTIMUM_HUMID_MAX !== undefined) updateData.OPTIMUM_HUMID_MAX = OPTIMUM_HUMID_MAX;

        try {
            const updatedUser = await User.findOneAndUpdate(
                { kitid },
                { $set: updateData },
                { new: true, runValidators: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ message: "User with this kitid not found" });
            }
    
            return res.status(200).json({
                message: "Medical thresholds updated successfully",
                user: updatedUser
            });
        } catch (error) {
            console.error("Error in medicalDetailsUpdate controller:", error.message);
            return res.status(500).json({ message: "Internal server error" });
        }


}