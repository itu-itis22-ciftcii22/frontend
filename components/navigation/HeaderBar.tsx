import React from "react";
import { View, XStack, Button, Text } from "tamagui";
import { User as UserIcon, Sun, Moon, Globe } from "@tamagui/lucide-icons-2";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth";
import { usePreferences } from "../Provider";
import { router } from "expo-router";

interface HeaderBarProps {
  title?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showProfile?: boolean;
  children?: React.ReactNode;
}

export function HeaderBar({
  title,
  leftElement,
  rightElement,
  showProfile = true,
  children,
}: HeaderBarProps) {
  const { t } = useTranslation();
  const { clearActiveSession } = useAuth();
  const { theme, setTheme, language, setLanguage } = usePreferences();

  const handleAccountSwitch = async () => {
    await clearActiveSession();
    router.replace("/login" as any);
  };

  return (
    <XStack
      p="$3"
      gap="$2.5"
      alignItems="center"
      bg="$surfaceDeep"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      zIndex={100}
    >
      {leftElement ? (
        leftElement
      ) : (
        <Text fontSize="$5" fontWeight="bold" color="$color12">
          {title}
        </Text>
      )}

      <View flex={1} />
      {children}
      <View flex={1} />

      {rightElement}

      {showProfile && (
        <XStack gap="$1.5" alignItems="center">
          <Button
            size="$3"
            circular
            chromeless
            hoverStyle={{ bg: "$surfaceHover" }}
            pressStyle={{ scale: 0.95 }}
            icon={theme === "dark" ? <Sun size={18} color="$color12" /> : <Moon size={18} color="$color12" />}
            onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          />

          <Button
            size="$3"
            circular
            chromeless
            hoverStyle={{ bg: "$surfaceHover" }}
            pressStyle={{ scale: 0.95 }}
            icon={<Globe size={18} color="$color12" />}
            onPress={() => setLanguage(language === "en" ? "tr" : "en")}
          />

          <Button
            size="$3"
            circular
            bg="$brandPrimary"
            hoverStyle={{ bg: "$brandPrimaryHover" }}
            pressStyle={{ scale: 0.95 }}
            icon={<UserIcon size={18} color="$accentForeground" />}
            onPress={handleAccountSwitch}
          />
        </XStack>
      )}
    </XStack>
  );
}
