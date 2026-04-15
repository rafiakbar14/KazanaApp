import React, { useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import Signature from 'react-native-signature-canvas';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SignaturePadProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export default function SignaturePad({ visible, onClose, onSave, title = "Tanda Tangan" }: SignaturePadProps) {
  const ref = useRef<any>(null);

  const handleOK = (signature: string) => {
    onSave(signature);
    onClose();
  };

  const handleClear = () => {
    ref.current.clearSignature();
  };

  const handleConfirm = () => {
    ref.current.readSignature();
  };

  const style = `.m-signature-pad--footer {display: none; margin: 0px;}`;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Canvas Area */}
        <View style={styles.canvasContainer}>
          <Signature
            ref={ref}
            onOK={handleOK}
            onEmpty={() => console.log("Empty")}
            descriptionText={title}
            clearText="Clear"
            confirmText="Save"
            webStyle={style}
            autoClear={true}
          />
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={handleClear}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>Hapus</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleConfirm}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Simpan Tanda Tangan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  closeBtn: {
    padding: 4
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  footer: {
    padding: 20,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12
  },
  clearBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearBtnText: {
    color: '#475569',
    fontWeight: 'bold'
  },
  saveBtn: {
    flex: 2,
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold'
  }
});
