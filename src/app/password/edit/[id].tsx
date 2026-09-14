import PasswordForm from "@/components/password-form";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { updatePassword } from "@/db/mutations/passwords.mutation";
import { passwordWithCrateById } from "@/db/queries/passwords.queries";
import { tagsByPasswordId } from "@/db/queries/tags.queries";
import { decrypt } from "@/lib/crypto";
import { validatePasswordForm } from "@/lib/validation/password";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import {
  PasswordFormErrors,
  PasswordFormProps,
  PasswordFormValue,
} from "types";

const EditPassword = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const db = useDb();
  const router = useRouter();
  const { derivedKey } = useCrypto();

  const { data: passwordRows, updatedAt: passwordUpdatedAt } = useLiveQuery(
    passwordWithCrateById({ db, id }),
  );
  const password = passwordRows?.[0];

  const { data: tagRows, updatedAt: tagsUpdatedAt } = useLiveQuery(
    tagsByPasswordId({ db, passwordId: id }),
  );

  const [formData, setFormData] = useState<PasswordFormValue | null>(null);
  const [errors, setErrors] = useState<PasswordFormErrors>({});

  useEffect(() => {
    if (formData || !password || !derivedKey) return;
    if (!passwordUpdatedAt || !tagsUpdatedAt) return;

    setFormData({
      title: password.title,
      username: password.username ?? "",
      password: decrypt(password.encryptedPassword, derivedKey),
      url: password.url ?? "",
      notes: password.notes ?? "",
      crateId: password.crateId ?? "",
      crateName: password.crateName ?? "",
      tags: tagRows ?? [],
      expiryDays: password.expiryDays ? String(password.expiryDays) : "",
    });
  }, [
    formData,
    password,
    tagRows,
    passwordUpdatedAt,
    tagsUpdatedAt,
    derivedKey,
  ]);

  const handleChange: PasswordFormProps["onChange"] = (data) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const next = typeof data === "function" ? data(prev) : data;

      const changedKeys = (
        Object.keys(next) as (keyof PasswordFormValue)[]
      ).filter((key) => next[key] !== prev[key]);

      if (changedKeys.length > 0) {
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          changedKeys.forEach((key) => {
            delete nextErrors[key as keyof PasswordFormErrors];
          });
          return nextErrors;
        });
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    if (!derivedKey || !formData) return;

    const result = validatePasswordForm(formData);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    try {
      await updatePassword({ db, id, derivedKey, values: formData });
      toast.success("Password updated successfully");
      router.back();
    } catch (error) {
      console.error("🚀 ~ handleSubmit ~ error", error);
      toast.error("Failed to update password");
    }
  };

  if (!formData) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PasswordForm
        value={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        errors={errors}
      />
    </View>
  );
};

export default EditPassword;
