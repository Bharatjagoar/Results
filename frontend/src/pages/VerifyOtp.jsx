import React, { useEffect, useState } from "react";
import "./VerifyOTP.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  useEffect(() => {
    if (!email) navigate("/signup");
  }, [email, navigate]);

  useEffect(() => {

    if (!email) {
      // If someone opens verify page manually or refreshes -> cancel pending signup
      axios.post("http://localhost:5000/api/auth/cancel", {});
      navigate("/signup");
    }

    // CLEANUP on refresh, back, or leaving this page
    return () => {
      alert("hellpw from")
      if (email) {
        axios.post("http://localhost:5000/api/auth/cancel", { email });
      }
    };
  }, []);


  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error("OTP expired. Please try again.");
      navigate("/signup");
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const formatTime = () => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // 🔐 VERIFY OTP
  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      // backend returns success: true
      if (res.data.success) {
        toast.success("OTP Verified!");
        navigate("/");
      } else {
        toast.error(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 RESEND OTP
  const handleResend = async () => {
    try {
      setTimeLeft(180);
      setOtp("");

      await axios.post("http://localhost:5000/api/auth/resend-otp", { email });


      toast.success("OTP resent successfully!");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <h2>Verify OTP</h2>
        <p className="otp-description">
          Enter the OTP sent to: <b>{email}</b>
        </p>

        <p className="timer">
          OTP expires in: <span>{formatTime()}</span>
        </p>

        <form onSubmit={handleVerify}>
          <div className="otp-input-group">
            <input
              type="text"
              maxLength={6}
              placeholder="______"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button disabled={timeLeft <= 0 || loading} type="submit" className="otp-btn">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="otp-footer">
          Didn’t receive OTP?{" "}
          <span onClick={handleResend} className="resend-btn">
            Resend
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
