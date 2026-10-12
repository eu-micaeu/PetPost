import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { dateToIso, formatBirthDate, isoToDate, parseBirthDate } from '../utils/petHelpers';

type BirthDateFieldProps = {
  /** Data em ISO (AAAA-MM-DD), '' quando vazia. No web pode conter texto incompleto. */
  value: string;
  onChange: (value: string) => void;
};

const PLACEHOLDER = 'DD/MM/AAAA';

export function BirthDateField({ value, onChange }: BirthDateFieldProps) {
  if (Platform.OS === 'web') {
    return <WebBirthDateInput value={value} onChange={onChange} />;
  }
  return <NativeBirthDatePicker value={value} onChange={onChange} />;
}

function NativeBirthDatePicker({ value, onChange }: BirthDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  const selectedDate = isoToDate(value) ?? today;
  const displayValue = formatBirthDate(value);

  return (
    <View>
      <Pressable style={styles.field} onPress={() => setIsOpen((open) => !open)}>
        <Text style={displayValue ? styles.valueText : styles.placeholderText}>
          {displayValue || PLACEHOLDER}
        </Text>
        {displayValue ? (
          <Pressable hitSlop={8} onPress={() => onChange('')}>
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        ) : null}
      </Pressable>

      {isOpen && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerBox : undefined}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={today}
            locale="pt-BR"
            themeVariant="dark"
            textColor="#FFF9FB"
            onValueChange={(_event, date) => {
              // No Android o diálogo fecha sozinho ao confirmar; no iOS o spinner atualiza ao vivo.
              if (Platform.OS === 'android') setIsOpen(false);
              onChange(dateToIso(date));
            }}
            onDismiss={() => setIsOpen(false)}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              style={styles.confirmBtn}
              onPress={() => {
                if (!value) onChange(dateToIso(selectedDate));
                setIsOpen(false);
              }}
            >
              <Text style={styles.confirmText}>Confirmar</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita. */
function maskDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function WebBirthDateInput({ value, onChange }: BirthDateFieldProps) {
  const [text, setText] = useState(() => formatBirthDate(value));
  const [prevValue, setPrevValue] = useState(value);

  // Sincroniza quando o formulário é preenchido/limpo externamente.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value === '') setText('');
    else if (formatBirthDate(value)) setText(formatBirthDate(value));
  }

  return (
    <TextInput
      value={text}
      onChangeText={(input) => {
        const masked = maskDate(input);
        setText(masked);
        // Texto incompleto é repassado como está para falhar na validação ao salvar.
        onChange(masked === '' ? '' : parseBirthDate(masked) ?? masked);
      }}
      placeholder={PLACEHOLDER}
      placeholderTextColor="#8F8797"
      style={[styles.field, styles.valueText]}
      keyboardType="number-pad"
      maxLength={10}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: '#13101A',
    borderWidth: 1,
    borderColor: '#2F273B',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    color: '#FFF9FB',
    fontSize: 14,
  },
  placeholderText: {
    color: '#8F8797',
    fontSize: 14,
  },
  clearText: {
    color: '#C78EA8',
    fontSize: 12,
    fontWeight: '700',
  },
  iosPickerBox: {
    marginTop: 8,
    backgroundColor: '#13101A',
    borderWidth: 1,
    borderColor: '#2F273B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F273B',
  },
  confirmText: {
    color: '#C78EA8',
    fontSize: 14,
    fontWeight: '800',
  },
});
