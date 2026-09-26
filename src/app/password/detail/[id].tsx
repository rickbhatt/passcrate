import ConfirmDialog from "@/components/confirm-dialog";
import DynamicIcon from "@/components/dynamic-icon";
import ScreenHeader from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  deletePassword,
  incrementAccessCount,
  toggleFavourite,
} from "@/db/mutations/passwords.mutation";
import { passwordById } from "@/db/queries/passwords.queries";
import { copySensitiveText } from "@/lib/clipboard";
import { decrypt } from "@/lib/crypto";
import { formatDateTime } from "@/lib/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";

const toOpenableUrl = (url: string) =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <View className="detail-group">
    <Text className="text-base text-text-primary font-sans-semibold">
      {label}
    </Text>
    <Text className="font-sans text-lg text-text-primary">{value}</Text>
  </View>
);

const DetailLinkField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View className="detail-group">
    <Text className="text-base text-text-primary font-sans-semibold">
      {label}
    </Text>
    <Pressable
      onPress={() => {
        Linking.openURL(toOpenableUrl(value)).catch((error) => {
          console.error("🚀 ~ DetailLinkField ~ error", error);
          toast.error("Failed to open link");
        });
      }}
    >
      <Text className="font-sans text-lg text-primary underline">{value}</Text>
    </Pressable>
  </View>
);

const PasswordDetail = () => {
  const COLORS = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const db = useDb();

  const router = useRouter();

  const { derivedKey } = useCrypto();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { data } = useLiveQuery(passwordById({ db, id }));

  const password = data?.[0];

  useEffect(() => {
    if (!id) return;
    incrementAccessCount({ db, id }).catch((error) => {
      console.error("🚀 ~ PasswordDetail access increment ~ error", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getDecryptedPassword = () => {
    if (!password || !derivedKey) return null;
    return decrypt(password.encryptedPassword, derivedKey);
  };

  const handleToggleFavourite = async () => {
    if (!password) return;
    try {
      await toggleFavourite({ db, id, isFavourite: !password.isFavourite });
    } catch (error) {
      console.error("🚀 ~ handleToggleFavourite ~ error", error);
      toast.error("Failed to update favourite");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePassword({ db, id });
      toast.success("Password deleted successfully");
      router.back();
    } catch (error) {
      console.error("🚀 ~ handleDelete ~ error", error);
      toast.error("Failed to delete password");
    }
  };

  const handleCopyPassword = async () => {
    try {
      const decrypted = getDecryptedPassword();
      if (!decrypted) return;

      await copySensitiveText(decrypted);
      toast.success("Password copied");
    } catch (error) {
      console.error("🚀 ~ handleCopyPassword ~ error", error);
      toast.error("Failed to copy password");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <ScreenHeader showBackButton title={password?.title ?? ""} />
          ),
        }}
      />
      <View className="main">
        {/* header */}
        <View className="flex-row justify-end">
          {/* button container */}
          <View className="flex-row gap-x-3">
            {/* favourite */}
            <Button
              variant={password?.isFavourite ? "success" : "secondary"}
              size="icon"
              onPress={handleToggleFavourite}
              className="h-14 w-14 rounded-full"
            >
              <DynamicIcon
                family="FontAwesome6"
                name="star"
                color={
                  password?.isFavourite
                    ? COLORS.primaryForeground
                    : COLORS.textPrimary
                }
              />
            </Button>
            {/* delete */}
            <Button
              variant="destructive"
              size="icon"
              onPress={() => setIsDeleteDialogOpen(true)}
              className="h-14 w-14 rounded-full"
            >
              <DynamicIcon
                family="FontAwesome6"
                name="trash"
                color={COLORS.primaryForeground}
              />
            </Button>
            {/* edit */}
            <Button
              variant="secondary"
              size="icon"
              onPress={() => router.push(`/password/edit/${id}`)}
              className="h-14 w-14 rounded-full"
            >
              <DynamicIcon
                family="FontAwesome6"
                name="pen"
                color={COLORS.textPrimary}
              />
            </Button>
          </View>
        </View>
        {/* content */}
        <View className="flex-col gap-y-4 mt-6">
          {password?.username ? (
            <DetailField label="Username" value={password.username} />
          ) : null}

          <View className="flex-row items-end justify-between gap-x-3">
            <View className="detail-group flex-1">
              <Text className="text-base text-text-primary font-sans-semibold">
                Password
              </Text>
              <Text className="text-lg text-text-primary font-sans">
                {isPasswordVisible ? getDecryptedPassword() : "••••••••••"}
              </Text>
            </View>
            <Button
              variant="secondary"
              size="icon"
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              className="h-11 w-11 min-h-0 rounded-full"
            >
              <DynamicIcon
                family="FontAwesome6"
                name={isPasswordVisible ? "eye-slash" : "eye"}
                size={18}
              />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onPress={handleCopyPassword}
              className="h-11 w-11 min-h-0 rounded-full"
            >
              <DynamicIcon family="FontAwesome6" name="copy" size={18} />
            </Button>
          </View>

          {password?.url ? (
            <DetailLinkField label="URL" value={password.url} />
          ) : null}

          {password?.notes ? (
            <DetailField label="Notes" value={password.notes} />
          ) : null}

          {password?.expiresAt ? (
            <DetailField
              label="Expires"
              value={formatDateTime(password.expiresAt).shortDateWithYear}
            />
          ) : null}

          <DetailField
            label="Created"
            value={
              formatDateTime(password?.createdAt).dateTimeToISOString ?? ""
            }
          />

          <DetailField
            label="Last Updated"
            value={
              formatDateTime(password?.updatedAt).dateTimeToISOString ?? ""
            }
          />
        </View>
      </View>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Password"
        description={`Are you sure you want to delete "${password?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
};

export default PasswordDetail;
