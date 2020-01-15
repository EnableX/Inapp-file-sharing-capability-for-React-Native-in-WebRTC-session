import React, { PureComponent } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  Alert,
  TouchableHighlight,
  TextInput,
  Button,
  View,
  Dimensions,
  Image,
  PermissionsAndroid,
  FlatList
} from "react-native";
import { registerScreens } from "./screens";
import PropTypes from "prop-types";

import {
  EnxRoom,
  EnxRtc,
  Enx,
  EnxStream,
  EnxSubscribeStream,
  EnxPlayerView
} from "enx-rtc-react-native";
import { Navigation } from "react-native-navigation";
import axios from "react-native-axios";
import Menu, {
  MenuItem,
  MenuDivider,
  Position
} from "react-native-enhanced-popup-menu";
import Toast, { DURATION } from "react-native-easy-toast";
import { GiftedChat } from 'react-native-gifted-chat';


import Modal from "react-native-modal";
import { List, ListItem } from "react-native-elements";

type Props = {};
export default class EnxConferenceScreen extends PureComponent {
  static propTypes = {
    text: PropTypes.string,
    componentId: PropTypes.string
  };

  static options(passProps) {
    return {
      topBar: {
        visible: true,
        animate: true,
        rightButtonColor: "white",
        backButton: {
          visible: false
        },
        title: {
          text: "EnxConferenceScreen",
          fontSize: 20,
          color: "white"
        },
        background: {
          color: "#6f5989"
        }
      },
      statusBar: {
        backgroundColor: "#534367",
        visible: true,
        style: "light"
      }
    };
  }

