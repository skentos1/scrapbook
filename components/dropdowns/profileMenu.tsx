// ✅ ProfileMenu.tsx (komponenta dropdownu profilu)
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "react-native-heroicons/outline";
import { useAuth } from "../../context/AuthContext";

const ProfileMenu = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setOpen(!open)}
      >
        <UserCircleIcon size={24} color="#fff" />
      </TouchableOpacity>

      {open && isAuthenticated && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigate("/profile")}
          >
            <UserCircleIcon size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.menuText}>Môj profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              logout();
              setOpen(false);
            }}
          >
            <ArrowRightOnRectangleIcon
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.menuText}>Odhlásiť sa</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 999,
  },
  avatarButton: {
    backgroundColor: "#9333ea",
    padding: 8,
    borderRadius: 999,
  },
  menu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 240,
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  menuText: {
    color: "#fff",
    fontSize: 14,
  },
});

export default ProfileMenu;
