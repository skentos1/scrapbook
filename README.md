
# Scrapbook - Your Digital Memory Keeper 📖✨

[![Expo Go Compatible](https://img.shields.io/badge/Expo%20Go-Compatible-green)](https://expo.dev/go)
[![React Native](https://img.shields.io/badge/React%20Native-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-000000.svg?style=for-the-badge&logo=appwrite&logoColor=F0287A)](https://appwrite.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Scrapbook is a mobile application built with Expo and React Native, designed to help you capture, preserve, and relive your precious memories. It provides a beautiful and intuitive interface for creating digital scrapbooks, adding photos, and documenting your experiences.

## ✨ Key Features

-   **Create Stunning Scrapbooks:** Easily create and customize digital scrapbooks to organize your memories.
-   **Rich Media Support:** Add photos, dates, locations, and descriptions to your memories.
-   **Intuitive User Interface:** Enjoy a seamless and engaging user experience with beautiful animations and a user-friendly design.
-   **Secure Authentication:** Built-in authentication using Appwrite.
-   **Favorite Scrapbooks:** Mark scrapbooks as favorites for quick access.
-   **Offline Access:** Access your scrapbooks and memories even without an internet connection (implementation dependent).
-   **Themed Experiences:** Select from a variety of themes to customize the look and feel of your scrapbooks.
-   **Share Memories:** Easily share your scrapbook with friends and family.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (>=18)
-   [npm](https://www.npmjs.com/) (or [Yarn](https://yarnpkg.com/))
-   [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
-   [Appwrite Account](https://appwrite.io/) (for backend services)

### Installation

1.  **Clone the repository:**

    bash
    npm install
    # or
    yarn install
    > -   Create a new project in your Appwrite console.
> -   Set up a database and collections for `users`, `scrapbooks`, and `memories`.  Ensure proper indexing for efficient queries.
> -   Configure authentication methods (e.g., email/password).  Consider adding OAuth providers (Google, Apple) for easier signup.
> -   Create a storage bucket for storing images.
> -   Update the `.env` file (create one if it doesn't exist) with your Appwrite project ID, database ID, collection IDs, and storage bucket ID. Example:

2.  **Choose your preferred way to run the app:**

    -   **Expo Go:** Scan the QR code with the Expo Go app on your iOS or Android device.
    -   **Android Emulator/iOS Simulator:**  Press `a` for Android or `i` for iOS to run in an emulator or simulator.  You may need to configure these separately.
    -   **Development Build:** Create a custom development build for more advanced features.

### Basic Usage

1.  **Creating a Scrapbook:**

    -   Tap the "Create" tab or button.
    -   Enter a title and description for your scrapbook.
    -   Add a cover image (optional).
    -   Tap "Create Scrapbook" to save your new scrapbook.

2.  **Adding Memories:**

    -   Open a scrapbook from the "Scrapbooks" tab or home screen.
    -   Tap the "Add Memory" button.
    -   Choose an image from your gallery or take a new photo.
    -   Add a title, description, date, and location for your memory.
    -   Tap "Add Memory" to save the memory to your scrapbook.

3.  **Navigating:**

    -   Use the tab bar to navigate between the "Home," "Discover," "Create," "Scrapbooks," and "Profile" screens.
    -   Use the back button in the top-left corner to navigate back to the previous screen.

## ⚙️ Configuration

-   **Environment Variables:** Store sensitive information like API keys and database credentials in a `.env` file at the root of your project. Use the `dotenv` package (already included in Expo) to load these variables into your application. Make sure to add `.env` to your `.gitignore` file to prevent committing sensitive information.

## 📝 Code Highlights

### Authentication (context/AuthContext.tsx & lib/auth.ts)

typescript
export const AuthProvider =