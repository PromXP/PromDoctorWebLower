"use client";
import React, {
  useState,
  useEffect,
  useRef,
  PureComponent,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ErrorBar,
  LabelList,
  ComposedChart,
  Bar,
} from "recharts";

import Image from "next/image";

import { API_URL } from "../libs/global";

import { Poppins } from "next/font/google";

import ProfileImage from "@/app/assets/profile.png";
import { UserIcon } from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/16/solid";
import Patientimg from "@/app/assets/patimg.png";
import Closeicon from "@/app/assets/closeicon.png";

import Surgeryreport from "@/app/Surgeryreport/page";

import "@/app/globals.css";

// === Helper functions ===
const quantile = (arr, q) => {
  const pos = (arr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return arr[base] + rest * (arr[base + 1] - arr[base]);
};

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const computeBoxStats = (data, mean) => {
  const sorted = [...data].sort((a, b) => a - b);
  return {
    min: sorted[0],
    lowerQuartile: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    upperQuartile: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    Patient: mean,
  };
};

// === Shape Components ===
const HorizonBar = (props) => {
  const { cx, cy, payload, dataKey, width = 30 } = props;

  if (cx == null || cy == null || !payload) return null;
  const isMedian = dataKey === "_median";
  const length = isMedian ? 30 : 10;

  return (
    <line
      x1={cx - length / 2}
      y1={cy}
      x2={cx + length / 2}
      y2={cy}
      stroke={dataKey === "_median" ? "#FFFFFF" : "#4A3AFF"}
      strokeWidth={2}
    />
  );
};

const DotBar = ({ x, y, width, height }) => {
  if (x == null || y == null || width == null || height == null) return null;
  return (
    <line
      x1={x + width / 2}
      y1={y + height}
      x2={x + width / 2}
      y2={y}
      stroke="#4A3AFF"
      strokeWidth={3}
      strokeDasharray="0"
    />
  );
};

// === Hook to structure data for chart ===
const useBoxPlot = (boxPlots) => {
  return useMemo(
    () =>
      boxPlots.map((v) => {
        // Ensure all required data points (min, median, etc.) are valid numbers, otherwise set to null.
        const min = !isNaN(v.min) ? v.min : null;
        const max = !isNaN(v.max) ? v.max : null;
        const lowerQuartile = !isNaN(v.lowerQuartile) ? v.lowerQuartile : null;
        const upperQuartile = !isNaN(v.upperQuartile) ? v.upperQuartile : null;
        const median = !isNaN(v.median) ? v.median : null;
        const Patient = !isNaN(v.Patient) ? v.Patient : null;

        return {
          name: v.name,
          min: min,
          bottomWhisker:
            lowerQuartile !== null && min !== null ? lowerQuartile - min : null,
          bottomBox:
            median !== null && lowerQuartile !== null
              ? median - lowerQuartile
              : null,
          topBox:
            upperQuartile !== null && median !== null
              ? upperQuartile - median
              : null,
          topWhisker:
            max !== null && upperQuartile !== null ? max - upperQuartile : null,
          medianLine: 0.0001, // dummy to render median bar
          maxLine: 0.0001, // dummy to render max bar
          minLine: 0.0001, // dummy to render min bar (optional)
          Patient: Patient,
          size: 250,
          _median: median, // actual Y position for rendering line
          _max: max,
          _min: min,
        };
      }),
    [boxPlots]
  );
};

const page = ({ patient, scoreGroups, userData }) => {
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
  const [surgeryPatient, setsurgeryPatient] = useState({});

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [isDateTimeEdited, setIsDateTimeEdited] = useState(false);

  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  const handleClockClick = () => {
    timeInputRef.current?.showPicker();
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      setSelectedDate(dateValue);
      handleClockClick(); // Show time picker right after date
    }
  };

  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    if (timeValue) {
      setSelectedTime(timeValue);
      setIsDateTimeEdited(true);
    }
  };

  const saveDateTime = async () => {
    const finalDateTime = `${selectedDate} ${selectedTime}`;
    console.log("Saved Date & Time:", finalDateTime);
    setIsDateTimeEdited(false);

    if (!selectedDate || !selectedTime) {
      setWarning("Please select both date and time.");
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (selectedDateTime < now) {
      setWarning("Selected date and time cannot be in the past.");
      return;
    }

    if (!patient?.uhid) {
      console.error("No patient selected for surgery scheduling.");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      surgery_scheduled: {
        date: selectedDate,
        time: selectedTime,
      },
    };

    try {
      const response = await fetch(API_URL + "update-surgery-schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Surgery scheduled successfully:", result);
      window.location.reload();
      // Optionally reset form or show success feedback
    } catch (error) {
      console.error("Error scheduling surgery:", error);
    }
  };

  const { width, height } = useWindowSize();

  const normalizePeriod = (period) =>
    period.trim().toUpperCase().replace(/\s+/g, "");

  const getScoreByPeriodAndType = (scores, period, type) => {
    const match = scores.find(
      (s) =>
        normalizePeriod(s.period) === normalizePeriod(period) &&
        s.name.toLowerCase().includes(type.toLowerCase())
    );
    return match ? match.score[0] : null;
  };

  const generateChartData = (patient) => {
    const scores = patient?.questionnaire_scores || [];

    const periodMap = {
      "-3": "PRE OP",
      "3W": "3W", // 👈 Add this
      SURGERY: "SURGERY",
      "+42": "6W",
      "+90": "3M",
      "+180": "6M",
      "+365": "1Y",
      "+730": "2Y",
    };

    const timeOrder = {
      "-3": -3,
      "3W": 21, // 👈 Approximate 3 weeks in days
      SURGERY: 10,
      "+42": 42,
      "+90": 90,
      "+180": 180,
      "+365": 365,
      "+730": 730,
    };

    // Check if a period exists in the questionnaire_scores
    const hasPeriodData = (periodKey) => {
      return scores.some(
        (s) =>
          normalizePeriod(s.period) === normalizePeriod(periodMap[periodKey])
      );
    };

    // Always include surgery, include others only if data exists
    const periods = Object.keys(periodMap).filter(
      (key) => key === "SURGERY" || hasPeriodData(key)
    );

    const chartData = periods.map((label) => {
      const periodKey = periodMap[label];

      return {
        name: periodKey,
        oks:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "Oxford Knee Score"),
        sf12:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "SF-12"),
        koos:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "KOOS"),
        kss:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "KSS"),
        fjs:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "FJS"),
        _order: timeOrder[label],
      };
    });

    return chartData
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...rest }) => rest);
  };

  const data = patient ? generateChartData(patient) : [];

  const rawScores = patient?.questionnaire_scores ?? [];

  // Define the custom order for the periods
  const periodOrder = ["PRE OP", "SURGERY", "6W", "3M", "6M", "1Y", "2Y"];

  // Filter, map and sort the data
  const sf12Data = periodOrder.map((period, index) => {
    const match = rawScores.find(
      (q) =>
        q.name.toLowerCase().includes("short form") &&
        q.name.toLowerCase().includes("12") &&
        q.period?.toLowerCase() === period.toLowerCase()
    );

    return {
      name: period,
      x: index,
      pScore: match?.score?.[1] ?? null,
      mScore: match?.score?.[2] ?? null,
    };
  });

  // Extract name for transformedData (could be expanded with additional properties if needed)
  const transformedData = sf12Data.map(({ name }) => ({ name }));

  // Dynamic PCS Data - Filtering out null pScores and setting error to [10, 10]
  const dataPCS = sf12Data
    .filter((d) => d.pScore !== null)
    .map((d) => ({
      x: d.x - 0.1,
      y: d.pScore,
      error: [10, 10],
    }));

  const dataMCS = sf12Data
    .filter((d) => d.mScore !== null)
    .map((d) => ({
      x: d.x + 0.1,
      y: d.mScore,
      error: [10, 10],
    }));

  // Finding the surgery index, if available
  const surgeryIndex = periodOrder.indexOf("SURGERY");

  const TIMEPOINT_ORDER = [
    "PREOP",
    "6 WEEKS",
    "3 MONTHS",
    "6 MONTHS",
    "1 YEAR",
    "2 YEARS",
  ];

  const normalizeLabel = (label) => {
    const map = {
      "PRE OP": "PREOP",
      "6W": "6 WEEKS",
      "3M": "3 MONTHS",
      "6M": "6 MONTHS",
      "1Y": "1 YEAR",
      "2Y": "2 YEARS",
    };

    const normalizedLabel = label.trim().toUpperCase();
    return map[normalizedLabel] || normalizedLabel;
  };

  const parseValues = (arr) => {
    if (!arr || arr.length === 0) return null;
    return arr
      .map((val) => val.split(","))
      .flat()
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
  };

  const boxPlotData = useMemo(() => {
    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Oxford Knee Score (OKS)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = patient?.questionnaire_scores?.find(
          (s) =>
            s.name === "Oxford Knee Score (OKS)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill in missing timepoints
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by TIMEPOINT_ORDER
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [scoreGroups, patient]);

  const databox = useBoxPlot(
    (boxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient < 100;

      if (!isValidDot) {
        stats.Patient = undefined;
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // SF-12 data processing
  const sf12BoxPlotData = useMemo(() => {
    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Short Form - 12 (SF-12)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = patient?.questionnaire_scores?.find(
          (s) =>
            s.name === "Short Form - 12 (SF-12)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill in any missing timepoints with empty data
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort the data based on the TIMEPOINT_ORDER
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [scoreGroups, patient]);

  const sf12Databox = useBoxPlot(
    (sf12BoxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient <= 100;

      if (!isValidDot) {
        stats.Patient = undefined; // strip rogue dot
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // KOOS data
  const koosBoxPlotData = useMemo(() => {
    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) =>
        key.startsWith(
          "Knee Injury and Ostheoarthritis Outcome Score, Joint Replacement (KOOS, JR)"
        )
      )
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = patient?.questionnaire_scores?.find(
          (s) =>
            s.name ===
              "Knee Injury and Ostheoarthritis Outcome Score, Joint Replacement (KOOS, JR)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Add missing timepoints with default data
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by TIMEPOINT_ORDER
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [scoreGroups, patient]);

  const koosDatabox = useBoxPlot(
    (koosBoxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient < 100;

      if (!isValidDot) {
        stats.Patient = undefined;
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // KSS data
  const kssBoxPlotData = useMemo(() => {
    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Knee Society Score (KSS)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = patient?.questionnaire_scores?.find(
          (s) =>
            s.name === "Knee Society Score (KSS)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill in missing timepoints
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by defined timepoint order
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [scoreGroups, patient]);

  const kssDatabox = useBoxPlot(
    (kssBoxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient < 100;

      if (!isValidDot) {
        stats.Patient = undefined;
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // FJS data
  const fjsBoxPlotData = useMemo(() => {
    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Forgotten Joint Score (FJS)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = patient?.questionnaire_scores?.find(
          (s) =>
            s.name === "Forgotten Joint Score (FJS)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill missing timepoints
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by the explicit timepoint order
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [scoreGroups, patient]);

  const allLabels = [
    "PREOP",
    "6 WEEKS",
    "3 MONTHS",
    "6 MONTHS",
    "1 YEAR",
    "2 YEARS",
  ];

  const fjsDatabox = useBoxPlot(
    allLabels.map((label, index) => {
      // Check if data for the label exists
      const item = fjsBoxPlotData.find((data) => data.name === label);

      // If no data is found for that label, use a default value (e.g., null or empty data)
      const stats = item
        ? computeBoxStats(item.boxData, item.dotValue)
        : {
            min: null,
            bottomWhisker: null,
            bottomBox: null,
            topBox: null,
            topWhisker: null,
            median: null,
            max: null,
            Patient: null,
          };

      return {
        name: label,
        x: index * 10, // or some other index-based calculation
        ...stats,
      };
    })
  );

  const isPostSurgeryDetailsFilled = (details) => {
    if (!details) return false;
    const { surgeon, surgery_name, procedure, implant, technology } = details;
    return (
      surgeon?.trim() &&
      surgery_name?.trim() &&
      procedure?.trim() &&
      implant?.trim() &&
      technology?.trim()
    );
  };

  // console.log("Box plot:", JSON.stringify(databox, null, 2));

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row w-[95%] mx-auto mt-4 items-center justify-between">
        <div
          className={`w-full rounded-lg flex ${width < 760 ? "py-0" : "py-4"}`}
        >
          <div className={`relative w-full`}>
            <div
              className={`flex gap-4  flex-col justify-center items-center ${
                width < 760 ? "" : "py-0"
              }`}
            >
              <div
                className={`w-full flex gap-4 justify-center items-center ${
                  width < 530
                    ? "flex-col justify-center items-center"
                    : "flex-row"
                }`}
              >
                <Image
                  className={`rounded-full w-14 h-14`}
                  src={Patientimg}
                  alt="alex hales"
                />

                <div
                  className={`w-full flex items-center ${
                    width < 760 ? "flex-col gap-2 justify-center" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex  flex-col gap-3 ${
                      width < 760 ? "w-full" : "w-2/5"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 flex-row ${
                        width < 530 ? "justify-center" : ""
                      }`}
                    >
                      <p
                        className={`text-[#475467] font-poppins font-semibold text-base ${
                          width < 530 ? "text-start" : ""
                        }`}
                      >
                        Patient Name |
                      </p>
                      <p
                        className={`text-black font-poppins font-bold text-base ${
                          width < 530 ? "text-start" : ""
                        }`}
                      >
                        {patient?.first_name + " " + patient?.last_name}
                      </p>
                    </div>
                    <div
                      className={`flex flex-row  ${
                        width < 710 && width >= 530
                          ? "w-full justify-between"
                          : ""
                      }`}
                    >
                      <p
                        className={`font-poppins font-semibold text-sm text-[#475467] ${
                          width < 530 ? "text-center" : "text-start"
                        }
                          w-1/2`}
                      >
                        {patient?.age}, {patient?.gender}
                      </p>
                      <div
                        className={`text-sm font-normal font-poppins text-[#475467] w-1/2 ${
                          width < 530 ? "text-center" : ""
                        }`}
                      >
                        UHID {patient?.uhid}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex   ${
                      width < 760 ? "w-full" : "w-3/5 justify-center"
                    }
                      ${
                        width < 530
                          ? "flex-col gap-4 justify-center items-center"
                          : "flex-row"
                      }`}
                  >
                    <div
                      className={` flex flex-col gap-3 ${
                        width < 530
                          ? "justify-center items-center w-full"
                          : "w-[20%]"
                      }`}
                    >
                      <p className="text-[#475467] font-semibold text-5">BMI</p>
                      <p className="text-[#04CE00] font-bold text-6">
                        {patient?.bmi}
                      </p>
                    </div>
                    <div
                      className={` flex flex-col gap-3 ${
                        width < 530
                          ? "justify-center items-center w-full"
                          : "w-[40%]"
                      }`}
                    >
                      <p className="text-[#475467] font-semibold text-5">
                        STATUS
                      </p>
                      <p className="text-[#F86060] font-bold text-6">
                        {patient?.current_status}
                      </p>
                    </div>
                    <div
                      className={` flex flex-col gap-3 ${
                        width < 530
                          ? "justify-center items-center w-full"
                          : "w-[30%]"
                      }`}
                    >
                      <p className="text-[#475467] font-semibold text-5">
                        SURGERY REPORT
                      </p>
                      <div className="w-full flex flex-row items-center gap-2">
                        {isPostSurgeryDetailsFilled(
                          surgeryPatient?.post_surgery_details ||
                            patient?.post_surgery_details
                        ) ? (
                          <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <p>COMPLETED</p>
                            <div className="relative flex items-center gap-2 cursor-pointer">
                              {/* Hidden date input */}
                              <input
                                type="date"
                                ref={dateInputRef}
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="absolute opacity-0 pointer-events-none w-0 h-0"
                              />

                              {/* Hidden time input */}
                              <input
                                type="time"
                                ref={timeInputRef}
                                value={selectedTime}
                                onChange={handleTimeChange}
                                className="absolute opacity-0 pointer-events-none w-0 h-0"
                              />

                              {/* Displayed text to click */}
                              <p
                                className="text-sm text-green-600"
                                onClick={openDatePicker}
                              >
                                {selectedDate && selectedTime
                                  ? `${new Date(
                                      `${selectedDate}T${selectedTime}`
                                    ).toLocaleString("en-GB")}`
                                  : "Select date & time"}
                              </p>

                              {/* Save icon only when both are filled */}
                              {isDateTimeEdited && selectedDate && (
                                <CheckCircleIcon
                                  className="w-7 h-7 text-blue-600 cursor-pointer"
                                  onClick={saveDateTime}
                                  title="Save Date & Time"
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[#F86060] font-bold text-sm">
                            <p>PENDING</p>

                            <PencilSquareIcon
                              className="w-5 h-5 text-black cursor-pointer"
                              onClick={() => setIsOpen(true)}
                            />

                            <div className="relative flex items-center gap-2 cursor-pointer">
                              {/* Hidden date input */}
                              <input
                                type="date"
                                ref={dateInputRef}
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="absolute opacity-0 pointer-events-none w-0 h-0"
                              />

                              {/* Hidden time input */}
                              <input
                                type="time"
                                ref={timeInputRef}
                                value={selectedTime}
                                onChange={handleTimeChange}
                                className="absolute opacity-0 pointer-events-none w-0 h-0"
                              />

                              {/* Displayed text to click */}
                              <p
                                className="text-sm text-[#F86060]"
                                onClick={openDatePicker}
                              >
                                {selectedDate && selectedTime
                                  ? `${new Date(
                                      `${selectedDate}T${selectedTime}`
                                    ).toLocaleString("en-GB")}`
                                  : "Select date & time"}
                              </p>

                              {/* Save icon only when both are filled */}
                              {isDateTimeEdited && selectedDate && (
                                <CheckCircleIcon
                                  className="w-7 h-7 text-blue-600 cursor-pointer"
                                  onClick={saveDateTime}
                                  title="Save Date & Time"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={` h-fit mx-auto flex  mt-5 gap-4 ${
          width < 1415
            ? "w-full flex-col justify-center items-center"
            : "w-[95%] flex-col"
        }`}
      >
        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[1000px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={` flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">PROM ANALYSIS</p>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="8 10" vertical={false} />

                <XAxis
                  dataKey="name"
                  label={{
                    value: "DAYS",
                    position: "insideBottom",
                    offset: -5,
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }} // tick values
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                    dx: 15,
                  }}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }} // tick values
                  domain={[0, 100]}
                />

                <Tooltip
                  isAnimationActive={false}
                  content={({ active, payload, label }) => {
                    if (label === "SURGERY" || !active || !payload?.length)
                      return null;

                    console.log("PROM Payload" + payload);

                    return (
                      <div className="bg-white p-2 border rounded shadow text-black">
                        <p className="font-semibold">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} style={{ color: entry.stroke }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      oks: "Oxford Knee Score",
                      sf12: "Short Form - 12",
                      koos: "KOOS",
                      kss: "Knee Society Score",
                      fjs: "Forgotten Joint Score",
                    };

                    const colors = {
                      oks: "#4F46E5",
                      sf12: "#A855F7",
                      koos: "#10B981",
                      kss: "#F97316",
                      fjs: "#3B82F6",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <ReferenceLine
                  x="SURGERY"
                  stroke="limegreen"
                  strokeWidth={2}
                  ifOverflow="visible"
                  isFront
                />

                {["oks", "sf12", "koos", "kss", "fjs"].map((key, i) => {
                  const colors = [
                    "#4F46E5", // Indigo
                    "#A855F7", // Purple
                    "#10B981", // Emerald
                    "#F97316", // Orange
                    "#3B82F6", // Blue
                  ];

                  const labels = {
                    oks: "Oxford Knee Score",
                    sf12: "Short Form - 12",
                    koos: "KOOS",
                    kss: "Knee Society Score",
                    fjs: "Forgotten Joint Score",
                  };

                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      connectNulls={true} // Continue connecting lines even when there's no data
                      name={labels[key]}
                      stroke={colors[i]}
                      strokeWidth={2}
                      dot={({ cx, cy, payload, index }) => {
                        // Check if the value exists before rendering the dot
                        if (payload[key] == null || payload[key] === 0) {
                          return null; // Don't render the dot if there's no data
                        }

                        return (
                          <circle
                            key={`dot-${index}`} // Ensure unique key
                            cx={cx}
                            cy={cy}
                            r={3}
                            stroke={colors[i]}
                            strokeWidth={1}
                            fill={colors[i]}
                          />
                        );
                      }}
                      activeDot={({ payload }) => {
                        // Only show active dot if there's data
                        if (payload[key] == null || payload[key] === 0) {
                          return null; // Don't render active dot if there's no data
                        }

                        return (
                          <circle
                            r={6}
                            stroke="black"
                            strokeWidth={2}
                            fill="white"
                          />
                        );
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              SHORT FORM 12 (PCS vs MCS)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="8 10" vertical={false} />

                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-0.5, transformedData.length - 0.5]}
                  tickFormatter={(tick) => {
                    const i = Math.round(tick);
                    return transformedData[i]?.name || "";
                  }}
                  ticks={transformedData.map((_, index) => index)}
                  allowDecimals={false}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }}
                  label={{
                    value: "DAYS",
                    position: "insideBottom",
                    offset: -5,
                    fontWeight: "bold",
                    fill: "#615E83",
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  domain={["dataMin - 10", "dataMax + 10"]}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }}
                  label={{
                    value: "Score ",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fontWeight: "bold",
                    fill: "#615E83",
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                  }}
                />

                <Tooltip />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      pcs: "Physical Component Summary (PCS)",
                      mcs: "Mental Component Summary (MCS)",
                    };

                    const colors = {
                      pcs: "#4A3AFF",
                      mcs: "#962DFF",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <ReferenceLine
                  x={surgeryIndex}
                  stroke="limegreen"
                  strokeWidth={2}
                  label={{
                    value: "Surgery",
                    position: "top",
                    fill: "limegreen",
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                />

                {/* Physical Component Summary (PCS) Scatter */}
                <Scatter
                  name="Physical (PCS)"
                  data={dataPCS.filter(
                    (point) => point.y != null && point.x != null
                  )} // Filter out invalid data
                  fill="red"
                >
                  <ErrorBar
                    dataKey="error"
                    direction="y"
                    width={4}
                    stroke="#4A3AFF"
                  />
                </Scatter>

                {/* Mental Component Summary (MCS) Scatter */}
                <Scatter
                  name="Mental (MCS)"
                  data={dataMCS.filter(
                    (point) => point.y != null && point.x != null
                  )} // Filter out invalid data
                  fill="red"
                >
                  <ErrorBar
                    dataKey="error"
                    direction="y"
                    width={4}
                    stroke="#962DFF"
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[1000px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">OXFORD KNEE SCORE </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={databox.filter(
                  (item) =>
                    item.min !== undefined &&
                    item._median !== undefined &&
                    item._min !== undefined &&
                    item._max !== undefined
                )} // Filter out undefined data
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {payload.map((entry, index) => {
                          const value = entry?.value;
                          return (
                            <p
                              key={index}
                              style={{
                                margin: 0,
                                color: entry?.color ?? "#000",
                              }}
                            >
                              {entry.name}:{" "}
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Oxford Knee Score",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />

                {/* Median Line */}
                <Scatter
                  data={databox.filter((item) => item._median !== undefined)} // Ensure valid data
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />

                {/* Min Line */}
                <Scatter
                  data={databox.filter((item) => item._min !== undefined)} // Ensure valid data
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />

                {/* Max Line */}
                <Scatter
                  data={databox.filter((item) => item._max !== undefined)} // Ensure valid data
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />

                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={databox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // optional: clamp to realistic max
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />

                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 48]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">SHORT FORM 12</p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={sf12Databox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {payload.map((entry, index) => {
                          const value = entry?.value;
                          return (
                            <p
                              key={index}
                              style={{
                                margin: 0,
                                color: entry?.color ?? "#000",
                              }}
                            >
                              {entry.name}:{" "}
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Short Form 12",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />

                {/* Median Line */}
                <Scatter
                  data={sf12Databox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />

                {/* Min Line */}
                <Scatter
                  data={sf12Databox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />

                {/* Max Line */}
                <Scatter
                  data={sf12Databox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />

                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={sf12Databox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient <= 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />

                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 100]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[1000px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              KNEE INJURY AND OSTHEOARTHRITIS OUTCOME SCORE (KOOS)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={koosDatabox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {payload.map((entry, index) => {
                          const value = entry?.value;
                          return (
                            <p
                              key={index}
                              style={{
                                margin: 0,
                                color: entry?.color ?? "#000",
                              }}
                            >
                              {entry.name}:{" "}
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Knee Injury and Osteoarthritis Outcome Score (KOOS)",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />

                {/* Median Line */}
                <Scatter
                  data={koosDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />

                {/* Min Line */}
                <Scatter
                  data={koosDatabox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />

                {/* Max Line */}
                <Scatter
                  data={koosDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />

                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={koosDatabox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />

                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 28]} // Set domain to match your data range
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              KNEE SOCIETY SCORE (KSS)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={kssDatabox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {payload.map((entry, index) => {
                          const value = entry?.value;
                          return (
                            <p
                              key={index}
                              style={{
                                margin: 0,
                                color: entry?.color ?? "#000",
                              }}
                            >
                              {entry.name}:{" "}
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Knee Scociety Score",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />

                {/* Median Line */}
                <Scatter
                  data={kssDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />

                {/* Min Line */}
                <Scatter
                  data={kssDatabox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />

                {/* Max Line */}
                <Scatter
                  data={kssDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />

                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={kssDatabox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />

                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 100]} // Set domain to match your data range
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[500px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-full" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              FORGOTTEN JOINT SCORE (FJS){" "}
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={fjsDatabox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {payload.map((entry, index) => {
                          const value = entry?.value;
                          return (
                            <p
                              key={index}
                              style={{
                                margin: 0,
                                color: entry?.color ?? "#000",
                              }}
                            >
                              {entry.name}:{" "}
                              {value !== null && typeof value === "number"
                                ? value.toFixed(2)
                                : "No Data Available"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Forgotten Joint Score",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />

                {/* Median Line */}
                <Scatter
                  data={fjsDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />

                {/* Min Line */}
                <Scatter
                  data={fjsDatabox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />

                {/* Max Line */}
                <Scatter
                  data={fjsDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />

                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={fjsDatabox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />
                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 60]} // Set domain to match your data range
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Surgeryreport
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patient={patient}
        userData={userData}
        onSurgeryUpdate={(updatedDetails) => {
          setsurgeryPatient((prev) => ({
            ...prev,
            post_surgery_details: updatedDetails,
          }));
        }}
      />
    </>
  );
};

export default page;
