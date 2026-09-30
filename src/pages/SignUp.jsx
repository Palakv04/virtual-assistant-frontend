import React, { useContext, useState, useEffect, useRef } from 'react';
import bg from "../assets/authBg.png";
import { 
  IoEye, 
  IoEyeOff, 
  IoShieldCheckmarkOutline, 
  IoMailOutline, 
  IoArrowBackOutline 
} from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios";

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 6-digit individual boxes
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [timer, setTimer] = useState(0);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle individual OTP digit change
  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErr("");

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle Paste for 6-digit OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || "";
    }
    setOtpDigits(newDigits);
    setErr("");

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Step 1: Validate email & Send OTP
  const handleInitiateSignUp = async (e) => {
    e.preventDefault();
    setErr("");

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErr("Please enter a valid email address (e.g. name@domain.com)");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/send-otp`, {
        email: trimmedEmail
      });

      setTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep("otp");
      setLoading(false);

      // Focus first OTP input on step change
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setErr(error?.response?.data?.message || "Failed to send verification OTP");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    setErr("");
    try {
      await axios.post(`${serverUrl}/api/auth/send-otp`, {
        email: email.trim().toLowerCase()
      });
      setTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  // Step 2: Verify OTP & Complete Signup
  const handleVerifyAndSignUp = async (e) => {
    e.preventDefault();
    setErr("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErr("Please enter all 6 digits of the OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: fullOtp
        },
        { withCredentials: true }
      );

      const user = result.data.user || result.data;
      setUserData(user);
      setLoading(false);
      navigate("/customize");
    } catch (error) {
      console.error(error);
      setUserData(null);
      setLoading(false);
      setErr(error?.response?.data?.message || "Invalid or expired OTP. Please try again.");
    }
  };

  return (
    <div
      className='w-full h-[100vh] bg-cover flex justify-center items-center overflow-auto py-8 px-4'
      style={{ backgroundImage: `url(${bg})` }}
    >
      {step === "form" ? (
        // EXACT ORIGINAL FORM UI
        <form
          className='w-[90%] min-h-[500px] py-[40px] max-w-[450px] bg-black/40 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col items-center justify-center gap-[20px] px-[20px] rounded-3xl border border-white/10'
          onSubmit={handleInitiateSignUp}
        >
          <h1 className='text-white text-[24px] sm:text-[30px] font-semibold mb-[20px] sm:mb-[30px] text-center'>
            Register to <span className='text-blue-400'>Virtual Assistant</span>
          </h1>

          <input
            type="text"
            placeholder='Enter your Name'
            className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 rounded-full text-[18px]'
            style={{ paddingLeft: '40px', paddingRight: '40px' }}
            required
            onChange={(e) => setName(e.target.value)}
            value={name}
          />

          <input
            type="email"
            placeholder='Email'
            className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 rounded-full text-[18px]'
            style={{ paddingLeft: '40px', paddingRight: '40px' }}
            required
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />

          <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative'>
            <input
              type={showPassword ? "text" : "password"}
              placeholder='password'
              className='w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300'
              style={{ paddingLeft: '40px', paddingRight: '40px' }}
              required
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            {!showPassword && (
              <IoEye
                className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-[white] cursor-pointer'
                onClick={() => setShowPassword(true)}
              />
            )}
            {showPassword && (
              <IoEyeOff
                className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-[white] cursor-pointer'
                onClick={() => setShowPassword(false)}
              />
            )}
          </div>

          {err.length > 0 && (
            <p className='text-red-500 text-[17px]'>*{err}</p>
          )}

          <button
            className='min-w-[150px] px-8 h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer transition-transform hover:scale-105 active:scale-95'
            disabled={loading}
          >
            {loading ? "Checking..." : "Sign Up"}
          </button>

          <p
            className='text-[white] text-[18px] cursor-pointer'
            onClick={() => navigate("/signin")}
          >
            Already have an account ? <span className='text-blue-400'>Sign In</span>
          </p>
        </form>
      ) : (
        // ULTRA-PREMIUM, POLISHED OTP VERIFICATION SCREEN
        <form
          className='w-[90%] max-w-[450px] min-h-[500px] py-10 px-6 sm:px-8 bg-black/50 backdrop-blur-2xl shadow-2xl shadow-cyan-950/50 flex flex-col items-center justify-center rounded-3xl border border-white/15 animate-fadeIn'
          onSubmit={handleVerifyAndSignUp}
        >
          {/* Top Floating Glowing Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-400/20 border border-cyan-400/40 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <IoShieldCheckmarkOutline className="text-cyan-400 text-3xl" />
          </div>

          {/* Heading */}
          <h1 className='text-white text-[24px] sm:text-[28px] font-bold tracking-tight text-center'>
            Verify <span className='text-cyan-400'>Your Email</span>
          </h1>

          {/* Subtitle & Email Pill */}
          <p className='text-slate-300 text-[14px] text-center mt-1'>
            Enter the 6-digit code sent to
          </p>
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/15 px-3.5 py-1 rounded-full mt-2 mb-4">
            <IoMailOutline className="text-cyan-400 text-sm" />
            <span className='text-cyan-300 font-medium text-xs sm:text-sm tracking-wide'>{email}</span>
          </div>

          {/* 6 Individual Glass OTP Digit Boxes */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-3 w-full">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-11 sm:w-12 h-14 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono text-white rounded-xl outline-none transition-all duration-200 ${
                  digit 
                    ? 'border-2 border-cyan-400 bg-cyan-950/40 shadow-md shadow-cyan-500/20' 
                    : 'border-2 border-white/20 bg-white/5 focus:border-cyan-400 focus:bg-cyan-950/30 focus:shadow-md focus:shadow-cyan-500/20'
                }`}
              />
            ))}
          </div>

          {/* Dev Mode Helper (if SMTP credentials aren't set in backend) */}


          {/* Error Message */}
          {err && (
            <p className='text-red-400 text-xs sm:text-sm bg-red-950/40 border border-red-500/30 px-3.5 py-2 rounded-xl text-center my-2 max-w-full'>
              *{err}
            </p>
          )}

          {/* Resend OTP Timer Line */}
          <div className="text-xs sm:text-sm text-slate-400 text-center my-3">
            {timer > 0 ? (
              <span>Didn't receive the code? Resend in <strong className='text-cyan-400 font-semibold'>{timer}s</strong></span>
            ) : (
              <span>
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className='text-cyan-400 font-semibold hover:underline cursor-pointer'
                >
                  Resend OTP
                </button>
              </span>
            )}
          </div>

          {/* Verify & Sign Up Button (Single-line, well-padded, premium) */}
          <button
            type="submit"
            disabled={loading || otpDigits.join("").length !== 6}
            className='w-full max-w-[280px] h-[54px] mt-2 text-black font-semibold bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-[17px] tracking-wide transition-all shadow-lg shadow-white/10 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center'
          >
            {loading ? "Verifying..." : "Verify & Sign Up"}
          </button>

          {/* Back / Change Email Link */}
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setErr("");
            }}
            className='text-slate-400 hover:text-white text-xs sm:text-sm transition-colors mt-5 flex items-center gap-1.5 cursor-pointer hover:underline'
          >
            <IoArrowBackOutline className="text-base" /> Change email or go back
          </button>
        </form>
      )}
    </div>
  );
}

export default SignUp;
