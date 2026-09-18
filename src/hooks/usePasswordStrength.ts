import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { useEffect, useState } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const PASSWORD_STRENGTH_INDICATOR = [
  { label: "Very Weak", color: "bg-red-500" },
  { label: "Weak", color: "bg-orange-500" },
  { label: "Fair", color: "bg-yellow-500" },
  { label: "Good", color: "bg-sky-500" },
  { label: "Strong", color: "bg-green-500" },
];

const options = {
  dictionary: {
    ...zxcvbnEnPackage.dictionary,
  },
  translations: zxcvbnEnPackage.translations,
};
const zxcvbn = new ZxcvbnFactory(options);

export const WEAK_SCORE_THRESHOLD = 1;

export const scorePasswordStrength = (password: string) =>
  zxcvbn.check(password).score;

export const usePasswordStrength = (password: string) => {
  const [score, setScore] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const result = zxcvbn.check(password);
    progress.value = withTiming((result.score + 1) / 5, { duration: 250 });
    setScore(result.score);
  }, [password]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return {
    score,
    label: PASSWORD_STRENGTH_INDICATOR[score].label,
    color: PASSWORD_STRENGTH_INDICATOR[score].color,
    animatedStyle,
  };
};
