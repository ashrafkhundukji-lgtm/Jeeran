# Jeeran Business (owner app)

Native Android app for shop owners. Expo SDK 58 (React Native 0.88), Expo Router, TypeScript. Its own package: nothing here is part of the website build (`mobile/` is excluded from the root tsconfig, ESLint and the Vercel upload).

## Configure

Copy `.env.example` to `.env.local` (git-ignored) and fill in:

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | same as the website's `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same as the website's `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public) |
| `EXPO_PUBLIC_API_URL` | the website, e.g. `https://jeeran.vercel.app` (default) |

These are compiled into the app. Never put the service-role key here.

## Check

```sh
npm run typecheck && npm run lint && npm test
```

## Build an APK on Windows (no Expo account)

React Native's C++ build hits Windows path-length limits from `C:\Dev\jeeran-network\mobile`, so build from a short copy and use CMake 3.31 (its ninja handles long paths):

```powershell
robocopy C:\Dev\jeeran-network\mobile C:\j\m /E /XD android .expo   # app (keep node_modules)
robocopy C:\Dev\jeeran-network\src\lib C:\j\src\lib /E              # shared copy modules
sdkmanager "cmake;3.31.6"
cd C:\j\m; npx expo prebuild -p android --clean --no-install
# android\local.properties:
#   sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk
#   cmake.dir=C:/Users/<you>/AppData/Local/Android/Sdk/cmake/3.31.6
cd android; .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

Output: `android\app\build\outputs\apk\release\app-release.apk`. It is signed with the debug key: fine to install on your own phone, not for the Play Store (that needs an upload key, milestone 3).

## Structure

- `src/app/` routes: `(auth)` login / signup / forgot-password; `(owner)` onboarding, frozen, `(tabs)` home / offers / account (scan and credits routes exist, hidden until milestone 2), `offer/new`, `offer/[id]`.
- `src/lib/apiClient.ts` the only way to the website API (`Authorization: Bearer`, refresh + retry once on 401).
- `src/shared/web.ts` the only imports from the website (copy tables, categories); a test keeps them framework-free.
- `src/ui/` design tokens and shared components. RTL is done by the app itself (`useI18n().row`, `<Txt>`), not `I18nManager`, so switching language needs no restart.
- `plugins/withAsciiProjectName.js` keeps the Gradle project name ASCII (the Arabic app name breaks Gradle on Windows).
- `package.json` `expo.autolinking.exclude`: reanimated, worklets and gesture-handler are installed only as peers of expo-router's drawer and are not used; excluding them keeps them out of the native build.