  async componentWillMount() {
    console.log("componentWillMount");
    console.log("token", this.props.token);
    console.log("username", this.props.username);
    console.log("permissionsError", this.props.permissionsError);
    console.log("role", this.props.role);
    if (this.props.role === "moderator") {
      Navigation.mergeOptions(this.props.componentId, {
        topBar: {
          rightButtons: [
            {
              id: "sendLogs",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Send Logs",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
             {
              id: "sendFile",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Send File",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
            {
              id: "downloadFile",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "download File",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
            {
              id: "startRecord",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Start Recording",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
              {
              id: "privateFileShare",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Private File Share",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
          ]
        }
      });
    } else {
      Navigation.mergeOptions(this.props.componentId, {
        topBar: {
          rightButtons: [
            {
              id: "sendLogs",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Send Logs",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
             {
              id: "sendFile",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Send File",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
            {
              id: "downloadFile",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "download File",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
             {
              id: "privateFileShare",
              icon: require("./image_asset/raise_hand.png"),
              enabled: true,
              text: "Private File Share",
              color: "white",
              showAsAction: "never",
              systemItem: "done"
            },
          ]
        }
      });
    }
    Enx.initRoom();
  }
 
  constructor(props) {
    super(props);
    this.textRef = React.createRef();
    this.menuRef = null;
    this.sharePlayer = null;
    this.canvasPlayer = null;
    this.toast = null;
    this.state = {
      selectedDevice: "",
      base64Icon: "",
      isPostLogs:false,
      isShareFile:false,
      isDownloadFile:false,
      deviceList: [],
      participantList: "",
      activeTalkerStreams: [],
      downloadFileList: [],
      messages: [], 
      isDeviceModal: false,
      isParticipantModal: false,
      isFileModal: false,
      recordingCheck: false,
      screenShareCheck: false,
      audioMuteUnmuteCheck: true,
      chatCheck: false,
      audioMuteUnmuteImage: require("./image_asset/unmute.png"),
      videoMuteUnmuteCheck: true,
      videoMuteUnmuteImage: require("./image_asset/startvideo.png"),
      canvasCheck: false,
      localStreamId: "0",
      screenShareId: null,
      canvasStreamId: null,
      localStreamInfo: {
        audio: true,
        video: true,
        data: true,
        maxVideoBW: "400",
        minVideoBW: "300",
        audioMuted: false,
        videoMuted: false,
        name: "React Native",
        minWidth: "720",
        minHeight: "480",
        maxWidth: "1280",
        maxHeight: "720"
      }
    };
    this.requestStoragePermission = this.requestStoragePermission.bind(this);
    this.roomEventHandlers = {
      roomConnected: event => {
        console.log("roomConnected", event.userList);
        Enx.getLocalStreamId(status => {
          this.setState({
            localStreamId: status
          });
          this.state.localStreamId = status;
          console.log("localStreamId", this.state.localStreamId);
        });
        Enx.publish();
      },
      notifyDeviceUpdate:event=>{
        console.log("notifyDeviceUpdate",event);
      },
      roomError: event => {
        console.log("roomError", event);
      },
      streamPublished: event => {
        console.log("streamPublished", event);
      },
      eventError: event => {
        this.toast.show(event.msg);
        console.log("eventErrorrr", event);
        if (this.props.permissionsError) {
          alert("Kindly grant camera and microphone permission to continue.");
        }
      },
      streamAdded: event => {
        console.log("streamAdded", event);
        Enx.subscribe(event.streamId, error => {
          console.log("streamAdded", error);
        });
      },
       activeTalkerList: event => {
         console.log("activeTalkerList: ", event);
        var tempArray = [];
        tempArray = event;
        console.log("activeTalkerListtempArray: ", tempArray);
        if (tempArray.length == 0) {
          this.setState({
            activeTalkerStreams: tempArray
          });
        }
        if (tempArray.length > 0) {
          this.setState({
            activeTalkerStreams: tempArray
          });
        }
      },
      streamSubscribed: event => {
        console.log("streamSubscribed", event);
      },

      roomDisconnected: event => {
        console.log("disconnecteddddd", event);
        Navigation.pop(this.props.componentId);
      },
      roomRecordingOn: event => {
        console.log("roomRecordingOn", event.msg);
        if (this.props.role === "moderator") {
          Navigation.mergeOptions(this.props.componentId, {
            topBar: {
              rightButtons: [
                {
                  id: "sendLogs",
                  icon: require("./image_asset/raise_hand.png"),
                  enabled: true,
                  text: "Send Logs",
                  color: "white",
                  showAsAction: "never",
                  systemItem: "done"
                },
                {
                  id: "startRecord",
                  icon: require("./image_asset/raise_hand.png"),
                  enabled: true,
                  text: "Stop Recording",
                  color: "white",
                  showAsAction: "never",
                  systemItem: "done"
                },
                {
                  id: "recording",
                  icon: require("./image_asset/recording.png"),
                  enabled: false,
                  text: "Stop Recording",
                  disabledColor: "red",
                  showAsAction: "always",
                  systemItem: "done"
                }
              ]
            }
          });
        } else {
          Navigation.mergeOptions(this.props.componentId, {
            topBar: {
              rightButtons: [
                {
                  id: "sendLogs",
                  icon: require("./image_asset/raise_hand.png"),
                  enabled: true,
                  text: "Send Logs",
                  color: "white",
                  showAsAction: "never",
                  systemItem: "done"
                },
                {
                  id: "recording",
                  icon: require("./image_asset/recording.png"),
                  enabled: false,
                  text: "Stop Recording",
                  disabledColor: "red",
                  showAsAction: "always",
                  systemItem: "done"
                }
              ]
            }
          });
        }
        this.setState({ recordingCheck: true });
      },
      roomRecordingOff: event => {
        console.log("roomRecordingOff", event.msg);
        if (this.props.role === "moderator") {
          Navigation.mergeOptions(this.props.componentId, {
            topBar: {
              rightButtons: [
                {
                  id: "sendLogs",
                  icon: require("./image_asset/raise_hand.png"),
                  enabled: true,
                  text: "Send Logs",
                  color: "white",
                  showAsAction: "never",
                  systemItem: "done"
                },
                {
                  id: "startRecord",
                  icon: require("./image_asset/raise_hand.png"),
                  enabled: true,
                  text: "Start Recording",
                  color: "white",
                  showAsAction: "never",
                  systemItem: "done"
                }
              ]
            }
          });
        } else {
          Navigation.mergeOptions(this.props.componentId, {
            topBar: {
              rightButtons: [
                {
                  id: "sendLogs",
                  icon: require("./image_asset/raise_hand.png"),
                  enabled: true,
                  text: "Send Logs",
                  color: "white",
                  showAsAction: "never",
                  systemItem: "done"
                }
              ]
            }
          });
        }

        this.setState({ recordingCheck: false });
      },
      startRecordingEvent: event => {
        console.log("startRecordingEvent", event);
        if (event.result == "0") {
          this.setState({ recordingCheck: true });
          this.toast.show(event.msg);
        }
      },
      stopRecordingEvent: event => {
        console.log("stopRecordingEvent", event);
        if (event.result == "0") {
          this.setState({ recordingCheck: false });
          this.toast.show(event.msg);
        }
      },
      screenShareStarted: event => {
        this.screenShareId = String(event.streamId);
        console.log("shareScreeId", this.screenShareId);
        this.setState({ screenShareCheck: true });
        console.log("raisedscreenShareCheck: ", this.state.screenShareCheck);
      },
      sceenShareStopped: event => {
        console.log("sceenShareStoppedddd", event);
        this.setState({ screenShareCheck: false });
      },
      canvasStarted: event => {
        this.canvasStreamId = String(event.streamId);
        console.log("shareScreeId", this.canvasStreamId);
        this.setState({ canvasCheck: true });
      },

      canvasStopped: event => {
        console.log("canvasStoppedddd", event);
        this.setState({ canvasCheck: false });
      },
      floorRequested: event => {
        console.log("canvasStoppedddd", event);
        this.toast.show(event.msg, 500, () => {});
      },
      mutedAllUser: event => {
        console.log("mutedAllUser", event);
      },
      unmutedAllUser: event => {
        console.log("unmutedAllUser", event);
      },
      hardMutedAll: event => {
        console.log("hardMutedAll", event);
      },
      hardUnmuteAllUser: event => {
        console.log("hardUnmuteAllUser", event);
      },
      userConnected: event => {
        console.log("userConnected", event);
         this.setState({
            participantList: event.clientId
          });
      },
      userDisconnected: event => {
        console.log("userDisconnected", event);
      },
      logUpload: event => {
        console.log("logUpload", event);
        this.toast.show(event.msg);
      },
      publishStats: event => {
        console.log("publishStats", event);
      },
      subscribeStats: event => {
        console.log("subscribeStats", event);
      },
      setTalkerCount: event => {
        console.log("setTalkerCount", event);
      },
      getMaxTalkers: event => {
        console.log("getMaxTalkers", event);
      },
      getTalkerCount: event => {
        console.log("getTalkerCount", event);
      },
       availableFiles:event=>{
        console.log("availableFiles", event);
        console.log("downloadFileList", event.files);
        this.setState({downloadFileList:event.files});
         this.toggleFileList();
      },
       fileUploadStarted: event => {
        console.log("fileUploadStarted", event);
      },
      initFileUpload: event => {
        console.log("initFileUpload", event);
      },
      fileAvailable: event => {
        console.log("fileAvailable", event);
      },
      fileUploaded: event => {
        console.log("fileUploaded", event);
      },
      fileUploadFailed: event => {
        console.log("fileUploadFailed", event);
      },
      fileDownloaded: event => {
        console.log("fileDownloaded", event);
         this.setState({
          base64Icon: event
        });
      },
      fileDownloadFailed: event => {
        console.log("fileDownloadFailed", event);
      },
      userDataReceived: event => {
        console.log("userDataReceived", event);
      },
      messageReceived: event => {
        console.log("messageReceived", event);
      },
    };
    this.streamEventHandlers = {
      audioEvent: event => {
        console.log("audioEvent", event);
        if (event.result == "0") {
          this.toast.show(event.msg);
          if (this.state.audioMuteUnmuteCheck) {
            this.setState({ audioMuteUnmuteCheck: false });
            this.setState({
              audioMuteUnmuteImage: require("./image_asset/mute.png")
            });
          } else {
            this.setState({ audioMuteUnmuteCheck: true });
            this.setState({
              audioMuteUnmuteImage: require("./image_asset/unmute.png")
            });
          }
          console.log("NoError Audioo");
        } else {
          this.toast.show(event.msg);
          console.log("Error Audioo");
        }
      },

      videoEvent: event => {
        console.log("videoEvent", event);
        if (event.result == "0") {
          this.toast.show(event.msg);
          if (event.msg == "Video Off") {
            this.setState({
              videoMuteUnmuteCheck: false
            });
            this.setState({
              videoMuteUnmuteImage: require("./image_asset/stopvideo.png")
            });
          } else {
            this.setState({
              videoMuteUnmuteCheck: true
            });
            this.setState({
              videoMuteUnmuteImage: require("./image_asset/startvideo.png")
            });
          }
        } else {
          this.toast.show(event.msg);
          console.log("Error Audioo");
        }
      },
      hardMuteAudio: event => {
        console.log("hardMuteAudio", event);
      },
      hardUnmuteAudio: event => {
        console.log("hardUnmuteAudio", event);
      },
      recievedHardMutedAudio: event => {
        console.log("recievedHardMutedAudio", event);
      },
      recievedHardUnmutedAudio: event => {
        console.log("recievedHardUnmutedAudio", event);
      },
      hardVideoMute: event => {
        console.log("hardVideoMute", event);
      },
      hardVideoUnmute: event => {
        console.log("hardVideoUnmute", event);
      },
      receivehardMuteVideo: event => {
        console.log("receivehardMuteVideo", event);
      },
      recivehardUnmuteVideo: event => {
        console.log("recivehardUnmuteVideo", event);
      },
      receiveData: event => {
        console.log("receiveData", event);
       var data =  {
          // _id: 2,
          name: event.from,
          text: event.message,
          createdAt: new Date(),
        };
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, data),
        }))
        // { timestamp: 1560258823249,
        //   type: 'public',
        //   message: 'asd',
        //   from: 'Web' }

      }
    };
    Navigation.events().registerNavigationButtonPressedListener(event => {});
    Navigation.events().bindComponent(this);
    this._onPressMute = this._onPressMute.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleFileList = this.toggleFileList.bind(this);
    this._onPressSwitchCamera = this._onPressSwitchCamera.bind(this);
    this._onPressVideoMute = this._onPressVideoMute.bind(this);
    this._onPressSpeaker = this._onPressSpeaker.bind(this);
    this._onPressDisconnect = this._onPressDisconnect.bind(this);
  }

  navigationButtonPressed({ buttonId }) {
    console.log("nav button clicked");
    if (Platform.OS === "android") {
      if (buttonId == "sendLogs") {
        console.log("sendLogs clicked");
        this.setState({isPostLogs:true});
        this.requestStoragePermission();
      }
      if (buttonId == "sendFile") {
        console.log("sendFile clicked");
         this.setState({isShareFile:true})
        this.requestStoragePermission();
      }
      if(buttonId="privateFileShare"){
        console.log("privateFileShare clicked");
           Enx.sendFiles("top",false,[this.state.participantList]);
      }
      if(buttonId=="downloadFile")
      {
      console.log("sendFile clicked");
      this.setState({isDownloadFile:true})
        this.requestStoragePermission();
      }
      if (buttonId == "startRecord") {
        console.log("start Recording button clicked");
        if (this.state.recordingCheck) {
          console.log("recordingCheckif", this.state.recordingCheck);
          Enx.stopRecord();
        } else {
          console.log("recordingCheckElse", this.state.recordingCheck);
          Enx.startRecord();
        }
      }
    } else {
      if (buttonId == "sendLogs") {
        this.menuRef.show(this.textRef.current, (stickTo = Position.TOP_RIGHT));
      }
    }
  }

  async requestStoragePermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: "Enablex Storage Permission",
          message: "Enablex needs access to your storage " + "to write logs.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.setState({ permissionError: true });
        if(this.state.isPostLogs){
        Enx.postClientLogs();
        this.setState({isPostLogs:false});
        }
        if(this.state.isDownloadFile){
        Enx.getAvailableFiles();
        this.setState({isDownloadFile:false});
        }
        else{
          Enx.sendFiles("top",true,[]);
      }
      } else {
        alert("Kindly grant storage permission to send logs.");
      }
    } catch (err) {
      console.warn(err);
    }
  }

  createCanvasPlayerView() {
    if (this.state.canvasCheck) {
      const { height, width } = Dimensions.get("window");
      return (
        <EnxPlayerView
          key={this.canvasStreamId}
          streamId={this.canvasStreamId}
           isLocal="remote"
          style={{ width: width, height: height }}
        />
      );
    }
  }

   createActiveTalkerPlayers() {
    console.log(
      "this.state.activeTalkerStreams: ",
      this.state.activeTalkerStreams.length
    );
    return (
      <View>
        {this.state.activeTalkerStreams.map(function(element, index) {
          if (index == 0) {
            const { height, width } = Dimensions.get("window");
            return (
              <EnxPlayerView
                key={String(element.streamId)}
                streamId={String(element.streamId)}
                isLocal="remote"
                style={{ width: width, height: height }}
              />
            );
          } 
        })}
      </View>
    );
  }


  chatView(){
    if (this.state.chatCheck) {    
      return (
        <View style={{height: Dimensions.get('window').height - 85,position: 'relative',backgroundColor: 'rgba(52, 52, 52, 0.5)'}}>
         <View >
              <TouchableHighlight
                underlayColor="transparent"
                onPress={this._onCloseChat}
              >
                <Image
                  source={require("./image_asset/close.png")}
                  style={styles.inlineImg}
                />
              </TouchableHighlight>
            </View>


        <GiftedChat
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          
        />
        </View>
      )
    }
  }

  onSend(messages = []) {
    var messageDict = messages[0]
    var dict = {
      from: "RN",
      message: messageDict.text,
      timestamp: "",
      type: "public"
    };
    Enx.sendData(this.state.localStreamId,dict);

    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }))
  }

  
  showIOSMenu() {
    const setMenuRef = ref => (this.menuRef = ref);

    if (Platform.OS === "android") {
      return;
    } else {
      return (
        <View>
          <Text
            ref={this.textRef}
            style={{ fontSize: 20, textAlign: "center" }}
          />
          <Menu ref={setMenuRef}>
            <MenuItem onPress={this._onPressSendLogs}>Send Logs</MenuItem>
            <MenuItem onPress={this._onPressStartRecord}>
              Start Recording
            </MenuItem>
            <MenuItem onPress={this._onPressStopRecord}>
              Stop Recording
            </MenuItem>
          </Menu>
        </View>
      );
    }
  }

  render() {
      const { height, width } = Dimensions.get("window");

      return (
        <View style={{ flex: 1, backgroundColor: "#000000" }}>
         <View>{this.showIOSMenu()}</View>
          <EnxRoom
            token={this.props.token}
            eventHandlers={this.roomEventHandlers}
            localInfo={this.state.localStreamInfo}
          >
            <EnxStream
              style={{
                position: "absolute",
                right: 20,
                width: 100,
                height: 100,
                zIndex: 1000
              }}
              eventHandlers={this.streamEventHandlers}
            />
       </EnxRoom>
           <View>{this.createActiveTalkerPlayers()}</View>
          {/* <View style={{ zIndex: -1 }}>{this.createPlayerView()}</View> */}
          <View style={{ zIndex: -1 }}>{this.createCanvasPlayerView()}</View>
      <Modal
          isVisible={this.state.isDeviceModal}
          coverScreen={false}
          backdropColor="#B4B3DB"
          backdropOpacity={0.8}
          animationIn="zoomInDown"
          animationOut="zoomOutUp"
          animationInTiming={600}
          animationOutTiming={600}
          backdropTransitionInTiming={600}
          backdropTransitionOutTiming={600}
        >
          <View>
            <Text style={{ alignSelf: "center", fontSize: 16, margin: 10 }}>
             Device List
            </Text>
            <FlatList
              extraData={this.state}
              data={this.state.deviceList}
              renderItem={this.renderModal}
              keyExtractor={item => item.name}
            />
          </View>
        </Modal>
            <Modal
          isVisible={this.state.isFileModal}
          coverScreen={false}
          backdropColor="#B4B3DB"
          backdropOpacity={0.8}
          animationIn="zoomInDown"
          animationOut="zoomOutUp"
          animationInTiming={600}
          animationOutTiming={600}
          backdropTransitionInTiming={600}
          backdropTransitionOutTiming={600}
        >
          <View>
            <Text style={{ alignSelf: "center", fontSize: 16, margin: 10 }}>
             Download File
            </Text>
            <FlatList
              extraData={this.state}
              data={this.state.downloadFileList}
              renderItem={this.renderDownloadList}
              keyExtractor={item => item.name}
            />
          </View>
        </Modal>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              flexDirection: "row",
              alignSelf: "center"
            }}
          >
            <TouchableHighlight
              underlayColor="transparent"
              onPress={this._onPressDisconnect}
            >
              <Image
                source={require("./image_asset/disconnect.png")}
                style={styles.disconnectImg}
              />
            </TouchableHighlight>
          </View>
          
          <View
            style={{
              flex: 4,
              flexDirection: "row",
              height: 50,
              width: 300,
              position: "absolute",
              bottom: 0,
              alignItems: "center",
              justifyContent: "space-around",
              borderRadius: 25,
              marginBottom: 20,
              alignSelf: "center",
              backgroundColor: "#eae7e7"
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <TouchableHighlight
                underlayColor="transparent"
                onPress={this._onPressMute}
              >
                <Image
                  source={this.state.audioMuteUnmuteImage}
                  style={styles.inlineImg}
                />
              </TouchableHighlight>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <TouchableHighlight
                underlayColor="transparent"
                onPress={this._onPressSwitchCamera}
              >
                <Image
                  source={require("./image_asset/switchcamera.png")}
                  style={styles.inlineImg}
                />
              </TouchableHighlight>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <TouchableHighlight
                underlayColor="transparent"
                onPress={this._onPressVideoMute}
              >
                <Image
                  source={this.state.videoMuteUnmuteImage}
                  style={styles.inlineImg}
                />
              </TouchableHighlight>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <TouchableHighlight
                underlayColor="transparent"
                onPress={this._onPressChat}
              >
                <Image
                  source={require("./image_asset/chat.png")}
                  style={styles.inlineImg}
                />
              </TouchableHighlight>
            </View>
         

            <View style={{ flex: 1, alignItems: "center" }}>
              <TouchableHighlight
                underlayColor="transparent"
                onPress={this._onPressSpeaker}
              >
                <Image
                  source={require("./image_asset/speaker.png")}
                  style={styles.inlineImg}
                />
              </TouchableHighlight>
            </View>
          </View>
                  {this.chatView()}
            
          <Toast
            ref={toast => {
              this.toast = toast;
            }}
          />
           {/* <Image
            style={{ width: 200, height: 200 }}
            source={{ uri: this.state.base64Icon }}
          />       */}
        </View>
      );
    
  }

   renderModal = ({ item }) => {
    console.log("renderModal", item);
    return (
      <ListItem
        title={item}
        onPress={() => this.onClick(item)}
      />
    );
  };

  renderParticipantModal = ({ item }) => {
    console.log("renderParticipantModal", item);
    return (
      <ListItem
        title={item.name}
        onPress={() => this.onParticipantClick(item)}
      />
    );
  };

 renderDownloadList = ({ item }) => {
    console.log("renderDownloadList", item);
    return (
      <ListItem
        title={item.name}
        onPress={() => this.onDownloadFileClick(item)}
      />
    );
  };

  onClick = item => {
    console.log("onClick",item);
    Enx.switchMediaDevice(item);
    this.toggleModal(); 
  };

  onDownloadFileClick = item => {
    console.log("onClick",item);
    Enx.downloadFile(item,false);
    this.toggleFileList(); 
  };

  _onPressMute = () => {
    console.log("_onPressMute", "clicked");
    console.log("_onPressMuteValue", this.state.audioMuteUnmuteCheck);
    Enx.muteSelfAudio(
      this.state.localStreamId,
      this.state.audioMuteUnmuteCheck
    );
  };

  toggleModal = () => {
    this.setState({ isDeviceModal: !this.state.isDeviceModal });
  };

  toggleFileList = () => {
    this.setState({ isFileModal: !this.state.isFileModal });
  };

  _onPressSwitchCamera = () => {
    console.log("_onPressSwitchCamera", "clicked");
    Enx.switchCamera(this.state.localStreamId);
  };

  _onPressVideoMute = () => {
    console.log("_onPressVideoMute", "clicked");
    Enx.muteSelfVideo(
      this.state.localStreamId,
      this.state.videoMuteUnmuteCheck
    );
  };

  _onCloseChat = () => {
    this.setState({
      chatCheck: false
    });
  }

  _onPressChat = () => {
    if(this.state.chatCheck){
      this.setState({
        chatCheck: false
      });
     }
     else{
      this.setState({
        chatCheck: true
      });
     }
  }


  _onPressSpeaker = () => {  
    console.log("_onPressSpeaker", "clicked");
        Enx.getDevices(status => {
          console.log("getDevices",status);
          this.setState({
            deviceList: status
          });
          this.state.deviceList = status;
          console.log("getDevices", this.state.deviceList);
        });
        this.toggleModal();
  };

  _onPressSendLogs() {
    console.log("_onPressSendLogs");
    Enx.postClientLogs();
  }

  _onPressStartRecord() {
    console.log("_onPressStartRecordsss");
    Enx.startRecord();
  }

  _onPressStopRecord() {
    console.log("_onPressStopRecord");
    Enx.stopRecord();
  }
  _onPressDisconnect = () => {
    console.log("_onPressDisconnect", "clicked");
     Enx.disconnect();
  };
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  local_stream_border: {
    marginTop: 50,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderColor: "rgba(255,255,255,0.4)",
    height: 60,
    width: 400,
    borderWidth: 4,
    paddingLeft: 120,
    borderRadius: 4,
    justifyContent: "center",
    alignSelf: "center"
  },
  inlineImg_: {
    width: 42,
    alignSelf: "center",
    height: 42,
    zIndex: 50,
    top: 10
  },
  disconnectImg: {
    width: 60,
    height: 60,
    zIndex: 50
  }
});
