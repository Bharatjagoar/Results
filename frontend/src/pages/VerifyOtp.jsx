import React, { useEffect, useState } from "react";
import "./VerifyOTP.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email; // <-- Email passed from signup

  // If user visits page directly → redirect back
  useEffect(() => {
    if (!email) navigate("/signup");
  }, [email, navigate]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      navigate("/signup");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const formatTime = () => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // 📌 VERIFY OTP
  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      alert("OTP Verified Successfully!");
      navigate("/"); // redirect wherever you want
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // 📌 RESEND OTP
  const handleResend = async () => {
    try {
      setTimeLeft(180);
      setOtp("");

      await axios.post("http://localhost:5000/api/auth/signup", { email });

      alert("OTP Resent to your email!");
    } catch (err) {
      console.log(err);
      alert("Failed to resend OTP");
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <h2>Verify OTP</h2>
        <p className="otp-description">Enter the OTP sent to: <b>{email}</b></p>

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
