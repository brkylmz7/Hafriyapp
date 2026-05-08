import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  value: string;           // "HH:MM" formatında
  onChange: (time: string) => void;
  placeholder?: string;
  flex?: boolean;
};

const timeStringToDate = (timeStr: string): Date => {
  const now = new Date();
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    now.setHours(h, m, 0, 0);
  } else {
    now.setHours(8, 0, 0, 0);
  }
  return now;
};

const dateToTimeString = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const TimePickerInput: React.FC<Props> = ({ value, onChange, placeholder = 'Saat seçin', flex }) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(timeStringToDate(value));

  const handleOpen = () => {
    setTempDate(timeStringToDate(value));
    setShow(true);
  };

  // Android: picker doğrudan dialog açar, seçince kapanır
  const handleAndroidChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShow(false);
    if (selected) {
      onChange(dateToTimeString(selected));
    }
  };

  // iOS: modal içinde spinner, "Tamam" ile onaylanır
  const handleIOSChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
  };

  const handleIOSConfirm = () => {
    onChange(dateToTimeString(tempDate));
    setShow(false);
  };

  const handleIOSCancel = () => {
    setShow(false);
  };

  return (
    <View style={[styles.wrapper, flex && { flex: 1 }]}>
      <TouchableOpacity style={styles.input} onPress={handleOpen} activeOpacity={0.7}>
        <Text style={[styles.valueText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.clockIcon}>🕐</Text>
      </TouchableOpacity>

      {/* Android: doğrudan göster */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS: Modal içinde spinner */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleIOSCancel}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Saat Seçin</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={styles.confirmText}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleIOSChange}
                style={styles.picker}
                locale="tr-TR"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default TimePickerInput;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CFCFCF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 46,
  },
  valueText: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  placeholder: {
    color: '#AAA',
    fontWeight: '400',
  },
  clockIcon: {
    fontSize: 14,
  },
  // iOS modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  cancelText: {
    fontSize: 15,
    color: '#888',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFD500',
  },
  picker: {
    height: 200,
  },
});
