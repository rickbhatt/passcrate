import { clsx, type ClassValue } from "clsx";
import { format, isToday, isYesterday } from "date-fns";
import * as ExpoCrypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

const generateUUID = () => {
  return ExpoCrypto.randomUUID();
};

const checkBiometricSupport = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  return hasHardware && isEnrolled;
};

export const formatDateTime = (date: string | Date | undefined) => {
  if (!date)
    return { dateMonthOnly: "", shortDateWithYear: "", dateToISOString: "" };

  const formatDateMonth = format(new Date(date), "d MMM");

  const formatShortDateWithYear = format(new Date(date), "d MMM yyyy");

  const formatDateToISOString = format(new Date(date), "yyyy-MM-dd");

  const formatDateTimeToISOString = format(
    new Date(date),
    "dd/MM/yyyy, hh:mm a",
  );

  const formatOnlyTime = format(new Date(date), "hh:mm a");

  return {
    dateMonthOnly: formatDateMonth,
    shortDateWithYear: formatShortDateWithYear,
    dateToISOString: formatDateToISOString,
    dateTimeToISOString: formatDateTimeToISOString,
    onlyTime: formatOnlyTime,
  };
};

/** "Today, 12:59 pm" / "Yesterday, 12:59 pm" / "3 Sep 2026, 12:59 pm". */
const formatBackupDate = (date: Date) => {
  const time = format(date, "h:mm aaa");
  if (isToday(date)) return `Today, ${time}`;
  if (isYesterday(date)) return `Yesterday, ${time}`;
  return `${format(date, "d MMM yyyy")}, ${time}`;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};

export {
  checkBiometricSupport,
  cn,
  formatBackupDate,
  formatBytes,
  generateUUID,
};
