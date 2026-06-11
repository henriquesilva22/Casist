# Capacitor Setup

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npm run build
npm run export
npx cap add android
npx cap sync android
npx cap open android
```

Use estas permissões no AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```
