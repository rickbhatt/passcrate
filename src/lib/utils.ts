import { clsx, type ClassValue } from "clsx";
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

export { checkBiometricSupport, cn, generateUUID };
