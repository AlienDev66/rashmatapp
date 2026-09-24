import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { Avatar, Screen } from "@/src/components/ui/Screen";
import { TextField } from "@/src/components/ui/TextField";
import { pickProfileImage, uploadAvatar } from "@/src/lib/avatar";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, spacing } from "@/src/theme";
import { router } from "expo-router";
import { Camera } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useT } from "@/src/i18n";

export default function PersonalInfoScreen() {
  const t = useT();
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    setName(profile?.full_name ?? user?.email?.split("@")[0] ?? "");
    setCity(profile?.city ?? "");
    setCountry(profile?.country ?? "");
    setAge(profile?.age != null ? String(profile.age) : "");
    setWeight(profile?.weight_kg != null ? String(profile.weight_kg) : "");
    setAvatarUri(profile?.avatar_url ?? null);
  }, [profile, user?.email]);

  const onPickPhoto = async () => {
    if (!user) {
      Alert.alert(t("common.signInRequired"), t("extra.signInToUpdatePhoto"));
      return;
    }
    const { error, uri, mimeType } = await pickProfileImage();
    if (error) {
      Alert.alert(t("extra.permission"), error);
      return;
    }
    if (!uri) return;

    setBusy(true);
    setAvatarUri(uri);
    const { error: upError, url } = await uploadAvatar(user.id, uri, mimeType);
    if (upError || !url) {
      setBusy(false);
      Alert.alert(t("extra.uploadFailed"), upError ?? t("extra.uploadFailedBody"));
      setAvatarUri(profile?.avatar_url ?? null);
      return;
    }
    const { error: saveError } = await updateProfile({ avatar_url: url });
    setBusy(false);
    if (saveError) {
      Alert.alert(t("extra.couldNotSavePhoto"), saveError);
      return;
    }
    await refreshProfile();
  };

  const onSave = async () => {
    setBusy(true);
    const { error } = await updateProfile({
      full_name: name.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      age: age.trim() ? Number(age) : null,
      weight_kg: weight.trim() ? Number(weight) : null,
    });
    setBusy(false);
    if (error) {
      Alert.alert(t("extra.couldNotSave"), error);
      return;
    }
    await refreshProfile();
    Alert.alert(t("extra.profileSaved"), t("extra.profileSavedBody"), [
      { text: t("common.ok"), onPress: () => router.back() },
    ]);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        >
          <View style={styles.top}>
            <BackButton />
            <Text style={styles.title}>{t("screens.personalInfo")}</Text>
            <View style={{ width: 40 }} />
          </View>

          <Pressable style={styles.photoWrap} onPress={onPickPhoto} disabled={busy}>
            <View style={styles.avatarBox}>
              <Avatar uri={avatarUri} name={name} size={96} ring />
              <View style={styles.cameraBadge}>
                <Camera color={colors.black} size={14} />
              </View>
            </View>
            <Text style={styles.photoHint}>{busy ? t("extra.updatingPhoto") : t("extra.changePhoto")}</Text>
          </Pressable>

          <View style={styles.form}>
            <Text style={styles.label}>{t("screens.fullName")}</Text>
            <TextField value={name} onChangeText={setName} />
            <Text style={styles.label}>{t("screens.city")}</Text>
            <TextField value={city} onChangeText={setCity} />
            <Text style={styles.label}>{t("screens.country")}</Text>
            <TextField value={country} onChangeText={setCountry} />
            <Text style={styles.label}>{t("screens.age")}</Text>
            <TextField value={age} onChangeText={setAge} keyboardType="number-pad" />
            <Text style={styles.label}>{t("screens.weightKg")}</Text>
            <TextField value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
          </View>

          <View style={{ marginTop: "auto", paddingTop: 24 }}>
            <Button
              label={busy ? t("extra.saving") : t("extra.saveChanges")}
              variant="accent"
              disabled={busy}
              onPress={onSave}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  photoWrap: { alignItems: "center", marginBottom: 20 },
  avatarBox: { width: 96, height: 96 },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  photoHint: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
    marginTop: 10,
  },
  form: { gap: 8 },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 8,
  },
});
