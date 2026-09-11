import PasswordForm from "@/components/password-form";
import { useCrypto } from "@/contexts/CryptoContext";
import { addPassword } from "@/db/mutations/passwords.mutation";
import { useDb } from "@/db/hooks/useDb";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";
import { PasswordFormValue } from "types";

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

  const db = useDb();
  const { derivedKey } = useCrypto();

  const handleSubmit = async () => {
    if (!derivedKey) return;

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
        onChange={setFormData}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

export default AddPassword;
