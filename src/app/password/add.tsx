import PasswordForm from "@/components/password-form";
import { useDb } from "@/db/hooks/useDb";
import { useState } from "react";
import { View } from "react-native";
import { PasswordInsertType } from "types";

const AddPassword = () => {
  const [formData, setFormData] = useState<Partial<PasswordInsertType>>({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    folderId: "",
    tags: [],
  });

  const db = useDb();

  const handleSubmit = () => {
    console.log("formData", formData);
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
