/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform, StyleSheet, View, WebView, BackHandler, Text, Alert, TouchableOpacity,
} from 'react-native';
import { width, height, totalSize } from 'react-native-dimension';
import WebViewBridge from 'react-native-webview-bridge-updated';
import FCM, {FCMEvent, RemoteNotificationResult, WillPresentNotificationResult, NotificationType} from 'react-native-fcm';

const base64 = require('base-64');
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  container_launch: {
    width: width(100), height: height(100), position: 'absolute' },
  container_webview: {
    width: width(100),
    height: height(100),
    // marginTop: 20,
    backgroundColor: '#FFF',
  },
  container_webview_plus: {
    width: 375,
    height: height(100),
    marginTop: 40,
    marginLeft: 19,
    backgroundColor: '#FFF',
    transform: [{ scale: 1.11 }],
  },
  container_webview_x: {},
});

FCM.on(FCMEvent.RefreshToken, (token) => {
  //Alert.alert('refresh:'+token);
  // fcm token may not be available on first load, catch it here
});


class Main extends React.Component {
  constructor(props) {
    super(props);

    // 초기값 저장
    this.state = {
      token: ''
    };

    this.webview = null;
    this.uri='https://push.sleepinglion.pe.kr/';

  }

  componentDidMount() {
    // iOS: show permission prompt for the first call. later just check permission in user settings
    // Android: check permission in user settings
    FCM.requestPermissions(); // .then( () => console.log('granted') ).catch(() => console.log('notification permission rejected'));

    FCM.getFCMToken().then((token) => {
        this.setState({ token : token})
        this.checkSessionWithToken();
        // store fcm token in your server
    });

    this.notificationListener = FCM.on(FCMEvent.Notification, async (notif) => {
      Alert.alert('Receive Noti');
      if (Platform.OS === 'ios') {
        // optional
        // iOS requires developers to call completionHandler to end notification process. If you do not call it your background remote notifications could be throttled, to read more about it see the above documentation link.
        // This library handles it for you automatically with default behavior (for remote notification, finish with NoData; for WillPresent, finish depend on "show_in_foreground"). However if you want to return different result, follow the following code to override
        // notif._notificationType is available for iOS platfrom
        switch (notif._notificationType) {
          case NotificationType.Remote:
            notif.finish(RemoteNotificationResult.NewData); // other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
            break;
          case NotificationType.NotificationResponse:
            notif.finish();
            break;
          case NotificationType.WillPresent:
            notif.finish(WillPresentNotificationResult.All); // other types available: WillPresentNotificationResult.None
            break;
          default:
            break;
        }
      }
    });

    // initial notification contains the notification that launchs the app. If user launchs app by clicking banner, the banner notification info will be here rather than through FCM.on event
    // sometimes Android kills activity when app goes to background, and when resume it broadcasts notification before JS is run. You can use FCM.getInitialNotification() to capture those missed events.
    // initial notification will be triggered all the time even when open app by icon so send some action identifier when you send notification
    FCM.getInitialNotification().then(notif => {
       console.log(notif)
    });
}

componentWillUnmount() {
    // stop listening for events
    this.notificationListener.remove();
}

componentWillMount() {
  BackHandler.addEventListener('hardwareBackPress', this.backHandler);
}

backHandler = () => {
  if(this.state.backButtonEnabled && this.webview) {
    this.webview.goBack();
    return true;
  }
  return false;
};

  onBridgeMessage(message){
    const { webviewbridge } = this.refs;

    const msg = JSON.parse(message);
    
    switch (msg.action) {
      case 'login' :
        this.fetchToken();
        webviewbridge.sendToBridge("change url");
        break;
      case 'message' :
        Alert.alert('알림', msg);
    }
  }

  fetchToken = () => {
    if(this.state.token=='') {
      return false;
    }

    //Alert.alert(this.state.token);

    let formData = new FormData();
    formData.append('device[registration_id]', base64.encode(this.state.token));
    formData.append('device[os]',Platform.OS);
      
    return fetch(this.uri+'devices.json',{
      method : 'POST',
      headers : {},
      body : formData
    }); /* .then((response) => response.json())
    .then((responseJson) => {
      Alert.alert(JSON.stringify(responseJson));
    })
    .catch((error) => {
      console.error(error);
    }); */
  }

  render() {
    const style = width(100) === 375 ? styles.container_webview : styles.container_webview_plus;
      //console.log(Platform.OS);
      return (
        <View style={styles.container}>
      <WebViewBridge
        ref="webviewbridge"
        onBridgeMessage={this.onBridgeMessage.bind(this)}
        javaScriptEnabled={true}
        source={{uri: this.uri, headers:{}}}/>
      </View>
    );
  }
}

export default Main;