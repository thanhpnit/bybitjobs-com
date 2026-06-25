import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import Constants from 'expo-constants';

// Cấu hình cách hiển thị thông báo khi app đang mở (Foreground)


export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  // Cấu hình kênh thông báo mặc định cho Android (Bắt buộc để phát tiếng chuông trên Android 8.0+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default', // Phát tiếng chuông mặc định của điện thoại
    });
  }

  if (Device.isDevice) {
    // Kiểm tra quyền thông báo hiện tại
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Nếu chưa được cấp quyền, tiến hành xin quyền
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Không xin được quyền thông báo đẩy!');
      return;
    }

    try {
      // Lấy projectId cấu hình EAS động từ app.json
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn(
          '⚠️ LỖI CẤU HÌNH THÔNG BÁO ĐẨY:\n' +
          'Không tìm thấy "projectId" của EAS trong cấu hình ứng dụng.\n' +
          'Từ Expo SDK 49 trở lên, bạn bắt buộc phải có tài khoản Expo và khởi tạo EAS project để chạy thông báo đẩy.\n\n' +
          '👉 Hướng dẫn khắc phục:\n' +
          '1. Cài đặt EAS CLI nếu chưa có: npm install -g eas-cli\n' +
          '2. Đăng nhập tài khoản Expo của bạn: eas login\n' +
          '3. Chạy lệnh: eas project:init tại thư mục dự án này để tự động tạo dự án trên Expo và cập nhật projectId vào app.json\n' +
          '4. Hoặc thêm thủ công vào app.json:\n' +
          '   "extra": { "eas": { "projectId": "YOUR-EAS-PROJECT-ID-UUID" } }'
        );
        return;
      }

      // Lấy Expo Push Token
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      console.log('Expo Push Token của thiết bị:', token);

      // Lưu Token vào hồ sơ User trên Firestore để Backend gửi tin nhắn
      if (userId && token) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          expoPushToken: token,
        }, { merge: true });
        console.log(`Đã lưu token thông báo đẩy cho user: ${userId}`);
      }
    } catch (error) {
      console.error('Lỗi khi lấy hoặc lưu Expo Push Token:', error);
    }
  } else {
    console.log('Phải sử dụng thiết bị thật để kiểm tra Push Notification');
  }

  return token;
}
