import PasswordForm from "@/components/password-form";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { addPassword } from "@/db/mutations/passwords.mutation";
import { validatePasswordForm } from "@/lib/validation/password";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";
import { PasswordFormErrors, PasswordFormProps, PasswordFormValue } from "types";

const initialFormData: PasswordFormValue = {
  title: "",
  username: "",
  password: "",
  url: "",
  notes: "",
  folderId: "",
  folderName: "",
  tags: [],
  expiryDays: "",
};

const AddPassword = () => {
  const [formData, setFormData] = useState<PasswordFormValue>(initialFormData);
  const [errors, setErrors] = useState<PasswordFormErrors>({});

  const db = useDb();
  const { derivedKey } = useCrypto();

  const handleChange: PasswordFormProps["onChange"] = (data) => {
    setFormData((prev) => {
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
    if (!derivedKey) return;

    const result = validatePasswordForm(formData);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    try {
      await addPassword({ db, derivedKey, values: formData });
      toast.success("Password saved successfully");
      setFormData(initialFormData);
    } catch (error) {
      console.error("🚀 ~ handleSubmit ~ error", error);
      toast.error("Failed to save password");
    }
  };

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

export default AddPassword;
