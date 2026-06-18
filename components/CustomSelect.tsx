import React from "react";
import { Select, useTheme } from "tamagui";
import { ChevronDown, ChevronUp } from "@tamagui/lucide-icons-2";

interface SelectItem {
  value: string;
  label: string;
}

const SelectContent = Select.Content as any;
const SelectViewport = Select.Viewport as any;

interface CustomSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  items: SelectItem[];
  width?: any;
  flex?: any;
  flexBasis?: any;
  minWidth?: any;
  maxWidth?: any;
  size?: any;
  triggerProps?: any;
}

export function CustomSelect({
  value,
  onValueChange,
  items,
  width,
  flex,
  flexBasis,
  minWidth,
  maxWidth,
  size = "$3",
  triggerProps,
}: CustomSelectProps) {
  const theme = useTheme();

  return (
    <Select value={value} onValueChange={onValueChange} disablePreventBodyScroll>
      <Select.Trigger
        width={width}
        flex={flex}
        flexBasis={flexBasis}
        minWidth={minWidth}
        maxWidth={maxWidth}
        iconAfter={<ChevronDown size={14} color="$color8" />}
        rounded="$3"
        size={size}
        borderColor="$borderColor"
        bg="$surfaceDeep"
        color="$color12"
        {...triggerProps}
      >
        <Select.Value color="$color12" />
      </Select.Trigger>
      <SelectContent>
        <Select.ScrollUpButton
          alignItems="center"
          justifyContent="center"
          height="$3"
        >
          <ChevronUp size={16} color="$color8" />
        </Select.ScrollUpButton>
        <SelectViewport
          unstyled
          style={{
            backgroundColor: theme.surfaceCard.get(),
            borderColor: theme.borderColor.get(),
            borderStyle: "solid",
            borderWidth: 1,
            zIndex: 200000,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {items.map((item, i) => (
            <Select.Item
              key={item.value}
              index={i}
              value={item.value}
              hoverStyle={{ bg: "$surfaceHover" }}
            >
              <Select.ItemText color="$color12">{item.label}</Select.ItemText>
            </Select.Item>
          ))}
        </SelectViewport>
        <Select.ScrollDownButton
          alignItems="center"
          justifyContent="center"
          height="$3"
        >
          <ChevronDown size={16} color="$color8" />
        </Select.ScrollDownButton>
      </SelectContent>
    </Select>
  );
}
