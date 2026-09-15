import QuickCrypto from "react-native-quick-crypto";

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

interface GeneratePasswordOptions {
  length?: number;
  useUppercase?: boolean;
  useLowercase?: boolean;
  useDigits?: boolean;
  useSymbols?: boolean;
}

const randomIndex = (max: number) => {
  const maxValidByte = 256 - (256 % max);
  let byte: number;
  do {
    byte = QuickCrypto.randomBytes(1)[0];
  } while (byte >= maxValidByte);
  return byte % max;
};

export const generatePassword = (options?: GeneratePasswordOptions) => {
  const {
    length = 16,
    useUppercase = true,
    useLowercase = true,
    useDigits = true,
    useSymbols = true,
  } = options ?? {};

  const enabledCharsets = [
    useLowercase && CHARSETS.lowercase,
    useUppercase && CHARSETS.uppercase,
    useDigits && CHARSETS.digits,
    useSymbols && CHARSETS.symbols,
  ].filter((charset): charset is string => Boolean(charset));

  const alphabet = enabledCharsets.join("");

  const passwordChars = Array.from(
    { length },
    () => alphabet[randomIndex(alphabet.length)],
  );

  enabledCharsets.forEach((charset) => {
    const hasCharFromSet = passwordChars.some((char) => charset.includes(char));
    if (!hasCharFromSet) {
      const position = randomIndex(passwordChars.length);
      passwordChars[position] = charset[randomIndex(charset.length)];
    }
  });

  return passwordChars.join("");
};
