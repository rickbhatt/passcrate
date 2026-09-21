import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { useEffect, useState } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const PASSWORD_STRENGTH_INDICATOR = [
  { label: "Very Weak", color: "bg-danger" },
  { label: "Weak", color: "bg-danger/60" },
  { label: "Fair", color: "bg-primary/60" },
  { label: "Good", color: "bg-primary" },
  { label: "Strong", color: "bg-success" },
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
