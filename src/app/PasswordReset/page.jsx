"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { API_URL } from "../libs/global";

import Image from "next/image";

import { Poppins } from "next/font/google";

import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const page = ({ isOpen, onClose }) => {
  const useWindowSize = () => {
    const [size, setSize] = useState({
      width: 0,
      height: 0,
    });

    useEffect(() => {
      const updateSize = () => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateSize(); // set initial size
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    return size;
  };

  const { width, height } = useWindowSize();

  const [data, setData] = useState(null);
  const [userUHID, setuserUHID] = useState("");
  const [userPassword, setuserPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [showAlert, setshowAlert] = useState(false);
  const [alermessage, setAlertMessage] = useState("");
  const [response, setResponse] = useState(null);

  const fetchData = async () => {
    if (!userUHID.trim())
      return showWarning("UHID is required");
    if (!userPassword.trim()) return showWarning("PASSWORD is required");
    if (!confirmPassword.trim()) return showWarning("Confirm Password is required");
    if (userPassword !== confirmPassword) return showWarning("Passwords do not match");

    const payload = {
      uhid: userUHID,
      new_password: userPassword,
    };

    try {
      const res = await axios.put(API_URL+"doctors/reset-password", payload);
      setResponse(res.data);

      onClose();
    } catch (err) {
      console.error("POST error:", err);
    }
  };


  const showWarning = (message) => {
    setAlertMessage(message);
    setshowAlert(true);
    setTimeout(() => setshowAlert(false), 4000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 "
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)", // white with 50% opacity
      }}
    >
      <div
        className={`
        min-h-screen w-fit flex flex-col items-center justify-center mx-auto
        ${width < 950 ? "p-4 gap-4 " : "p-4 "}
      `}
      >
        <div
          className={`w-full bg-white rounded-2xl p-4  overflow-y-auto overflow-x-hidden max-h-[90vh] ${
            width < 1095 ? "flex flex-col gap-4" : ""
          }`}
        >
          <div
            className={`w-full bg-white  ${width < 760 ? "h-fit" : "h-[20%]"} `}
          >
            <div
              className={`w-full rounded-lg flex flex-col gap-5 justify-center items-center ${
                width < 760 ? "py-0" : "py-4"
              }`}
            >
              <div
                className={`w-full flex gap-4 justify-start items-center ${
                  width < 530
                    ? "flex-col justify-center items-center"
                    : "flex-row "
                }`}
              >
                <p className="font-bold text-5 text-black">
                  UHID
                </p>
              </div>

              <div className="w-full flex flex-col gap-2">
                <input
                  placeholder="UHID"
                  rows={3}
                  className="w-full text-black px-4 py-2  text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "rgba(71, 84, 103, 0.1)" }}
                  value={userUHID}
                  onChange={(e) => setuserUHID(e.target.value)}
                />
              </div>

              <div
                className={`w-full flex gap-4 justify-start items-center ${
                  width < 530
                    ? "flex-col justify-center items-center"
                    : "flex-row"
                }`}
              >
                <p className="font-bold text-5 text-black">PASSWORD</p>
              </div>

              <div className="w-full flex flex-col gap-2">
                <input
                  placeholder="PASSWORD"
                  rows={3}
                  type="password"
                  className="w-full text-black px-4 py-2  text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "rgba(71, 84, 103, 0.1)" }}
                  value={userPassword}
                  onChange={(e) => setuserPassword(e.target.value)}
                />
              </div>

              <div
                className={`w-full flex gap-4 justify-start items-center ${
                  width < 530
                    ? "flex-col justify-center items-center"
                    : "flex-row"
                }`}
              >
                <p className="font-bold text-5 text-black">CONFIRM PASSWORD</p>
              </div>

              <div className="w-full flex flex-col gap-2">
                <input
                  placeholder="PASSWORD"
                  rows={3}
                  type="text"
                  className="w-full text-black px-4 py-2  text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "rgba(71, 84, 103, 0.1)" }}
                  value={confirmPassword}
                  onChange={(e) => setconfirmPassword(e.target.value)}
                />
              </div>

              <div className="w-full flex flex-row justify-center items-center">
                <p
                  className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-sm border-[#005585] border-2"
                  style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                  onClick={fetchData}
                >
                  RESET
                </p>
              </div>

              <div className="w-full flex flex-row justify-center items-center">
                <p
                  className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-black text-sm border-[#005585] border-2"
                
                  onClick={onClose}
                >
                  Close
                </p>
              </div>

              {showAlert && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                    {alermessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
