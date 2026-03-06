import * as Notifications from 'expo-notifications';
import { Button } from 'react-native';

interface NotificationButtonProps {
  title?: string;
  body?: string;
  type?: 'instant' | 'reminder' | 'dueSoon' | 'overdue' | 'rotation'; // Optional prop to specify notification type
  buttonTitle?: string; // Optional prop for button text (defaults to "Send Notification")
}

export default function Notification({
  title = 'Dorm Chores Reminder',
  body = 'Do your chores today!',
  buttonTitle = 'Send Notification', // Defaulted to button for testing purposes most likely will be changed to something else in the future
}: NotificationButtonProps) {
  const sendTimerNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 }, // null = send immediately
    });
  };

  const sendInstantNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null, // Send immediately
    });
  };

  const sendScheduledNotification = async (hours: number) => {
    //Will update this to be with calander schedule
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: hours * 3600,
      },
    });
  };

  return (
    <>
      <Button title="Send Instant Notification" onPress={sendInstantNotification} />
      <Button title="Send Timer Notification" onPress={sendTimerNotification} />
      <Button title="Send Scheduled Notification" onPress={() => sendScheduledNotification(0.1)} />
    </>
  );
}
