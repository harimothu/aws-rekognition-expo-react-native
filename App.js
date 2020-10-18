import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Root, Container, Button, Content, Text, ActionSheet, H2, Card, CardItem, Body } from 'native-base';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
var BUTTONS = [
  { text: "Choose Photo", icon: "american-football", iconColor: "#2c8ef4" },
  { text: "Take Photo", icon: "analytics", iconColor: "#f42ced" },
  { text: "Cancel", icon: "close", iconColor: "#25de5b" }
];
var CANCEL_INDEX = 2;

const aws = require('aws-sdk');
import { Buffer } from 'buffer'
import * as FileSystem from 'expo-file-system';
var rekognition = new aws.Rekognition();
import AWS_CONFIG from './aws-config';
console.log(AWS_CONFIG);
aws.config.update(AWS_CONFIG);

export default class App extends React.Component {

  state = {
    loading: false,
    detectedTexts: []
  };
  //Reads file from local file system
  async readFile(file) {
    return await FileSystem.readAsStringAsync(file, { encoding: 'base64' });
  }

 

  recognizeTextFromImage = async (path) => {
    console.log('In recognizeTextFromImage()');
    this.readFile(path).then((data) => {
      const buffer = new Buffer(data, 'base64');
      rekognition.detectText({
        Image: {
          Bytes: buffer
        }
      }).promise()
        .then((res) => {
          var detectedTexts = [];
          const map1 = res.TextDetections.map((x) => {
            detectedTexts.push(x.DetectedText);
          }
          );
          this.setState({
            isLoading: false,
            detectedTexts: detectedTexts
          });
        });

    })
      .catch(error => {
        console.error(error);
      });

  };
  detectText = () => {
    ActionSheet.show(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX
      },
      buttonIndex => {
        if (buttonIndex == 0)
          this._pickImage();
        if (buttonIndex == 1)
          this._takePhoto();
      }
    );
  }
  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      allowsMultipleSelection: true
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      allowsMultipleSelection: true
    });

    this._handleImagePicked(pickerResult);
  };
  _handleImagePicked = async pickerResult => {
    try {
      this.setState({ loading: true });
      if (!pickerResult.cancelled) {
        await this.recognizeTextFromImage(pickerResult.uri);
      }
    } catch (e) {
      console.log(e);
      alert('Error in handling image picker :(');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    return (
      <Root>
        <Container>
          <Content padder>
            <Card>
              <CardItem header bordered>
                <Text>Detected Texts</Text>
              </CardItem>
              <CardItem bordered>
                <Body>
                  {
                    this.state.detectedTexts.map((text, i) => (
                      <Text key={i}>{text}</Text>
                    ))
                  }
                </Body>
              </CardItem>
              <CardItem footer bordered>
                <Button style={{ alignSelf: "center" }} success block onPress={this.detectText}>
                  <Text>SCAN PHOTO</Text>
                </Button>
                {
                  this.state.loading ?
                    <ActivityIndicator size="small" color={'black'} /> : null
                }
              </CardItem>
            </Card>
          </Content>
        </Container>
      </Root>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
