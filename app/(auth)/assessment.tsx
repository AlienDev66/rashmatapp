import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { ASSESSMENT_STEPS, ASSESSMENT_TOTAL } from "@/src/data/assessment";
import { images } from "@/src/data/mock";
import { useAssessmentPersistence } from "@/src/hooks/useAssessmentPersistence";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets();
  const { ready, answers, currentStep, setAnswers, setCurrentStep, complete } =
    useAssessmentPersistence();

  const stepIndex = Math.min(currentStep, ASSESSMENT_TOTAL - 1);
  const step = ASSESSMENT_STEPS[stepIndex];
  const progress = `${stepIndex + 1} of ${ASSESSMENT_TOTAL}`;

  const selected = answers[step.id];
  const canContinue = useMemo(() => {
    if (step.type === "multi") return Array.isArray(selected) && selected.length > 0;
    if (step.type === "number") return typeof selected === "number" || selected === undefined;
    return selected !== undefined && selected !== null && selected !== "";
  }, [selected, step.type]);

  const goNext = async () => {
    if (stepIndex < ASSESSMENT_TOTAL - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      await complete();
      router.replace("/(auth)/recommendations");
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setCurrentStep(stepIndex - 1);
    else router.back();
  };

  const setSingle = (id: string) => setAnswers((a) => ({ ...a, [step.id]: id }));

  const toggleMulti = (id: string) => {
    setAnswers((a) => {
      const prev = (a[step.id] as string[] | undefined) ?? [];
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return { ...a, [step.id]: next };
    });
  };

  const bumpNumber = (delta: number) => {
    if (step.type !== "number") return;
    const current =
      typeof answers[step.id] === "number" ? (answers[step.id] as number) : step.defaultValue;
    const next = Math.min(step.max, Math.max(step.min, current + delta));
    setAnswers((a) => ({ ...a, [step.id]: next }));
  };

  const numberValue =
    step.type === "number"
      ? typeof answers[step.id] === "number"
        ? (answers[step.id] as number)
        : step.defaultValue
      : 0;

  if (!ready) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <BackButton onPress={goBack} />
        <Text style={styles.headerTitle}>Assessment</Text>
        <View style={styles.step}>
          <Text style={styles.stepText}>{progress}</Text>
        </View>
      </View>

      <Text style={styles.question}>{step.question}</Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {step.type === "gender" ? (
          <View style={styles.genderCards}>
            <GenderCard
              label="♂ Male"
              image={images.avatar}
              selected={selected === "male"}
              onPress={() => setSingle("male")}
            />
            <GenderCard
              label="♀ Female"
              image={images.woman}
              selected={selected === "female"}
              onPress={() => setSingle("female")}
            />
          </View>
        ) : null}

        {step.type === "single" || step.type === "multi" ? (
          <View style={styles.options}>
            {step.options.map((opt) => {
              const on =
                step.type === "multi"
                  ? Array.isArray(selected) && selected.includes(opt.id)
                  : selected === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() =>
                    step.type === "multi" ? toggleMulti(opt.id) : setSingle(opt.id)
                  }
                  style={[styles.option, on && styles.optionOn]}
                >
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text style={[styles.optionLabel, on && styles.optionLabelOn]}>{opt.label}</Text>
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step.type === "number" ? (
          <View style={styles.numberWrap}>
            <Pressable style={styles.bump} onPress={() => bumpNumber(-1)}>
              <Text style={styles.bumpText}>−</Text>
            </Pressable>
            <View style={styles.numberCenter}>
              <Text style={styles.numberValue}>{numberValue}</Text>
              <Text style={styles.numberUnit}>{step.unit}</Text>
            </View>
            <Pressable style={styles.bump} onPress={() => bumpNumber(1)}>
              <Text style={styles.bumpText}>+</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step.skippable ? (
          <Button label="Prefer to skip, thanks!  ✕" variant="soft" onPress={goNext} />
        ) : null}
        <Button
          label="Go  →"
          onPress={goNext}
          disabled={step.type === "number" ? false : !canContinue && !step.skippable}
        />
      </View>
    </View>
  );
}

function GenderCard({
  label,
  image,
  selected,
  onPress,
}: {
  label: string;
  image: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={[styles.radioDark, selected && styles.radioDarkOn]}>
          {selected ? <View style={styles.radioDotDark} /> : null}
        </View>
      </View>
      <Image source={{ uri: image }} style={styles.cardImage} contentFit="cover" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  loading: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 16 },
  step: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  stepText: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 12 },
  question: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 18,
  },
  body: { paddingBottom: 16, gap: 12 },
  options: { gap: 12 },
  option: {
    minHeight: 58,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionOn: {
    backgroundColor: colors.accent,
  },
  optionIcon: { fontSize: 20 },
  optionLabel: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  optionLabelOn: { color: colors.white },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.white },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  genderCards: { gap: 14 },
  card: {
    height: 140,
    borderRadius: radii.xl,
    backgroundColor: "#F2F2F2",
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: colors.accent },
  cardLeft: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  cardLabel: { color: colors.black, fontFamily: fonts.poppinsSemiBold, fontSize: 18 },
  radioDark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDarkOn: { borderColor: colors.black },
  radioDotDark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.black,
  },
  cardImage: { width: "48%", height: "100%" },
  numberWrap: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  bump: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bumpText: {
    color: colors.white,
    fontSize: 28,
    fontFamily: fonts.poppinsBold,
    lineHeight: 32,
  },
  numberCenter: { alignItems: "center", minWidth: 120 },
  numberValue: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 64,
    lineHeight: 68,
  },
  numberUnit: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    marginTop: 4,
  },
  footer: { gap: 12, marginTop: 12 },
});
