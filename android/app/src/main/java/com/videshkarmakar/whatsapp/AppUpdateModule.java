package com.videshkarmakar.whatsapp;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;

import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

/** Native support for the in-app App Update flow. */
public class AppUpdateModule extends ReactContextBaseJavaModule {

    public AppUpdateModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AppUpdateModule";
    }

    @ReactMethod
    public void getVersionName(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            PackageInfo info = context.getPackageManager()
                    .getPackageInfo(context.getPackageName(), 0);
            promise.resolve(info.versionName);
        } catch (Exception error) {
            promise.reject("VERSION_ERROR", error.getMessage(), error);
        }
    }

    @ReactMethod
    public void getApkVersionName(String filePath, Promise promise) {
        try {
            if (filePath == null || filePath.isEmpty()) {
                promise.reject("VERSION_ERROR", "No APK path provided");
                return;
            }
            File apkFile = new File(filePath);
            if (!apkFile.exists()) {
                promise.reject("VERSION_ERROR", "APK file was not found");
                return;
            }
            PackageInfo info = getReactApplicationContext()
                    .getPackageManager()
                    .getPackageArchiveInfo(filePath, 0);
            if (info == null || info.versionName == null) {
                promise.reject("VERSION_ERROR", "Could not read APK version");
                return;
            }
            promise.resolve(info.versionName);
        } catch (Exception error) {
            promise.reject("VERSION_ERROR", error.getMessage(), error);
        }
    }

    @ReactMethod
    public void installApk(String filePath, Promise promise) {
        try {
            if (filePath == null || filePath.isEmpty()) {
                promise.reject("INSTALL_ERROR", "No APK path provided");
                return;
            }

            Context context = getReactApplicationContext();
            File apkFile = new File(filePath);
            if (!apkFile.exists()) {
                promise.reject("INSTALL_ERROR", "Downloaded APK was not found");
                return;
            }

            Uri apkUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                apkUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        apkFile);
            } else {
                apkUri = Uri.fromFile(apkFile);
            }

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(
                    apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(installIntent);
            promise.resolve(true);
        } catch (Exception error) {
            promise.reject("INSTALL_ERROR", error.getMessage(), error);
        }
    }
}
