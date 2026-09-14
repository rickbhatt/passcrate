import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
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

export { checkBiometricSupport, cn, generateUUID };
