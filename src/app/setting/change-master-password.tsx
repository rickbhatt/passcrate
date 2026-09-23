import PasswordInput from "@/components/password-input";
import PasswordStrengthMeter from "@/components/password-strength-meter";
import { Button } from "@/components/ui/button";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  changeMasterPassword,
  updateBiometric,
} from "@/db/mutations/appConfig.mutation";
import { getAppConfig } from "@/db/queries/appConfig.queries";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { getDerivedKey } from "@/lib/crypto";
import { deleteSecureItem, setSecureItem } from "@/lib/secure-storage";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from "react-native-keyboard-controller";
import QuickCrypto from "react-native-quick-crypto";
import { toast } from "sonner-native";

const KeyboardAwareScrollView = styled(
  RNKeyboardAwareScrollView as React.ComponentType<any>,
);

type FormErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;

const ChangeMasterPasswordScreen = () => {
  const db = useDb();
  const router = useRouter();
  const { derivedKey, setDerivedKey, setBiometricAuthInProgress } =
    useCrypto();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isBusy, setIsBusy] = useState(false);

  const { score: newPasswordScore } = usePasswordStrength(newPassword);

  const canSubmit =
    !isBusy &&
    currentPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPasswordScore >= 3;

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (newPassword === currentPassword) {
      nextErrors.newPassword =
        "New password must be different from the current one";
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    return nextErrors;
  };

  // The vault is already re-keyed at this point, so a failure here must not
  // leave the old password in SecureStore: biometric unlock would then fail
  // every time. Fall back to turning fingerprint lock off instead.
  const updateStoredBiometricPassword = async () => {
    setBiometricAuthInProgress(true);
    try {
      await setSecureItem(SECURE_KEYS.MASTER_PASSWORD, newPassword, {
        requireAuthentication: true,
        authenticationPrompt: "Verify it's you",
      });
      return true;
    } catch (error) {
      console.error(error);
      await deleteSecureItem(SECURE_KEYS.MASTER_PASSWORD).catch(() => {});
      await updateBiometric({ db, enabled: false });
      return false;
    } finally {
      setBiometricAuthInProgress(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsBusy(true);
    try {
      const appConfig = await getAppConfig(db);
      if (!appConfig?.salt || !derivedKey) {
        throw new Error("Vault is not unlocked");
      }

      const currentKey = await getDerivedKey({
        masterPassword: currentPassword,
        salt: appConfig.salt,
      });
      if (currentKey !== derivedKey) {
        setErrors({ currentPassword: "Incorrect master password" });
        return;
      }

      const newSalt = QuickCrypto.randomBytes(16).toString("hex");
      const newKey = await getDerivedKey({
        masterPassword: newPassword,
        salt: newSalt,
      });

      changeMasterPassword({ db, oldKey: derivedKey, newKey, newSalt });
      setDerivedKey(newKey);

      if (appConfig.biometricEnabled) {
        const isUpdated = await updateStoredBiometricPassword();
        if (!isUpdated) {
          toast.warning(
            "Master password changed, but fingerprint lock was turned off. Turn it on again in Security.",
          );
          router.back();
          return;
        }
      }

      toast.success("Master password changed");
      router.back();
    } catch (error) {
      console.error(error);
      toast.error("Could not change master password. Nothing was changed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        bottomOffset={16}
        className="screen-x-padding"
        contentContainerClassName="flex-col gap-5 pt-3 pb-10"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm font-sans text-text-secondary">
          All your saved passwords will be re-encrypted with the new master
          password. If you forget it, your data cannot be recovered.
        </Text>

        <View className="form-group">
          <Text className="form-label">Current master password</Text>
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="current password..."
            textContentType="password"
            hasError={!!errors.currentPassword}
          />
          {errors.currentPassword && (
            <Text className="font-sans text-danger text-sm">
              {errors.currentPassword}
            </Text>
          )}
        </View>

        <View className="form-group">
          <Text className="form-label">New master password</Text>
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            placeholder="new password..."
            hasError={!!errors.newPassword}
          />
          {errors.newPassword && (
            <Text className="font-sans text-danger text-sm">
              {errors.newPassword}
            </Text>
          )}
          <PasswordStrengthMeter
            password={newPassword}
            hintText="Recommended strength: Good or higher."
          />
        </View>

        <View className="form-group">
          <Text className="form-label">Confirm new master password</Text>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="repeat new password..."
            hasError={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <Text className="font-sans text-danger text-sm">
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        <Button onPress={handleSubmit} disabled={!canSubmit} className="w-full">
          <Text className="btn-label-white">
            {isBusy ? "Changing..." : "Change master password"}
          </Text>
        </Button>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default ChangeMasterPasswordScreen;
