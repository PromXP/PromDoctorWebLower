"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";

import { Poppins } from "next/font/google";

import HomeDashboard from "@/app/Homedashboard/page";
import Patientreport from "@/app/Patientreport/page";

import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const page = () => {
  const router=useRouter();
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

  const [selected, setSelected] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [groupedScores, setGroupedScores] = useState({});
  const [userData, setUserData] = useState(null);
  // This will be passed to HomeDashboard
  const handleGoToReport = (patient, scores, userData) => {
    setSelectedPatient(patient);
    setGroupedScores(scores);
    setUserData(userData);
    setSelected("report");
  };

  const handleSelect = (index) => {
    setSelected(index);
  };

  const [selectedComponent, setSelectedComponent] = useState("");

  const renderSelectedComponent = () => {
    switch (selected) {
      case "home":
        return <HomeDashboard goToReport={handleGoToReport} />;
      case "report":
        return (
          <Patientreport
            patient={selectedPatient}
            scoreGroups={groupedScores}
            userData={userData} // Pass userData to Patientreport
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`${poppins.className} flex h-screen bg-[#7075DB] py-1.5 pr-1.5`}
    >
      <div className="w-[18%] sm:w-[12%] md:w-[10%] lg:w-[8%] xl:w-[7%] h-full flex justify-center items-center">
        <div className="w-full h-[65%] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10">
          {/* Button 1 */}
          <button
            className={`cursor-pointer p-2 rounded-lg transition-all ${
              selected === 0
                ? "bg-white/40 backdrop-blur-md shadow-lg border border-white/30"
                : "opacity-100"
            }`}
            onClick={() => handleSelect("home")}
          >
            <svg
              width="31"
              height="32"
              viewBox="0 0 31 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_1708)">
                <path
                  d="M3.99805 17.0341H14.2394V4.23242H3.99805L3.99805 17.0341ZM3.99805 27.2754H14.2394V19.5944H3.99805V27.2754ZM16.7997 27.2754H27.0411V14.4738H16.7997V27.2754ZM16.7997 4.23242V11.9134H27.0411V4.23242L16.7997 4.23242Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_643_1708">
                  <rect
                    width="30.724"
                    height="30.724"
                    fill="white"
                    transform="translate(0.158203 0.392578)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>

          {/* Button 2 */}
          <button
            className={`cursor-pointer p-2 rounded-lg transition-all invisible ${
              selected === 1
                ? "bg-white/40 backdrop-blur-md shadow-lg border border-white/30"
                : "opacity-100"
            }`}
          >
            <svg
              width="31"
              height="32"
              viewBox="0 0 31 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_1716)">
                <path
                  d="M15.5204 29.0721C8.45006 29.0721 2.71875 23.3408 2.71875 16.2704C2.71875 10.5378 6.48628 5.686 11.6799 4.05507V6.77414C9.47922 7.66776 7.65738 9.29826 6.52604 11.3867C5.39471 13.4752 5.02418 15.8919 5.47784 18.2234C5.93149 20.5549 7.18114 22.6563 9.01303 24.1682C10.8449 25.6801 13.1452 26.5085 15.5204 26.5118C17.5607 26.5117 19.5546 25.9025 21.2464 24.7621C22.9383 23.6217 24.2511 22.0021 25.0167 20.1109H27.7358C26.1048 25.3046 21.253 29.0721 15.5204 29.0721ZM28.2581 17.5506H14.2403V3.53276C14.6614 3.49051 15.089 3.46875 15.5204 3.46875C22.5908 3.46875 28.3221 9.20006 28.3221 16.2704C28.3221 16.7018 28.3003 17.1294 28.2581 17.5506ZM16.8006 6.10845V14.9903H25.6824C25.3974 12.7341 24.37 10.6368 22.762 9.02882C21.154 7.4208 19.0567 6.3934 16.8006 6.10845Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_643_1716">
                  <rect
                    width="30.724"
                    height="30.724"
                    fill="white"
                    transform="translate(0.158203 0.908203)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>

          {/* Button 3 */}
          <button
            className={`cursor-pointer p-2 rounded-lg transition-all invisible ${
              selected === 2
                ? "bg-white/40 backdrop-blur-md shadow-lg border border-white/30"
                : "opacity-100"
            }`}
          >
            <svg
              width="33"
              height="33"
              viewBox="0 0 33 33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_1724)">
                <path
                  d="M4.72024 23.2937C4.14299 22.2955 3.69428 21.2283 3.38477 20.1175C4.05838 19.7749 4.6241 19.2526 5.01932 18.6085C5.41455 17.9643 5.62388 17.2234 5.62417 16.4677C5.62445 15.7119 5.41567 14.9708 5.02092 14.3264C4.62618 13.6819 4.06086 13.1592 3.3875 12.8161C4.00476 10.5842 5.18004 8.5461 6.80264 6.8939C7.43637 7.30591 8.17173 7.53454 8.92735 7.55451C9.68297 7.57447 10.4294 7.38498 11.084 7.00701C11.7386 6.62903 12.2758 6.07732 12.6363 5.41292C12.9967 4.74852 13.1663 3.99734 13.1263 3.24252C15.3686 2.66303 17.7216 2.66397 19.9634 3.24525C19.9238 4.00006 20.0937 4.75112 20.4545 5.41533C20.8152 6.07954 21.3527 6.631 22.0074 7.00868C22.6621 7.38637 23.4086 7.57554 24.1641 7.55529C24.9197 7.53503 25.6549 7.30612 26.2885 6.8939C27.0791 7.69955 27.781 8.61581 28.3709 9.63858C28.9622 10.6613 29.4046 11.7278 29.7064 12.8148C29.0328 13.1574 28.467 13.6796 28.0718 14.3238C27.6766 14.9679 27.4673 15.7089 27.467 16.4646C27.4667 17.2204 27.6755 17.9614 28.0702 18.6059C28.465 19.2503 29.0303 19.773 29.7036 20.1161C29.0864 22.3481 27.9111 24.3862 26.2885 26.0384C25.6548 25.6264 24.9194 25.3977 24.1638 25.3778C23.4082 25.3578 22.6618 25.5473 22.0072 25.9253C21.3526 26.3032 20.8153 26.8549 20.4549 27.5194C20.0944 28.1838 19.9248 28.9349 19.9648 29.6898C17.7225 30.2692 15.3695 30.2683 13.1277 29.687C13.1674 28.9322 12.9974 28.1811 12.6367 27.5169C12.2759 26.8527 11.7385 26.3013 11.0838 25.9236C10.429 25.5459 9.68258 25.3567 8.927 25.377C8.17143 25.3972 7.43619 25.6262 6.80264 26.0384C5.99561 25.2149 5.29593 24.2927 4.72024 23.2937ZM12.449 23.5613C13.9042 24.4006 14.9982 25.7475 15.5214 27.3438C16.2028 27.408 16.8869 27.4093 17.5683 27.3452C18.0919 25.7487 19.1865 24.4017 20.6421 23.5627C22.0967 22.7211 23.8108 22.4464 25.4555 22.7912C25.8515 22.2341 26.1929 21.6401 26.4769 21.0188C25.3564 19.7672 24.7374 18.146 24.7386 16.4661C24.7386 14.7456 25.3804 13.1384 26.4769 11.9135C26.1909 11.2924 25.8481 10.6991 25.4528 10.1411C23.8091 10.4856 22.0961 10.2114 20.6421 9.37094C19.187 8.53165 18.0929 7.18473 17.5697 5.58847C16.8883 5.52429 16.2042 5.52292 15.5228 5.5871C14.9993 7.18359 13.9047 8.53055 12.449 9.36957C10.9945 10.2112 9.28033 10.4859 7.6356 10.1411C7.24038 10.6986 6.89841 11.292 6.6142 11.9135C7.7347 13.1651 8.3537 14.7863 8.3525 16.4661C8.3525 18.1867 7.71071 19.7939 6.6142 21.0188C6.90024 21.6399 7.24307 22.2332 7.63833 22.7912C9.28202 22.4467 10.995 22.7209 12.449 23.5613ZM16.5456 20.5627C15.4591 20.5627 14.4171 20.1311 13.6489 19.3628C12.8806 18.5946 12.449 17.5526 12.449 16.4661C12.449 15.3797 12.8806 14.3377 13.6489 13.5694C14.4171 12.8012 15.4591 12.3696 16.5456 12.3696C17.632 12.3696 18.674 12.8012 19.4423 13.5694C20.2105 14.3377 20.6421 15.3797 20.6421 16.4661C20.6421 17.5526 20.2105 18.5946 19.4423 19.3628C18.674 20.1311 17.632 20.5627 16.5456 20.5627ZM16.5456 17.8316C16.9077 17.8316 17.255 17.6878 17.5111 17.4317C17.7672 17.1756 17.9111 16.8283 17.9111 16.4661C17.9111 16.104 17.7672 15.7567 17.5111 15.5006C17.255 15.2445 16.9077 15.1006 16.5456 15.1006C16.1834 15.1006 15.8361 15.2445 15.58 15.5006C15.3239 15.7567 15.1801 16.104 15.1801 16.4661C15.1801 16.8283 15.3239 17.1756 15.58 17.4317C15.8361 17.6878 16.1834 17.8316 16.5456 17.8316Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_643_1724">
                  <rect
                    width="32.7723"
                    height="32.7723"
                    fill="white"
                    transform="translate(0.158203 0.0800781)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>

          {/* Button 4 */}
          <button
            className={`cursor-pointer p-2 rounded-lg transition-all ${
              selected === 3
                ? "bg-white/40 backdrop-blur-md shadow-lg border border-white/30"
                : "opacity-100"
            }`}
            onClick={()=>{
              router.replace("/");
              localStorage.removeItem("userData");
            }}
          >
            <svg
              width="31"
              height="31"
              viewBox="0 0 31 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_1728)">
                <path
                  d="M5.27995 23.2952H7.84029V25.8555H23.2023V5.37283L7.84029 5.37283V7.93317H5.27995V4.09267C5.27995 3.75315 5.41483 3.42753 5.65491 3.18745C5.89499 2.94737 6.2206 2.8125 6.56012 2.8125L24.4825 2.8125C24.822 2.8125 25.1476 2.94737 25.3877 3.18745C25.6278 3.42753 25.7626 3.75315 25.7626 4.09267V27.1357C25.7626 27.4752 25.6278 27.8008 25.3877 28.0409C25.1476 28.281 24.822 28.4158 24.4825 28.4158H6.56012C6.2206 28.4158 5.89499 28.281 5.65491 28.0409C5.41483 27.8008 5.27995 27.4752 5.27995 27.1357V23.2952ZM7.84029 14.334H16.8015V16.8943H7.84029V20.7348L1.43945 15.6142L7.84029 10.4935V14.334Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_643_1728">
                  <rect
                    width="30.724"
                    height="30.724"
                    fill="white"
                    transform="translate(0.158203 0.251953)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content - You can place it here beside the sidebar */}
      <div className="flex-1 overflow-auto p-4 text-white bg-[#F8F8F8] rounded-l-4xl">
        {renderSelectedComponent()}
      </div>
    </div>
  );
};

export default page;
