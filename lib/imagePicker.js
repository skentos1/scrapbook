import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const imagePickerService = {
  // Request permissions
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera roll permissions to select images."
      );
      return false;
    }
    return true;
  },

  // Pick image from gallery
  async pickFromGallery() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
      return null;
    }
  },

  // Take photo with camera
  async takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera permissions to take photos."
      );
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
      return null;
    }
  },

  // Show options to pick image
  showImagePickerOptions() {
    Alert.alert("Select Image", "Choose how you want to add an image", [
      { text: "Camera", onPress: () => this.takePhoto() },
      { text: "Gallery", onPress: () => this.pickFromGallery() },
      { text: "Cancel", style: "cancel" },
    ]);
  },
};
