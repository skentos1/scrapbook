import { ID } from "appwrite";
import { account } from "./appwrite";

export const authService = {
  async register(email, password, name) {
    try {
      // Najprv sa odhlás ak si prihlásený
      await this.logout().catch(() => {});

      const response = await account.create(ID.unique(), email, password, name);
      await this.login(email, password);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      // Najprv sa odhlás ak si prihlásený
      await this.logout().catch(() => {});

      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async logout() {
    try {
      return await account.deleteSession("current");
    } catch (error) {
      // Ignoruj chybu ak nie je session
      console.log("No active session to logout");
      return null;
    }
  },

  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  async getCurrentSession() {
    try {
      return await account.getSession("current");
    } catch (error) {
      return null;
    }
  },
};
